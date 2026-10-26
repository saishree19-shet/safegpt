import io
import os
import uuid
from pathlib import Path
from typing import Optional

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from docx import Document as WordDocument
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document, User
from app.security import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

# Private local storage. Kept out of version control and not served statically.
STORAGE_DIR = Path(
    os.getenv(
        "DOCUMENT_STORAGE_DIR",
        str(Path(__file__).resolve().parents[2] / "private_uploads"),
    )
)
MAX_FILE_SIZE = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024))  # 10 MB default
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


class DocumentUploadResponse(BaseModel):
    message: str = "Document uploaded and text extracted successfully."
    document_id: int
    filename: str
    size_bytes: int
    page_count: Optional[int] = None
    status: str = "uploaded"
    extraction_status: str = "completed"


def extract_pdf_text(file_path: Path) -> list[dict]:
    """Extract text from each PDF page while preserving page numbers."""
    pages = []

    try:
        pdf_bytes = file_path.read_bytes()
        with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
            if pdf.is_encrypted:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password-protected PDFs are not supported.",
                )

            for page_number, page in enumerate(pdf, start=1):
                pages.append({
                    "page": page_number,
                    "text": page.get_text("text").strip(),
                })
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF is invalid or unreadable.",
        )

    return pages


def extract_docx_text(file_path: Path) -> list[dict]:
    """Extract paragraphs from a Word document."""
    try:
        docx_bytes = io.BytesIO(file_path.read_bytes())
        document = WordDocument(docx_bytes)
        text = "\n".join(
            paragraph.text for paragraph in document.paragraphs
            if paragraph.text.strip()
        )

        # DOCX paragraphs do not have reliable page numbers.
        return [{"page": None, "text": text}]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded Word document is invalid or unreadable.",
        )


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process a company document",
)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Secure document upload endpoint.
    - Requires authenticated user via Bearer token.
    - Accepts only PDF (.pdf) and Word (.docx) files.
    - Enforces file size limit while streaming to disk.
    - Safely extracts text without exposing contents publicly.
    - Stores file with random UUID filename in private directory.
    - Cleans up uploaded files and rolls back DB on any failure.
    """
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if not original_name or len(original_name) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename.",
        )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported.",
        )

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{extension}"
    stored_path = STORAGE_DIR / stored_name

    size = 0

    try:
        # Stream to disk while enforcing the configured size limit.
        with stored_path.open("xb") as destination:
            while True:
                chunk = file.file.read(1024 * 1024)
                if not chunk:
                    break

                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds the {MAX_FILE_SIZE // (1024 * 1024)} MB limit.",
                    )

                destination.write(chunk)

        if size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty.",
            )

        if extension == ".pdf":
            pages = extract_pdf_text(stored_path)
        else:
            pages = extract_docx_text(stored_path)

        extracted_text = "\n\n".join(
            f"[Page {item['page']}]\n{item['text']}"
            if item["page"] is not None else item["text"]
            for item in pages if item["text"]
        )

        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No text was extracted. Scanned PDFs may require OCR.",
            )

        record = Document(
            title=original_name,
            filename=original_name,
            storage_path=str(stored_path),
            owner_id=current_user.id,
            status="uploaded",
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return DocumentUploadResponse(
            message="Document uploaded and text extracted successfully.",
            document_id=record.id,
            filename=record.filename,
            size_bytes=size,
            page_count=len(pages) if extension == ".pdf" else None,
            status=record.status,
            extraction_status="completed",
        )

    except HTTPException:
        db.rollback()
        if stored_path.exists():
            stored_path.unlink(missing_ok=True)
        raise
    except Exception:
        db.rollback()
        if stored_path.exists():
            stored_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document upload failed.",
        )
    finally:
        file.file.close()
