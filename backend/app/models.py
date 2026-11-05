from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="employee")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    documents = relationship("Document", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    owner_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    status = Column(String(30), nullable=False, default="uploaded")
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    owner = relationship("User", back_populates="documents")
    permissions = relationship(
        "DocumentPermission",
        back_populates="document",
        cascade="all, delete-orphan",
    )
    text_pages = relationship(
        "DocumentTextPage",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentTextPage.page_number.asc().nullsfirst()",
    )
    chunks = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentChunk.chunk_index.asc()",
    )
    sanitized_chunks = relationship(
        "SanitizedChunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )


class DocumentPermission(Base):
    __tablename__ = "document_permissions"
    __table_args__ = (
        UniqueConstraint(
            "document_id", "user_id", name="uq_document_user_permission"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    can_read = Column(Boolean, nullable=False, default=True)
    granted_by = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    document = relationship("Document", back_populates="permissions")
    user = relationship("User", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])


class DocumentTextPage(Base):
    __tablename__ = "document_text_pages"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Page number: 1-indexed for PDF; preserved if parser supports;
    # NULL for DOCX when physical page boundaries cannot be reliably determined.
    page_number = Column(Integer, nullable=True)
    text_content = Column(Text, nullable=False)
    char_count = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    document = relationship("Document", back_populates="text_pages")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = (
        UniqueConstraint(
            "document_id", "chunk_index", name="uq_document_chunk_index"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Page reference: 1-indexed for PDF; preserved from source when available;
    # NULL for DOCX when physical page boundaries cannot be reliably determined.
    page_number = Column(Integer, nullable=True)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    start_char = Column(Integer, nullable=False)
    end_char = Column(Integer, nullable=False)
    embedding = Column(Vector(768), nullable=False)
    embedding_model = Column(String(100), nullable=False, default="nomic-embed-text")
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    document = relationship("Document", back_populates="chunks")
    sanitized_chunk = relationship(
        "SanitizedChunk",
        back_populates="chunk",
        uselist=False,
        cascade="all, delete-orphan",
    )


class SanitizedChunk(Base):
    __tablename__ = "sanitized_chunks"
    __table_args__ = (
        UniqueConstraint("chunk_id", name="uq_sanitized_chunk_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(
        Integer, ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sanitized_text = Column(Text, nullable=False)
    # Stored as JSON/JSONB: e.g. {"EMAIL": 2, "PHONE": 1}
    entity_counts = Column(JSON, nullable=False, default=dict)
    detector_version = Column(String(50), nullable=False, default="v1.0.0")
    sanitizer_version = Column(String(50), nullable=False, default="v1.0.0")
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    document = relationship("Document", back_populates="sanitized_chunks")
    chunk = relationship("DocumentChunk", back_populates="sanitized_chunk")


class AuditLog(Base):
    """
    Immutable-by-convention security audit log.

    Design decisions:
    - user_id uses SET NULL (not CASCADE) so audit records survive user deletion.
    - details stores only pre-allowlisted metadata via app.audit.service._sanitize_metadata().
    - Application code never exposes UPDATE or DELETE operations on this table.
    - created_at is always UTC, set at write time.

    Limitations (documented):
    - Database-level immutability is NOT enforced. A privileged DB administrator
      can still modify records directly. For stronger guarantees, consider a
      dedicated append-only audit store (future enhancement).
    """
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_event_type", "event_type"),
        Index("ix_audit_logs_created_at", "created_at"),
        Index("ix_audit_logs_event_status", "event_status"),
    )

    id = Column(Integer, primary_key=True)
    # SET NULL preserves audit history when a user account is deleted
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_type = Column(String(80), nullable=False)
    event_status = Column(String(20), nullable=False)
    resource_type = Column(String(30), nullable=True)
    resource_id = Column(Integer, nullable=True)
    # Truncated to 45 chars (max IPv6 length) in service layer
    ip_address = Column(String(45), nullable=True)
    # Truncated to 300 chars in service layer
    user_agent = Column(String(300), nullable=True)
    # Filtered through ALLOWED_METADATA_KEYS allowlist before storage
    details = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
