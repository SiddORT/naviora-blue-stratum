"""Organization Assignment schemas."""
from datetime import datetime
from typing import Optional

from app.schemas.common import BaseSchema


class OrgAssignmentCreate(BaseSchema):
    user_id: int
    organization_id: int
    assignment_type: str = "SECONDARY"
    notes: Optional[str] = None


class OrgAssignmentUpdate(BaseSchema):
    assignment_type: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class OrgAssignmentResponse(BaseSchema):
    id: int
    user_id: int
    organization_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    organization_name: Optional[str] = None
    assignment_type: str
    assigned_by: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
