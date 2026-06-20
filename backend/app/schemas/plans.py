"""Pydantic v2 schemas for Plans & Entitlements."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ── Feature ──────────────────────────────────────────────────────────────────

class FeatureBase(BaseModel):
    feature_name: str = Field(..., min_length=1, max_length=150)
    feature_code: str = Field(..., min_length=1, max_length=100, pattern=r"^[A-Z0-9_]+$")
    description: Optional[str] = None
    category: str = "General"
    status: str = "active"


class FeatureCreate(FeatureBase):
    pass


class FeatureUpdate(BaseModel):
    feature_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class FeatureResponse(FeatureBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Plan ─────────────────────────────────────────────────────────────────────

class FeaturePage(BaseModel):
    items: list[FeatureResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PlanBase(BaseModel):
    plan_name: str = Field(..., min_length=1, max_length=150, alias="name")
    plan_code: str = Field(..., min_length=1, max_length=100, alias="slug")
    description: Optional[str] = None
    monthly_price: float = Field(default=0.0, alias="price_monthly")
    yearly_price: float = Field(default=0.0, alias="price_yearly")
    billing_cycle: str = "Monthly"
    max_users: int = 10
    max_candidates: int = 50
    max_assessments_per_month: int = 10
    max_storage_gb: int = 5
    max_simulators: int = 1
    certificate_enabled: bool = False
    ai_enabled: bool = False
    offline_enabled: bool = False
    custom_exercises_enabled: bool = False
    status: str = "Draft"
    is_public: bool = False
    display_order: int = 0

    model_config = {"populate_by_name": True}


class PlanCreate(BaseModel):
    plan_name: str = Field(..., min_length=1, max_length=150)
    plan_code: str = Field(..., min_length=1, max_length=100, pattern=r"^[A-Z0-9_\-]+$")
    description: Optional[str] = None
    monthly_price: float = 0.0
    yearly_price: float = 0.0
    billing_cycle: str = "Monthly"
    max_users: int = 10
    max_candidates: int = 50
    max_assessments_per_month: int = 10
    max_storage_gb: int = 5
    max_simulators: int = 1
    certificate_enabled: bool = False
    ai_enabled: bool = False
    offline_enabled: bool = False
    custom_exercises_enabled: bool = False
    status: str = "Draft"
    is_public: bool = False
    display_order: int = 0


class PlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    description: Optional[str] = None
    monthly_price: Optional[float] = None
    yearly_price: Optional[float] = None
    billing_cycle: Optional[str] = None
    max_users: Optional[int] = None
    max_candidates: Optional[int] = None
    max_assessments_per_month: Optional[int] = None
    max_storage_gb: Optional[int] = None
    max_simulators: Optional[int] = None
    certificate_enabled: Optional[bool] = None
    ai_enabled: Optional[bool] = None
    offline_enabled: Optional[bool] = None
    custom_exercises_enabled: Optional[bool] = None
    status: Optional[str] = None
    is_public: Optional[bool] = None
    display_order: Optional[int] = None


class PlanResponse(BaseModel):
    id: int
    uuid: str
    plan_name: str
    plan_code: str
    description: Optional[str]
    monthly_price: float
    yearly_price: float
    billing_cycle: str
    max_users: int
    max_candidates: int
    max_assessments_per_month: int
    max_storage_gb: int
    max_simulators: int
    certificate_enabled: bool
    ai_enabled: bool
    offline_enabled: bool
    custom_exercises_enabled: bool
    status: str
    is_public: bool
    display_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_plan(cls, p: Any) -> "PlanResponse":
        return cls(
            id=p.id,
            uuid=p.uuid,
            plan_name=p.name,
            plan_code=p.slug,
            description=p.description,
            monthly_price=p.price_monthly,
            yearly_price=p.price_yearly,
            billing_cycle=p.billing_cycle,
            max_users=p.max_users,
            max_candidates=p.max_candidates,
            max_assessments_per_month=p.max_assessments_per_month,
            max_storage_gb=p.max_storage_gb,
            max_simulators=p.max_simulators,
            certificate_enabled=p.certificate_enabled,
            ai_enabled=p.ai_enabled,
            offline_enabled=p.offline_enabled,
            custom_exercises_enabled=p.custom_exercises_enabled,
            status=p.status,
            is_public=p.is_public,
            display_order=p.display_order,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )


class PlanPage(BaseModel):
    items: list[PlanResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── PlanFeature ───────────────────────────────────────────────────────────────

class PlanFeatureResponse(BaseModel):
    feature_id: int
    feature_uuid: str
    feature_name: str
    feature_code: str
    category: str
    is_enabled: bool
    configuration_json: Optional[dict] = None

    model_config = {"from_attributes": True}


class PlanFeatureUpsert(BaseModel):
    feature_id: int
    is_enabled: bool = True
    configuration_json: Optional[dict] = None


# ── PlanExercise ──────────────────────────────────────────────────────────────

class PlanExerciseResponse(BaseModel):
    exercise_id: int
    exercise_uuid: str
    exercise_name: str
    exercise_code: str
    is_enabled: bool

    model_config = {"from_attributes": True}


class PlanExerciseUpsert(BaseModel):
    exercise_id: int
    is_enabled: bool = True


# ── PlanSimulator ─────────────────────────────────────────────────────────────

class PlanSimulatorResponse(BaseModel):
    simulator_vendor_id: int
    vendor_uuid: str
    vendor_name: str
    is_enabled: bool

    model_config = {"from_attributes": True}


class PlanSimulatorUpsert(BaseModel):
    simulator_vendor_id: int
    is_enabled: bool = True


# ── OrganizationSubscription ──────────────────────────────────────────────────

class SubscriptionCreate(BaseModel):
    organization_id: int
    plan_id: int
    billing_cycle: str = "Monthly"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    auto_renew: bool = True
    custom_limits_json: Optional[dict] = None


class SubscriptionUpdate(BaseModel):
    plan_id: Optional[int] = None
    billing_cycle: Optional[str] = None
    end_date: Optional[datetime] = None
    subscription_status: Optional[str] = None
    auto_renew: Optional[bool] = None
    custom_limits_json: Optional[dict] = None


class SubscriptionResponse(BaseModel):
    id: int
    uuid: str
    organization_id: int
    organization_name: Optional[str] = None
    plan_id: int
    plan_name: Optional[str] = None
    plan_code: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime]
    subscription_status: str
    billing_cycle: str
    auto_renew: bool
    custom_limits_json: Optional[dict]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionPage(BaseModel):
    items: list[SubscriptionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── OrganizationUsage ─────────────────────────────────────────────────────────

class UsageResponse(BaseModel):
    organization_id: int
    organization_name: Optional[str] = None
    current_users: int
    current_candidates: int
    assessments_this_month: int
    storage_used_gb: float
    active_simulators: int
    updated_at: datetime
    # Limits from active plan/subscription
    max_users: Optional[int] = None
    max_candidates: Optional[int] = None
    max_assessments_per_month: Optional[int] = None
    max_storage_gb: Optional[int] = None
    max_simulators: Optional[int] = None

    model_config = {"from_attributes": True}


class UsagePage(BaseModel):
    items: list[UsageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── EntitlementLimits ─────────────────────────────────────────────────────────

class EntitlementLimits(BaseModel):
    max_users: int
    max_candidates: int
    max_assessments_per_month: int
    max_storage_gb: int
    max_simulators: int
    certificate_enabled: bool
    ai_enabled: bool
    offline_enabled: bool
    custom_exercises_enabled: bool
    source: str  # "plan" | "subscription_override"


# Aliases used by services and endpoints
PlanFeatureItem = PlanFeatureResponse
PlanExerciseItem = PlanExerciseResponse
PlanSimulatorItem = PlanSimulatorResponse
