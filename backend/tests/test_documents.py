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
from app.models import Document, User
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
