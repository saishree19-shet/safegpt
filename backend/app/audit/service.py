"""
Security Audit Logging Service for CogniSec.

Responsibilities:
1. Write audit log records to the database using an explicit allowlist for metadata.
2. Provide query functions for per-user and administrator audit log retrieval.
3. Never log passwords, tokens, document text, PII, or other sensitive values.
4. Handle database errors safely without leaking internal exceptions.

Security model:
- Metadata keys are validated against ALLOWED_METADATA_KEYS before storage.
- Any key not in the allowlist is silently dropped. This is the primary
  defence against accidental sensitive-data logging.
- Audit records use SET NULL on user_id FK so they survive user deletion.
- Application code cannot UPDATE or DELETE audit records through this service.
  Read access is strictly scoped (employees: own records; admins: all records).

Limitations (documented, not hidden):
- Database-level immutability is not enforced. A privileged DB user or DBA can
  still modify records directly. For stronger guarantees, consider a dedicated
  append-only audit database or write-once storage tier (future enhancement).
- The in-process audit write is not cryptographically signed or hash-chained.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.audit.events import (
    ALLOWED_METADATA_KEYS,
    VALID_EVENT_TYPES,
    VALID_STATUS_VALUES,
)
from app.models import AuditLog

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Metadata sanitization
# ---------------------------------------------------------------------------

def _sanitize_metadata(raw: dict[str, Any] | None) -> dict[str, Any]:
    """
    Return a copy of raw containing ONLY keys in ALLOWED_METADATA_KEYS.

    Any key not explicitly permitted is silently dropped. Values that are
    not JSON-serializable safe primitives (str, int, float, bool, None) are
    also dropped to prevent accidental storage of complex objects.
    """
    if not raw:
        return {}

    safe_types = (str, int, float, bool, type(None))
    result: dict[str, Any] = {}

    for key, value in raw.items():
        if key not in ALLOWED_METADATA_KEYS:
            continue
        if not isinstance(value, safe_types):
            # Drop complex objects (lists, dicts, custom classes) silently
            continue
        result[key] = value

    return result


# ---------------------------------------------------------------------------
# Core write operation
# ---------------------------------------------------------------------------

def log_event(
    db: Session,
    event_type: str,
    event_status: str,
    *,
    user_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> Optional[AuditLog]:
    """
    Write a single audit event record to the database.

    Args:
        db:            SQLAlchemy session. The caller is responsible for committing
                       the surrounding transaction unless this call is in its own
                       nested/savepoint context.
        event_type:    One of the constants in app.audit.events (e.g. LOGIN_SUCCESS).
        event_status:  One of "success", "failure", "denied", "warning".
        user_id:       Authenticated user ID, or None for unauthenticated events.
        resource_type: Category of resource affected (e.g. "document", "user").
        resource_id:   Integer ID of the specific resource, if applicable.
        ip_address:    Client IP address string, if available. Truncated to 45 chars.
        user_agent:    HTTP User-Agent header value. Truncated to 300 chars.
        details:       Arbitrary metadata dict. Filtered through ALLOWED_METADATA_KEYS
                       allowlist before storage. NEVER pass passwords, tokens, or text.

    Returns:
        The persisted AuditLog ORM object, or None if the write failed safely.

    Security:
        - event_type and event_status are validated before write.
        - metadata is filtered through ALLOWED_METADATA_KEYS before storage.
        - Database errors are caught and logged without re-raising, so audit
          failures do not interfere with the caller's response flow.
          EXCEPTION: callers that need fail-closed behaviour should check the
          return value and handle None themselves.
    """
    # Validate event type
    if event_type not in VALID_EVENT_TYPES:
        logger.error(
            "log_event called with unknown event_type=%r — event not recorded.", event_type
        )
        return None

    # Validate status
    if event_status not in VALID_STATUS_VALUES:
        logger.error(
            "log_event called with unknown event_status=%r — event not recorded.", event_status
        )
        return None

    safe_details = _sanitize_metadata(details)

    # Truncate strings defensively
    safe_ip = (ip_address or "")[:45] or None
    safe_ua = (user_agent or "")[:300] or None

    try:
        record = AuditLog(
            user_id=user_id,
            event_type=event_type,
            event_status=event_status,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=safe_ip,
            user_agent=safe_ua,
            details=safe_details if safe_details else None,
            created_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.flush()   # Assign PK without committing; caller commits surrounding txn.
        return record

    except SQLAlchemyError as exc:
        logger.error(
            "Audit log write failed for event_type=%r user_id=%r: %s",
            event_type,
            user_id,
            type(exc).__name__,
        )
        db.rollback()
        return None


# ---------------------------------------------------------------------------
# Query operations (read-only; no UPDATE/DELETE exposed)
# ---------------------------------------------------------------------------

def get_user_audit_logs(
    db: Session,
    user_id: int,
    *,
    page: int = 1,
    page_size: int = 50,
    event_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> tuple[list[AuditLog], int]:
    """
    Retrieve audit log records belonging to a specific user.

    Security: Strictly scoped to user_id. Employees cannot see other users' logs.

    Returns:
        (items, total_count) tuple for pagination.
    """
    query = db.query(AuditLog).filter(AuditLog.user_id == user_id)

    if event_type:
        if event_type in VALID_EVENT_TYPES:
            query = query.filter(AuditLog.event_type == event_type)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    total = query.count()
    items = (
        query
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_admin_audit_logs(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 50,
    event_type: Optional[str] = None,
    user_id_filter: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> tuple[list[AuditLog], int]:
    """
    Retrieve audit log records for administrator review.

    Security: Caller must have already verified admin role before calling this.

    Returns:
        (items, total_count) tuple for pagination.
    """
    query = db.query(AuditLog)

    if user_id_filter is not None:
        query = query.filter(AuditLog.user_id == user_id_filter)
    if event_type and event_type in VALID_EVENT_TYPES:
        query = query.filter(AuditLog.event_type == event_type)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    total = query.count()
    items = (
        query
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total

