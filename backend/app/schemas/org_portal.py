"""Schemas for the Organization Portal API."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────────────────────────

class OrgLoginRequest(BaseModel):
    email: str
    password: str


class OrgUserResponse(BaseModel):
    uuid: str
    email: str
    full_name: str
    user_type: str
    organization_id: int
    organization_name: str
    organization_code: str
    avatar_url: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class OrgDashboardStats(BaseModel):
    total_users: int = 0
    total_candidates: int = 0
    active_assessments: int = 0
    completed_assessments: int = 0
    pass_rate: float = 0.0
    current_plan: Optional[str] = None
    plan_renewal_date: Optional[str] = None
    max_users: int = 0
    max_candidates: int = 0
    users_used: int = 0
    candidates_used: int = 0


# ── Organization Settings ─────────────────────────────────────────────────────

class OrgSettingsUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    timezone: Optional[str] = None
    logo_url: Optional[str] = None


class OrgProfileResponse(BaseModel):
    id: int
    uuid: str
    name: str
    code: str
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    timezone: Optional[str] = None
    runtime_mode: Optional[str] = None
    organization_type: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_status: str
    max_users: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Org Users ─────────────────────────────────────────────────────────────────

class OrgUserInvite(BaseModel):
    email: EmailStr
    full_name: str
    user_type: str = Field(default="INSTRUCTOR", description="INSTRUCTOR or ASSESSOR")
    phone: Optional[str] = None


class OrgUserListItem(BaseModel):
    uuid: str
    email: str
    full_name: str
    user_type: str
    status: str
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Subscription ─────────────────────────────────────────────────────────────

class OrgSubscriptionDetail(BaseModel):
    plan_name: str
    plan_slug: str
    billing_cycle: str
    subscription_status: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    auto_renew: bool
    max_users: int
    max_simulators: int
    max_candidates: Optional[int] = None
    price_monthly: float
    current_users: int
    current_candidates: int
    active_simulators: int
    assessments_this_month: int
