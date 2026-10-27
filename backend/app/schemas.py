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

