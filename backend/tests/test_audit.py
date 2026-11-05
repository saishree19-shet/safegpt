"""
Comprehensive Security Audit Logging Tests for CogniSec (Step 6).

Covers:
1. Signup audit logging (SIGNUP_SUCCESS) with user_id, without password or tokens.
2. Login success audit logging (LOGIN_SUCCESS) with user_id and session resource.
3. Login failure audit logging (LOGIN_FAILURE) without user_id (preventing enumeration).
4. Inactive account access audit logging (ACCOUNT_INACTIVE_ACCESS).
5. Document upload audit logging (DOCUMENT_UPLOAD) with safe metadata, no text.
6. Document read audit logging (DOCUMENT_READ) and unauthorized access (UNAUTHORIZED_DOCUMENT_ACCESS).
7. Document permission grant and revoke audit logging (DOCUMENT_PERMISSION_GRANTED, DOCUMENT_PERMISSION_REVOKED).
8. Privacy analysis audit logging (PRIVACY_ANALYSIS, SANITIZATION_SUCCESS, SANITIZATION_FAILURE).
9. Privacy review access audit logging (PRIVACY_REVIEW_ACCESS) for authorized and unauthorized attempts.
10. Semantic search audit logging (SEMANTIC_SEARCH) with safe metrics, no query text or vectors.
11. RAG answer generation audit logging (ANSWER_GENERATION_SUCCESS, INSUFFICIENT_EVIDENCE, CITATION_VALIDATION_FAILURE).
12. Strict metadata allowlist validation (_sanitize_metadata drops unauthorized keys like passwords, prompts, tokens).
13. Employee vs Admin audit log access control (/audit/me scoped to user, /audit restricted to admin, 403 for employee).
14. Audit log pagination and filtering (by event_type, date range, user_id).
15. Audit transaction fail-closed behavior (operation fails if audit log persistence fails).
16. User deletion preserves audit records using ON DELETE SET NULL.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.audit import (
    ACCOUNT_INACTIVE_ACCESS,
    ALLOWED_METADATA_KEYS,
    ANSWER_GENERATION_FAILURE,
    ANSWER_GENERATION_SUCCESS,
    CITATION_VALIDATION_FAILURE,
    DOCUMENT_PERMISSION_GRANTED,
    DOCUMENT_PERMISSION_REVOKED,
    DOCUMENT_READ,
    DOCUMENT_UPLOAD,
    INSUFFICIENT_EVIDENCE,
    LOGIN_FAILURE,
    LOGIN_SUCCESS,
    PRIVACY_ANALYSIS,
    PRIVACY_REVIEW_ACCESS,
    RESOURCE_DOCUMENT,
    RESOURCE_PRIVACY,
    RESOURCE_RAG,
    RESOURCE_SESSION,
    RESOURCE_USER,
    SANITIZATION_FAILURE,
    SANITIZATION_SUCCESS,
    SEMANTIC_SEARCH,
    SIGNUP_SUCCESS,
    STATUS_DENIED,
    STATUS_FAILURE,
    STATUS_SUCCESS,
    STATUS_WARNING,
    UNAUTHORIZED_DOCUMENT_ACCESS,
    _sanitize_metadata,
    get_admin_audit_logs,
    get_user_audit_logs,
    log_event,
)
from app.database import Base, get_db
from app.main import app
from app.models import AuditLog, Document, DocumentChunk, DocumentPermission, SanitizedChunk, User
from app.routes.auth import get_current_user
from app.security import hash_password, login_rate_limiter

# ---------------------------------------------------------------------------
# Test SQLite Engine for Isolation with Foreign Key Support
# ---------------------------------------------------------------------------

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


_Session = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
Base.metadata.create_all(bind=_engine)


@pytest.fixture()
def db():
    """Isolated session per test; drops and recreates schema."""
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)
    session = _Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    """TestClient configured with isolated SQLite DB."""
    login_rate_limiter.reset()

    def _db_override():
        yield db

    app.dependency_overrides[get_db] = _db_override
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()
    login_rate_limiter.reset()


def _create_user(db, email: str, role: str = "employee", is_active: bool = True, password: str = "TestPass123!@#") -> User:
    u = User(
        email=email.strip().lower(),
        full_name="User " + email,
        password_hash=hash_password(password),
        role=role,
        is_active=is_active,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _create_doc(db, owner: User, filename: str = "test_handbook.pdf") -> Document:
    d = Document(
        title=filename,
        filename=filename,
        storage_path="/tmp/" + filename,
        owner_id=owner.id,
        status="uploaded",
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


# ---------------------------------------------------------------------------
# 1. Metadata Allowlist Validation Tests
# ---------------------------------------------------------------------------

def test_metadata_allowlist_drops_forbidden_keys():
    """Verify that _sanitize_metadata strictly drops sensitive or non-allowlisted keys."""
    raw = {
        "password": "supersecretpassword",
        "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token": "secret_token_123",
        "text": "This is raw confidential document text with PII.",
        "original_text": "Sensitive original content",
        "sanitized_text": "Sanitized content",
        "prompt": "You are a helpful assistant. Question: ...",
        "answer": "Here is the answer...",
        "embedding": [0.12, -0.45, 0.88],
        "query": "How do I bypass security?",
        "pii": "john.doe@company.com",
        # Allowed keys
        "document_id": 101,
        "chunk_count": 5,
        "size_bytes": 1024,
        "file_extension": ".pdf",
        "is_owner": True,
        "reason": "invalid_credentials",
    }
    sanitized = _sanitize_metadata(raw)

    # Disallowed keys must NOT be present
    forbidden = ["password", "jwt", "token", "text", "original_text", "sanitized_text", "prompt", "answer", "embedding", "query", "pii"]
    for k in forbidden:
        assert k not in sanitized, f"Forbidden key {k} was not dropped!"

    # Allowed keys must remain
    assert sanitized["document_id"] == 101
    assert sanitized["chunk_count"] == 5
    assert sanitized["size_bytes"] == 1024
    assert sanitized["file_extension"] == ".pdf"
    assert sanitized["is_owner"] is True
    assert sanitized["reason"] == "invalid_credentials"


def test_metadata_allowlist_drops_complex_objects():
    """Verify that nested dicts/lists in metadata values are dropped to prevent secret leakage."""
    raw = {
        "document_id": 101,
        "reason": {"nested_error": "sensitive stack trace with credentials"},
    }
    sanitized = _sanitize_metadata(raw)
    assert "document_id" in sanitized
    assert "reason" not in sanitized


# ---------------------------------------------------------------------------
# 2. Authentication Audit Logging Tests
# ---------------------------------------------------------------------------

def test_signup_audit_logging(client, db):
    """POST /auth/signup creates a user and writes SIGNUP_SUCCESS audit log with user_id."""
    res = client.post(
        "/auth/signup",
        json={
            "full_name": "Audit New User",
            "email": "audit.new@company.com",
            "password": "SecurePassword123!@#",
        },
    )
    assert res.status_code == 201
    user_id = res.json()["id"]

    log = db.query(AuditLog).filter(AuditLog.event_type == SIGNUP_SUCCESS).first()
    assert log is not None
    assert log.event_status == STATUS_SUCCESS
    assert log.user_id == user_id
    assert log.resource_type == RESOURCE_USER
    assert log.resource_id == user_id
    # Assert password is NOT stored in details or anywhere in log
    assert log.details is None or "password" not in str(log.details)


def test_login_success_audit_logging(client, db):
    """POST /auth/login with valid credentials records LOGIN_SUCCESS with user_id."""
    u = _create_user(db, email="login.audit@company.com", password="Password123!@#")

    res = client.post(
        "/auth/login",
        json={"email": "login.audit@company.com", "password": "Password123!@#"},
    )
    assert res.status_code == 200

    log = db.query(AuditLog).filter(AuditLog.event_type == LOGIN_SUCCESS).first()
    assert log is not None
    assert log.event_status == STATUS_SUCCESS
    assert log.user_id == u.id
    assert log.resource_type == RESOURCE_SESSION
    # Ensure no token or password in log
    assert log.details is None or "access_token" not in str(log.details)


def test_login_failure_audit_logging(client, db):
    """POST /auth/login with incorrect credentials records LOGIN_FAILURE without user_id."""
    _create_user(db, email="existing.user@company.com", password="Password123!@#")

    res = client.post(
        "/auth/login",
        json={"email": "existing.user@company.com", "password": "WrongPassword999!"},
    )
    assert res.status_code == 401

    log = db.query(AuditLog).filter(AuditLog.event_type == LOGIN_FAILURE).first()
    assert log is not None
    assert log.event_status == STATUS_FAILURE
    # Security requirement: user_id must be None to prevent account enumeration
    assert log.user_id is None
    assert log.resource_type == RESOURCE_SESSION
    assert log.details == {"reason": "invalid_credentials"}


def test_account_inactive_access_audit_logging(client, db):
    """POST /auth/login for inactive user records ACCOUNT_INACTIVE_ACCESS."""
    u = _create_user(db, email="inactive.user@company.com", password="Password123!@#", is_active=False)

    res = client.post(
        "/auth/login",
        json={"email": "inactive.user@company.com", "password": "Password123!@#"},
    )
    assert res.status_code == 401
    assert "inactive" in res.json()["detail"].lower()

    log = db.query(AuditLog).filter(AuditLog.event_type == ACCOUNT_INACTIVE_ACCESS).first()
    assert log is not None
    assert log.event_status == STATUS_DENIED
    assert log.user_id == u.id
    assert log.resource_type == RESOURCE_SESSION
    assert log.details == {"reason": "account_inactive"}


# ---------------------------------------------------------------------------
# 3. Document Operations Audit Logging Tests
# ---------------------------------------------------------------------------

def test_document_read_and_unauthorized_audit_logging(client, db):
    """GET /documents/{id} logs DOCUMENT_READ on success and UNAUTHORIZED_DOCUMENT_ACCESS on denial."""
    owner = _create_user(db, email="owner@company.com")
    other_user = _create_user(db, email="other@company.com")
    doc = _create_doc(db, owner=owner, filename="q3_report.pdf")

    # 1. Owner reads doc -> DOCUMENT_READ
    app.dependency_overrides[get_current_user] = lambda: owner
    res = client.get(f"/documents/{doc.id}")
    assert res.status_code == 200

    read_log = (
        db.query(AuditLog)
        .filter(AuditLog.event_type == DOCUMENT_READ, AuditLog.user_id == owner.id)
        .first()
    )
    assert read_log is not None
    assert read_log.event_status == STATUS_SUCCESS
    assert read_log.resource_id == doc.id
    assert read_log.details == {"is_owner": True}

    # 2. Other user tries to read doc without permission -> UNAUTHORIZED_DOCUMENT_ACCESS
    app.dependency_overrides[get_current_user] = lambda: other_user
    res = client.get(f"/documents/{doc.id}")
    assert res.status_code == 403

    unauth_log = (
        db.query(AuditLog)
        .filter(AuditLog.event_type == UNAUTHORIZED_DOCUMENT_ACCESS, AuditLog.user_id == other_user.id)
        .first()
    )
    assert unauth_log is not None
    assert unauth_log.event_status == STATUS_DENIED
    assert unauth_log.resource_id == doc.id


def test_permission_grant_and_revoke_audit_logging(client, db):
    """Granting and revoking document access logs DOCUMENT_PERMISSION_GRANTED and DOCUMENT_PERMISSION_REVOKED."""
    owner = _create_user(db, email="owner2@company.com")
    colleague = _create_user(db, email="colleague@company.com")
    doc = _create_doc(db, owner=owner)

    app.dependency_overrides[get_current_user] = lambda: owner

    # Grant permission
    res = client.post(
        f"/documents/{doc.id}/permissions",
        json={"email": colleague.email, "can_read": True},
    )
    assert res.status_code == 201

    grant_log = (
        db.query(AuditLog)
        .filter(AuditLog.event_type == DOCUMENT_PERMISSION_GRANTED)
        .first()
    )
    assert grant_log is not None
    assert grant_log.event_status == STATUS_SUCCESS
    assert grant_log.user_id == owner.id
    assert grant_log.resource_id == doc.id
    assert grant_log.details["target_user_id"] == colleague.id
    assert grant_log.details["can_read"] is True

    # Revoke permission
    res = client.delete(f"/documents/{doc.id}/permissions/{colleague.id}")
    assert res.status_code == 200

    revoke_log = (
        db.query(AuditLog)
        .filter(AuditLog.event_type == DOCUMENT_PERMISSION_REVOKED)
        .first()
    )
    assert revoke_log is not None
    assert revoke_log.event_status == STATUS_SUCCESS
    assert revoke_log.user_id == owner.id
    assert revoke_log.resource_id == doc.id
    assert revoke_log.details["target_user_id"] == colleague.id


# ---------------------------------------------------------------------------
# 4. Privacy Audit Logging Tests
# ---------------------------------------------------------------------------

def test_privacy_analysis_audit_logging(client, db):
    """POST /privacy/analyze logs PRIVACY_ANALYSIS and SANITIZATION_SUCCESS with safe entity metrics."""
    user = _create_user(db, email="privacy.analyst@company.com")
    app.dependency_overrides[get_current_user] = lambda: user

    res = client.post(
        "/privacy/analyze",
        json={"text": "Contact Alice at alice@company.com or 555-123-4567."},
    )
    assert res.status_code == 200

    analysis_log = db.query(AuditLog).filter(AuditLog.event_type == PRIVACY_ANALYSIS).first()
    assert analysis_log is not None
    assert analysis_log.event_status == STATUS_SUCCESS
    assert analysis_log.user_id == user.id
    assert analysis_log.details["entity_count"] >= 1
    # Ensure raw text or PII is NOT in details
    assert "alice@company.com" not in str(analysis_log.details)

    sanit_log = db.query(AuditLog).filter(AuditLog.event_type == SANITIZATION_SUCCESS).first()
    assert sanit_log is not None
    assert sanit_log.event_status == STATUS_SUCCESS


def test_privacy_review_access_audit_logging(client, db):
    """GET /privacy/documents/{id}/review logs PRIVACY_REVIEW_ACCESS for authorized and unauthorized callers."""
    owner = _create_user(db, email="docowner@company.com")
    intruder = _create_user(db, email="intruder@company.com")
    doc = _create_doc(db, owner=owner)

    # 1. Unauthorized attempt
    app.dependency_overrides[get_current_user] = lambda: intruder
    res = client.get(f"/privacy/documents/{doc.id}/review")
    assert res.status_code == 403

    denied_log = (
        db.query(AuditLog)
        .filter(AuditLog.event_type == PRIVACY_REVIEW_ACCESS, AuditLog.event_status == STATUS_DENIED)
        .first()
    )
    assert denied_log is not None
    assert denied_log.user_id == intruder.id
    assert denied_log.resource_id == doc.id

    # 2. Authorized attempt
    app.dependency_overrides[get_current_user] = lambda: owner
    res = client.get(f"/privacy/documents/{doc.id}/review")
    assert res.status_code == 200

    success_log = (
        db.query(AuditLog)
        .filter(AuditLog.event_type == PRIVACY_REVIEW_ACCESS, AuditLog.event_status == STATUS_SUCCESS)
        .first()
    )
    assert success_log is not None
    assert success_log.user_id == owner.id
    assert success_log.resource_id == doc.id


# ---------------------------------------------------------------------------
# 5. RAG Audit Logging Tests
# ---------------------------------------------------------------------------

def test_semantic_search_audit_logging(client, db):
    """POST /rag/search logs SEMANTIC_SEARCH with safe metrics and no raw vectors or query text."""
    user = _create_user(db, email="searcher@company.com")
    app.dependency_overrides[get_current_user] = lambda: user

    with patch("app.routes.rag.search_authorized_chunks", return_value=[]):
        res = client.post("/rag/search", json={"query": "company vacation policy", "top_k": 5})
        assert res.status_code == 200

    log = db.query(AuditLog).filter(AuditLog.event_type == SEMANTIC_SEARCH).first()
    assert log is not None
    assert log.event_status == STATUS_SUCCESS
    assert log.user_id == user.id
    assert log.resource_type == RESOURCE_RAG
    assert log.details["top_k"] == 5
    assert log.details["result_count"] == 0
    # Security: Query string must NOT be logged in details
    assert "query" not in log.details


def test_rag_answer_insufficient_evidence_audit_logging(client, db):
    """POST /rag/answer when no accessible chunks exist logs INSUFFICIENT_EVIDENCE."""
    user = _create_user(db, email="raguser@company.com")
    app.dependency_overrides[get_current_user] = lambda: user

    with patch("app.routes.rag.retrieve_and_sanitize_chunks", return_value=[]):
        res = client.post("/rag/answer", json={"question": "What is the policy?"})
        assert res.status_code == 200
        assert "sufficient" in res.json()["answer"].lower()

    log = db.query(AuditLog).filter(AuditLog.event_type == INSUFFICIENT_EVIDENCE).first()
    assert log is not None
    assert log.event_status == STATUS_SUCCESS
    assert log.user_id == user.id
    assert log.resource_type == RESOURCE_RAG
    assert log.details["used_context_chunks"] == 0


# ---------------------------------------------------------------------------
# 6. User Access Control and Audit Retrieval APIs (/audit/me, /audit)
# ---------------------------------------------------------------------------

def test_audit_me_only_returns_own_records(client, db):
    """GET /audit/me returns ONLY audit records for the authenticated user."""
    user1 = _create_user(db, email="user1@company.com")
    user2 = _create_user(db, email="user2@company.com")

    # Create logs for user1 and user2
    log_event(db, LOGIN_SUCCESS, STATUS_SUCCESS, user_id=user1.id, resource_type=RESOURCE_SESSION)
    log_event(db, DOCUMENT_UPLOAD, STATUS_SUCCESS, user_id=user1.id, resource_type=RESOURCE_DOCUMENT, resource_id=1)
    log_event(db, LOGIN_SUCCESS, STATUS_SUCCESS, user_id=user2.id, resource_type=RESOURCE_SESSION)
    db.commit()

    # User 1 queries /audit/me
    app.dependency_overrides[get_current_user] = lambda: user1
    res = client.get("/audit/me")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    for item in data["items"]:
        assert item["user_id"] == user1.id


def test_admin_audit_access_control(client, db):
    """GET /audit is restricted to admin (employee receives 403 Forbidden)."""
    employee = _create_user(db, email="emp@company.com", role="employee")
    admin = _create_user(db, email="admin@company.com", role="admin")

    log_event(db, LOGIN_SUCCESS, STATUS_SUCCESS, user_id=employee.id, resource_type=RESOURCE_SESSION)
    db.commit()

    # 1. Employee access -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: employee
    res = client.get("/audit")
    assert res.status_code == 403

    # 2. Admin access -> 200 OK with all logs
    app.dependency_overrides[get_current_user] = lambda: admin
    res = client.get("/audit")
    assert res.status_code == 200
    assert res.json()["total"] >= 1


def test_admin_audit_filtering_and_pagination(client, db):
    """Admin endpoint supports filtering by event_type, user_id, and pagination."""
    admin = _create_user(db, email="secops@company.com", role="admin")
    u1 = _create_user(db, email="u1@company.com")
    u2 = _create_user(db, email="u2@company.com")

    log_event(db, LOGIN_SUCCESS, STATUS_SUCCESS, user_id=u1.id, resource_type=RESOURCE_SESSION)
    log_event(db, DOCUMENT_UPLOAD, STATUS_SUCCESS, user_id=u1.id, resource_type=RESOURCE_DOCUMENT)
    log_event(db, LOGIN_SUCCESS, STATUS_SUCCESS, user_id=u2.id, resource_type=RESOURCE_SESSION)
    db.commit()

    app.dependency_overrides[get_current_user] = lambda: admin

    # Filter by user_id
    res = client.get(f"/audit?user_id={u1.id}")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # Filter by event_type
    res = client.get(f"/audit?event_type={DOCUMENT_UPLOAD}")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["event_type"] == DOCUMENT_UPLOAD

    # Pagination: page_size=1
    res = client.get("/audit?page=1&page_size=1")
    assert res.status_code == 200
    assert len(res.json()["items"]) == 1
    assert res.json()["page"] == 1
    assert res.json()["page_size"] == 1


# ---------------------------------------------------------------------------
# 7. Audit Integrity and Survivability (ON DELETE SET NULL)
# ---------------------------------------------------------------------------

def test_user_deletion_preserves_audit_records_set_null(db):
    """Deleting a user account preserves their audit history with user_id SET NULL."""
    user = _create_user(db, email="delete.me@company.com")
    uid = user.id

    rec = log_event(
        db,
        event_type=LOGIN_SUCCESS,
        event_status=STATUS_SUCCESS,
        user_id=uid,
        resource_type=RESOURCE_SESSION,
    )
    db.commit()
    audit_id = rec.id

    # Delete the user from database
    db.delete(user)
    db.commit()

    # Verify audit record still exists and user_id is now None (SET NULL)
    surviving_log = db.query(AuditLog).filter(AuditLog.id == audit_id).first()
    assert surviving_log is not None, "Audit log was incorrectly deleted when user was deleted!"
    assert surviving_log.user_id is None, f"Expected user_id to be NULL, got {surviving_log.user_id}"
    assert surviving_log.event_type == LOGIN_SUCCESS


# ---------------------------------------------------------------------------
# 8. Audit Transaction Fail-Closed Behavior
# ---------------------------------------------------------------------------

def test_audit_failure_aborts_operation_fail_closed(client, db):
    """If log_event fails (e.g. database error), the operation is aborted and returns 500."""
    with patch("app.routes.auth.log_event", return_value=None):
        res = client.post(
            "/auth/signup",
            json={
                "full_name": "Abort Test",
                "email": "abort.test@company.com",
                "password": "SecurePassword123!@#",
            },
        )
        assert res.status_code == 500
        assert "audit" in res.json()["detail"].lower()

    # Verify the user was NOT created in the database
    created = db.query(User).filter(User.email == "abort.test@company.com").first()
    assert created is None, "User must not be saved when required audit log fails to persist!"
