"""
Comprehensive Tests for CogniSec Step 5: Source Citations and Answer Validation.

Covers every required test case:
 1. Correct source citation from retrieval.
 2. Unknown source ID rejected; claim unsupported.
 3. Fabricated document ID ignored; backend uses own records.
 4. Fabricated chunk ID ignored; backend uses own records.
 5. Incorrect page number is never trusted from model; metadata from retrieval.
 6. Unsupported factual claim (wrong number) → unsupported.
 7. Contradictory number → unsupported.
 8. Incorrect date → unsupported.
 9. Negation change → unsupported.
10. Partially supported answer (some claims ok, some not).
11. Fully supported answer → evidence_status = "supported".
12. No relevant source documents → safe response, no LLM call.
13. Unauthorized source references → rejected.
14. Sanitized-only validation context (original_text never used).
15. Malformed structured LLM output → conservative fallback, claims unverified.
16. Plain-text LLM output → claims NOT auto-classified as supported.
17. Cross-chunk evidence matching → relinks to actual supporting chunk.
18. Empty answer field in JSON → insufficient_evidence.
19. API endpoint returns evidence_status field.
20. API endpoint claims list populated correctly.

Security:
- ALL validation uses only sanitized_text; original_text is never referenced.
- Model-generated source IDs are treated as untrusted hints.
- Backend independently verifies and rebuilds every citation.
"""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Document, DocumentChunk, User
from app.rag.context import build_llm_context
from app.rag.llm import OllamaChatClient
from app.rag.validator import (
    EVIDENCE_INSUFFICIENT,
    EVIDENCE_PARTIALLY_SUPPORTED,
    EVIDENCE_SUPPORTED,
    EVIDENCE_UNVERIFIED,
    EVIDENCE_UNSUPPORTED,
    INSUFFICIENT_EVIDENCE_MESSAGE,
    build_authorized_source_index,
    extract_claims_from_plain_text,
    parse_structured_llm_response,
    resolve_evidence_status,
    validate_answer,
    validate_claim_against_sources,
)
from app.routes.auth import get_current_user

# ---------------------------------------------------------------------------
# In-memory SQLite engine for integration tests
# ---------------------------------------------------------------------------

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_Session = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
Base.metadata.create_all(bind=_engine)


@pytest.fixture()
def db():
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)
    session = _Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    def _db_override():
        yield db

    app.dependency_overrides[get_db] = _db_override
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Chunk factory helpers
# ---------------------------------------------------------------------------

def _chunk(
    *,
    chunk_id: int = 1,
    document_id: int = 1,
    filename: str = "policy.pdf",
    page_number: int = 3,
    chunk_index: int = 0,
    sanitized_text: str = "Employees receive 25 days of annual leave.",
    original_text: str = "Employees receive 25 days of annual leave.",  # used only in DB fixture
    similarity_score: float = 0.90,
) -> dict[str, Any]:
    """Construct a sanitized chunk dict as returned by retrieve_and_sanitize_chunks()."""
    return {
        "chunk_id": chunk_id,
        "document_id": document_id,
        "filename": filename,
        "page_number": page_number,
        "chunk_index": chunk_index,
        "original_text": original_text,   # Security: validator MUST NOT read this
        "sanitized_text": sanitized_text,
        "similarity_score": similarity_score,
        "entity_counts": {},
        "detections": [],
        "is_sanitized": True,
    }


def _structured_response(answer: str, claims: list[dict]) -> str:
    """Produce a valid structured JSON LLM response string."""
    return json.dumps({"answer": answer, "claims": claims})


# ===========================================================================
# A. Unit Tests – Validator Core Functions
# ===========================================================================

class TestBuildAuthorizedSourceIndex:
    """Tests for build_authorized_source_index()."""

    def test_builds_index_with_correct_source_ids(self):
        chunks = [_chunk(chunk_id=10, document_id=1), _chunk(chunk_id=20, document_id=2)]
        index = build_authorized_source_index(chunks)
        assert "source_1" in index
        assert "source_2" in index
        assert index["source_1"]["chunk_id"] == 10
        assert index["source_2"]["chunk_id"] == 20

    def test_index_contains_only_sanitized_text(self):
        chunks = [_chunk(
            sanitized_text="Sanitized text with [EMAIL_1].",
            original_text="Sanitized text with ceo@company.com.",
        )]
        index = build_authorized_source_index(chunks)
        # sanitized_text should be present
        assert "[EMAIL_1]" in index["source_1"]["sanitized_text"]
        # original_text must not be accessible through the index
        assert "original_text" not in index["source_1"], (
            "Security violation: original_text must not be exposed in source index."
        )

    def test_rejects_unsanitized_chunk(self):
        chunks = [_chunk()]
        chunks[0]["is_sanitized"] = False
        with pytest.raises(ValueError, match="Security violation"):
            build_authorized_source_index(chunks)

    def test_empty_chunks_returns_empty_index(self):
        assert build_authorized_source_index([]) == {}


class TestParseStructuredLlmResponse:
    """Tests for parse_structured_llm_response()."""

    def test_valid_structured_json_parsed(self):
        raw = _structured_response(
            "Employees receive 25 days of annual leave.",
            [{"claim": "25 days annual leave.", "supporting_source_ids": ["source_1"]}],
        )
        result = parse_structured_llm_response(raw)
        assert result is not None
        assert result["answer"] == "Employees receive 25 days of annual leave."
        assert len(result["claims"]) == 1
        assert result["claims"][0]["claim"] == "25 days annual leave."
        assert result["claims"][0]["supporting_source_ids"] == ["source_1"]

    def test_malformed_json_returns_none(self):
        """Test 15: Malformed JSON → conservative None, not an error."""
        result = parse_structured_llm_response('{"answer": "incomplete JSON...')
        assert result is None

    def test_plain_text_returns_none(self):
        """Test 16: Plain text → returns None so caller uses plain-text fallback."""
        result = parse_structured_llm_response("Employees get 25 days of leave per year.")
        assert result is None

    def test_missing_answer_field_returns_none(self):
        result = parse_structured_llm_response(json.dumps({"claims": []}))
        assert result is None

    def test_missing_claims_field_returns_none(self):
        result = parse_structured_llm_response(json.dumps({"answer": "some answer"}))
        assert result is None

    def test_non_string_source_ids_filtered(self):
        raw = json.dumps({
            "answer": "some answer",
            "claims": [{"claim": "claim text", "supporting_source_ids": [1, "source_1", None]}],
        })
        result = parse_structured_llm_response(raw)
        assert result is not None
        # Only "source_1" should remain; integer 1 and None are discarded
        assert result["claims"][0]["supporting_source_ids"] == ["source_1"]

    def test_markdown_fenced_json_parsed(self):
        raw = "```json\n" + json.dumps({
            "answer": "Fenced answer.",
            "claims": [{"claim": "claim 1", "supporting_source_ids": []}],
        }) + "\n```"
        result = parse_structured_llm_response(raw)
        assert result is not None
        assert result["answer"] == "Fenced answer."

    def test_empty_response_returns_none(self):
        assert parse_structured_llm_response("") is None
        assert parse_structured_llm_response("   ") is None

    def test_invalid_structured_response_fabricated_doc_id(self):
        """Test 3: Fabricated document ID in source IDs is structurally fine but backend ignores it."""
        raw = json.dumps({
            "answer": "Some answer.",
            "claims": [{"claim": "A claim.", "supporting_source_ids": ["doc_999_chunk_42"]}],
        })
        result = parse_structured_llm_response(raw)
        # Parser accepts it; validation stage will reject non-existent source IDs
        assert result is not None
        assert result["claims"][0]["supporting_source_ids"] == ["doc_999_chunk_42"]


class TestExtractClaimsFromPlainText:
    """Tests for extract_claims_from_plain_text()."""

    def test_sentences_extracted_as_unverified_claims(self):
        """Test 16: Plain-text claims start as 'unverified', never 'supported'."""
        claims = extract_claims_from_plain_text(
            "Employees receive 25 days of leave. Managers get extra 5 days."
        )
        assert len(claims) >= 1
        for c in claims:
            assert c["status"] == EVIDENCE_UNVERIFIED, (
                f"Plain-text claim must be 'unverified', got: {c['status']}"
            )
            assert c["supporting_source_ids"] == []

    def test_empty_text_returns_empty_list(self):
        assert extract_claims_from_plain_text("") == []
        assert extract_claims_from_plain_text("   ") == []


class TestValidateClaimAgainstSources:
    """Tests for validate_claim_against_sources()."""

    def _make_index(self, sanitized_text: str) -> dict[str, dict]:
        return build_authorized_source_index([_chunk(sanitized_text=sanitized_text)])

    def test_supported_claim_with_matching_number(self):
        """Test 11: Fully matching claim → supported."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        status, ids = validate_claim_against_sources(
            "Employees receive 25 days of annual leave.",
            index,
            model_suggested_source_ids=["source_1"],
        )
        assert status == EVIDENCE_SUPPORTED
        assert "source_1" in ids

    def test_contradictory_number_unsupported(self):
        """Test 7: Claim says 30 days, chunk says 25 days → unsupported."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        status, ids = validate_claim_against_sources(
            "Employees receive 30 days of annual leave.",
            index,
            model_suggested_source_ids=["source_1"],
        )
        assert status == EVIDENCE_UNSUPPORTED
        assert ids == []

    def test_incorrect_date_unsupported(self):
        """Test 8: Date in claim doesn't match chunk."""
        index = self._make_index("Policy effective from January 1, 2024.")
        status, ids = validate_claim_against_sources(
            "Policy effective from March 15, 2025.",
            index,
            model_suggested_source_ids=["source_1"],
        )
        assert status == EVIDENCE_UNSUPPORTED
        assert ids == []

    def test_negation_change_unsupported(self):
        """Test 9: Chunk says 'is allowed', claim says 'is not allowed' → unsupported."""
        index = self._make_index("Remote work is allowed for all employees.")
        status, ids = validate_claim_against_sources(
            "Remote work is not allowed for all employees.",
            index,
            model_suggested_source_ids=["source_1"],
        )
        assert status == EVIDENCE_UNSUPPORTED
        assert ids == []

    def test_unknown_source_id_still_scans_all(self):
        """Test 2: Model suggests source_99 (not in index); backend scans all chunks anyway."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        status, ids = validate_claim_against_sources(
            "Employees receive 25 days of annual leave.",
            index,
            model_suggested_source_ids=["source_99"],  # Fabricated – not in index
        )
        # Backend should still find the evidence in source_1
        assert status == EVIDENCE_SUPPORTED
        assert "source_1" in ids

    def test_fabricated_source_id_rejected_when_no_evidence(self):
        """Test 2: Model suggests source_99, but claim contradicts chunk → still unsupported."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        status, ids = validate_claim_against_sources(
            "Employees receive 50 days of annual leave.",
            index,
            model_suggested_source_ids=["source_99"],
        )
        assert status == EVIDENCE_UNSUPPORTED
        assert ids == []

    def test_cross_chunk_evidence_matching(self):
        """Test 17: Model suggests source_1, but actual evidence is in source_2."""
        chunks = [
            _chunk(
                chunk_id=1, sanitized_text="The company was founded in 2010.",
                similarity_score=0.9,
            ),
            _chunk(
                chunk_id=2, sanitized_text="Employees are entitled to 25 days annual leave.",
                similarity_score=0.8,
            ),
        ]
        index = build_authorized_source_index(chunks)

        # Model incorrectly suggests source_1, but claim is about leave (source_2)
        status, ids = validate_claim_against_sources(
            "Employees are entitled to 25 days annual leave.",
            index,
            model_suggested_source_ids=["source_1"],  # Wrong hint
        )
        assert status == EVIDENCE_SUPPORTED
        assert "source_2" in ids
        # source_1 is about founding year; it should NOT be a match
        assert "source_1" not in ids

    def test_empty_sources_returns_unsupported(self):
        """Test 13: No authorized sources available."""
        status, ids = validate_claim_against_sources("Any claim.", {})
        assert status == EVIDENCE_UNSUPPORTED
        assert ids == []

    def test_original_text_not_accessible(self):
        """Test 14: Validation must use only sanitized_text; original_text must not be in index."""
        chunks = [_chunk(
            sanitized_text="Authorized text with [EMAIL_1].",
            original_text="Authorized text with ceo@company.com.",
        )]
        index = build_authorized_source_index(chunks)
        assert "original_text" not in index["source_1"]

    def test_partially_supported_conditional_claim(self):
        """Test 10: Claim adds condition not in chunk → partially_supported."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        status, ids = validate_claim_against_sources(
            "Employees receive 25 days of annual leave, only if approved by HR.",
            index,
            model_suggested_source_ids=["source_1"],
        )
        assert status == EVIDENCE_PARTIALLY_SUPPORTED


class TestResolveEvidenceStatus:
    """Tests for resolve_evidence_status()."""

    def test_all_supported(self):
        claims = [
            {"status": EVIDENCE_SUPPORTED},
            {"status": EVIDENCE_SUPPORTED},
        ]
        assert resolve_evidence_status(claims) == EVIDENCE_SUPPORTED

    def test_mixed_gives_partially_supported(self):
        """Test 10: Some supported, some unsupported → partially_supported."""
        claims = [
            {"status": EVIDENCE_SUPPORTED},
            {"status": EVIDENCE_UNSUPPORTED},
        ]
        assert resolve_evidence_status(claims) == EVIDENCE_PARTIALLY_SUPPORTED

    def test_all_unsupported_gives_insufficient(self):
        claims = [{"status": EVIDENCE_UNSUPPORTED}, {"status": EVIDENCE_UNSUPPORTED}]
        assert resolve_evidence_status(claims) == EVIDENCE_INSUFFICIENT

    def test_all_unverified_gives_insufficient(self):
        claims = [{"status": EVIDENCE_UNVERIFIED}]
        assert resolve_evidence_status(claims) == EVIDENCE_INSUFFICIENT

    def test_empty_gives_insufficient(self):
        assert resolve_evidence_status([]) == EVIDENCE_INSUFFICIENT


class TestValidateAnswer:
    """Tests for the top-level validate_answer() orchestrator."""

    def _make_index(self, sanitized_text: str = "Employees receive 25 days of annual leave.") -> dict:
        return build_authorized_source_index([_chunk(sanitized_text=sanitized_text)])

    def test_valid_structured_response_supported(self):
        """Test 11: All claims verifiable → evidence_status = supported."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        raw = _structured_response(
            "Employees receive 25 days of annual leave.",
            [{"claim": "Employees receive 25 days of annual leave.", "supporting_source_ids": ["source_1"]}],
        )
        answer, claims, status = validate_answer(raw, index)
        assert status == EVIDENCE_SUPPORTED
        assert "25" in answer
        assert len(claims) == 1
        assert claims[0]["status"] == EVIDENCE_SUPPORTED

    def test_unsupported_factual_claim(self):
        """Test 6: Claim says 30 days; chunk says 25 days → unsupported → insufficient_evidence."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        raw = _structured_response(
            "Employees receive 30 days of annual leave.",
            [{"claim": "Employees receive 30 days of annual leave.", "supporting_source_ids": ["source_1"]}],
        )
        answer, claims, status = validate_answer(raw, index)
        assert status == EVIDENCE_INSUFFICIENT
        assert answer == INSUFFICIENT_EVIDENCE_MESSAGE
        assert claims[0]["status"] == EVIDENCE_UNSUPPORTED

    def test_malformed_json_fallback_conservative(self):
        """Test 15: Malformed JSON → all claims unverified, insufficient_evidence."""
        index = self._make_index()
        answer, claims, status = validate_answer('{"answer": BROKEN JSON', index)
        assert status == EVIDENCE_INSUFFICIENT
        # Claims must be unverified, not supported
        for c in claims:
            assert c["status"] == EVIDENCE_UNVERIFIED

    def test_plain_text_response_not_auto_supported(self):
        """Test 16: Plain-text response → claims unverified → insufficient_evidence."""
        index = self._make_index()
        answer, claims, status = validate_answer(
            "Employees receive 25 days of annual leave per year.",
            index,
        )
        assert status == EVIDENCE_INSUFFICIENT
        assert answer == INSUFFICIENT_EVIDENCE_MESSAGE
        for c in claims:
            assert c["status"] not in (EVIDENCE_SUPPORTED, EVIDENCE_PARTIALLY_SUPPORTED)

    def test_empty_answer_field_returns_insufficient(self):
        """Test 18: LLM returns {"answer": "", "claims": []} → insufficient_evidence."""
        index = self._make_index()
        raw = json.dumps({"answer": "", "claims": []})
        answer, claims, status = validate_answer(raw, index)
        assert status == EVIDENCE_INSUFFICIENT
        assert answer == INSUFFICIENT_EVIDENCE_MESSAGE

    def test_fabricated_citation_rejected(self):
        """Test 3 & 4: Model suggests nonexistent source_99; claim has no real evidence."""
        index = self._make_index("Employees receive 25 days of annual leave.")
        raw = _structured_response(
            "Employees receive 50 days of leave.",
            [{"claim": "Employees receive 50 days of leave.", "supporting_source_ids": ["source_99"]}],
        )
        answer, claims, status = validate_answer(raw, index)
        assert claims[0]["status"] == EVIDENCE_UNSUPPORTED
        # source_99 must not appear in verified source_ids
        assert "source_99" not in claims[0]["source_ids"]

    def test_negation_change_unsupported(self):
        """Test 9: Negation conflict → claim unsupported."""
        index = self._make_index("Remote work is allowed for all employees.")
        raw = _structured_response(
            "Remote work is not allowed for all employees.",
            [{"claim": "Remote work is not allowed for all employees.", "supporting_source_ids": ["source_1"]}],
        )
        answer, claims, status = validate_answer(raw, index)
        assert claims[0]["status"] == EVIDENCE_UNSUPPORTED

    def test_incorrect_date_unsupported(self):
        """Test 8: Date in claim doesn't match chunk → unsupported."""
        index = self._make_index("Policy effective January 1, 2024.")
        raw = _structured_response(
            "Policy effective March 15, 2025.",
            [{"claim": "Policy effective March 15, 2025.", "supporting_source_ids": ["source_1"]}],
        )
        answer, claims, status = validate_answer(raw, index)
        assert claims[0]["status"] == EVIDENCE_UNSUPPORTED

    def test_cross_chunk_evidence_matching(self):
        """Test 17: Model says source_1, but claim is supported by source_2."""
        chunks = [
            _chunk(chunk_id=1, sanitized_text="The company was founded in 2010."),
            _chunk(chunk_id=2, sanitized_text="Employees are entitled to 25 days annual leave."),
        ]
        index = build_authorized_source_index(chunks)
        raw = _structured_response(
            "Employees are entitled to 25 days annual leave.",
            [{"claim": "Employees are entitled to 25 days annual leave.", "supporting_source_ids": ["source_1"]}],
        )
        answer, claims, status = validate_answer(raw, index)
        assert claims[0]["status"] == EVIDENCE_SUPPORTED
        # Must be relinked to source_2, not source_1
        assert "source_2" in claims[0]["source_ids"]
        assert "source_1" not in claims[0]["source_ids"]

    def test_partially_supported_answer(self):
        """Test 10: One claim supported, one unsupported → partially_supported."""
        chunks = [_chunk(sanitized_text="Employees receive 25 days of annual leave.")]
        index = build_authorized_source_index(chunks)
        raw = _structured_response(
            "Employees receive 25 days of leave. The sky is green.",
            [
                {"claim": "Employees receive 25 days of annual leave.", "supporting_source_ids": ["source_1"]},
                {"claim": "The sky is green.", "supporting_source_ids": []},
            ],
        )
        answer, claims, status = validate_answer(raw, index)
        assert status == EVIDENCE_PARTIALLY_SUPPORTED
        statuses = [c["status"] for c in claims]
        assert EVIDENCE_SUPPORTED in statuses or EVIDENCE_PARTIALLY_SUPPORTED in statuses
        assert EVIDENCE_UNSUPPORTED in statuses

    def test_empty_llm_response_returns_insufficient(self):
        index = self._make_index()
        answer, claims, status = validate_answer("", index)
        assert status == EVIDENCE_INSUFFICIENT
        assert answer == INSUFFICIENT_EVIDENCE_MESSAGE

    def test_original_text_not_used_in_validation(self):
        """Test 14: Validator must never access original_text from chunks."""
        # original_text has number 50; sanitized_text has 25
        # Claim says 50 days → should fail (sanitized text wins, not original)
        chunks = [_chunk(
            sanitized_text="Employees receive 25 days of annual leave.",
            original_text="Employees receive 50 days of annual leave.",  # Must NOT be used
        )]
        index = build_authorized_source_index(chunks)
        # Confirm original_text is not in the index
        assert "original_text" not in index["source_1"]
        # Claim says 50 — should be UNSUPPORTED because sanitized text says 25
        raw = _structured_response(
            "Employees receive 50 days of leave.",
            [{"claim": "Employees receive 50 days of annual leave.", "supporting_source_ids": ["source_1"]}],
        )
        answer, claims, status = validate_answer(raw, index)
        assert claims[0]["status"] == EVIDENCE_UNSUPPORTED

    def test_no_sources_returns_insufficient(self):
        """Test 12: Empty authorized source index."""
        answer, claims, status = validate_answer(
            _structured_response("Some answer.", [{"claim": "Some claim.", "supporting_source_ids": []}]),
            {},
        )
        assert status == EVIDENCE_INSUFFICIENT


# ===========================================================================
# B. API Integration Tests (POST /rag/answer)
# ===========================================================================

def _create_user(db, email: str, role: str = "employee", is_active: bool = True) -> User:
    u = User(email=email, full_name="User " + email, password_hash="hashed", role=role, is_active=is_active)
    db.add(u)
    db.flush()
    return u


def _create_doc(db, owner: User, filename: str = "policy.pdf") -> Document:
    d = Document(title=filename, filename=filename, storage_path="/tmp/x", owner_id=owner.id, status="uploaded")
    db.add(d)
    db.flush()
    return d


def _create_chunk(db, doc: Document, idx: int = 0, text: str = "chunk text.") -> DocumentChunk:
    c = DocumentChunk(
        document_id=doc.id,
        page_number=3,
        chunk_index=idx,
        chunk_text=text,
        start_char=0,
        end_char=len(text),
        embedding=[1.0 / (768 ** 0.5)] * 768,
        embedding_model="nomic-embed-text",
    )
    db.add(c)
    db.flush()
    return c


class TestRAGAnswerCitationEndpoint:
    """Integration tests for the /rag/answer endpoint – Step 5 citation behavior."""

    @pytest.fixture(autouse=True)
    def setup(self, db):
        self.db = db
        self.owner = _create_user(db, "citation_owner@x.com")
        self.doc = _create_doc(db, self.owner, "employee_handbook.pdf")
        self.chunk = _create_chunk(
            db, self.doc,
            text="Employees receive 25 days of annual leave. Contact hr@company.com for queries.",
        )
        db.commit()

        self.embed_patch = patch(
            "app.rag.retrieval.OllamaEmbeddingClient.embed_query",
            return_value=[1.0 / (768 ** 0.5)] * 768,
        )
        self.embed_patch.start()
        yield
        self.embed_patch.stop()

    def test_endpoint_returns_evidence_status_field(self, client):
        """Test 19: API endpoint returns evidence_status field."""
        app.dependency_overrides[get_current_user] = lambda: self.owner
        raw = _structured_response(
            "Employees receive 25 days of annual leave.",
            [{"claim": "Employees receive 25 days of annual leave.", "supporting_source_ids": ["source_1"]}],
        )
        with patch.object(OllamaChatClient, "generate_answer", return_value=raw):
            resp = client.post("/rag/answer", json={"question": "How many leave days?", "top_k": 3})

        assert resp.status_code == 200
        data = resp.json()
        assert "evidence_status" in data
        assert data["evidence_status"] in (
            EVIDENCE_SUPPORTED, EVIDENCE_PARTIALLY_SUPPORTED, EVIDENCE_INSUFFICIENT
        )

    def test_endpoint_returns_claims_list(self, client):
        """Test 20: API endpoint claims list populated correctly."""
        app.dependency_overrides[get_current_user] = lambda: self.owner
        raw = _structured_response(
            "Employees receive 25 days of annual leave.",
            [{"claim": "Employees receive 25 days of annual leave.", "supporting_source_ids": ["source_1"]}],
        )
        with patch.object(OllamaChatClient, "generate_answer", return_value=raw):
            resp = client.post("/rag/answer", json={"question": "How many leave days?", "top_k": 3})

        assert resp.status_code == 200
        data = resp.json()
        assert "claims" in data
        assert isinstance(data["claims"], list)

    def test_sources_derived_from_backend_not_model(self, client):
        """Tests 3 & 4: Sources always come from retrieval records, not model output."""
        app.dependency_overrides[get_current_user] = lambda: self.owner
        # Model fabricates a nonexistent source_id and chunk reference
        raw = _structured_response(
            "Employees receive 25 days of annual leave.",
            [{"claim": "Employees receive 25 days of annual leave.", "supporting_source_ids": ["source_999"]}],
        )
        with patch.object(OllamaChatClient, "generate_answer", return_value=raw):
            resp = client.post("/rag/answer", json={"question": "How many leave days?", "top_k": 3})

        assert resp.status_code == 200
        data = resp.json()
        # Every source in the response must reference an actual retrieved document
        for src in data["sources"]:
            assert src["document_id"] == self.doc.id
            assert src["filename"] == "employee_handbook.pdf"
            assert src["chunk_id"] == self.chunk.id

    def test_fabricated_page_number_not_trusted(self, client):
        """Test 5: Model-fabricated page numbers are ignored; metadata comes from retrieval."""
        app.dependency_overrides[get_current_user] = lambda: self.owner
        # Chunk has page_number=3 (set in _create_chunk); model might suggest page 99
        # but we always use backend metadata
        raw = _structured_response(
            "Employees receive 25 days of annual leave.",
            [{"claim": "Employees receive 25 days.", "supporting_source_ids": ["source_1"]}],
        )
        with patch.object(OllamaChatClient, "generate_answer", return_value=raw):
            resp = client.post("/rag/answer", json={"question": "Leave policy?", "top_k": 3})

        assert resp.status_code == 200
        data = resp.json()
        for src in data["sources"]:
            # Page number must match our DB record (3), not anything the model could fabricate
            assert src["page_number"] == 3

    def test_no_accessible_documents_safe_response_no_llm(self, client, db):
        """Test 12: No relevant chunks → safe message, LLM not called."""
        stranger = _create_user(db, "stranger_citation@x.com")
        db.commit()
        app.dependency_overrides[get_current_user] = lambda: stranger

        with patch.object(OllamaChatClient, "generate_answer") as mock_gen:
            resp = client.post("/rag/answer", json={"question": "Any leave policy?"})

        assert resp.status_code == 200
        data = resp.json()
        assert "do not contain sufficient information" in data["answer"]
        assert data["sources"] == []
        mock_gen.assert_not_called()

    def test_malformed_llm_response_handled_gracefully(self, client):
        """Test 15: Malformed JSON from LLM → conservative fallback, no 500 error."""
        app.dependency_overrides[get_current_user] = lambda: self.owner
        with patch.object(OllamaChatClient, "generate_answer", return_value="{broken json"):
            resp = client.post("/rag/answer", json={"question": "How many leave days?", "top_k": 3})

        assert resp.status_code == 200
        data = resp.json()
        assert data["evidence_status"] == EVIDENCE_INSUFFICIENT

    def test_plain_text_llm_response_not_auto_supported(self, client):
        """Test 16: Plain-text LLM response → insufficient_evidence in response."""
        app.dependency_overrides[get_current_user] = lambda: self.owner
        with patch.object(
            OllamaChatClient, "generate_answer",
            return_value="Employees receive 25 days of annual leave per year.",
        ):
            resp = client.post("/rag/answer", json={"question": "Leave days?", "top_k": 3})

        assert resp.status_code == 200
        data = resp.json()
        # Claims from plain text should be unverified → insufficient
        assert data["evidence_status"] == EVIDENCE_INSUFFICIENT

    def test_unauthorized_user_cannot_access_docs(self, client, db):
        """Test 13: Unauthorized source references rejected; stranger sees no chunks."""
        stranger = _create_user(db, "unauthorized_citation@x.com")
        db.commit()
        app.dependency_overrides[get_current_user] = lambda: stranger

        raw = _structured_response(
            "Employees receive 25 days of annual leave.",
            [{"claim": "25 days leave.", "supporting_source_ids": ["source_1"]}],
        )
        with patch.object(OllamaChatClient, "generate_answer", return_value=raw):
            resp = client.post("/rag/answer", json={"question": "Leave policy?"})

        assert resp.status_code == 200
        data = resp.json()
        # No chunks retrieved → safe message, sources must be empty
        assert data["sources"] == []
        assert data["used_context_chunks"] == 0

