"""Services for Plans & Entitlements, including EntitlementService."""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature import Feature
from app.models.plan import Plan
from app.models.organization_subscription import OrganizationSubscription
from app.repositories.plans import (
    FeatureRepository,
    PlanRepository,
    SubscriptionRepository,
    UsageRepository,
)
from app.schemas.plans import (
    EntitlementLimits,
    FeatureCreate,
    FeatureResponse,
    FeatureUpdate,
    PlanCreate,
    PlanExerciseItem,
    PlanExerciseUpsert,
    PlanFeatureItem,
    PlanFeatureUpsert,
    PlanPage,
    PlanResponse,
    PlanSimulatorItem,
    PlanSimulatorUpsert,
    PlanUpdate,
    SubscriptionCreate,
    SubscriptionPage,
    SubscriptionResponse,
    SubscriptionUpdate,
    UsagePage,
    UsageResponse,
    FeaturePage,
)


def _page(total: int, page: int, page_size: int) -> dict:
    return {"total": total, "page": page, "page_size": page_size, "total_pages": max(1, math.ceil(total / page_size))}


def _sub_response(s: OrganizationSubscription) -> SubscriptionResponse:
    return SubscriptionResponse(
        id=s.id,
        uuid=s.uuid,
        organization_id=s.organization_id,
        organization_name=s.organization.name if s.organization else None,
        plan_id=s.plan_id,
        plan_name=s.plan.name if s.plan else None,
        plan_code=s.plan.slug if s.plan else None,
        start_date=s.start_date,
        end_date=s.end_date,
        subscription_status=s.subscription_status,
        billing_cycle=s.billing_cycle,
        auto_renew=s.auto_renew,
        custom_limits_json=s.custom_limits_json,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


# ── FeatureService ────────────────────────────────────────────────────────────

class FeatureService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = FeatureRepository(db)

    async def list(self, page: int, page_size: int, search: Optional[str] = None, category: Optional[str] = None, status: Optional[str] = None) -> FeaturePage:
        items, total = await self.repo.list(page, page_size, search, category, status)
        return FeaturePage(items=[FeatureResponse.model_validate(f) for f in items], **_page(total, page, page_size))

    async def get(self, uuid: str) -> FeatureResponse:
        f = await self.repo.get_by_uuid(uuid)
        if not f:
            raise ValueError(f"Feature {uuid!r} not found")
        return FeatureResponse.model_validate(f)

    async def create(self, body: FeatureCreate, by: str) -> FeatureResponse:
        existing = await self.repo.get_by_code(body.feature_code)
        if existing:
            raise ValueError(f"Feature code {body.feature_code!r} already exists")
        f = await self.repo.create(**body.model_dump(), created_by=by, updated_by=by)
        return FeatureResponse.model_validate(f)

    async def update(self, uuid: str, body: FeatureUpdate, by: str) -> FeatureResponse:
        f = await self.repo.get_by_uuid(uuid)
        if not f:
            raise ValueError(f"Feature {uuid!r} not found")
        updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
        updates["updated_by"] = by
        return FeatureResponse.model_validate(await self.repo.update(f, **updates))

    async def delete(self, uuid: str, by: str) -> None:
        f = await self.repo.get_by_uuid(uuid)
        if not f:
            raise ValueError(f"Feature {uuid!r} not found")
        await self.repo.delete(f, by)

    async def list_all_active(self) -> list[FeatureResponse]:
        items = await self.repo.list_all_active()
        return [FeatureResponse.model_validate(f) for f in items]


# ── PlanService ───────────────────────────────────────────────────────────────

class PlanService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = PlanRepository(db)

    async def list(self, page: int, page_size: int, search: Optional[str] = None, status: Optional[str] = None, sort_by: str = "display_order", sort_order: str = "asc") -> PlanPage:
        items, total = await self.repo.list(page, page_size, search, status, sort_by, sort_order)
        return PlanPage(items=[PlanResponse.from_orm_plan(p) for p in items], **_page(total, page, page_size))

    async def get(self, uuid: str) -> PlanResponse:
        p = await self.repo.get_by_uuid(uuid)
        if not p:
            raise ValueError(f"Plan {uuid!r} not found")
        return PlanResponse.from_orm_plan(p)

    async def _get_orm(self, uuid: str) -> Plan:
        p = await self.repo.get_by_uuid(uuid)
        if not p:
            raise ValueError(f"Plan {uuid!r} not found")
        return p

    async def create(self, body: PlanCreate, by: str) -> PlanResponse:
        if await self.repo.get_by_code(body.plan_code):
            raise ValueError(f"Plan code {body.plan_code!r} already exists")
        p = await self.repo.create(
            name=body.plan_name,
            slug=body.plan_code,
            description=body.description,
            price_monthly=body.monthly_price,
            price_yearly=body.yearly_price,
            billing_cycle=body.billing_cycle,
            max_users=body.max_users,
            max_candidates=body.max_candidates,
            max_assessments_per_month=body.max_assessments_per_month,
            max_storage_gb=body.max_storage_gb,
            max_simulators=body.max_simulators,
            certificate_enabled=body.certificate_enabled,
            ai_enabled=body.ai_enabled,
            offline_enabled=body.offline_enabled,
            custom_exercises_enabled=body.custom_exercises_enabled,
            status=body.status,
            is_public=body.is_public,
            display_order=body.display_order,
            created_by=by,
            updated_by=by,
        )
        return PlanResponse.from_orm_plan(p)

    async def update(self, uuid: str, body: PlanUpdate, by: str) -> PlanResponse:
        p = await self._get_orm(uuid)
        field_map = {
            "plan_name": "name",
            "monthly_price": "price_monthly",
            "yearly_price": "price_yearly",
        }
        updates: dict[str, Any] = {"updated_by": by}
        for k, v in body.model_dump(exclude_none=True).items():
            col = field_map.get(k, k)
            updates[col] = v
        return PlanResponse.from_orm_plan(await self.repo.update(p, **updates))

    async def delete(self, uuid: str, by: str) -> None:
        p = await self._get_orm(uuid)
        await self.repo.delete(p, by)

    async def clone(self, uuid: str, new_name: str, new_code: str, by: str) -> PlanResponse:
        src = await self._get_orm(uuid)
        if await self.repo.get_by_code(new_code):
            raise ValueError(f"Plan code {new_code!r} already exists")
        p = await self.repo.create(
            name=new_name, slug=new_code,
            description=src.description, price_monthly=src.price_monthly, price_yearly=src.price_yearly,
            billing_cycle=src.billing_cycle, max_users=src.max_users, max_candidates=src.max_candidates,
            max_assessments_per_month=src.max_assessments_per_month, max_storage_gb=src.max_storage_gb,
            max_simulators=src.max_simulators, certificate_enabled=src.certificate_enabled,
            ai_enabled=src.ai_enabled, offline_enabled=src.offline_enabled,
            custom_exercises_enabled=src.custom_exercises_enabled, status="Draft",
            is_public=False, display_order=src.display_order, created_by=by, updated_by=by,
        )
        return PlanResponse.from_orm_plan(p)

    # ── Plan Features ────────────────────────────────────────────────────────

    async def get_plan_features(self, uuid: str) -> list[PlanFeatureItem]:
        p = await self._get_orm(uuid)
        pfs = await self.repo.get_plan_features(p.id)
        return [
            PlanFeatureItem(
                feature_id=pf.feature_id,
                feature_uuid=pf.feature.uuid,
                feature_name=pf.feature.feature_name,
                feature_code=pf.feature.feature_code,
                category=pf.feature.category,
                is_enabled=pf.is_enabled,
                configuration_json=pf.configuration_json,
            )
            for pf in pfs if pf.feature
        ]

    async def upsert_plan_feature(self, uuid: str, body: PlanFeatureUpsert) -> PlanFeatureItem:
        p = await self._get_orm(uuid)
        pf = await self.repo.upsert_plan_feature(p.id, body.feature_id, body.is_enabled, body.configuration_json)
        # reload with feature
        pfs = await self.repo.get_plan_features(p.id)
        match = next((x for x in pfs if x.feature_id == body.feature_id), None)
        if not match or not match.feature:
            raise ValueError("Feature not found after upsert")
        return PlanFeatureItem(
            feature_id=match.feature_id, feature_uuid=match.feature.uuid,
            feature_name=match.feature.feature_name, feature_code=match.feature.feature_code,
            category=match.feature.category, is_enabled=match.is_enabled, configuration_json=match.configuration_json,
        )

    async def remove_plan_feature(self, uuid: str, feature_id: int) -> None:
        p = await self._get_orm(uuid)
        await self.repo.remove_plan_feature(p.id, feature_id)

    # ── Plan Exercises ───────────────────────────────────────────────────────

    async def get_plan_exercises(self, uuid: str) -> list[PlanExerciseItem]:
        p = await self._get_orm(uuid)
        pes = await self.repo.get_plan_exercises(p.id)
        return [
            PlanExerciseItem(
                exercise_id=pe.exercise_id,
                exercise_uuid=pe.exercise.uuid,
                exercise_name=pe.exercise.exercise_name,
                exercise_code=pe.exercise.exercise_code,
                is_enabled=pe.is_enabled,
            )
            for pe in pes if pe.exercise
        ]

    async def upsert_plan_exercise(self, uuid: str, body: PlanExerciseUpsert) -> None:
        p = await self._get_orm(uuid)
        await self.repo.upsert_plan_exercise(p.id, body.exercise_id, body.is_enabled)

    async def remove_plan_exercise(self, uuid: str, exercise_id: int) -> None:
        p = await self._get_orm(uuid)
        await self.repo.remove_plan_exercise(p.id, exercise_id)

    # ── Plan Simulators ──────────────────────────────────────────────────────

    async def get_plan_simulators(self, uuid: str) -> list[PlanSimulatorItem]:
        p = await self._get_orm(uuid)
        pss = await self.repo.get_plan_simulators(p.id)
        return [
            PlanSimulatorItem(
                simulator_vendor_id=ps.simulator_vendor_id,
                vendor_uuid=ps.vendor.uuid,
                vendor_name=ps.vendor.vendor_name if hasattr(ps.vendor, "vendor_name") else ps.vendor.name if hasattr(ps.vendor, "name") else str(ps.vendor.id),
                is_enabled=ps.is_enabled,
            )
            for ps in pss if ps.vendor
        ]

    async def upsert_plan_simulator(self, uuid: str, body: PlanSimulatorUpsert) -> None:
        p = await self._get_orm(uuid)
        await self.repo.upsert_plan_simulator(p.id, body.simulator_vendor_id, body.is_enabled)

    async def remove_plan_simulator(self, uuid: str, vendor_id: int) -> None:
        p = await self._get_orm(uuid)
        await self.repo.remove_plan_simulator(p.id, vendor_id)


# ── SubscriptionService ───────────────────────────────────────────────────────

class SubscriptionService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = SubscriptionRepository(db)

    async def list(self, page: int, page_size: int, organization_id: Optional[int] = None, plan_id: Optional[int] = None, status: Optional[str] = None) -> SubscriptionPage:
        items, total = await self.repo.list(page, page_size, organization_id, plan_id, status)
        return SubscriptionPage(items=[_sub_response(s) for s in items], **_page(total, page, page_size))

    async def get(self, uuid: str) -> SubscriptionResponse:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            raise ValueError(f"Subscription {uuid!r} not found")
        return _sub_response(s)

    async def get_active_for_org(self, org_id: int) -> Optional[SubscriptionResponse]:
        s = await self.repo.get_active_for_org(org_id)
        return _sub_response(s) if s else None

    async def create(self, body: SubscriptionCreate, by: str) -> SubscriptionResponse:
        from datetime import datetime, timezone
        s = await self.repo.create(
            organization_id=body.organization_id,
            plan_id=body.plan_id,
            billing_cycle=body.billing_cycle,
            start_date=body.start_date or datetime.now(timezone.utc),
            end_date=body.end_date,
            auto_renew=body.auto_renew,
            custom_limits_json=body.custom_limits_json,
            subscription_status="Active",
            created_by=by,
            updated_by=by,
        )
        full = await self.repo.get_by_uuid(s.uuid)
        return _sub_response(full)  # type: ignore[arg-type]

    async def update(self, uuid: str, body: SubscriptionUpdate, by: str) -> SubscriptionResponse:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            raise ValueError(f"Subscription {uuid!r} not found")
        updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
        updates["updated_by"] = by
        await self.repo.update(s, **updates)
        full = await self.repo.get_by_uuid(uuid)
        return _sub_response(full)  # type: ignore[arg-type]


# ── UsageService ──────────────────────────────────────────────────────────────

class UsageService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UsageRepository(db)
        self.sub_repo = SubscriptionRepository(db)

    async def list(self, page: int, page_size: int) -> UsagePage:
        items, total = await self.repo.list(page, page_size)
        result = []
        for u in items:
            sub = await self.sub_repo.get_active_for_org(u.organization_id)
            plan = sub.plan if sub else None
            # custom_limits override
            custom = sub.custom_limits_json or {} if sub else {}
            result.append(UsageResponse(
                organization_id=u.organization_id,
                organization_name=u.organization.name if u.organization else None,
                current_users=u.current_users,
                current_candidates=u.current_candidates,
                assessments_this_month=u.assessments_this_month,
                storage_used_gb=u.storage_used_gb,
                active_simulators=u.active_simulators,
                updated_at=u.updated_at,
                max_users=custom.get("max_users", plan.max_users if plan else None),
                max_candidates=custom.get("max_candidates", plan.max_candidates if plan else None),
                max_assessments_per_month=custom.get("max_assessments_per_month", plan.max_assessments_per_month if plan else None),
                max_storage_gb=custom.get("max_storage_gb", plan.max_storage_gb if plan else None),
                max_simulators=custom.get("max_simulators", plan.max_simulators if plan else None),
            ))
        return UsagePage(items=result, **_page(total, page, page_size))

    async def get_for_org(self, org_id: int) -> Optional[UsageResponse]:
        u = await self.repo.get_by_org(org_id)
        if not u:
            return None
        sub = await self.sub_repo.get_active_for_org(org_id)
        plan = sub.plan if sub else None
        custom = sub.custom_limits_json or {} if sub else {}
        return UsageResponse(
            organization_id=u.organization_id,
            organization_name=u.organization.name if u.organization else None,
            current_users=u.current_users, current_candidates=u.current_candidates,
            assessments_this_month=u.assessments_this_month, storage_used_gb=u.storage_used_gb,
            active_simulators=u.active_simulators, updated_at=u.updated_at,
            max_users=custom.get("max_users", plan.max_users if plan else None),
            max_candidates=custom.get("max_candidates", plan.max_candidates if plan else None),
            max_assessments_per_month=custom.get("max_assessments_per_month", plan.max_assessments_per_month if plan else None),
            max_storage_gb=custom.get("max_storage_gb", plan.max_storage_gb if plan else None),
            max_simulators=custom.get("max_simulators", plan.max_simulators if plan else None),
        )


# ── EntitlementService ────────────────────────────────────────────────────────

class EntitlementService:
    """Dynamic entitlement checks. Never hardcode plan names — all logic is DB-driven."""

    def __init__(self, db: AsyncSession) -> None:
        self.sub_repo = SubscriptionRepository(db)
        self.usage_repo = UsageRepository(db)

    async def _get_limits(self, org_id: int) -> Optional[EntitlementLimits]:
        sub = await self.sub_repo.get_active_for_org(org_id)
        if not sub or not sub.plan:
            return None
        plan = sub.plan
        custom = sub.custom_limits_json or {}
        return EntitlementLimits(
            max_users=custom.get("max_users", plan.max_users),
            max_candidates=custom.get("max_candidates", plan.max_candidates),
            max_assessments_per_month=custom.get("max_assessments_per_month", plan.max_assessments_per_month),
            max_storage_gb=custom.get("max_storage_gb", plan.max_storage_gb),
            max_simulators=custom.get("max_simulators", plan.max_simulators),
            certificate_enabled=plan.certificate_enabled,
            ai_enabled=plan.ai_enabled,
            offline_enabled=plan.offline_enabled,
            custom_exercises_enabled=plan.custom_exercises_enabled,
            source="subscription_override" if custom else "plan",
        )

    async def get_organization_limits(self, org_id: int) -> Optional[EntitlementLimits]:
        return await self._get_limits(org_id)

    async def can_access_feature(self, org_id: int, feature_code: str) -> bool:
        from sqlalchemy import select as sa_select
        from app.models.plan_feature import PlanFeature
        from app.models.feature import Feature
        sub = await self.sub_repo.get_active_for_org(org_id)
        if not sub:
            return False
        db = self.sub_repo.db
        r = await db.execute(
            sa_select(PlanFeature).join(Feature, Feature.id == PlanFeature.feature_id).where(
                PlanFeature.plan_id == sub.plan_id,
                Feature.feature_code == feature_code,
                PlanFeature.is_enabled.is_(True),
            )
        )
        return r.scalar_one_or_none() is not None

    async def can_access_exercise(self, org_id: int, exercise_id: int) -> bool:
        from sqlalchemy import select as sa_select
        from app.models.plan_exercise import PlanExercise
        sub = await self.sub_repo.get_active_for_org(org_id)
        if not sub:
            return False
        db = self.sub_repo.db
        r = await db.execute(
            sa_select(PlanExercise).where(
                PlanExercise.plan_id == sub.plan_id,
                PlanExercise.exercise_id == exercise_id,
                PlanExercise.is_enabled.is_(True),
            )
        )
        return r.scalar_one_or_none() is not None

    async def can_access_simulator(self, org_id: int, vendor_id: int) -> bool:
        from sqlalchemy import select as sa_select
        from app.models.plan_simulator import PlanSimulator
        sub = await self.sub_repo.get_active_for_org(org_id)
        if not sub:
            return False
        db = self.sub_repo.db
        r = await db.execute(
            sa_select(PlanSimulator).where(
                PlanSimulator.plan_id == sub.plan_id,
                PlanSimulator.simulator_vendor_id == vendor_id,
                PlanSimulator.is_enabled.is_(True),
            )
        )
        return r.scalar_one_or_none() is not None

    async def has_available_candidate_slots(self, org_id: int) -> bool:
        limits = await self._get_limits(org_id)
        if not limits:
            return False
        usage = await self.usage_repo.get_by_org(org_id)
        current = usage.current_candidates if usage else 0
        return limits.max_candidates < 0 or current < limits.max_candidates

    async def has_available_assessment_quota(self, org_id: int) -> bool:
        limits = await self._get_limits(org_id)
        if not limits:
            return False
        usage = await self.usage_repo.get_by_org(org_id)
        current = usage.assessments_this_month if usage else 0
        return limits.max_assessments_per_month < 0 or current < limits.max_assessments_per_month
