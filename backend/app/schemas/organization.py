"""Organization request/response schemas."""
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import BaseSchema


class OrganizationCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=255)
    code: str = Field(min_length=2, max_length=50, pattern=r"^[A-Z0-9_-]+$")
    email: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None
    website: Optional[str] = Field(default=None, max_length=255)
    plan_id: Optional[int] = None
    max_users: int = Field(default=10, ge=1)
    notes: Optional[str] = None


class OrganizationUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None
    website: Optional[str] = Field(default=None, max_length=255)
    plan_id: Optional[int] = None
    max_users: Optional[int] = Field(default=None, ge=1)
    subscription_status: Optional[str] = None
    notes: Optional[str] = None


class OrganizationResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    code: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    plan_id: Optional[int] = None
    subscription_status: str
    max_users: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user_count: int = 0


class OrganizationListResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    code: str
    email: Optional[str] = None
    subscription_status: str
    max_users: int
    is_active: bool
    created_at: datetime
    user_count: int = 0
