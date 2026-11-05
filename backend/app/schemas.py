from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    model_config = ConfigDict(extra="ignore")

    @field_validator("full_name")
    @classmethod
    def clean_full_name(cls, v: str) -> str:
        trimmed = " ".join(v.split())
        if len(trimmed) < 2:
            raise ValueError("Full name must have at least 2 non-whitespace characters")
        return trimmed

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password cannot be blank or contain only whitespace.")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    model_config = ConfigDict(extra="ignore")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DocumentUploadResponse(BaseModel):
    message: str = "Document uploaded and text extracted successfully."
    document_id: int
    filename: str
    size_bytes: int
    page_count: Optional[int] = None
    status: str = "uploaded"
    extraction_status: str = "completed"
    chunk_count: Optional[int] = None
    embedding_status: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    filename: str
    owner_id: int
    status: str
    created_at: datetime
    is_owner: Optional[bool] = None
    can_read: Optional[bool] = True

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(BaseModel):
    id: int
    title: str
    filename: str
    owner_id: int
    status: str
    created_at: datetime
    is_owner: bool
    can_manage_permissions: bool

    model_config = ConfigDict(from_attributes=True)


class GrantPermissionRequest(BaseModel):
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None
    can_read: bool = True

    model_config = ConfigDict(extra="ignore")


class DocumentPermissionResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    user_email: Optional[str] = None
    can_read: bool
    granted_by: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActionMessageResponse(BaseModel):
    message: str
    document_id: int
    user_id: Optional[int] = None


class DocumentTextPageResponse(BaseModel):
    id: int
    page_number: Optional[int] = None
    text_content: str
    char_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentTextResponse(BaseModel):
    document_id: int
    title: str
    filename: str
    total_pages: int
    total_chars: int
    pages: list[DocumentTextPageResponse]

    model_config = ConfigDict(from_attributes=True)


class DocumentChunkResponse(BaseModel):
    """Safe chunk response schema. Raw embedding arrays are strictly omitted."""
    id: int
    document_id: int
    page_number: Optional[int] = None
    chunk_index: int
    chunk_text: str
    start_char: int
    end_char: int
    embedding_model: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReprocessDocumentResponse(BaseModel):
    message: str = "Document reprocessed and embedded successfully."
    document_id: int
    chunk_count: int
    embedding_model: str
    embedding_status: str = "completed"


# ---------------------------------------------------------------------------
# RAG / Semantic Search schemas
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    """Request body for POST /rag/search."""

    query: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)
    similarity_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    model_config = ConfigDict(extra="ignore")

    @field_validator("query")
    @classmethod
    def strip_query(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Query must not be blank or contain only whitespace.")
        return stripped


class SearchResultItem(BaseModel):
    """A single retrieved chunk result. Raw embedding arrays are strictly omitted."""

    chunk_id: int
    document_id: int
    filename: str
    page_number: Optional[int] = None
    chunk_index: int
    chunk_text: str
    similarity_score: float

    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    """Response body for POST /rag/search."""

    query: str
    results: list[SearchResultItem]
    total_results: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# RAG Answer Generation Schemas (Step 4)
# ---------------------------------------------------------------------------

class SourceCitation(BaseModel):
    """A verified source citation derived directly from retrieved chunks."""

    source_id: Optional[str] = None
    document_id: int
    filename: str
    chunk_id: int
    page_number: Optional[int] = None
    chunk_index: int
    similarity_score: float

    model_config = ConfigDict(from_attributes=True)


class VerifiedClaim(BaseModel):
    """A claim verified against retrieved sanitized document evidence."""

    text: str
    status: str = "supported"  # "supported" | "partially_supported" | "unsupported"
    source_ids: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AnswerRequest(BaseModel):
    """Request payload for POST /rag/answer."""

    question: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)
    similarity_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    model_config = ConfigDict(extra="ignore")

    @field_validator("question")
    @classmethod
    def strip_question(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Question must not be blank or contain only whitespace.")
        return stripped


class AnswerResponse(BaseModel):
    """Response payload for POST /rag/answer."""

    question: str
    answer: str
    evidence_status: str = "supported"  # "supported" | "partially_supported" | "insufficient_evidence"
    claims: list[VerifiedClaim] = Field(default_factory=list)
    sources: list[SourceCitation]
    model: str
    used_context_chunks: int

    model_config = ConfigDict(from_attributes=True)
