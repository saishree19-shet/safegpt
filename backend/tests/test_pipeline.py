"""
End-to-end tests for document ingestion and atomic reprocessing.
Verifies chunk creation, embedding storage, atomic replacement, failure safety,
and API vector privacy.
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Document, DocumentChunk, DocumentPermission, DocumentTextPage, User
from app.rag.embeddings import (
    EXPECTED_EMBEDDING_DIM,
    EmbeddingValidationError,
    OllamaConnectionError,
    OllamaEmbeddingClient,
)
from app.rag.pipeline import (
    ingest_document_chunks_and_embeddings,
    reprocess_document_chunks_and_embeddings,
)
from app.security import create_access_token, hash_password


def make_dummy_vector(dim: int = EXPECTED_EMBEDDING_DIM, val: float = 0.05) -> list[float]:
    return [val] * dim


@pytest.fixture(name="db_session")
def fixture_db_session():
    """Isolated SQLite in-memory test database."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(name="client")
def fixture_client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def fixture_test_user(db_session):
    user = User(
        full_name="Alice Documenter",
        email="alice.pipeline@company.com",
        password_hash=hash_password("StrongPassword123!"),
        role="employee",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(name="admin_user")
def fixture_admin_user(db_session):
    admin = User(
        full_name="Admin Boss",
        email="admin.pipeline@company.com",
        password_hash=hash_password("AdminPassword123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(name="mock_embed_client")
def fixture_mock_embed_client():
    client = MagicMock(spec=OllamaEmbeddingClient)
    client.model = "nomic-embed-text"
    client.embed_document_chunks.side_effect = lambda chunks, **kwargs: [
        make_dummy_vector(EXPECTED_EMBEDDING_DIM, 0.01 * (i + 1)) for i in range(len(chunks))
    ]
    return client


def test_ingest_document_chunks_and_embeddings(db_session, test_user, mock_embed_client):
    """Verify document text pages are chunked, embedded, and stored as DocumentChunk records."""
    doc = Document(
        title="Engineering Spec",
        filename="eng_spec.pdf",
        storage_path="/tmp/eng_spec.pdf",
        owner_id=test_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    p1 = DocumentTextPage(
        document_id=doc.id,
        page_number=1,
        text_content="Page 1: System requirements and compliance overview. " * 10,
        char_count=520,
    )
    p2 = DocumentTextPage(
        document_id=doc.id,
        page_number=2,
        text_content="Page 2: Vector search and data pipeline architecture. " * 10,
        char_count=530,
    )
    db_session.add_all([p1, p2])
    db_session.commit()

    stored_chunks = ingest_document_chunks_and_embeddings(
        document_id=doc.id,
        db=db_session,
        client=mock_embed_client,
        chunk_size=300,
        chunk_overlap=50,
    )

    assert len(stored_chunks) >= 4
    db_chunks = (
        db_session.query(DocumentChunk)
        .filter(DocumentChunk.document_id == doc.id)
        .order_by(DocumentChunk.chunk_index.asc())
        .all()
    )
    assert len(db_chunks) == len(stored_chunks)

    # Verify sequential indexes
    indexes = [c.chunk_index for c in db_chunks]
    assert indexes == list(range(len(db_chunks)))

    # Verify model metadata tracking
    for c in db_chunks:
        assert c.embedding_model == "nomic-embed-text"
        assert len(c.embedding) == EXPECTED_EMBEDDING_DIM
        assert c.document_id == doc.id
        assert c.page_number in (1, 2)


def test_atomic_reprocessing_success(db_session, test_user, mock_embed_client):
    """Verify atomic reprocessing replaces old chunks cleanly with new chunks."""
    doc = Document(
        title="Strategy Plan",
        filename="strategy.pdf",
        storage_path="/tmp/strategy.pdf",
        owner_id=test_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    page = DocumentTextPage(
        document_id=doc.id,
        page_number=1,
        text_content="Original text before amendment. " * 15,
        char_count=480,
    )
    db_session.add(page)
    db_session.commit()

    # Ingest original chunks
    old_chunks = ingest_document_chunks_and_embeddings(
        doc.id, db_session, client=mock_embed_client, chunk_size=200, chunk_overlap=30
    )
    db_session.commit()
    old_count = len(old_chunks)
    assert old_count > 0

    # Update page text
    page.text_content = "Amended strategy policy with completely new provisions. " * 20
    db_session.commit()

    # Reprocess atomically
    new_chunks = reprocess_document_chunks_and_embeddings(
        doc.id, db_session, client=mock_embed_client, chunk_size=200, chunk_overlap=30
    )
    db_session.commit()

    current_chunks = (
        db_session.query(DocumentChunk)
        .filter(DocumentChunk.document_id == doc.id)
        .all()
    )
    assert len(current_chunks) == len(new_chunks)
    assert all("Amended strategy policy" in c.chunk_text for c in current_chunks)


def test_atomic_reprocessing_preserves_old_chunks_on_failure(db_session, test_user):
    """
    MANDATORY RULE 2: If embedding generation fails during reprocessing,
    the previous valid chunks MUST be preserved untouched.
    """
    doc = Document(
        title="Security Brief",
        filename="security_brief.pdf",
        storage_path="/tmp/security_brief.pdf",
        owner_id=test_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    page = DocumentTextPage(
        document_id=doc.id,
        page_number=1,
        text_content="Initial valid company security policies. " * 10,
        char_count=410,
    )
    db_session.add(page)
    db_session.commit()

    # Working mock client for initial ingest
    working_client = MagicMock(spec=OllamaEmbeddingClient)
    working_client.model = "nomic-embed-text"
    working_client.embed_document_chunks.side_effect = lambda chunks, **kwargs: [
        make_dummy_vector(EXPECTED_EMBEDDING_DIM, 0.1) for _ in chunks
    ]

    initial_chunks = ingest_document_chunks_and_embeddings(
        doc.id, db_session, client=working_client, chunk_size=150, chunk_overlap=20
    )
    db_session.commit()
    initial_count = len(initial_chunks)
    assert initial_count > 0

    # Failing mock client simulating Ollama failure
    failing_client = MagicMock(spec=OllamaEmbeddingClient)
    failing_client.model = "nomic-embed-text"
    failing_client.embed_document_chunks.side_effect = OllamaConnectionError(
        "Ollama connection refused during reprocessing"
    )

    with pytest.raises(OllamaConnectionError):
        reprocess_document_chunks_and_embeddings(
            doc.id, db_session, client=failing_client
        )

    # CRUCIAL ASSERTION: Verify original chunks are STILL in the database!
    preserved_chunks = (
        db_session.query(DocumentChunk)
        .filter(DocumentChunk.document_id == doc.id)
        .all()
    )
    assert len(preserved_chunks) == initial_count
    assert preserved_chunks[0].chunk_text == initial_chunks[0].chunk_text


def test_docx_page_references_preserved_as_nullable(db_session, test_user, mock_embed_client):
    """
    MANDATORY RULE 1: Preserve actual page references when available;
    represent page reference as nullable (None) when boundaries cannot be determined.
    """
    doc = Document(
        title="Word Manual",
        filename="manual.docx",
        storage_path="/tmp/manual.docx",
        owner_id=test_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    docx_page = DocumentTextPage(
        document_id=doc.id,
        page_number=None,  # Nullable for DOCX
        text_content="Full flowing Word document prose without physical page breaks. " * 10,
        char_count=650,
    )
    db_session.add(docx_page)
    db_session.commit()

    chunks = ingest_document_chunks_and_embeddings(
        doc.id, db_session, client=mock_embed_client, chunk_size=250, chunk_overlap=30
    )
    db_session.commit()

    assert len(chunks) > 0
    for c in chunks:
        assert c.page_number is None  # Accurately preserved as None


def test_document_chunks_api_security_does_not_expose_raw_vectors(
    client, db_session, test_user, mock_embed_client
):
    """
    MANDATORY RULE 5: Never expose raw embedding arrays through API endpoints.
    """
    token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    doc = Document(
        title="Secret Blueprint",
        filename="blueprint.pdf",
        storage_path="/tmp/blueprint.pdf",
        owner_id=test_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    page = DocumentTextPage(
        document_id=doc.id,
        page_number=1,
        text_content="Confidential blueprint descriptions and specs. " * 8,
        char_count=380,
    )
    db_session.add(page)
    db_session.commit()

    ingest_document_chunks_and_embeddings(
        doc.id, db_session, client=mock_embed_client, chunk_size=200, chunk_overlap=30
    )
    db_session.commit()

    response = client.get(f"/documents/{doc.id}/chunks", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

    for item in data:
        assert "chunk_text" in item
        assert "start_char" in item
        assert "end_char" in item
        assert "embedding_model" in item
        # Security assertion: raw vector must NOT be in JSON response!
        assert "embedding" not in item


def test_reprocess_endpoint_permissions(
    client, db_session, test_user, admin_user, mock_embed_client
):
    """Verify reprocess endpoint requires owner or admin permissions."""
    owner_token = create_access_token(data={"sub": str(test_user.id)})
    admin_token = create_access_token(data={"sub": str(admin_user.id)})
    unauthorized_user = User(
        full_name="Eve Hacker",
        email="eve.pipeline@company.com",
        password_hash=hash_password("Pass123!"),
        role="employee",
        is_active=True,
    )
    db_session.add(unauthorized_user)
    db_session.commit()
    eve_token = create_access_token(data={"sub": str(unauthorized_user.id)})

    doc = Document(
        title="Restricted Doc",
        filename="restricted.pdf",
        storage_path="/tmp/restricted.pdf",
        owner_id=test_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    page = DocumentTextPage(
        document_id=doc.id,
        page_number=1,
        text_content="Restricted document text content. " * 10,
        char_count=350,
    )
    db_session.add(page)
    db_session.commit()

    ingest_document_chunks_and_embeddings(
        doc.id, db_session, client=mock_embed_client, chunk_size=200, chunk_overlap=30
    )
    db_session.commit()

    # Unauthorized employee cannot reprocess (403 Forbidden)
    res_eve = client.post(
        f"/documents/{doc.id}/reprocess",
        headers={"Authorization": f"Bearer {eve_token}"},
    )
    assert res_eve.status_code == 403

    # Document owner can reprocess (200 OK)
    with patch("app.routes.documents.reprocess_document_chunks_and_embeddings") as mock_reprocess:
        dummy_chunk = DocumentChunk(
            id=1, document_id=doc.id, chunk_index=0, chunk_text="t", start_char=0, end_char=1,
            embedding=[0.1]*EXPECTED_EMBEDDING_DIM, embedding_model="nomic-embed-text"
        )
        mock_reprocess.return_value = [dummy_chunk]
        res_owner = client.post(
            f"/documents/{doc.id}/reprocess",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert res_owner.status_code == 200
        assert res_owner.json()["chunk_count"] == 1

        # Administrator can also reprocess
        res_admin = client.post(
            f"/documents/{doc.id}/reprocess",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res_admin.status_code == 200
