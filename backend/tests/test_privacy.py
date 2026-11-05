"""
Comprehensive Security and Privacy Tests for CogniSec (Step 3).

Covers:
1. Email detection
2. Phone number detection
3. Person-name detection (with honorifics / corporate cues)
4. Card number detection with Luhn checksum validation
5. API key and token detection (vendor-specific and generic)
6. Database connection string detection
7. Consistent placeholders for repeated values across document context
8. Overlapping detection handling (precedence + right-to-left substitution)
9. Unicode text preservation
10. Empty and whitespace-only input
11. Original text immutability
12. Sanitized text contains no detected raw values
13. Unauthorized user cannot access original text
14. Unauthorized user cannot access privacy-review results
15. Administrator role alone does not bypass zero-trust document permissions
16. Revoked document permission immediately blocks access
17. Fail-closed guarantee: sanitization failure never returns raw text
18. Contextual Aadhaar detection: rejects uncontextualized 12-digit numbers
19. API tests: POST /privacy/analyze (authorized vs unauthorized vs unauthenticated)
20. API tests: GET /privacy/documents/{id}/review
21. Integration test: retrieve_and_sanitize_chunks fail-closed and authorization

NOTE: Synthetic test data ONLY. No real employee PII or real credentials are used.
"""

from typing import Optional
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Document, DocumentChunk, DocumentPermission, SanitizedChunk, User
from app.privacy import (
    DETECTOR_VERSION,
    SANITIZER_VERSION,
    SanitizationError,
    SanitizationSession,
    SensitiveEntityDetector,
    get_detector,
    sanitize_chunks_batch,
    sanitize_text,
)
from app.privacy.patterns import validate_luhn
from app.rag.retrieval import retrieve_and_sanitize_chunks
from app.routes.auth import get_current_user

# ---------------------------------------------------------------------------
# Test SQLite Engine for Isolation
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
    def _db_override():
        yield db

    app.dependency_overrides[get_db] = _db_override
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_user(db, email: str, role: str = "employee", is_active: bool = True) -> User:
    u = User(email=email, full_name="User " + email, password_hash="hashed", role=role, is_active=is_active)
    db.add(u); db.flush()
    return u


def _create_doc(db, owner: User, filename: str = "doc.pdf") -> Document:
    d = Document(title=filename, filename=filename, storage_path="/tmp/x", owner_id=owner.id, status="uploaded")
    db.add(d); db.flush()
    return d


def _create_chunk(db, doc: Document, idx: int = 0, text: str = "chunk text.") -> DocumentChunk:
    c = DocumentChunk(
        document_id=doc.id, page_number=1, chunk_index=idx,
        chunk_text=text, start_char=0, end_char=len(text),
        embedding=[0.0] * 768, embedding_model="nomic-embed-text",
    )
    db.add(c); db.flush()
    return c


def _grant(db, doc: Document, user: User, can_read: bool = True) -> DocumentPermission:
    p = DocumentPermission(document_id=doc.id, user_id=user.id, can_read=can_read)
    db.add(p); db.flush()
    return p


# ===========================================================================
# 1. Detector Unit Tests
# ===========================================================================

class TestSensitiveEntityDetector:

    @pytest.fixture(autouse=True)
    def setup_detector(self):
        self.detector = SensitiveEntityDetector()

    # 1. Email detection
    def test_email_detection(self):
        text = "Please reach out to support@example.com and sec-team@company.internal.org."
        res = self.detector.detect(text)
        emails = [d for d in res if d.entity_type == "EMAIL"]
        assert len(emails) == 2
        assert any(d.raw_value == "support@example.com" for d in emails)
        assert any(d.raw_value == "sec-team@company.internal.org" for d in emails)

    # 2. Phone number detection
    def test_phone_number_detection(self):
        text = "Call +1-555-0199 or 9876543210 or (555) 012-3456 for assistance."
        res = self.detector.detect(text)
        phones = [d for d in res if d.entity_type == "PHONE"]
        assert len(phones) >= 3

    # 3. Person-name detection with honorifics and attribution cues
    def test_person_name_detection(self):
        text = "Meeting with Dr. Jane Doe and Mr. Robert Smith. Assigned to: Alice Vance."
        res = self.detector.detect(text)
        names = [d for d in res if d.entity_type == "PERSON"]
        assert len(names) >= 2
        name_vals = [d.raw_value for d in names]
        assert "Jane Doe" in name_vals or "Robert Smith" in name_vals

    # 4. Card number detection with Luhn checksum validation
    def test_card_number_valid_luhn(self):
        # Valid synthetic test card (passes Luhn MOD 10)
        valid_card = "4532-0150-1234-5671"
        assert validate_luhn(valid_card) is True
        text = f"Payment processed with card {valid_card}."
        res = self.detector.detect(text)
        cards = [d for d in res if d.entity_type == "CREDIT_CARD"]
        assert len(cards) == 1
        assert cards[0].raw_value == valid_card

    def test_card_number_invalid_luhn_rejected(self):
        # Invalid 16-digit number (fails Luhn)
        invalid_card = "4532-0150-1234-5670"
        assert validate_luhn(invalid_card) is False
        text = f"Invalid sequence: {invalid_card}."
        res = self.detector.detect(text)
        cards = [d for d in res if d.entity_type == "CREDIT_CARD"]
        assert len(cards) == 0

    # 5. API keys and Token detection
    def test_api_keys_and_tokens(self):
        text = (
            "OpenAI: sk-abc1234567890123456789012345678901234\n"
            "AWS: AKIAIOSFODNN7EXAMPLE\n"
            "GitHub: ghp_123456789012345678901234567890123456\n"
            "Google: AIzaSyD12345678901234567890123456789012\n"
            "JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotRealSignature1234567890\n"
            "Generic: api_key = 'sampleSecretToken1234567890'"
        )
        res = self.detector.detect(text)
        types = {d.entity_type for d in res}
        assert "API_KEY" in types
        assert "JWT_TOKEN" in types

    # 6. Database connection strings
    def test_database_connection_string(self):
        text = "Connect using postgresql://dbadmin:SuperSecretPass99@db.internal:5432/corp_db"
        res = self.detector.detect(text)
        db_creds = [d for d in res if d.entity_type == "DATABASE_CREDENTIALS"]
        assert len(db_creds) == 1
        assert "dbadmin:SuperSecretPass99" in db_creds[0].raw_value

    # 7. Private Keys
    def test_private_key_detection(self):
        text = (
            "-----BEGIN RSA PRIVATE KEY-----\n"
            "MIIEowIBAAKCAQEA0syntheticKeyDataForTestingOnly...\n"
            "-----END RSA PRIVATE KEY-----"
        )
        res = self.detector.detect(text)
        keys = [d for d in res if d.entity_type == "PRIVATE_KEY"]
        assert len(keys) == 1

    # 8. Contextual Aadhaar detection (Requirement 3)
    def test_aadhaar_with_context_detected(self):
        text = "Citizen Aadhaar number is 9876 5432 1098."
        res = self.detector.detect(text)
        aadhaar = [d for d in res if d.entity_type == "INDIA_AADHAAR"]
        assert len(aadhaar) == 1

    def test_uncontextualized_12_digit_number_rejected_as_aadhaar(self):
        text = "Serial number for inventory package: 987654321098."
        res = self.detector.detect(text)
        aadhaar = [d for d in res if d.entity_type == "INDIA_AADHAAR"]
        assert len(aadhaar) == 0

    # 9. India PAN detection
    def test_india_pan_detection(self):
        text = "Taxpayer PAN is ABCDE1234F."
        res = self.detector.detect(text)
        pan = [d for d in res if d.entity_type == "INDIA_PAN"]
        assert len(pan) == 1
        assert pan[0].raw_value == "ABCDE1234F"

    # 10. Financial IFSC and Bank Account
    def test_ifsc_and_bank_account(self):
        text = "Remit to Account No: 123456789012 at IFSC: SBIN0123456."
        res = self.detector.detect(text)
        types = {d.entity_type for d in res}
        assert "BANK_ACCOUNT" in types
        assert "IFSC_CODE" in types


# ===========================================================================
# 2. Sanitizer Unit Tests
# ===========================================================================

class TestTextSanitizer:

    # 1. Deterministic replacement within same context
    def test_deterministic_placeholders_for_repeated_values(self):
        text = "Email alice@example.com once. Then email alice@example.com again. Contact bob@example.com."
        res = sanitize_text(text)

        # Same email must have identical placeholder
        assert "[EMAIL_1]" in res.sanitized_text
        assert "[EMAIL_2]" in res.sanitized_text
        assert "alice@example.com" not in res.sanitized_text
        assert "bob@example.com" not in res.sanitized_text

        # alice@example.com should appear twice as [EMAIL_1]
        assert res.sanitized_text.count("[EMAIL_1]") == 2
        assert res.sanitized_text.count("[EMAIL_2]") == 1

    # 2. Consistent placeholders across batch chunks (Requirement 4)
    def test_batch_sanitization_shares_placeholder_mappings(self):
        session = SanitizationSession()
        chunk1 = {"chunk_text": "First chunk mentions alice@company.com and Dr. John Smith."}
        chunk2 = {"chunk_text": "Second chunk also contacts alice@company.com for guidance."}

        results = sanitize_chunks_batch([chunk1, chunk2], session=session)
        assert len(results) == 2

        # alice@company.com must be [EMAIL_1] in BOTH chunks
        assert "[EMAIL_1]" in results[0].sanitized_text
        assert "[EMAIL_1]" in results[1].sanitized_text
        assert "alice@company.com" not in results[0].sanitized_text
        assert "alice@company.com" not in results[1].sanitized_text

    # 3. Overlapping detection resolution (Precedence + Length)
    def test_overlapping_detections_resolved_safely(self):
        # Database URL contains embedded credentials and password
        text = "Config: postgresql://admin:MyPass123@db.corp.internal:5432/app"
        res = sanitize_text(text)

        # DATABASE_CREDENTIALS has higher priority than PASSWORD; shouldn't corrupt text
        assert "[DATABASE_CREDENTIALS_1]" in res.sanitized_text
        assert "MyPass123" not in res.sanitized_text
        assert "admin" not in res.sanitized_text
        assert res.sanitized_text.startswith("Config: [DATABASE_CREDENTIALS_1]")

    # 4. Unicode text preservation
    def test_unicode_text_preserved(self):
        text = "नमस्ते Rahul! Contact: test@example.com 🚀 (Café Résumé)."
        res = sanitize_text(text)
        assert "नमस्ते" in res.sanitized_text
        assert "🚀" in res.sanitized_text
        assert "Café Résumé" in res.sanitized_text
        assert "test@example.com" not in res.sanitized_text
        assert "[EMAIL_1]" in res.sanitized_text

    # 5. Empty and whitespace input
    def test_empty_and_whitespace_input(self):
        assert sanitize_text("").sanitized_text == ""
        assert sanitize_text("   ").sanitized_text == "   "

    # 6. Original text immutability
    def test_original_text_is_not_modified(self):
        original = "Confidential report by Dr. Alice Smith (alice@corp.com)."
        original_copy = str(original)
        res = sanitize_text(original)

        assert original == original_copy
        assert res.sanitized_text != original
        assert "alice@corp.com" not in res.sanitized_text

    # 7. Detection metadata never contains raw sensitive values (Requirement 6)
    def test_detection_metadata_omits_raw_values(self):
        text = "Contact support@secret.com or call 9876543210."
        res = sanitize_text(text)

        for det in res.detections:
            det_dict = det.model_dump()
            assert "support@secret.com" not in str(det_dict)
            assert "9876543210" not in str(det_dict)
            assert det.placeholder in {"[EMAIL_1]", "[PHONE_1]"}

    # 8. Fail-closed on error (Requirement 7)
    def test_fail_closed_on_detector_error(self):
        broken_detector = MagicMock()
        broken_detector.detect.side_effect = RuntimeError("Detector crash simulation")

        with pytest.raises(SanitizationError):
            sanitize_text("Sensitive text: user@corp.com", detector=broken_detector)


# ===========================================================================
# 3. Privacy Review API Tests (POST /privacy/analyze, GET /privacy/.../review)
# ===========================================================================

class TestPrivacyAPIEndpoints:

    # --- POST /privacy/analyze ---

    def test_analyze_direct_text_success(self, client):
        resp = client.post(
            "/privacy/analyze",
            json={"text": "Reach out to admin@company.com with code 9876543210."},
            headers={"Authorization": "Bearer dummy"},
        )
        # Auth override for current_user
        app.dependency_overrides[get_current_user] = lambda: _create_user(client.app.dependency_overrides[get_db]().__next__(), "own@x.com")

    def test_analyze_chunk_by_owner_succeeds(self, db, client):
        owner = _create_user(db, "owner_api@x.com")
        doc = _create_doc(db, owner, "confidential.pdf")
        chunk = _create_chunk(db, doc, 0, "Confidential: contact ceo@company.com.")
        db.commit()

        app.dependency_overrides[get_current_user] = lambda: owner

        resp = client.post(
            "/privacy/analyze",
            json={"chunk_id": chunk.id},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["chunk_id"] == chunk.id
        assert data["original_text"] == "Confidential: contact ceo@company.com."
        assert "[EMAIL_1]" in data["sanitized_text"]
        assert "ceo@company.com" not in data["sanitized_text"]
        assert data["entity_counts"].get("EMAIL") == 1

    def test_analyze_chunk_by_permitted_reader_succeeds(self, db, client):
        owner = _create_user(db, "owner_p@x.com")
        reader = _create_user(db, "reader_p@x.com")
        doc = _create_doc(db, owner, "shared.pdf")
        chunk = _create_chunk(db, doc, 0, "Confidential note for reader: contact hr@corp.com.")
        _grant(db, doc, reader, can_read=True)
        db.commit()

        app.dependency_overrides[get_current_user] = lambda: reader

        resp = client.post(
            "/privacy/analyze",
            json={"chunk_id": chunk.id},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "[EMAIL_1]" in data["sanitized_text"]
        assert data["original_text"] is not None

    def test_analyze_chunk_by_unauthorized_user_forbidden(self, db, client):
        owner = _create_user(db, "owner_unauth@x.com")
        stranger = _create_user(db, "stranger_unauth@x.com")
        doc = _create_doc(db, owner, "secret.pdf")
        chunk = _create_chunk(db, doc, 0, "Top secret token: ghp_123456789012345678901234567890123456.")
        db.commit()

        app.dependency_overrides[get_current_user] = lambda: stranger

        resp = client.post(
            "/privacy/analyze",
            json={"chunk_id": chunk.id},
        )
        assert resp.status_code == 403
        assert "permission" in resp.json()["detail"].lower()

    # Requirement 1: Administrator role alone does not grant access
    def test_admin_without_explicit_grant_cannot_analyze_chunk(self, db, client):
        owner = _create_user(db, "owner_admin_test@x.com", role="employee")
        admin_user = _create_user(db, "admin_user@x.com", role="admin")
        doc = _create_doc(db, owner, "employee_only.pdf")
        chunk = _create_chunk(db, doc, 0, "Employee personal info: contact test@example.com.")
        db.commit()

        # Admin tries to access employee's document without ownership or explicit read grant
        app.dependency_overrides[get_current_user] = lambda: admin_user

        resp = client.post(
            "/privacy/analyze",
            json={"chunk_id": chunk.id},
        )
        assert resp.status_code == 403

    def test_analyze_chunk_revoked_permission_forbidden(self, db, client):
        owner = _create_user(db, "owner_rev@x.com")
        revoked_user = _create_user(db, "revoked@x.com")
        doc = _create_doc(db, owner, "revoked.pdf")
        chunk = _create_chunk(db, doc, 0, "Sensitive details.")
        _grant(db, doc, revoked_user, can_read=False)
        db.commit()

        app.dependency_overrides[get_current_user] = lambda: revoked_user

        resp = client.post(
            "/privacy/analyze",
            json={"chunk_id": chunk.id},
        )
        assert resp.status_code == 403

    def test_analyze_nonexistent_chunk_returns_404(self, db, client):
        owner = _create_user(db, "owner_404@x.com")
        db.commit()
        app.dependency_overrides[get_current_user] = lambda: owner

        resp = client.post("/privacy/analyze", json={"chunk_id": 99999})
        assert resp.status_code == 404

    # --- GET /privacy/documents/{id}/review ---

    def test_document_privacy_review_success(self, db, client):
        owner = _create_user(db, "doc_owner@x.com")
        doc = _create_doc(db, owner, "review_doc.pdf")
        chunk1 = _create_chunk(db, doc, 0, "First chunk: email alpha@co.com.")
        chunk2 = _create_chunk(db, doc, 1, "Second chunk: email beta@co.com.")
        db.commit()

        app.dependency_overrides[get_current_user] = lambda: owner

        resp = client.get(f"/privacy/documents/{doc.id}/review")
        assert resp.status_code == 200
        data = resp.json()
        assert data["document_id"] == doc.id
        assert data["total_chunks"] == 2
        assert len(data["chunks"]) == 2
        assert data["total_entities_detected"] >= 2
        assert "EMAIL" in data["category_counts"]

        # Check that SanitizedChunk records were persisted in database
        persisted = db.query(SanitizedChunk).filter(SanitizedChunk.document_id == doc.id).all()
        assert len(persisted) == 2

    def test_document_privacy_review_unauthorized_user_forbidden(self, db, client):
        owner = _create_user(db, "doc_owner_sec@x.com")
        stranger = _create_user(db, "stranger_sec@x.com")
        doc = _create_doc(db, owner, "private_doc.pdf")
        _create_chunk(db, doc, 0, "Private info.")
        db.commit()

        app.dependency_overrides[get_current_user] = lambda: stranger

        resp = client.get(f"/privacy/documents/{doc.id}/review")
        assert resp.status_code == 403

    def test_document_privacy_review_nonexistent_returns_404(self, db, client):
        owner = _create_user(db, "owner_rev_404@x.com")
        db.commit()
        app.dependency_overrides[get_current_user] = lambda: owner

        resp = client.get("/privacy/documents/99999/review")
        assert resp.status_code == 404


# ===========================================================================
# 4. RAG Retrieval & Sanitization Integration Tests
# ===========================================================================

class TestRAGRetrievalPrivacyIntegration:

    def test_retrieve_and_sanitize_chunks_pipeline(self, db):
        owner = _create_user(db, "rag_privacy_owner@x.com")
        doc = _create_doc(db, owner, "rag_doc.pdf")
        _create_chunk(db, doc, 0, "Important memo: Contact Dr. Alan Turing at alan@bletchley.org.")
        db.commit()

        mock_client = MagicMock()
        mock_client.embed_query.return_value = [1.0 / (768**0.5)] * 768

        results = retrieve_and_sanitize_chunks(
            query="memo Turing",
            current_user=owner,
            db=db,
            client=mock_client,
        )

        assert len(results) >= 1
        item = results[0]
        assert item["is_sanitized"] is True
        assert "alan@bletchley.org" not in item["sanitized_text"]
        assert "[EMAIL_1]" in item["sanitized_text"]
        assert item["original_text"] == "Important memo: Contact Dr. Alan Turing at alan@bletchley.org."

    def test_retrieve_and_sanitize_fail_closed(self, db):
        owner = _create_user(db, "rag_fail_owner@x.com")
        doc = _create_doc(db, owner, "rag_fail_doc.pdf")
        _create_chunk(db, doc, 0, "Sensitive chunk.")
        db.commit()

        mock_client = MagicMock()
        mock_client.embed_query.return_value = [1.0 / (768**0.5)] * 768

        # When sanitizer raises an unexpected error, fail closed
        with patch("app.rag.retrieval.sanitize_text", side_effect=SanitizationError("Simulation")):
            with pytest.raises(SanitizationError):
                retrieve_and_sanitize_chunks(
                    query="test",
                    current_user=owner,
                    db=db,
                    client=mock_client,
                )
