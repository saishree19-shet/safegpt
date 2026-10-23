
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
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

