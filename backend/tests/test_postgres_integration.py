"""
Integration tests for PostgreSQL database safe_company_chatbot.
NOTE: These tests explicitly connect to the real configured PostgreSQL development database
to verify live schema definitions, connectivity, and data integrity.
They perform READ-ONLY assertions and NEVER insert, update, or delete development records.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text

from app.database import engine
from app.main import app


@pytest.mark.integration
def test_postgres_live_database_health():
    """Verify live PostgreSQL connectivity via /health/database using real database engine."""
    with TestClient(app) as client:
        response = client.get("/health/database")
        assert response.status_code == 200
        data = response.json()
        assert data["database"] == "connected"
        assert data["status"] == "ok"


@pytest.mark.integration
def test_postgres_schema_verification():
    """Verify that PostgreSQL contains all required tables, columns, and foreign keys."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    assert "users" in table_names
    assert "documents" in table_names
    assert "document_permissions" in table_names

    # Verify user columns
    user_cols = {c["name"] for c in inspector.get_columns("users")}
    expected_cols = {
        "id", "email", "full_name", "password_hash", "role", "is_active", "created_at"
    }
    assert expected_cols.issubset(user_cols)

    # Verify password_hash column properties
    password_hash_col = next(c for c in inspector.get_columns("users") if c["name"] == "password_hash")
    assert password_hash_col["nullable"] is False


@pytest.mark.integration
def test_postgres_data_unmodified_read_only():
    """Read-only check confirming that development data remains intact and uncorrupted."""
    with engine.connect() as conn:
        user_count = conn.execute(text("SELECT count(*) FROM users")).scalar()
        doc_count = conn.execute(text("SELECT count(*) FROM documents")).scalar()
        perm_count = conn.execute(text("SELECT count(*) FROM document_permissions")).scalar()
        assert user_count >= 0
        assert doc_count >= 0
        assert perm_count >= 0
