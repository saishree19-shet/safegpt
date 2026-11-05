"""
Integration tests for pgvector vector storage in PostgreSQL safe_company_chatbot.
Verifies the document_chunks table schema, HNSW index, cascading deletion,
and cosine similarity search via pgvector.
"""

import pytest
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database import engine
from app.models import Document, DocumentChunk, User
from app.security import hash_password


@pytest.mark.integration
def test_document_chunks_table_schema_and_indexes():
    """Verify that PostgreSQL contains document_chunks table with vector(768) and HNSW index."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    assert "document_chunks" in table_names

    columns = {c["name"]: c for c in inspector.get_columns("document_chunks")}
    required_cols = {
        "id",
        "document_id",
        "page_number",
        "chunk_index",
        "chunk_text",
        "start_char",
        "end_char",
        "embedding",
        "embedding_model",
        "created_at",
    }
    assert required_cols.issubset(set(columns.keys()))

    # Verify page_number is nullable
    assert columns["page_number"]["nullable"] is True

    # Verify indexes
    indexes = inspector.get_indexes("document_chunks")
    index_names = {ix["name"] for ix in indexes}
    assert "idx_document_chunks_document_id" in index_names
    assert "idx_document_chunks_doc_page_idx" in index_names
    assert "idx_document_chunks_embedding_hnsw" in index_names


@pytest.mark.integration
def test_pgvector_crud_and_cosine_distance_query():
    """Verify inserting vectors and querying with cosine distance (<=>) in PostgreSQL."""
    with Session(engine) as session:
        # Create a temporary test user and document
        test_email = "vector_test_runner@company.internal"
        existing = session.query(User).filter(User.email == test_email).first()
        if existing:
            session.delete(existing)
            session.commit()

        user = User(
            email=test_email,
            full_name="Vector Tester",
            password_hash=hash_password("Password123!"),
            role="employee",
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        doc = Document(
            title="Vector Test Doc",
            filename="vector_test.pdf",
            storage_path="/tmp/fake_vector_path.pdf",
            owner_id=user.id,
            status="uploaded",
        )
        session.add(doc)
        session.commit()
        session.refresh(doc)

        try:
            # Create two 768-dim unit-ish vectors
            v1 = [0.0] * 768
            v1[0] = 1.0  # Vector pointing along axis 0
            v2 = [0.0] * 768
            v2[1] = 1.0  # Vector pointing along axis 1

            chunk1 = DocumentChunk(
                document_id=doc.id,
                page_number=1,
                chunk_index=0,
                chunk_text="Chunk zero vector test along axis 0",
                start_char=0,
                end_char=35,
                embedding=v1,
                embedding_model="nomic-embed-text",
            )
            chunk2 = DocumentChunk(
                document_id=doc.id,
                page_number=2,
                chunk_index=1,
                chunk_text="Chunk one vector test along axis 1",
                start_char=0,
                end_char=34,
                embedding=v2,
                embedding_model="nomic-embed-text",
            )
            session.add_all([chunk1, chunk2])
            session.commit()

            # Query cosine distance using pgvector operator (<=>)
            query_vec = [0.0] * 768
            query_vec[0] = 0.99
            query_vec[1] = 0.01

            # Nearest neighbor to query_vec should be chunk1
            result = (
                session.query(
                    DocumentChunk,
                    DocumentChunk.embedding.cosine_distance(query_vec).label("distance"),
                )
                .filter(DocumentChunk.document_id == doc.id)
                .order_by("distance")
                .first()
            )

            assert result is not None
            nearest_chunk, distance = result
            assert nearest_chunk.chunk_index == 0
            assert nearest_chunk.page_number == 1
            assert distance < 0.05  # Highly similar

            # Test foreign key cascading deletion
            session.delete(doc)
            session.commit()

            remaining_chunks = (
                session.query(DocumentChunk)
                .filter(DocumentChunk.document_id == doc.id)
                .count()
            )
            assert remaining_chunks == 0, "Cascading delete failed to remove document chunks"

        finally:
            # Clean up test user
            session.query(User).filter(User.id == user.id).delete()
            session.commit()

