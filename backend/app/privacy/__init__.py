"""
CogniSec Privacy and Sanitization Engine.

Provides sensitive information detection, typed placeholder sanitization,
cross-chunk deterministic sessions, and safe metadata handling.
"""

from app.privacy.detector import (
    DETECTOR_VERSION,
    RawDetection,
    SensitiveEntityDetector,
    get_detector,
)
from app.privacy.sanitizer import (
    SANITIZER_VERSION,
    SanitizationError,
    SanitizationResult,
    SanitizationSession,
    sanitize_chunks_batch,
    sanitize_text,
)
from app.privacy.schemas import (
    AnalyzeChunkRequest,
    AnalyzeResponse,
    DetectionEntity,
    DocumentPrivacyReviewItem,
    DocumentPrivacyReviewResponse,
)

__all__ = [
    "SensitiveEntityDetector",
    "get_detector",
    "DETECTOR_VERSION",
    "SANITIZER_VERSION",
    "RawDetection",
    "sanitize_text",
    "sanitize_chunks_batch",
    "SanitizationSession",
    "SanitizationResult",
    "SanitizationError",
    "DetectionEntity",
    "AnalyzeChunkRequest",
    "AnalyzeResponse",
    "DocumentPrivacyReviewItem",
    "DocumentPrivacyReviewResponse",
]

