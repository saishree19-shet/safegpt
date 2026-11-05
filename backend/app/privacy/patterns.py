"""
Privacy Detection Patterns and Algorithmic Checksum Validators for CogniSec.

Provides compiled regular expressions, context keywords, and checksum algorithms
for high-precision detection of:
- Personal Identifiable Information (PII)
- Financial Identifiers (with Luhn checksum validation)
- Credentials and Technical Secrets
- Organization and Company-Sensitive Data

Security principles:
- Deterministic and rule-based: no data leaves local memory.
- False-positive reduction via context indicators (e.g. Aadhaar, Bank Accounts).
- Algorithmic validation (e.g. Luhn algorithm for credit/debit cards).
"""

import re
from typing import Optional


# ===========================================================================
# 1. Checksum Validators
# ===========================================================================

def validate_luhn(card_number_str: str) -> bool:
    """
    Validate a payment card number using the Luhn (MOD 10) algorithm.
    Strips non-digits before checking. Returns True only if valid.
    """
    digits = [int(d) for d in re.sub(r"\D", "", card_number_str)]
    if len(digits) < 13 or len(digits) > 19:
        return False

    checksum = 0
    # Process digits from right to left; double every second digit
    for idx, digit in enumerate(reversed(digits)):
        if idx % 2 == 1:
            doubled = digit * 2
            checksum += (doubled - 9) if doubled > 9 else doubled
        else:
            checksum += digit

    return checksum % 10 == 0


def validate_aadhaar_context(raw_text: str, match_start: int, match_end: int) -> bool:
    """
    Validate that a 12-digit number has nearby contextual cues indicating an Aadhaar number,
    such as 'aadhaar', 'uid', 'aadhar', 'adhar', or explicit 4-4-4 spacing.
    Prevents classifying arbitrary 12-digit numbers as Aadhaar.
    """
    # Check if number itself is formatted as 4-4-4 digits
    matched_str = raw_text[match_start:match_end]
    has_spaces = bool(re.match(r"^\d{4}\s\d{4}\s\d{4}$", matched_str))

    # Examine a window of 60 characters before and after the match
    window_start = max(0, match_start - 60)
    window_end = min(len(raw_text), match_end + 60)
    context_window = raw_text[window_start:window_end].lower()

    aadhaar_keywords = {"aadhaar", "aadhar", "adhar", "uidai", "uid number", "unique identification"}
    has_keyword = any(kw in context_window for kw in aadhaar_keywords)

    # Valid if explicit keyword present, or formatted as 4-4-4 spaced with identity context
    if has_keyword:
        return True
    if has_spaces and any(k in context_window for k in {"identity", "id", "card", "gov", "govt"}):
        return True

    return False


# ===========================================================================
# 2. PII Patterns
# ===========================================================================

# Email addresses (RFC 5322 compatible subset)
EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)

# Phone numbers (International E.164, Indian 10-digit mobile, US standard formats)
PHONE_PATTERN = re.compile(
    r"(?:"
    r"(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]\d{4}\b"
    r"|"
    r"(?:\+91[-.\s]?)?[6-9]\d{9}\b"
    r"|"
    r"\+\d{1,3}[-.\s]\d{3,4}[-.\s]\d{4}\b"
    r")"
)

# Date of Birth (must be preceded by context like DOB, Date of Birth, Born on)
DOB_PATTERN = re.compile(
    r"(?i)\b(?:dob|date\s+of\s+birth|born\s+(?:on)?)\s*[:=-]?\s*"
    r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|"
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b"
)

# Government IDs
US_SSN_PATTERN = re.compile(
    r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b"
)

INDIA_PAN_PATTERN = re.compile(
    r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"
)

# Aadhaar: 12 digits, optional space/hyphen between 4-digit groups
INDIA_AADHAAR_PATTERN = re.compile(
    r"\b[2-9]\d{3}[-\s]?\d{4}[-\s]?\d{4}\b"
)

# Person Names (Context-guided to avoid high false-positive rates)
# Looks for honorifics (Mr., Dr., etc.) or corporate attribution (Assigned to, Reported by, Contact, etc.)
PERSON_HONORIFIC_PATTERN = re.compile(
    r"\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b"
)

PERSON_ATTRIBUTION_PATTERN = re.compile(
    r"\b(?:contact|assigned\s+to|reported\s+by|employee|author|manager)\s*[:=-]?\s*"
    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b",
    re.IGNORECASE,
)

# Physical Addresses (Street / Avenue / Road / Postal code indicators)
ADDRESS_PATTERN = re.compile(
    r"\b\d{1,5}\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+"
    r"(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Nagar|Layout|Sector|Block)"
    r"(?:,\s*(?:[A-Za-z\s]+,)?\s*(?:[A-Z]{2}|\d{5,6}))?\b",
    re.IGNORECASE
)


# ===========================================================================
# 3. Financial Patterns
# ===========================================================================

# Credit / Debit Cards (Candidate pattern, strictly validated with validate_luhn)
CREDIT_CARD_CANDIDATE_PATTERN = re.compile(
    r"\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{13,19}\b"
)

# Bank Account Numbers: 9 to 18 digits preceded by financial context
BANK_ACCOUNT_PATTERN = re.compile(
    r"(?i)\b(?:account\s*(?:no\.?|num(?:ber)?|#)?|a/c\s*(?:no\.?)?|bank\s*acc(?:ount)?)\s*[:=-]?\s*"
    r"(\d{9,18})\b"
)

# IFSC Code: 4 uppercase letters + '0' + 6 alphanumeric
IFSC_PATTERN = re.compile(
    r"\b[A-Z]{4}0[A-Z0-9]{6}\b"
)

# UPI ID (e.g. user@oksbi, payment@upi)
UPI_ID_PATTERN = re.compile(
    r"\b[a-zA-Z0-9_.-]+@(okhdfcbank|okaxis|oksbi|okicici|paytm|upi|gpay|ybl|ibl|axl)\b",
    re.IGNORECASE
)

# SWIFT / BIC codes (8 or 11 characters)
SWIFT_BIC_PATTERN = re.compile(
    r"(?i)\b(?:swift|bic)\s*[:=-]?\s*([A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b"
)


# ===========================================================================
# 4. Credentials and Technical Secrets
# ===========================================================================

# Well-known API Keys with specific vendor prefixes
API_KEY_PREDEFINED = re.compile(
    r"(?:"
    r"\bsk-[A-Za-z0-9_-]{32,}\b"             # OpenAI
    r"|"
    r"\bAKIA[0-9A-Z]{16}\b"                 # AWS Access Key ID
    r"|"
    r"\bAIza[0-9A-Za-z-_]{35}\b"            # Google API Key
    r"|"
    r"\bghp_[A-Za-z0-9]{36}\b"              # GitHub Personal Access Token
    r"|"
    r"\bgho_[A-Za-z0-9]{36}\b"              # GitHub OAuth Token
    r"|"
    r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b"     # Slack Token
    r")"
)

# Generic API Key / Secret assignments
GENERIC_API_KEY = re.compile(
    r"(?i)\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\s*[:=]\s*"
    r"['\"]?([A-Za-z0-9_\-]{16,64})['\"]?"
)

# JWT Tokens: Three Base64URL-encoded parts starting with eyJ
JWT_PATTERN = re.compile(
    r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"
)

# Password assignments in config/code
PASSWORD_PATTERN = re.compile(
    r"(?i)\b(?:password|passwd|pwd)\s*[:=]\s*['\"]([^'\"]{4,64})['\"]"
)

# Private Key Blocks
PRIVATE_KEY_PATTERN = re.compile(
    r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"
)

# Database Connection URIs with credentials
DATABASE_URI_PATTERN = re.compile(
    r"\b(?:postgresql|postgres|mysql|mongodb(?:\+srv)?|redis|amqp|mssql):\/\/"
    r"[^:\s@]+:[^@\s]+@[^/\s]+\/[^\s]*",
    re.IGNORECASE
)


# ===========================================================================
# 5. Company-Sensitive Data (Configurable Foundation)
# ===========================================================================

# Internal Employee ID formats (e.g. EMP-1234, EID-56789)
EMPLOYEE_ID_PATTERN = re.compile(
    r"\b(?:EMP|EID|CORP)[-_]?\d{4,6}\b",
    re.IGNORECASE
)

# Confidential Project Names (Configurable codenames)
DEFAULT_PROJECT_NAMES = {"titan", "apollo", "cognisec", "falcon", "omega", "blackbird", "nebula"}
PROJECT_CODENAME_PATTERN = re.compile(
    r"(?i)\bproject\s+([A-Za-z0-9_-]+)\b"
)

# Internal Server Names & URLs (private IP blocks & internal domains)
INTERNAL_URL_PATTERN = re.compile(
    r"(?:"
    r"\bhttps?:\/\/(?:[a-zA-Z0-9_-]+\.)*(?:corp|internal|lan|local)\b[^\s]*"
    r"|"
    r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b"
    r")"
)
