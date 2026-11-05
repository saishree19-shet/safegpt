"""
Deterministic Text Sanitizer for CogniSec.

Replaces detected sensitive information with typed placeholders (e.g. [EMAIL_1], [PERSON_1]).
Enforces:
1. Determinism: identical sensitive values receive the same placeholder within a document session.
2. Cross-chunk consistency: batch processing across document chunks maintains stable placeholders.
3. Safe overlap resolution: credential > financial > government > pii precedence, right-to-left substitution.
4. Non-destructive: preserves all non-sensitive text, line breaks, spacing, and Unicode.
5. Zero leakage: raw values are never stored in placeholders, detection metadata, or logs.
6. Fail-closed: failures raise SanitizationError and never return raw unsanitized text as AI context.
"""

from dataclasses import dataclass, field
import logging
from typing import Optional, Sequence

from app.privacy.detector import RawDetection, SensitiveEntityDetector, get_detector
from app.privacy.schemas import DetectionEntity

logger = logging.getLogger(__name__)

SANITIZER_VERSION = "v1.0.0"

# Category precedence hierarchy for resolving overlapping detection spans
ENTITY_PRIORITY: dict[str, int] = {
    # Highest priority: technical secrets & credentials
    "PRIVATE_KEY": 100,
    "DATABASE_CREDENTIALS": 95,
    "API_KEY": 90,
    "PASSWORD": 90,
    "JWT_TOKEN": 85,
    # Financial identifiers
    "CREDIT_CARD": 80,
    "BANK_ACCOUNT": 75,
    "UPI_ID": 70,
    "IFSC_CODE": 70,
    "SWIFT_BIC": 70,
    # Government identification
    "US_SSN": 65,
    "INDIA_PAN": 65,
    "INDIA_AADHAAR": 65,
    # Personal Identifiable Information (PII)
    "EMAIL": 60,
    "PHONE": 55,
    "PERSON": 50,
    "DATE_OF_BIRTH": 45,
    "PHYSICAL_ADDRESS": 40,
    # Organization-sensitive
    "EMPLOYEE_ID": 35,
    "PROJECT_CODENAME": 30,
    "INTERNAL_URL": 25,
    "CUSTOM_SECRET": 20,
}


class SanitizationError(Exception):
    """Raised when text sanitization encounters an unrecoverable failure. Enforces fail-closed."""
    pass


@dataclass
class SanitizationSession:
    """
    Maintains deterministic placeholder assignments across chunks belonging to the same document.
    """
    # Key: (entity_type, normalized_raw_value) -> placeholder string, e.g. ("EMAIL", "alice@co.com") -> "[EMAIL_1]"
    value_to_placeholder: dict[tuple[str, str], str] = field(default_factory=dict)
    # Next sequential index per entity type: e.g. {"EMAIL": 2, "PERSON": 1}
    type_counters: dict[str, int] = field(default_factory=dict)

    def get_or_create_placeholder(self, entity_type: str, raw_value: str) -> str:
        """
        Return the assigned placeholder for a given entity type and value.
        If not yet seen, allocate the next sequential index.
        """
        norm_key = (entity_type, raw_value.strip().lower() if entity_type == "EMAIL" else raw_value.strip())
        if norm_key in self.value_to_placeholder:
            return self.value_to_placeholder[norm_key]

        next_idx = self.type_counters.get(entity_type, 0) + 1
        self.type_counters[entity_type] = next_idx
        placeholder = f"[{entity_type}_{next_idx}]"
        self.value_to_placeholder[norm_key] = placeholder
        return placeholder


@dataclass
class SanitizationResult:
    """Safe result containing sanitized text and safe detection metadata."""
    sanitized_text: str
    detections: list[DetectionEntity]
    entity_counts: dict[str, int]
    detector_version: str = "v1.0.0"
    sanitizer_version: str = "v1.0.0"


def _resolve_overlapping_detections(detections: Sequence[RawDetection]) -> list[RawDetection]:
    """
    Resolve overlapping candidate detections.
    Sorts by:
      1. Entity priority (higher priority wins)
      2. Span length (longer match wins)
      3. Start offset (earlier match wins)
    Suppresses any candidate that overlaps with an already-accepted higher-priority candidate.
    """
    if not detections:
        return []

    # Sort candidates by descending priority, descending span length, ascending start offset
    sorted_candidates = sorted(
        detections,
        key=lambda d: (
            ENTITY_PRIORITY.get(d.entity_type, 0),
            (d.end_char - d.start_char),
            -d.start_char,
        ),
        reverse=True,
    )

    accepted: list[RawDetection] = []
    occupied_spans: list[tuple[int, int]] = []

    for cand in sorted_candidates:
        c_start, c_end = cand.start_char, cand.end_char
        # Check for overlap with any previously accepted span
        has_overlap = any(
            max(c_start, o_start) < min(c_end, o_end)
            for o_start, o_end in occupied_spans
        )
        if not has_overlap:
            accepted.append(cand)
            occupied_spans.append((c_start, c_end))

    # Return accepted spans ordered by start character offset ascending
    return sorted(accepted, key=lambda d: d.start_char)


def sanitize_text(
    text: str,
    detector: Optional[SensitiveEntityDetector] = None,
    session: Optional[SanitizationSession] = None,
) -> SanitizationResult:
    """
    Detect sensitive entities in text and replace with deterministic typed placeholders.

    Args:
        text:      Input raw text.
        detector:  Optional SensitiveEntityDetector instance (defaults to shared detector).
        session:   Optional SanitizationSession to share placeholder mappings across chunks.

    Returns:
        SanitizationResult containing sanitized text, safe metadata, and category counts.

    Raises:
        SanitizationError: On any unexpected failure (enforcing fail-closed behavior).
    """
    if not isinstance(text, str):
        raise SanitizationError(f"Expected text to be a string, got {type(text).__name__}.")

    if not text:
        return SanitizationResult(
            sanitized_text="",
            detections=[],
            entity_counts={},
            detector_version="v1.0.0",
            sanitizer_version=SANITIZER_VERSION,
        )

    try:
        active_detector = detector or get_detector()
        active_session = session or SanitizationSession()

        # 1. Run detection
        raw_detections = active_detector.detect(text)

        # 2. Resolve overlaps
        resolved_detections = _resolve_overlapping_detections(raw_detections)

        # 3. Associate placeholders
        assigned_entities: list[tuple[RawDetection, str]] = []
        entity_counts: dict[str, int] = {}

        for det in resolved_detections:
            placeholder = active_session.get_or_create_placeholder(det.entity_type, det.raw_value)
            assigned_entities.append((det, placeholder))
            entity_counts[det.entity_type] = entity_counts.get(det.entity_type, 0) + 1

        # 4. Substitute from right to left (descending start offset) so character offsets remain valid
        sanitized_chars = list(text)
        sorted_for_replacement = sorted(assigned_entities, key=lambda pair: pair[0].start_char, reverse=True)

        for det, placeholder in sorted_for_replacement:
            sanitized_chars[det.start_char : det.end_char] = list(placeholder)

        sanitized_text = "".join(sanitized_chars)

        # 5. Build safe detection entities (strictly omit raw values)
        safe_detections: list[DetectionEntity] = []
        for det, placeholder in assigned_entities:
            safe_detections.append(
                DetectionEntity(
                    entity_type=det.entity_type,
                    start_char=det.start_char,
                    end_char=det.end_char,
                    placeholder=placeholder,
                    confidence=det.confidence,
                    detection_method=det.detection_method,
                )
            )

        return SanitizationResult(
            sanitized_text=sanitized_text,
            detections=safe_detections,
            entity_counts=entity_counts,
            detector_version="v1.0.0",
            sanitizer_version=SANITIZER_VERSION,
        )

    except Exception as exc:
        # Fail closed: never return raw unsanitized text when an error occurs
        logger.error("Sanitization failed unexpectedly; failing closed.")
        raise SanitizationError("Failed to sanitize text due to internal error.") from exc


def sanitize_chunks_batch(
    chunks: Sequence[dict],
    detector: Optional[SensitiveEntityDetector] = None,
    session: Optional[SanitizationSession] = None,
) -> list[SanitizationResult]:
    """
    Sanitize a sequence of chunks within a shared SanitizationSession.
    Guarantees consistent placeholders across all chunks in the batch.
    """
    batch_session = session or SanitizationSession()
    results: list[SanitizationResult] = []

    for chunk in chunks:
        chunk_text = chunk.get("chunk_text", "")
        res = sanitize_text(chunk_text, detector=detector, session=batch_session)
        results.append(res)

    return results

