"""
Pydantic Schemas for Sensitive Information Detection and Sanitization in CogniSec.

Enforces zero-leakage security:
- Sensitive raw values are NEVER exposed in detection items, responses, or logs.
- Original text is only returned when the caller is verified to have read permission.
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DetectionEntity(BaseModel):
    """
    Metadata representation of a detected sensitive span.
    Strictly omits raw sensitive values.
    """
    entity_type: str
    start_char: int
    end_char: int
    placeholder: str
    confidence: float = Field(ge=0.0, le=1.0)
    detection_method: str

    model_config = ConfigDict(from_attributes=True)


class AnalyzeChunkRequest(BaseModel):
    """Request payload for POST /privacy/analyze."""
    document_id: Optional[int] = None
    chunk_id: Optional[int] = None
    text: Optional[str] = Field(default=None, max_length=50000)

    model_config = ConfigDict(extra="ignore")


class AnalyzeResponse(BaseModel):
    """Response payload for POST /privacy/analyze."""
    document_id: Optional[int] = None
    chunk_id: Optional[int] = None
    original_text: Optional[str] = None  # Populated ONLY if caller has explicit read authorization
    sanitized_text: str
    detections: list[DetectionEntity]
    entity_counts: dict[str, int]
    detector_version: str
    sanitizer_version: str

    model_config = ConfigDict(from_attributes=True)


class DocumentPrivacyReviewItem(BaseModel):
    """A single chunk review record within a document."""
    chunk_id: int
    chunk_index: int
    page_number: Optional[int] = None
    sanitized_text: str
    original_text: Optional[str] = None  # Populated ONLY if caller is authorized
    entity_counts: dict[str, int]

    model_config = ConfigDict(from_attributes=True)


class DocumentPrivacyReviewResponse(BaseModel):
    """Document-wide privacy review summary."""
    document_id: int
    filename: str
    total_chunks: int
    total_entities_detected: int
    category_counts: dict[str, int]
    chunks: list[DocumentPrivacyReviewItem]
    detector_version: str
    sanitizer_version: str

    model_config = ConfigDict(from_attributes=True)

