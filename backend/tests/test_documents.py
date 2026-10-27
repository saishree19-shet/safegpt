import io
from pathlib import Path
from unittest.mock import patch
import pytest
from docx import Document as WordDocument
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from app.database import Base, get_db
from app.main import app
from app.models import Document, DocumentPermission, User
from app.routes import documents as doc_module
from app.security import create_access_token, hash_password


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
    """Test client using isolated test database."""
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
    """Active user fixture for authenticated requests."""
    user = User(
        full_name="Alice Documenter",
        email="alice@company.com",
        password_hash=hash_password("StrongPassword123!"),
        role="employee",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(name="auth_headers")
def fixture_auth_headers(test_user):
    """Valid authorization headers for active test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="isolated_storage", autouse=True)
def fixture_isolated_storage(tmp_path, monkeypatch):
    """Ensure all test uploads use a temporary directory."""
    monkeypatch.setattr(doc_module, "STORAGE_DIR", tmp_path)
    return tmp_path


def make_valid_pdf_bytes(text: str = "Confidential Company Strategy Plan") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def make_valid_docx_bytes(text: str = "Quarterly Internal Financial Review") -> bytes:
    doc = WordDocument()
    doc.add_paragraph(text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def make_encrypted_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Encrypted classified information")
    pdf_bytes = doc.tobytes(
        encryption=fitz.PDF_ENCRYPT_AES_256,
        owner_pw="admin_owner",
        user_pw="secure_user",
    )
    doc.close()
    return pdf_bytes


def make_blank_pdf_bytes() -> bytes:
    doc = fitz.open()
    doc.new_page()
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def make_blank_docx_bytes() -> bytes:
    doc = WordDocument()
    doc.add_paragraph("   \n\t  ")
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# 1. Authentication requirements
def test_upload_requires_authentication(client):
    pdf_content = make_valid_pdf_bytes()

    # No token provided
    res_no_auth = client.post(
        "/documents/upload",
        files={"file": ("test.pdf", pdf_content, "application/pdf")},
    )
    assert res_no_auth.status_code == 401
    assert "Not authenticated" in res_no_auth.json()["detail"]

    # Invalid token provided
    res_invalid_auth = client.post(
        "/documents/upload",
        files={"file": ("test.pdf", pdf_content, "application/pdf")},
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert res_invalid_auth.status_code == 401

    # Inactive user token
    inactive_token = create_access_token(data={"sub": "99999"})
    res_inactive = client.post(
        "/documents/upload",
        files={"file": ("test.pdf", pdf_content, "application/pdf")},
        headers={"Authorization": f"Bearer {inactive_token}"},
    )
    assert res_inactive.status_code == 401


# 2. PDF upload success and response privacy
def test_upload_pdf_success(client, auth_headers, test_user, db_session, isolated_storage):
    secret_text = "Highly confidential company memo regarding FY27 expansion."
    pdf_content = make_valid_pdf_bytes(secret_text)

    response = client.post(
        "/documents/upload",
        files={"file": ("company_memo.pdf", pdf_content, "application/pdf")},
        headers={**auth_headers},
    )

    assert response.status_code == 201
    data = response.json()

    # Response must include appropriate metadata
    assert data["message"] == "Document uploaded and text extracted successfully."
    assert data["document_id"] > 0
    assert data["filename"] == "company_memo.pdf"
    assert data["size_bytes"] == len(pdf_content)
    assert data["page_count"] == 1
    assert data["status"] == "uploaded"
    assert data["extraction_status"] == "completed"

    # Privacy requirement: never leak extracted company document text in API response
    assert "extracted_text" not in data
    assert secret_text not in str(data)

    # Verify database record
    doc_record = db_session.query(Document).filter(Document.id == data["document_id"]).first()
    assert doc_record is not None
    assert doc_record.title == "company_memo.pdf"
    assert doc_record.filename == "company_memo.pdf"
    assert doc_record.owner_id == test_user.id
    assert doc_record.status == "uploaded"

    # Verify stored file in isolated storage directory
    stored_path = Path(doc_record.storage_path)
    assert stored_path.exists()
    assert stored_path.parent == isolated_storage
    assert stored_path.suffix == ".pdf"
    assert stored_path.stat().st_size == len(pdf_content)


# 3. DOCX upload success and response privacy
def test_upload_docx_success(client, auth_headers, test_user, db_session, isolated_storage):
    secret_text = "Private corporate roadmap for Q3."
    docx_content = make_valid_docx_bytes(secret_text)

    response = client.post(
        "/documents/upload",
        files={"file": ("q3_roadmap.docx", docx_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        headers={**auth_headers},
    )

    assert response.status_code == 201
    data = response.json()

    assert data["message"] == "Document uploaded and text extracted successfully."
    assert data["document_id"] > 0
    assert data["filename"] == "q3_roadmap.docx"
    assert data["size_bytes"] == len(docx_content)
    assert data["page_count"] is None
    assert data["status"] == "uploaded"
    assert data["extraction_status"] == "completed"

    # Privacy verification
    assert "extracted_text" not in data
    assert secret_text not in str(data)

    doc_record = db_session.query(Document).filter(Document.id == data["document_id"]).first()
    assert doc_record is not None
    assert doc_record.owner_id == test_user.id
    assert Path(doc_record.storage_path).exists()


# 4. Invalid file types rejected
@pytest.mark.parametrize(
    "filename, content, content_type",
    [
        ("notes.txt", b"plain text notes", "text/plain"),
        ("spreadsheet.xlsx", b"excel spreadsheet", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("malicious.exe", b"MZbinaryexecutable", "application/octet-stream"),
        ("photo.png", b"\x89PNG\r\n\x1a\nimage", "image/png"),
        ("no_extension", b"some bytes", "application/octet-stream"),
    ]
)
def test_upload_rejects_invalid_file_types(client, auth_headers, isolated_storage, db_session, filename, content, content_type):
    response = client.post(
        "/documents/upload",
        files={"file": (filename, content, content_type)},
        headers={**auth_headers},
    )

    assert response.status_code == 400
    assert "Only PDF and DOCX files are supported." in response.json()["detail"]

    # Verify no files were stored and no DB records created
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# 5. Empty file rejected and cleaned up
def test_upload_empty_file_rejected(client, auth_headers, isolated_storage, db_session):
    for ext in [".pdf", ".docx"]:
        response = client.post(
            "/documents/upload",
            files={"file": (f"empty_document{ext}", b"", "application/octet-stream")},
            headers={**auth_headers},
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
        assert list(isolated_storage.glob("*")) == []
        assert db_session.query(Document).count() == 0


# 6. File size limits enforced and partial files cleaned up
def test_upload_file_size_limit_exceeded(client, auth_headers, isolated_storage, db_session, monkeypatch):
    # Set limit to 500 bytes for deterministic testing
    monkeypatch.setattr(doc_module, "MAX_FILE_SIZE", 500)

    oversized_content = make_valid_pdf_bytes("This is a document whose size exceeds the limit.")
    assert len(oversized_content) > 500

    response = client.post(
        "/documents/upload",
        files={"file": ("oversized.pdf", oversized_content, "application/pdf")},
        headers={**auth_headers},
    )

    assert response.status_code == 413
    assert "limit" in response.json()["detail"].lower()

    # Ensure partial file was completely deleted from disk
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# 7. Corrupt PDF rejection and cleanup
def test_upload_corrupt_pdf(client, auth_headers, isolated_storage, db_session):
    corrupt_pdf = b"%PDF-1.4\nGarbage data not a valid PDF body"
    response = client.post(
        "/documents/upload",
        files={"file": ("corrupt.pdf", corrupt_pdf, "application/pdf")},
        headers={**auth_headers},
    )

    assert response.status_code == 400
    assert "invalid or unreadable" in response.json()["detail"].lower()
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# 8. Corrupt DOCX rejection and cleanup
def test_upload_corrupt_docx(client, auth_headers, isolated_storage, db_session):
    corrupt_docx = b"PK\x03\x04not a valid docx zip structure"
    response = client.post(
        "/documents/upload",
        files={"file": ("corrupt.docx", corrupt_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        headers={**auth_headers},
    )

    assert response.status_code == 400
    assert "invalid or unreadable" in response.json()["detail"].lower()
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# 9. Password-protected PDF rejection and cleanup
def test_upload_encrypted_pdf_rejected(client, auth_headers, isolated_storage, db_session):
    enc_pdf = make_encrypted_pdf_bytes()
    response = client.post(
        "/documents/upload",
        files={"file": ("locked.pdf", enc_pdf, "application/pdf")},
        headers={**auth_headers},
    )

    assert response.status_code == 400
    assert "Password-protected" in response.json()["detail"]
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# 10. PDF with no extracted text (e.g. blank or un-OCRed scan)
def test_upload_pdf_with_no_text_rejected(client, auth_headers, isolated_storage, db_session):
    blank_pdf = make_blank_pdf_bytes()
    response = client.post(
        "/documents/upload",
        files={"file": ("blank_scan.pdf", blank_pdf, "application/pdf")},
        headers={**auth_headers},
    )

    assert response.status_code == 422
    assert "No text was extracted" in response.json()["detail"]
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# 11. DOCX with no extracted text
def test_upload_docx_with_no_text_rejected(client, auth_headers, isolated_storage, db_session):
    blank_docx = make_blank_docx_bytes()
    response = client.post(
        "/documents/upload",
        files={"file": ("blank.docx", blank_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        headers={**auth_headers},
    )

    assert response.status_code == 422
    assert "No text was extracted" in response.json()["detail"]
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# 12. Database persistence error triggers rollback and file cleanup
def test_upload_database_error_rolls_back_and_removes_file(client, auth_headers, isolated_storage, db_session):
    valid_pdf = make_valid_pdf_bytes("Important valid content")

    with patch.object(db_session, "commit", side_effect=Exception("Database write failure")):
        response = client.post(
            "/documents/upload",
            files={"file": ("db_fail.pdf", valid_pdf, "application/pdf")},
            headers={**auth_headers},
        )

    assert response.status_code == 500
    assert "Document upload failed" in response.json()["detail"]

    # Crucial safety check: on DB error, newly written file is removed from disk
    assert list(isolated_storage.glob("*")) == []
    assert db_session.query(Document).count() == 0


# ============================================================================
# DOCUMENT ACCESS CONTROL FIXTURES & TESTS
# ============================================================================

@pytest.fixture(name="second_user")
def fixture_second_user(db_session):
    """Secondary employee user fixture for cross-user permission testing."""
    user = User(
        full_name="Bob Employee",
        email="bob@company.com",
        password_hash=hash_password("BobPassword123!"),
        role="employee",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(name="second_headers")
def fixture_second_headers(second_user):
    """Authorization headers for secondary employee user."""
    token = create_access_token(data={"sub": str(second_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="admin_user")
def fixture_admin_user(db_session):
    """Administrator user fixture."""
    user = User(
        full_name="Carol Administrator",
        email="admin@company.com",
        password_hash=hash_password("AdminPassword123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(name="admin_headers")
def fixture_admin_headers(admin_user):
    """Authorization headers for administrator user."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="sample_document")
def fixture_sample_document(db_session, test_user, isolated_storage):
    """A persisted test document owned by test_user (Alice)."""
    file_path = isolated_storage / "sample_report.pdf"
    file_path.write_bytes(b"%PDF-1.4 test document content")
    doc = Document(
        title="Quarterly Strategy Report.pdf",
        filename="Quarterly Strategy Report.pdf",
        storage_path=str(file_path),
        owner_id=test_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    return doc


# 1. Document Owner Access
def test_list_documents_owner_sees_own_documents(client, auth_headers, sample_document):
    response = client.get("/documents", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == sample_document.id
    assert data[0]["title"] == "Quarterly Strategy Report.pdf"
    assert data[0]["is_owner"] is True
    assert data[0]["can_read"] is True


def test_get_document_owner_access(client, auth_headers, sample_document):
    response = client.get(f"/documents/{sample_document.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_document.id
    assert data["title"] == "Quarterly Strategy Report.pdf"
    assert data["is_owner"] is True
    assert data["can_manage_permissions"] is True
    # Verify sensitive internals are not exposed
    assert "storage_path" not in data
    assert "text" not in data
    assert "password" not in data


# 2. Authorized vs Unauthorized Employees
def test_unauthorized_employee_cannot_list_or_access_document(client, second_headers, sample_document):
    # Bob should not see Alice's document in the document list
    list_resp = client.get("/documents", headers=second_headers)
    assert list_resp.status_code == 200
    assert list_resp.json() == []

    # Direct access by ID must return 403 Forbidden to prevent IDOR
    get_resp = client.get(f"/documents/{sample_document.id}", headers=second_headers)
    assert get_resp.status_code == 403
    assert "do not have permission" in get_resp.json()["detail"].lower()


def test_authorized_employee_can_list_and_access_document(client, auth_headers, second_headers, second_user, sample_document):
    # Alice grants access to Bob
    grant_resp = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"user_id": second_user.id, "can_read": True},
        headers=auth_headers,
    )
    assert grant_resp.status_code == 201

    # Bob can now see the document in list
    list_resp = client.get("/documents", headers=second_headers)
    assert list_resp.status_code == 200
    docs = list_resp.json()
    assert len(docs) == 1
    assert docs[0]["id"] == sample_document.id
    assert docs[0]["is_owner"] is False
    assert docs[0]["can_read"] is True

    # Bob can retrieve safe metadata
    get_resp = client.get(f"/documents/{sample_document.id}", headers=second_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == sample_document.id
    assert data["is_owner"] is False
    assert data["can_manage_permissions"] is False


def test_authorized_employee_cannot_manage_permissions(client, second_headers, second_user, auth_headers, test_user, sample_document, db_session):
    # Grant Bob read access first
    perm = DocumentPermission(
        document_id=sample_document.id,
        user_id=second_user.id,
        can_read=True,
        granted_by=test_user.id,
    )
    db_session.add(perm)
    db_session.commit()

    # Bob attempts to grant permission on Alice's document -> Forbidden
    grant_resp = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"email": "alice@company.com", "can_read": True},
        headers=second_headers,
    )
    assert grant_resp.status_code == 403

    # Bob attempts to revoke permission on Alice's document -> Forbidden
    revoke_resp = client.delete(
        f"/documents/{sample_document.id}/permissions/{second_user.id}",
        headers=second_headers,
    )
    assert revoke_resp.status_code == 403


# 3. Administrator Permissions
def test_administrator_permissions(client, admin_headers, sample_document, second_user):
    # Admin can view document metadata
    get_resp = client.get(f"/documents/{sample_document.id}", headers=admin_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == sample_document.id
    assert data["is_owner"] is False
    assert data["can_manage_permissions"] is True

    # Admin can list system documents with policy flags
    list_resp = client.get("/documents", headers=admin_headers)
    assert list_resp.status_code == 200
    assert any(d["id"] == sample_document.id for d in list_resp.json())

    # Admin can grant access to an employee on a document owned by someone else
    grant_resp = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"user_id": second_user.id, "can_read": True},
        headers=admin_headers,
    )
    assert grant_resp.status_code == 201
    assert grant_resp.json()["can_read"] is True

    # Admin can revoke access from that employee
    revoke_resp = client.delete(
        f"/documents/{sample_document.id}/permissions/{second_user.id}",
        headers=admin_headers,
    )
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["user_id"] == second_user.id


# 4. Grant and Revoke Operations
def test_grant_permission_by_email_and_user_id(client, auth_headers, second_user, sample_document):
    # Grant via email
    resp_email = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"email": "bob@company.com", "can_read": True},
        headers=auth_headers,
    )
    assert resp_email.status_code == 201
    assert resp_email.json()["user_email"] == "bob@company.com"
    assert resp_email.json()["user_id"] == second_user.id

    # Duplicate grant updates existing permission idempotently
    resp_update = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"user_id": second_user.id, "can_read": False},
        headers=auth_headers,
    )
    assert resp_update.status_code == 201
    assert resp_update.json()["can_read"] is False


def test_revocation_takes_effect_immediately(client, auth_headers, second_headers, second_user, sample_document):
    # Grant access
    client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"user_id": second_user.id, "can_read": True},
        headers=auth_headers,
    )

    # Bob can access
    assert client.get(f"/documents/{sample_document.id}", headers=second_headers).status_code == 200

    # Owner revokes access
    revoke_resp = client.delete(
        f"/documents/{sample_document.id}/permissions/{second_user.id}",
        headers=auth_headers,
    )
    assert revoke_resp.status_code == 200

    # Bob's access is immediately denied
    assert client.get(f"/documents/{sample_document.id}", headers=second_headers).status_code == 403
    assert client.get("/documents", headers=second_headers).json() == []


# 5. Invalid IDs and Error Handling
def test_invalid_document_and_user_ids(client, auth_headers, second_user, sample_document):
    # Nonexistent document ID
    assert client.get("/documents/99999", headers=auth_headers).status_code == 404
    assert client.get("/documents/0", headers=auth_headers).status_code == 404
    assert client.get("/documents/-5", headers=auth_headers).status_code == 404

    # Grant on nonexistent document
    assert client.post(
        "/documents/99999/permissions",
        json={"user_id": second_user.id},
        headers=auth_headers,
    ).status_code == 404

    # Grant with nonexistent user_id
    assert client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"user_id": 99999},
        headers=auth_headers,
    ).status_code == 404

    # Grant with nonexistent email
    assert client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"email": "nonexistent@company.com"},
        headers=auth_headers,
    ).status_code == 404

    # Grant with missing user_id and email
    assert client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"can_read": True},
        headers=auth_headers,
    ).status_code == 400

    # Revoke on nonexistent document
    assert client.delete(
        f"/documents/99999/permissions/{second_user.id}",
        headers=auth_headers,
    ).status_code == 404

    # Revoke on nonexistent user
    assert client.delete(
        f"/documents/{sample_document.id}/permissions/99999",
        headers=auth_headers,
    ).status_code == 404

    # Revoke when permission does not exist
    assert client.delete(
        f"/documents/{sample_document.id}/permissions/{second_user.id}",
        headers=auth_headers,
    ).status_code == 404

    # Revoke on document owner rejected
    assert client.delete(
        f"/documents/{sample_document.id}/permissions/{sample_document.owner_id}",
        headers=auth_headers,
    ).status_code == 400


# 6. Privilege Escalation Attempts
def test_privilege_escalation_prevented(client, auth_headers, admin_headers, test_user, admin_user, sample_document):
    # User cannot grant permission to themselves
    resp_self = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"user_id": test_user.id, "can_read": True},
        headers=auth_headers,
    )
    assert resp_self.status_code == 400
    assert "themselves" in resp_self.json()["detail"].lower()

    # Admin cannot grant permission to themselves
    resp_admin_self = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"user_id": admin_user.id, "can_read": True},
        headers=admin_headers,
    )
    assert resp_admin_self.status_code == 400
    assert "themselves" in resp_admin_self.json()["detail"].lower()

    # Granting to document owner rejected
    resp_owner = client.post(
        f"/documents/{sample_document.id}/permissions",
        json={"email": test_user.email, "can_read": True},
        headers=admin_headers,
    )
    assert resp_owner.status_code == 400
    assert "owner already has" in resp_owner.json()["detail"].lower()


# 7. Unauthenticated Requests
def test_unauthenticated_requests_rejected(client, sample_document):
    assert client.get("/documents").status_code == 401
    assert client.get(f"/documents/{sample_document.id}").status_code == 401
    assert client.post(f"/documents/{sample_document.id}/permissions", json={"user_id": 1}).status_code == 401
    assert client.delete(f"/documents/{sample_document.id}/permissions/1").status_code == 401

    # Invalid token rejected
    bad_headers = {"Authorization": "Bearer not.a.valid.jwt.token"}
    assert client.get("/documents", headers=bad_headers).status_code == 401


# 8. Database Failure Handling
def test_grant_and_revoke_database_failure_handling(client, auth_headers, second_user, sample_document, db_session):
    # Grant failure rolls back and returns 500
    with patch.object(db_session, "commit", side_effect=Exception("Database commit failed")):
        grant_resp = client.post(
            f"/documents/{sample_document.id}/permissions",
            json={"user_id": second_user.id, "can_read": True},
            headers=auth_headers,
        )
    assert grant_resp.status_code == 500
    assert "database error" in grant_resp.json()["detail"].lower()
    assert db_session.query(DocumentPermission).count() == 0

    # Create permission successfully
    perm = DocumentPermission(
        document_id=sample_document.id,
        user_id=second_user.id,
        can_read=True,
        granted_by=sample_document.owner_id,
    )
    db_session.add(perm)
    db_session.commit()

    # Revoke failure rolls back and returns 500
    with patch.object(db_session, "commit", side_effect=Exception("Database commit failed")):
        revoke_resp = client.delete(
            f"/documents/{sample_document.id}/permissions/{second_user.id}",
            headers=auth_headers,
        )
    assert revoke_resp.status_code == 500
    assert "database error" in revoke_resp.json()["detail"].lower()
    # Ensure permission was NOT revoked due to rollback
    assert db_session.query(DocumentPermission).count() == 1
