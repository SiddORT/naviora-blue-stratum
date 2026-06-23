"""User request/response schemas."""
from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import BaseSchema


class UserCreate(BaseSchema):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8)
    username: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    organization_id: Optional[int] = None
    role_slugs: list[str] = []
    user_type: Optional[str] = "ADMIN"
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


class UserUpdate(BaseSchema):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    username: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=50)
    status: Optional[str] = None
    notes: Optional[str] = None
    user_type: Optional[str] = None
    organization_id: Optional[int] = None


class UserRoleAssign(BaseSchema):
    role_slugs: list[str] = []
    organization_id: Optional[int] = None


class UserStatusUpdate(BaseSchema):
    status: str
    reason: Optional[str] = None


class UserAdminResetPassword(BaseSchema):
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(BaseSchema):
    id: int
    uuid: str
    email: str
    full_name: str
    username: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str
    user_type: str = "ADMIN"
    organization_id: Optional[int] = None
    is_active: bool
    last_login: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    roles: list[str] = []


class UserListResponse(BaseSchema):
    id: int
    uuid: str
    email: str
    full_name: str
    status: str
    user_type: str = "ADMIN"
    organization_id: Optional[int] = None
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    roles: list[str] = []
