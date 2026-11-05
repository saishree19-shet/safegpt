"""
Pydantic schemas for the Security Audit Log API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    """Public representation of a single audit log record."""

    id: int
    user_id: Optional[int] = None
    event_type: str
    event_status: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Paginated list of audit log records."""

    total: int
    page: int
    page_size: int
    items: list[AuditLogResponse]

