"""Candidate request/response schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import BaseSchema


class CandidateCreate(BaseSchema):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8)
    username: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    organization_id: Optional[int] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = Field(default=None, max_length=100)
    rank_or_designation: Optional[str] = Field(default=None, max_length=150)
    seafarer_id: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class CandidateUpdate(BaseSchema):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    username: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    organization_id: Optional[int] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = Field(default=None, max_length=100)
    rank_or_designation: Optional[str] = Field(default=None, max_length=150)
    seafarer_id: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = None
    notes: Optional[str] = None


class CandidateResponse(BaseSchema):
    id: int
    uuid: str
    email: str
    full_name: str
    username: Optional[str] = None
    phone: Optional[str] = None
    organization_id: Optional[int] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    rank_or_designation: Optional[str] = None
    seafarer_id: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str
    is_active: bool
    last_login: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CandidateListResponse(BaseSchema):
    id: int
    uuid: str
    email: str
    full_name: str
    phone: Optional[str] = None
    organization_id: Optional[int] = None
    rank_or_designation: Optional[str] = None
    seafarer_id: Optional[str] = None
    status: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
