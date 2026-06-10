"""Role and Permission schemas."""
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import BaseSchema


class PermissionResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    slug: str
    module: str
    action: str
    description: Optional[str] = None
    is_active: bool


class RoleCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9_]+$")
    description: Optional[str] = None
    permission_ids: list[int] = []


class RoleUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = None
    permission_ids: Optional[list[int]] = None


class RoleResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    slug: str
    description: Optional[str] = None
    is_system: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    permissions: list[PermissionResponse] = []


class RoleListResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    slug: str
    description: Optional[str] = None
    is_system: bool
    is_active: bool
    permission_count: int = 0
    user_count: int = 0
