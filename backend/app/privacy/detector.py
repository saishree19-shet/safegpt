"""
Layered Sensitive Entity Detector for CogniSec.

Detects:
1. Credentials and Technical Secrets (Private keys, Database URIs, API keys, JWT, Passwords)
2. Financial Identifiers (Credit cards with Luhn, Bank accounts with context, IFSC, UPI)
3. Government Identifiers (US SSN, India PAN, India Aadhaar with contextual verification)
4. Personal Identifiable Information (Email, Phone, DOB, Person Names, Physical Addresses)
5. Organization and Company-Sensitive Information (Employee IDs, Project Codenames, Internal URLs)

Zero-trust principles:
- Fully local execution; no external APIs.
- Internal raw values are kept in-memory only during the detection lifecycle.
"""

from dataclasses import dataclass
import re
from typing import Optional, Sequence

from app.privacy.patterns import (
    ADDRESS_PATTERN,
    API_KEY_PREDEFINED,
    BANK_ACCOUNT_PATTERN,
    CREDIT_CARD_CANDIDATE_PATTERN,
    DATABASE_URI_PATTERN,
    DEFAULT_PROJECT_NAMES,
    DOB_PATTERN,
    EMAIL_PATTERN,
    EMPLOYEE_ID_PATTERN,
    GENERIC_API_KEY,
    IFSC_PATTERN,
    INDIA_AADHAAR_PATTERN,
    INDIA_PAN_PATTERN,
    INTERNAL_URL_PATTERN,
    JWT_PATTERN,
    PASSWORD_PATTERN,
    PERSON_ATTRIBUTION_PATTERN,
    PERSON_HONORIFIC_PATTERN,
    PHONE_PATTERN,
    PRIVATE_KEY_PATTERN,
    PROJECT_CODENAME_PATTERN,
    SWIFT_BIC_PATTERN,
    UPI_ID_PATTERN,
    US_SSN_PATTERN,
    validate_aadhaar_context,
    validate_luhn,
)

DETECTOR_VERSION = "v1.0.0"


@dataclass(frozen=True)
class RawDetection:
    """Internal detection item used during sanitization pipeline."""
    entity_type: str
    start_char: int
    end_char: int
    raw_value: str
    confidence: float
    detection_method: str


class SensitiveEntityDetector:
    """
    Modular, high-performance rule and regex detection engine.
    Supports organization-specific custom pattern registration.
    """

    def __init__(self, custom_projects: Optional[set[str]] = None):
        self.project_names = set(DEFAULT_PROJECT_NAMES)
        if custom_projects:
            self.project_names.update(p.lower() for p in custom_projects)
        self._custom_patterns: list[tuple[str, re.Pattern, str, float]] = []

    def register_custom_pattern(
        self,
        name: str,
        regex_pattern: str,
        entity_type: str = "CUSTOM_SECRET",
        confidence: float = 0.9,
    ) -> None:
        """Register a custom organization-specific regex pattern."""
        compiled = re.compile(regex_pattern)
        self._custom_patterns.append((name, compiled, entity_type, confidence))

    def detect(self, text: str) -> list[RawDetection]:
        """
        Scan text and return all raw detection candidate spans.
        Non-empty, unicode-safe, handles empty text gracefully.
        """
        if not text or not text.strip():
            return []

        detections: list[RawDetection] = []

        # -------------------------------------------------------------------
        # 1. Credentials and Technical Secrets
        # -------------------------------------------------------------------
        # Private Keys
        for m in PRIVATE_KEY_PATTERN.finditer(text):
            detections.append(
                RawDetection("PRIVATE_KEY", m.start(), m.end(), m.group(0), 1.0, "regex_header")
            )

        # Database URIs with credentials
        for m in DATABASE_URI_PATTERN.finditer(text):
            detections.append(
                RawDetection("DATABASE_CREDENTIALS", m.start(), m.end(), m.group(0), 1.0, "regex_uri")
            )

        # Predefined vendor API keys
        for m in API_KEY_PREDEFINED.finditer(text):
            detections.append(
                RawDetection("API_KEY", m.start(), m.end(), m.group(0), 1.0, "vendor_prefix")
            )

        # Generic API keys with assignment context
        for m in GENERIC_API_KEY.finditer(text):
            # Capture the secret value token
            val = m.group(1)
            val_start = m.start(1)
            val_end = m.end(1)
            detections.append(
                RawDetection("API_KEY", val_start, val_end, val, 0.90, "assignment_heuristic")
            )

        # JWT Tokens
        for m in JWT_PATTERN.finditer(text):
            detections.append(
                RawDetection("JWT_TOKEN", m.start(), m.end(), m.group(0), 0.95, "jwt_base64")
            )

        # Password assignments
        for m in PASSWORD_PATTERN.finditer(text):
            val = m.group(1)
            detections.append(
                RawDetection("PASSWORD", m.start(1), m.end(1), val, 0.90, "password_assignment")
            )

        # -------------------------------------------------------------------
        # 2. Financial Identifiers
        # -------------------------------------------------------------------
        # Credit/Debit Cards with Luhn Checksum validation
        for m in CREDIT_CARD_CANDIDATE_PATTERN.finditer(text):
            candidate = m.group(0)
            if validate_luhn(candidate):
                detections.append(
                    RawDetection("CREDIT_CARD", m.start(), m.end(), candidate, 1.0, "luhn_checksum")
                )

        # Bank Account Numbers with context
        for m in BANK_ACCOUNT_PATTERN.finditer(text):
            acc_num = m.group(1)
            detections.append(
                RawDetection("BANK_ACCOUNT", m.start(1), m.end(1), acc_num, 0.85, "keyword_context")
            )

        # IFSC Codes
        for m in IFSC_PATTERN.finditer(text):
            detections.append(
                RawDetection("IFSC_CODE", m.start(), m.end(), m.group(0), 0.95, "regex_pattern")
            )

        # UPI Identifiers
        for m in UPI_ID_PATTERN.finditer(text):
            detections.append(
                RawDetection("UPI_ID", m.start(), m.end(), m.group(0), 0.90, "vpa_handle")
            )

        # SWIFT / BIC codes
        for m in SWIFT_BIC_PATTERN.finditer(text):
            bic = m.group(1)
            detections.append(
                RawDetection("SWIFT_BIC", m.start(1), m.end(1), bic, 0.90, "swift_context")
            )

        # -------------------------------------------------------------------
        # 3. Government Identification Numbers
        # -------------------------------------------------------------------
        # US SSN
        for m in US_SSN_PATTERN.finditer(text):
            detections.append(
                RawDetection("US_SSN", m.start(), m.end(), m.group(0), 0.95, "regex_format")
            )

        # India PAN
        for m in INDIA_PAN_PATTERN.finditer(text):
            detections.append(
                RawDetection("INDIA_PAN", m.start(), m.end(), m.group(0), 0.95, "pan_structure")
            )

        # India Aadhaar with contextual verification
        for m in INDIA_AADHAAR_PATTERN.finditer(text):
            if validate_aadhaar_context(text, m.start(), m.end()):
                detections.append(
                    RawDetection("INDIA_AADHAAR", m.start(), m.end(), m.group(0), 0.90, "aadhaar_context")
                )

        # -------------------------------------------------------------------
        # 4. Personal Identifiable Information (PII)
        # -------------------------------------------------------------------
        # Email Addresses
        for m in EMAIL_PATTERN.finditer(text):
            detections.append(
                RawDetection("EMAIL", m.start(), m.end(), m.group(0), 1.0, "rfc5322_regex")
            )

        # Phone Numbers
        for m in PHONE_PATTERN.finditer(text):
            matched = m.group(0).strip()
            # Verify minimum 7 digits to prevent matching small version numbers or years
            digit_count = sum(c.isdigit() for c in matched)
            if digit_count >= 7:
                detections.append(
                    RawDetection("PHONE", m.start(), m.end(), matched, 0.90, "phone_pattern")
                )

        # Date of Birth
        for m in DOB_PATTERN.finditer(text):
            dob_val = m.group(1)
            detections.append(
                RawDetection("DATE_OF_BIRTH", m.start(1), m.end(1), dob_val, 0.85, "dob_context")
            )

        # Person Names (with title or corporate attribution cues)
        for m in PERSON_HONORIFIC_PATTERN.finditer(text):
            name_val = m.group(1)
            if name_val:
                detections.append(
                    RawDetection("PERSON", m.start(1), m.end(1), name_val, 0.85, "honorific_cue")
                )

        for m in PERSON_ATTRIBUTION_PATTERN.finditer(text):
            name_val = m.group(1)
            if name_val:
                detections.append(
                    RawDetection("PERSON", m.start(1), m.end(1), name_val, 0.85, "attribution_cue")
                )

        # Physical Addresses
        for m in ADDRESS_PATTERN.finditer(text):
            detections.append(
                RawDetection("PHYSICAL_ADDRESS", m.start(), m.end(), m.group(0), 0.80, "street_indicators")
            )

        # -------------------------------------------------------------------
        # 5. Organization and Company-Sensitive Data
        # -------------------------------------------------------------------
        # Employee IDs
        for m in EMPLOYEE_ID_PATTERN.finditer(text):
            detections.append(
                RawDetection("EMPLOYEE_ID", m.start(), m.end(), m.group(0), 0.90, "employee_id_format")
            )

        # Confidential Project Codenames
        for m in PROJECT_CODENAME_PATTERN.finditer(text):
            codename = m.group(1).lower()
            if codename in self.project_names:
                detections.append(
                    RawDetection("PROJECT_CODENAME", m.start(1), m.end(1), m.group(1), 0.90, "project_registry")
                )

        # Internal URLs & Private IPs
        for m in INTERNAL_URL_PATTERN.finditer(text):
            detections.append(
                RawDetection("INTERNAL_URL", m.start(), m.end(), m.group(0), 0.95, "internal_network")
            )

        # Custom Registered Patterns
        for name, pattern, entity_type, conf in self._custom_patterns:
            for m in pattern.finditer(text):
                detections.append(
                    RawDetection(entity_type, m.start(), m.end(), m.group(0), conf, f"custom_{name}")
                )

        return detections


# Singleton detector instance for safe memory reuse
_global_detector: Optional[SensitiveEntityDetector] = None


def get_detector() -> SensitiveEntityDetector:
    """Return reusable thread-safe detector instance."""
    global _global_detector
    if _global_detector is None:
        _global_detector = SensitiveEntityDetector()
    return _global_detector
