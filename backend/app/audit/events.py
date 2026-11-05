"""
Audit event constants and metadata allowlist for CogniSec.

Defines the canonical set of event names, status values, and resource types.
Implements an explicit allowlist for metadata fields to prevent accidental logging
of passwords, tokens, document text, or other sensitive values.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Event Type Constants
# ---------------------------------------------------------------------------

# Authentication
LOGIN_SUCCESS = "LOGIN_SUCCESS"
LOGIN_FAILURE = "LOGIN_FAILURE"
SIGNUP_SUCCESS = "SIGNUP_SUCCESS"
ACCOUNT_INACTIVE_ACCESS = "ACCOUNT_INACTIVE_ACCESS"

# Documents
DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
DOCUMENT_READ = "DOCUMENT_READ"
DOCUMENT_DELETE = "DOCUMENT_DELETE"
DOCUMENT_PERMISSION_GRANTED = "DOCUMENT_PERMISSION_GRANTED"
DOCUMENT_PERMISSION_REVOKED = "DOCUMENT_PERMISSION_REVOKED"
UNAUTHORIZED_DOCUMENT_ACCESS = "UNAUTHORIZED_DOCUMENT_ACCESS"

# Privacy
PRIVACY_ANALYSIS = "PRIVACY_ANALYSIS"
SANITIZATION_SUCCESS = "SANITIZATION_SUCCESS"
SANITIZATION_FAILURE = "SANITIZATION_FAILURE"
PRIVACY_REVIEW_ACCESS = "PRIVACY_REVIEW_ACCESS"

# RAG / LLM
SEMANTIC_SEARCH = "SEMANTIC_SEARCH"
ANSWER_GENERATION_SUCCESS = "ANSWER_GENERATION_SUCCESS"
ANSWER_GENERATION_FAILURE = "ANSWER_GENERATION_FAILURE"
CITATION_VALIDATION_FAILURE = "CITATION_VALIDATION_FAILURE"
INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

# ---------------------------------------------------------------------------
# All valid event types — used to validate log_event() calls
# ---------------------------------------------------------------------------

VALID_EVENT_TYPES: frozenset[str] = frozenset({
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    SIGNUP_SUCCESS,
    ACCOUNT_INACTIVE_ACCESS,
    DOCUMENT_UPLOAD,
    DOCUMENT_READ,
    DOCUMENT_DELETE,
    DOCUMENT_PERMISSION_GRANTED,
    DOCUMENT_PERMISSION_REVOKED,
    UNAUTHORIZED_DOCUMENT_ACCESS,
    PRIVACY_ANALYSIS,
    SANITIZATION_SUCCESS,
    SANITIZATION_FAILURE,
    PRIVACY_REVIEW_ACCESS,
    SEMANTIC_SEARCH,
    ANSWER_GENERATION_SUCCESS,
    ANSWER_GENERATION_FAILURE,
    CITATION_VALIDATION_FAILURE,
    INSUFFICIENT_EVIDENCE,
})

# ---------------------------------------------------------------------------
# Event Status Constants
# ---------------------------------------------------------------------------

STATUS_SUCCESS = "success"
STATUS_FAILURE = "failure"
STATUS_DENIED = "denied"
STATUS_WARNING = "warning"

VALID_STATUS_VALUES: frozenset[str] = frozenset({
    STATUS_SUCCESS,
    STATUS_FAILURE,
    STATUS_DENIED,
    STATUS_WARNING,
})

# ---------------------------------------------------------------------------
# Resource Type Constants
# ---------------------------------------------------------------------------

RESOURCE_USER = "user"
RESOURCE_DOCUMENT = "document"
RESOURCE_CHUNK = "chunk"
RESOURCE_SESSION = "session"
RESOURCE_RAG = "rag"
RESOURCE_PRIVACY = "privacy"

VALID_RESOURCE_TYPES: frozenset[str] = frozenset({
    RESOURCE_USER,
    RESOURCE_DOCUMENT,
    RESOURCE_CHUNK,
    RESOURCE_SESSION,
    RESOURCE_RAG,
    RESOURCE_PRIVACY,
})

# ---------------------------------------------------------------------------
# Metadata Allowlist
#
# CRITICAL SECURITY CONTROL: Only fields in this set are permitted to appear
# in audit_log.details. Any other key is silently dropped during sanitization.
#
# This prevents accidental logging of:
# - Passwords or password hashes
# - JWT access tokens
# - API keys or secrets
# - Document text content (original or sanitized)
# - LLM prompts or generated answers
# - Embedding vectors
# - Full query strings
# - Raw PII values
# ---------------------------------------------------------------------------

ALLOWED_METADATA_KEYS: frozenset[str] = frozenset({
    # Event classification
    "reason",
    "error_category",

    # Resource identifiers (IDs only, no content)
    "document_id",
    "chunk_id",
    "target_user_id",
    "granted_by_user_id",
    "permission_id",

    # Safe counts and metrics
    "chunk_count",
    "result_count",
    "entity_count",
    "page_count",
    "size_bytes",
    "top_k",
    "similarity_threshold",
    "used_context_chunks",

    # Safe categorical values
    "embedding_status",
    "evidence_status",
    "file_extension",
    "document_status",
    "model_name",

    # Detector/sanitizer versioning (safe metadata)
    "detector_version",
    "sanitizer_version",

    # Boolean flags
    "is_owner",
    "can_read",
})

