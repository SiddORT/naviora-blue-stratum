"""User Invitation schemas."""
from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field

from app.schemas.common import BaseSchema


class InvitationCreate(BaseSchema):
    email: EmailStr
    full_name: Optional[str] = Field(default=None, max_length=255)
    organization_id: Optional[int] = None
    role_id: Optional[int] = None
    message: Optional[str] = None


class InvitationUpdate(BaseSchema):
    status: Optional[str] = None


class InvitationResponse(BaseSchema):
    id: int
    uuid: str
    email: str
    full_name: Optional[str] = None
    organization_id: Optional[int] = None
    role_id: Optional[int] = None
    organization_name: Optional[str] = None
    role_name: Optional[str] = None
    status: str
    message: Optional[str] = None
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    invited_by_name: Optional[str] = None
    is_active: bool
    created_at: datetime


class InvitationListResponse(BaseSchema):
    id: int
    uuid: str
    email: str
    full_name: Optional[str] = None
    organization_name: Optional[str] = None
    role_name: Optional[str] = None
    status: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    invited_by_name: Optional[str] = None
    created_at: datetime
