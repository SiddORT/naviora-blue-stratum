"""Authentication request/response schemas."""
from typing import Optional

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import BaseSchema


class LoginRequest(BaseSchema):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseSchema):
    refresh_token: str


class LogoutRequest(BaseSchema):
    refresh_token: str


class PasswordResetRequest(BaseSchema):
    email: EmailStr


class PasswordResetConfirm(BaseSchema):
    token: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class PasswordChangeRequest(BaseSchema):
    current_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserMeResponse(BaseSchema):
    uuid: str
    email: str
    full_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str
    organization_id: Optional[int] = None
    permissions: list[str] = []
    roles: list[str] = []
