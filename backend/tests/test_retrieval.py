"""
Comprehensive tests for Permission-Aware Semantic Retrieval (Step 2).

Covers all 12 security and functional scenarios:

  1.  Owner can search their own document.
  2.  Permitted user (can_read=True) can search a shared document.
  3.  Unpermitted user cannot retrieve any chunks.
  4.  Inactive user cannot access chunks.
  5.  Unauthenticated request is rejected (401).
  6.  top_k limits the number of results.
  7.  similarity_threshold filters low-score results.
  8.  Empty query is rejected.
  9.  top_k out of range is rejected.
  10. similarity_threshold out of range is rejected.
  11. Raw embedding vectors are never exposed in results.
  12. Permission revoked (can_read=False) blocks access.

Uses SQLite in-memory database; embedding calls are mocked.
No live Ollama or PostgreSQL connection required.
"""

import math
import os
import sys
from typing import Optional
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Document, DocumentChunk, DocumentPermission, User
from app.routes.auth import get_current_user

# ---------------------------------------------------------------------------
# Shared in-memory SQLite engine
# ---------------------------------------------------------------------------

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_Session = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
Base.metadata.create_all(bind=_engine)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def db_session():
    """Isolated session per test; drops and recreates schema to ensure isolation."""
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)
    db = _Session()
    try:
        yield db
    finally:
        db.close()


def _get_db_override(db):
    """Dependency override factory that yields the given session."""
    def _override():
        yield db
    return _override


@pytest.fixture()
def client(db_session):
    """TestClient with the SQLite DB overridden; auth override is test-specific."""
    app.dependency_overrides[get_db] = _get_db_override(db_session)
    # Do NOT use the context manager form (`with TestClient(app) as c`).
    # On Windows the lifespan thread can deadlock during teardown.
    c = TestClient(app, raise_server_exceptions=False)
    yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Test data helpers
# ---------------------------------------------------------------------------

def _unit_vec(dim: int = 768) -> list[float]:
    val = 1.0 / math.sqrt(dim)
    return [val] * dim


def _mock_client(vec: Optional[list[float]] = None) -> MagicMock:
    m = MagicMock()
    m.embed_query.return_value = vec or _unit_vec()
    return m


def _user(db, email: str, active: bool = True) -> User:
    u = User(email=email, full_name="T", password_hash="x", role="employee", is_active=active)
    db.add(u); db.flush()
    return u


def _doc(db, owner: User, filename: str = "doc.pdf") -> Document:
    d = Document(title=filename, filename=filename, storage_path="/tmp/x", owner_id=owner.id, status="uploaded")
    db.add(d); db.flush()
    return d


def _chunk(db, doc: Document, idx: int = 0, text: str = "chunk.", emb=None) -> DocumentChunk:
    c = DocumentChunk(
        document_id=doc.id, page_number=1, chunk_index=idx,
        chunk_text=text, start_char=0, end_char=len(text),
        embedding=emb or _unit_vec(), embedding_model="nomic-embed-text",
    )
    db.add(c); db.flush()
    return c


def _grant(db, doc: Document, user: User, can_read: bool = True) -> DocumentPermission:
    p = DocumentPermission(document_id=doc.id, user_id=user.id, can_read=can_read)
    db.add(p); db.flush()
    return p


# ---------------------------------------------------------------------------
# Unit tests: search_authorized_chunks() directly
# ---------------------------------------------------------------------------

class TestSearchAuthorizedChunks:

    def _search(self, db, query, current_user, **kwargs):
        from app.rag.retrieval import search_authorized_chunks
        return search_authorized_chunks(query, current_user, db, **kwargs)

    # 1. Owner retrieves own chunks
    def test_owner_retrieves_own_chunks(self, db_session):
        owner = _user(db_session, "u1@x.com")
        doc = _doc(db_session, owner, "a.pdf")
        _chunk(db_session, doc, 0, "Important company policy.")
        db_session.commit()

        results = self._search(db_session, "policy", owner, client=_mock_client())
        assert len(results) >= 1
        assert results[0]["document_id"] == doc.id
        assert results[0]["chunk_text"] == "Important company policy."
        assert results[0]["filename"] == "a.pdf"

    # 2. Permitted user can retrieve shared chunks
    def test_permitted_user_retrieves_shared_chunks(self, db_session):
        owner = _user(db_session, "u2a@x.com")
        reader = _user(db_session, "u2b@x.com")
        doc = _doc(db_session, owner, "b.pdf")
        _chunk(db_session, doc, 0, "Shared content.")
        _grant(db_session, doc, reader, can_read=True)
        db_session.commit()

        results = self._search(db_session, "shared", reader, client=_mock_client())
        assert any(r["document_id"] == doc.id for r in results)

    # 3. Unpermitted user gets no results
    def test_unpermitted_user_gets_no_results(self, db_session):
        owner = _user(db_session, "u3a@x.com")
        stranger = _user(db_session, "u3b@x.com")
        doc = _doc(db_session, owner, "c.pdf")
        _chunk(db_session, doc, 0, "Secret.")
        db_session.commit()

        results = self._search(db_session, "secret", stranger, client=_mock_client())
        assert results == []

    # 6. top_k limits results
    def test_top_k_limits_results(self, db_session):
        owner = _user(db_session, "u6@x.com")
        doc = _doc(db_session, owner, "d.pdf")
        for i in range(10):
            _chunk(db_session, doc, i, f"Chunk {i}.")
        db_session.commit()

        results = self._search(db_session, "chunk", owner, top_k=3, client=_mock_client())
        assert len(results) <= 3

    # 7. similarity_threshold filters results
    def test_similarity_threshold_filters_results(self, db_session):
        owner = _user(db_session, "u7@x.com")
        doc = _doc(db_session, owner, "e.pdf")
        ortho = [0.0] * 768; ortho[0] = 1.0
        _chunk(db_session, doc, 0, "Orthogonal.", emb=ortho)
        db_session.commit()

        qvec = [0.0] * 768; qvec[1] = 1.0
        results = self._search(db_session, "query", owner,
                               similarity_threshold=0.9, client=_mock_client(vec=qvec))
        assert all(r["similarity_score"] >= 0.9 for r in results)

    # 8. Empty query raises EmbeddingValidationError
    def test_empty_query_raises(self, db_session):
        from app.rag.embeddings import EmbeddingValidationError
        owner = _user(db_session, "u8@x.com"); db_session.commit()
        with pytest.raises(EmbeddingValidationError):
            self._search(db_session, "   ", owner, client=_mock_client())

    # 9. top_k=0 raises ValueError
    def test_top_k_zero_raises(self, db_session):
        owner = _user(db_session, "u9a@x.com"); db_session.commit()
        with pytest.raises(ValueError, match="top_k"):
            self._search(db_session, "test", owner, top_k=0, client=_mock_client())

    # 9b. top_k > 20 raises ValueError
    def test_top_k_above_max_raises(self, db_session):
        from app.rag.retrieval import MAX_TOP_K
        owner = _user(db_session, "u9b@x.com"); db_session.commit()
        with pytest.raises(ValueError, match="top_k"):
            self._search(db_session, "test", owner, top_k=MAX_TOP_K + 1, client=_mock_client())

    # 10. similarity_threshold > 1 raises ValueError
    def test_threshold_above_one_raises(self, db_session):
        owner = _user(db_session, "u10a@x.com"); db_session.commit()
        with pytest.raises(ValueError, match="similarity_threshold"):
            self._search(db_session, "test", owner, similarity_threshold=1.5, client=_mock_client())

    # 10b. similarity_threshold < 0 raises ValueError
    def test_threshold_below_zero_raises(self, db_session):
        owner = _user(db_session, "u10b@x.com"); db_session.commit()
        with pytest.raises(ValueError, match="similarity_threshold"):
            self._search(db_session, "test", owner, similarity_threshold=-0.1, client=_mock_client())

    # 11. Raw embeddings never in result dicts
    def test_embedding_never_in_result(self, db_session):
        owner = _user(db_session, "u11@x.com")
        doc = _doc(db_session, owner, "f.pdf")
        _chunk(db_session, doc, 0, "Test chunk.")
        db_session.commit()

        results = self._search(db_session, "test", owner, client=_mock_client())
        for r in results:
            assert "embedding" not in r

    # 12. Revoked permission (can_read=False) blocks access
    def test_revoked_permission_blocks(self, db_session):
        owner = _user(db_session, "u12a@x.com")
        blocked = _user(db_session, "u12b@x.com")
        doc = _doc(db_session, owner, "g.pdf")
        _chunk(db_session, doc, 0, "Secret.")
        _grant(db_session, doc, blocked, can_read=False)
        db_session.commit()

        results = self._search(db_session, "secret", blocked, client=_mock_client())
        assert results == []

    # Extra: Result dict has correct keys
    def test_result_has_expected_keys(self, db_session):
        owner = _user(db_session, "uk@x.com")
        doc = _doc(db_session, owner, "h.pdf")
        _chunk(db_session, doc, 0, "Keys test.")
        db_session.commit()

        results = self._search(db_session, "keys", owner, client=_mock_client())
        assert len(results) >= 1
        expected = {"chunk_id", "document_id", "filename", "page_number", "chunk_index", "chunk_text", "similarity_score"}
        for r in results:
            assert expected.issubset(r.keys())

    # Extra: similarity_score in [0, 1]
    def test_similarity_score_in_range(self, db_session):
        owner = _user(db_session, "us@x.com")
        doc = _doc(db_session, owner, "i.pdf")
        _chunk(db_session, doc, 0, "Score test.")
        db_session.commit()

        results = self._search(db_session, "score", owner, client=_mock_client())
        for r in results:
            assert 0.0 <= r["similarity_score"] <= 1.0

    # Extra: User with no documents gets empty list
    def test_no_docs_empty_results(self, db_session):
        new_user = _user(db_session, "unew@x.com"); db_session.commit()
        results = self._search(db_session, "anything", new_user, client=_mock_client())
        assert results == []


# ---------------------------------------------------------------------------
# API endpoint tests: POST /rag/search via TestClient
# ---------------------------------------------------------------------------

class TestSearchAPIEndpoint:

    @pytest.fixture(autouse=True)
    def _setup(self, db_session, client):
        self.db = db_session
        self.client = client

        self.owner = _user(db_session, "aown@x.com")
        self.other = _user(db_session, "aoth@x.com")
        self.doc = _doc(db_session, self.owner, "api.pdf")
        _chunk(db_session, self.doc, 0, "API integration test chunk.")
        db_session.commit()

        # Default auth: owner
        app.dependency_overrides[get_current_user] = lambda: self.owner

    def _as_user(self, user):
        app.dependency_overrides[get_current_user] = lambda: user

    def _patch_embed(self, vec: Optional[list[float]] = None):
        return patch("app.rag.retrieval.OllamaEmbeddingClient.embed_query", return_value=vec or _unit_vec())

    # 5. Unauthenticated → 401 (simulate by overriding get_current_user to raise)
    def test_unauthenticated_returns_401(self):
        """Simulate missing auth by raising 401 from the dependency."""
        def _unauthenticated():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        app.dependency_overrides[get_current_user] = _unauthenticated
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "test"})
        assert resp.status_code == 401

    # Owner search returns structured results
    def test_owner_search_returns_results(self):
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "API integration"})
        assert resp.status_code == 200
        data = resp.json()
        assert "query" in data and "results" in data and "total_results" in data
        assert data["total_results"] == len(data["results"])

    # 11 (via API): embedding never exposed
    def test_api_never_exposes_embedding(self):
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "embedding check"})
        assert resp.status_code == 200
        for item in resp.json().get("results", []):
            assert "embedding" not in item

    # 9 (via API): top_k=0 → 422
    def test_top_k_zero_rejected(self):
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "test", "top_k": 0})
        assert resp.status_code == 422

    # top_k=21 → 422
    def test_top_k_21_rejected(self):
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "test", "top_k": 21})
        assert resp.status_code == 422

    # 8 (via API): blank query → 422
    def test_blank_query_rejected(self):
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "   "})
        assert resp.status_code == 422

    # 10 (via API): similarity_threshold > 1 → 422
    def test_threshold_above_one_rejected(self):
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "test", "similarity_threshold": 1.5})
        assert resp.status_code == 422

    # 3 (via API): stranger gets empty results
    def test_stranger_gets_no_results(self):
        self._as_user(self.other)
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "API integration"})
        assert resp.status_code == 200
        assert resp.json()["total_results"] == 0

    # 2 (via API): permitted user gets shared chunk
    def test_permitted_user_gets_results(self, db_session):
        permitted = _user(db_session, "perm@x.com")
        _grant(db_session, self.doc, permitted, can_read=True)
        db_session.commit()
        self._as_user(permitted)

        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "API integration"})
        assert resp.status_code == 200
        assert any(r["document_id"] == self.doc.id for r in resp.json()["results"])

    # 12 (via API): revoked permission → 0 results
    def test_revoked_permission_blocked(self, db_session):
        revoked = _user(db_session, "rev@x.com")
        _grant(db_session, self.doc, revoked, can_read=False)
        db_session.commit()
        self._as_user(revoked)

        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "API integration"})
        assert resp.status_code == 200
        assert resp.json()["total_results"] == 0

    # 4. Inactive user: 0 results (or 401/403 if enforced at auth level)
    def test_inactive_user_no_access(self, db_session):
        inactive = _user(db_session, "inact@x.com", active=False)
        _grant(db_session, self.doc, inactive, can_read=True)
        db_session.commit()
        self._as_user(inactive)

        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "content"})

        if resp.status_code == 200:
            data = resp.json()
            # Inactive users should get zero accessible results
            assert data["total_results"] == 0 or all(
                r["document_id"] != self.doc.id for r in data["results"]
            )
        else:
            assert resp.status_code in (401, 403)

    # Response field types
    def test_response_structure(self):
        with self._patch_embed():
            resp = self.client.post("/rag/search", json={"query": "structure"})
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["query"], str)
        assert isinstance(data["results"], list)
        assert isinstance(data["total_results"], int)
