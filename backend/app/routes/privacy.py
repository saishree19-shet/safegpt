"""
Privacy Review and Sanitization API Routes for CogniSec.

Endpoints:
- POST /privacy/analyze: Analyze and sanitize a specific document chunk or text payload.
- GET  /privacy/documents/{document_id}/review: Review sanitized vs original text for a document.

Zero-trust authorization policy:
- The caller must be the document owner OR have an active explicit can_read=True grant.
- An administrator role alone does NOT grant access to the text of documents they do not own or
  have no explicit read grant for.
- Inactive user accounts and unauthenticated callers are rejected (401).
- Nonexistent documents return 404 Not Found.
- Unauthorized users return 403 Forbidden with no content hints.
- Raw sensitive values are strictly excluded from ordinary API responses, detection metadata, and logs.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.audit import (
    PRIVACY_ANALYSIS,
    PRIVACY_REVIEW_ACCESS,
    RESOURCE_PRIVACY,
    SANITIZATION_FAILURE,
    SANITIZATION_SUCCESS,
    STATUS_DENIED,
    STATUS_FAILURE,
    STATUS_SUCCESS,
    log_event,
)
from app.database import get_db
from app.models import Document, DocumentChunk, DocumentPermission, SanitizedChunk, User
from app.privacy import (
    DETECTOR_VERSION,
    SANITIZER_VERSION,
    AnalyzeChunkRequest,
    AnalyzeResponse,
    DocumentPrivacyReviewItem,
    DocumentPrivacyReviewResponse,
    SanitizationError,
    SanitizationSession,
    sanitize_text,
)
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/privacy", tags=["Privacy"])


def _verify_document_read_permission(document: Document, user: User, db: Session) -> bool:
    """
    Zero-trust permission check:
    Returns True if user is the document owner OR has an active can_read=True permission grant.
    An administrator role alone does NOT grant access.
    """
    if document.owner_id == user.id:
        return True

    perm = (
        db.query(DocumentPermission)
        .filter(
            DocumentPermission.document_id == document.id,
            DocumentPermission.user_id == user.id,
        )
        .first()
    )
    return bool(perm and perm.can_read)


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze and sanitize document chunk or text",
    description=(
        "Detect sensitive information and return sanitized text with typed placeholders. "
        "Original text is only returned if the caller owns or has explicit read permissions."
    ),
)
def analyze_chunk(
    body: AnalyzeChunkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    """
    POST /privacy/analyze

    Accepts:
    - document_id & chunk_id: analyzes the specified persisted document chunk.
    - text: directly analyzes raw text submitted in request body.
    """
    original_text: Optional[str] = None
    doc_id: Optional[int] = body.document_id
    chunk_id: Optional[int] = body.chunk_id

    if body.chunk_id is not None:
        # Document chunk lookup
        chunk = db.query(DocumentChunk).filter(DocumentChunk.id == body.chunk_id).first()
        if not chunk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document chunk not found.",
            )

        doc = db.query(Document).filter(Document.id == chunk.document_id).first()
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document not found.",
            )

        # Enforce zero-trust authorization check
        if not _verify_document_read_permission(doc, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this document.",
            )

        text_to_analyze = chunk.chunk_text
        original_text = chunk.chunk_text
        doc_id = doc.id

    elif body.document_id is not None:
        # If document_id provided without chunk_id
        doc = db.query(Document).filter(Document.id == body.document_id).first()
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        if not _verify_document_read_permission(doc, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this document.",
            )

        # Use first chunk if exists, or direct text if provided
        first_chunk = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == doc.id)
            .order_by(DocumentChunk.chunk_index.asc())
            .first()
        )
        if not first_chunk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No chunks found for this document.",
            )

        text_to_analyze = first_chunk.chunk_text
        original_text = first_chunk.chunk_text
        chunk_id = first_chunk.id

    elif body.text is not None:
        # Direct text submission
        text_to_analyze = body.text
        original_text = body.text

    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Must provide either chunk_id, document_id, or text payload.",
        )

    try:
        res = sanitize_text(text_to_analyze)
    except SanitizationError as exc:
        logger.error("Sanitization error during /privacy/analyze: %s", exc)
        log_event(
            db,
            event_type=PRIVACY_ANALYSIS,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_PRIVACY,
            resource_id=doc_id,
            details={
                "document_id": doc_id,
                "chunk_id": chunk_id,
                "error_category": "sanitization_error",
            },
        )
        log_event(
            db,
            event_type=SANITIZATION_FAILURE,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_PRIVACY,
            resource_id=doc_id,
            details={
                "document_id": doc_id,
                "chunk_id": chunk_id,
                "error_category": "sanitization_error",
            },
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sanitization failed. Cannot return un-sanitized content.",
        ) from exc

    # Persist or update sanitized chunk if chunk_id was provided
    if chunk_id is not None and doc_id is not None:
        existing = db.query(SanitizedChunk).filter(SanitizedChunk.chunk_id == chunk_id).first()
        if existing:
            existing.sanitized_text = res.sanitized_text
            existing.entity_counts = res.entity_counts
            existing.detector_version = res.detector_version
            existing.sanitizer_version = res.sanitizer_version
        else:
            new_sanitized = SanitizedChunk(
                chunk_id=chunk_id,
                document_id=doc_id,
                sanitized_text=res.sanitized_text,
                entity_counts=res.entity_counts,
                detector_version=res.detector_version,
                sanitizer_version=res.sanitizer_version,
            )
            db.add(new_sanitized)

    # Audit logging for successful analysis and sanitization
    total_detected = sum(res.entity_counts.values()) if res.entity_counts else 0
    rec_analysis = log_event(
        db,
        event_type=PRIVACY_ANALYSIS,
        event_status=STATUS_SUCCESS,
        user_id=current_user.id,
        resource_type=RESOURCE_PRIVACY,
        resource_id=doc_id,
        details={
            "document_id": doc_id,
            "chunk_id": chunk_id,
            "entity_count": total_detected,
            "detector_version": res.detector_version,
            "sanitizer_version": res.sanitizer_version,
        },
    )
    rec_sanitization = log_event(
        db,
        event_type=SANITIZATION_SUCCESS,
        event_status=STATUS_SUCCESS,
        user_id=current_user.id,
        resource_type=RESOURCE_PRIVACY,
        resource_id=doc_id,
        details={
            "document_id": doc_id,
            "chunk_id": chunk_id,
            "entity_count": total_detected,
            "detector_version": res.detector_version,
            "sanitizer_version": res.sanitizer_version,
        },
    )
    if rec_analysis is None or rec_sanitization is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; operation aborted.",
        )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; operation aborted.",
        )

    return AnalyzeResponse(
        document_id=doc_id,
        chunk_id=chunk_id,
        original_text=original_text,
        sanitized_text=res.sanitized_text,
        detections=res.detections,
        entity_counts=res.entity_counts,
        detector_version=res.detector_version,
        sanitizer_version=res.sanitizer_version,
    )


@router.get(
    "/documents/{document_id}/review",
    response_model=DocumentPrivacyReviewResponse,
    summary="Review sanitized document chunks",
    description=(
        "Retrieve sanitized vs original text for all chunks belonging to an authorized document. "
        "Strictly enforces zero-trust document permissions."
    ),
)
def review_document_privacy(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentPrivacyReviewResponse:
    """
    GET /privacy/documents/{document_id}/review

    Inspect all chunks of a document, their sanitized text, and safe detection category counts.
    Caller must own the document or have active read permission.
    """
    if document_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    if not _verify_document_read_permission(doc, current_user, db):
        log_event(
            db,
            event_type=PRIVACY_REVIEW_ACCESS,
            event_status=STATUS_DENIED,
            user_id=current_user.id,
            resource_type=RESOURCE_PRIVACY,
            resource_id=document_id,
            details={"document_id": document_id, "reason": "permission_denied"},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document.",
        )

    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == doc.id)
        .order_by(DocumentChunk.chunk_index.asc())
        .all()
    )

    review_items: list[DocumentPrivacyReviewItem] = []
    total_entities = 0
    category_counts: dict[str, int] = {}

    # Share a session to guarantee consistent placeholders across all document chunks
    session = SanitizationSession()

    for ch in chunks:
        # Check if already sanitized in database
        existing = db.query(SanitizedChunk).filter(SanitizedChunk.chunk_id == ch.id).first()
        if existing:
            sanitized_text = existing.sanitized_text
            counts = existing.entity_counts or {}
        else:
            try:
                res = sanitize_text(ch.chunk_text, session=session)
            except SanitizationError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to sanitize document chunk.",
                ) from exc

            # Persist newly sanitized chunk
            new_record = SanitizedChunk(
                chunk_id=ch.id,
                document_id=doc.id,
                sanitized_text=res.sanitized_text,
                entity_counts=res.entity_counts,
                detector_version=res.detector_version,
                sanitizer_version=res.sanitizer_version,
            )
            db.add(new_record)
            sanitized_text = res.sanitized_text
            counts = res.entity_counts

        for cat, cnt in counts.items():
            total_entities += cnt
            category_counts[cat] = category_counts.get(cat, 0) + cnt

        review_items.append(
            DocumentPrivacyReviewItem(
                chunk_id=ch.id,
                chunk_index=ch.chunk_index,
                page_number=ch.page_number,
                sanitized_text=sanitized_text,
                original_text=ch.chunk_text,  # Authorized callers receive original text for review
                entity_counts=counts,
            )
        )

    rec_access = log_event(
        db,
        event_type=PRIVACY_REVIEW_ACCESS,
        event_status=STATUS_SUCCESS,
        user_id=current_user.id,
        resource_type=RESOURCE_PRIVACY,
        resource_id=doc.id,
        details={
            "document_id": doc.id,
            "chunk_count": len(chunks),
            "entity_count": total_entities,
        },
    )
    if rec_access is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; operation aborted.",
        )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; operation aborted.",
        )

    return DocumentPrivacyReviewResponse(
        document_id=doc.id,
        filename=doc.filename,
        total_chunks=len(chunks),
        total_entities_detected=total_entities,
        category_counts=category_counts,
        chunks=review_items,
        detector_version=DETECTOR_VERSION,
        sanitizer_version=SANITIZER_VERSION,
    )

