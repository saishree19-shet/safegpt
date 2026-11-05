"""
Security Audit Log API routes for CogniSec.

Endpoints:
- GET /audit/me         Employee: view own audit history (paginated, filterable).
- GET /audit            Administrator-only: view all audit records.

Authorization:
- Reuses existing JWT authentication (get_current_user).
- Employees can only access their own records.
- Administrators can access all records.
- Ordinary employees receive 403 Forbidden on /audit.
- No new roles are introduced.
- Audit records are read-only. No create/update/delete endpoints are exposed.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.audit.schemas import AuditLogListResponse, AuditLogResponse
from app.audit.service import get_admin_audit_logs, get_user_audit_logs
from app.database import get_db
from app.models import User
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit", tags=["Audit"])

_MAX_PAGE_SIZE = 100
_DEFAULT_PAGE_SIZE = 50


@router.get(
    "/me",
    response_model=AuditLogListResponse,
    summary="Retrieve own audit history",
    description=(
        "Returns a paginated list of audit events attributed to the authenticated user. "
        "Employees can only view their own records. Filtering by event_type and date range is supported."
    ),
)
def get_my_audit_logs(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE, description="Records per page"),
    event_type: Optional[str] = Query(default=None, description="Filter by event type"),
    start_date: Optional[datetime] = Query(default=None, description="Filter: events at or after this UTC datetime"),
    end_date: Optional[datetime] = Query(default=None, description="Filter: events at or before this UTC datetime"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditLogListResponse:
    """
    GET /audit/me

    Retrieve a paginated, filterable list of audit events for the authenticated user.
    - Only events attributed to the current user are returned.
    - An unknown event_type filter is silently ignored (no events returned for it).
    """
    items, total = get_user_audit_logs(
        db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
    )

    return AuditLogListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[AuditLogResponse.model_validate(item) for item in items],
    )


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="Administrator: view all audit records",
    description=(
        "Administrator-only endpoint. Returns a paginated list of all audit events. "
        "Supports filtering by user_id, event_type, and date range."
    ),
)
@router.get("/", response_model=AuditLogListResponse, include_in_schema=False)
def get_all_audit_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    event_type: Optional[str] = Query(default=None),
    user_id_filter: Optional[int] = Query(default=None, alias="user_id"),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditLogListResponse:
    """
    GET /audit

    Administrator-only. Returns all audit log records with optional filters.
    - Ordinary employees receive 403 Forbidden.
    - No new roles introduced — reuses existing 'admin' role check.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )

    items, total = get_admin_audit_logs(
        db,
        page=page,
        page_size=page_size,
        event_type=event_type,
        user_id_filter=user_id_filter,
        start_date=start_date,
        end_date=end_date,
    )

    return AuditLogListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[AuditLogResponse.model_validate(item) for item in items],
    )

