"""Repositories for Plans & Entitlements."""
from __future__ import annotations

import math
from typing import Optional

from sqlalchemy import func, select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.feature import Feature
from app.models.plan import Plan
from app.models.plan_feature import PlanFeature
from app.models.plan_exercise import PlanExercise
from app.models.plan_simulator import PlanSimulator
from app.models.organization_subscription import OrganizationSubscription
from app.models.organization_usage import OrganizationUsage
from app.models.organization import Organization


# ── FeatureRepository ─────────────────────────────────────────────────────────

class FeatureRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[list[Feature], int]:
        q = select(Feature).where(Feature.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(Feature.feature_name.ilike(term), Feature.feature_code.ilike(term)))
        if category:
            q = q.where(Feature.category == category)
        if status:
            q = q.where(Feature.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        rows = (await self.db.execute(q.order_by(Feature.category, Feature.feature_name).offset((page - 1) * page_size).limit(page_size))).scalars().all()
        return list(rows), total

    async def get_by_uuid(self, uuid: str) -> Optional[Feature]:
        r = await self.db.execute(select(Feature).where(Feature.uuid == uuid, Feature.deleted_at.is_(None)))
        return r.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Feature]:
        r = await self.db.execute(select(Feature).where(Feature.feature_code == code))
        return r.scalar_one_or_none()

    async def create(self, **kwargs) -> Feature:
        f = Feature(**kwargs)
        self.db.add(f)
        await self.db.flush()
        await self.db.refresh(f)
        return f

    async def update(self, feature: Feature, **kwargs) -> Feature:
        for k, v in kwargs.items():
            setattr(feature, k, v)
        await self.db.flush()
        await self.db.refresh(feature)
        return feature

    async def delete(self, feature: Feature, deleted_by: str) -> None:
        feature.soft_delete(deleted_by)
        await self.db.flush()

    async def list_all_active(self) -> list[Feature]:
        r = await self.db.execute(select(Feature).where(Feature.status == "active", Feature.deleted_at.is_(None)).order_by(Feature.category, Feature.feature_name))
        return list(r.scalars().all())


# ── PlanRepository ────────────────────────────────────────────────────────────

class PlanRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "display_order",
        sort_order: str = "asc",
    ) -> tuple[list[Plan], int]:
        q = select(Plan).where(Plan.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(Plan.name.ilike(term), Plan.slug.ilike(term), Plan.description.ilike(term)))
        if status:
            q = q.where(Plan.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(Plan, {"plan_name": "name", "plan_code": "slug", "monthly_price": "price_monthly"}.get(sort_by, sort_by), Plan.display_order)
        rows = (await self.db.execute(q.order_by(col.asc() if sort_order == "asc" else col.desc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()
        return list(rows), total

    async def get_by_uuid(self, uuid: str) -> Optional[Plan]:
        r = await self.db.execute(select(Plan).where(Plan.uuid == uuid, Plan.deleted_at.is_(None)))
        return r.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Plan]:
        r = await self.db.execute(select(Plan).where(Plan.slug == code))
        return r.scalar_one_or_none()

    async def create(self, **kwargs) -> Plan:
        p = Plan(**kwargs)
        self.db.add(p)
        await self.db.flush()
        await self.db.refresh(p)
        return p

    async def update(self, plan: Plan, **kwargs) -> Plan:
        for k, v in kwargs.items():
            setattr(plan, k, v)
        await self.db.flush()
        await self.db.refresh(plan)
        return plan

    async def delete(self, plan: Plan, deleted_by: str) -> None:
        plan.soft_delete(deleted_by)
        await self.db.flush()

    # Plan Features
    async def get_plan_features(self, plan_id: int) -> list[PlanFeature]:
        r = await self.db.execute(
            select(PlanFeature).where(PlanFeature.plan_id == plan_id)
            .options(selectinload(PlanFeature.feature))
        )
        return list(r.scalars().all())

    async def upsert_plan_feature(self, plan_id: int, feature_id: int, is_enabled: bool, config: Optional[dict]) -> PlanFeature:
        r = await self.db.execute(select(PlanFeature).where(PlanFeature.plan_id == plan_id, PlanFeature.feature_id == feature_id))
        pf = r.scalar_one_or_none()
        if pf:
            pf.is_enabled = is_enabled
            pf.configuration_json = config
        else:
            pf = PlanFeature(plan_id=plan_id, feature_id=feature_id, is_enabled=is_enabled, configuration_json=config)
            self.db.add(pf)
        await self.db.flush()
        return pf

    async def remove_plan_feature(self, plan_id: int, feature_id: int) -> None:
        r = await self.db.execute(select(PlanFeature).where(PlanFeature.plan_id == plan_id, PlanFeature.feature_id == feature_id))
        pf = r.scalar_one_or_none()
        if pf:
            await self.db.delete(pf)
            await self.db.flush()

    # Plan Exercises
    async def get_plan_exercises(self, plan_id: int) -> list[PlanExercise]:
        from app.models.exercise import Exercise
        r = await self.db.execute(
            select(PlanExercise).where(PlanExercise.plan_id == plan_id)
            .options(selectinload(PlanExercise.exercise))
        )
        return list(r.scalars().all())

    async def upsert_plan_exercise(self, plan_id: int, exercise_id: int, is_enabled: bool) -> PlanExercise:
        r = await self.db.execute(select(PlanExercise).where(PlanExercise.plan_id == plan_id, PlanExercise.exercise_id == exercise_id))
        pe = r.scalar_one_or_none()
        if pe:
            pe.is_enabled = is_enabled
        else:
            pe = PlanExercise(plan_id=plan_id, exercise_id=exercise_id, is_enabled=is_enabled)
            self.db.add(pe)
        await self.db.flush()
        return pe

    async def remove_plan_exercise(self, plan_id: int, exercise_id: int) -> None:
        r = await self.db.execute(select(PlanExercise).where(PlanExercise.plan_id == plan_id, PlanExercise.exercise_id == exercise_id))
        pe = r.scalar_one_or_none()
        if pe:
            await self.db.delete(pe)
            await self.db.flush()

    # Plan Simulators
    async def get_plan_simulators(self, plan_id: int) -> list[PlanSimulator]:
        from app.models.simulator_vendor import SimulatorVendor
        r = await self.db.execute(
            select(PlanSimulator).where(PlanSimulator.plan_id == plan_id)
            .options(selectinload(PlanSimulator.vendor))
        )
        return list(r.scalars().all())

    async def upsert_plan_simulator(self, plan_id: int, vendor_id: int, is_enabled: bool) -> PlanSimulator:
        r = await self.db.execute(select(PlanSimulator).where(PlanSimulator.plan_id == plan_id, PlanSimulator.simulator_vendor_id == vendor_id))
        ps = r.scalar_one_or_none()
        if ps:
            ps.is_enabled = is_enabled
        else:
            ps = PlanSimulator(plan_id=plan_id, simulator_vendor_id=vendor_id, is_enabled=is_enabled)
            self.db.add(ps)
        await self.db.flush()
        return ps

    async def remove_plan_simulator(self, plan_id: int, vendor_id: int) -> None:
        r = await self.db.execute(select(PlanSimulator).where(PlanSimulator.plan_id == plan_id, PlanSimulator.simulator_vendor_id == vendor_id))
        ps = r.scalar_one_or_none()
        if ps:
            await self.db.delete(ps)
            await self.db.flush()


# ── SubscriptionRepository ────────────────────────────────────────────────────

class SubscriptionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        organization_id: Optional[int] = None,
        plan_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> tuple[list[OrganizationSubscription], int]:
        q = select(OrganizationSubscription).options(
            selectinload(OrganizationSubscription.organization),
            selectinload(OrganizationSubscription.plan),
        )
        if organization_id:
            q = q.where(OrganizationSubscription.organization_id == organization_id)
        if plan_id:
            q = q.where(OrganizationSubscription.plan_id == plan_id)
        if status:
            q = q.where(OrganizationSubscription.subscription_status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        rows = (await self.db.execute(q.order_by(OrganizationSubscription.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()
        return list(rows), total

    async def get_by_uuid(self, uuid: str) -> Optional[OrganizationSubscription]:
        r = await self.db.execute(
            select(OrganizationSubscription).where(OrganizationSubscription.uuid == uuid)
            .options(selectinload(OrganizationSubscription.organization), selectinload(OrganizationSubscription.plan))
        )
        return r.scalar_one_or_none()

    async def get_active_for_org(self, org_id: int) -> Optional[OrganizationSubscription]:
        r = await self.db.execute(
            select(OrganizationSubscription).where(
                OrganizationSubscription.organization_id == org_id,
                OrganizationSubscription.subscription_status.in_(["Active", "Trial"]),
            ).options(selectinload(OrganizationSubscription.plan))
        )
        return r.scalar_one_or_none()

    async def create(self, **kwargs) -> OrganizationSubscription:
        s = OrganizationSubscription(**kwargs)
        self.db.add(s)
        await self.db.flush()
        await self.db.refresh(s)
        return s

    async def update(self, sub: OrganizationSubscription, **kwargs) -> OrganizationSubscription:
        for k, v in kwargs.items():
            setattr(sub, k, v)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub


# ── UsageRepository ───────────────────────────────────────────────────────────

class UsageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list(self, page: int = 1, page_size: int = 20) -> tuple[list[OrganizationUsage], int]:
        q = select(OrganizationUsage).options(selectinload(OrganizationUsage.organization))
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        rows = (await self.db.execute(q.order_by(OrganizationUsage.updated_at.desc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()
        return list(rows), total

    async def get_by_org(self, org_id: int) -> Optional[OrganizationUsage]:
        r = await self.db.execute(select(OrganizationUsage).where(OrganizationUsage.organization_id == org_id).options(selectinload(OrganizationUsage.organization)))
        return r.scalar_one_or_none()

    async def upsert(self, org_id: int, **kwargs) -> OrganizationUsage:
        existing = await self.get_by_org(org_id)
        if existing:
            for k, v in kwargs.items():
                setattr(existing, k, v)
            await self.db.flush()
            return existing
        u = OrganizationUsage(organization_id=org_id, **kwargs)
        self.db.add(u)
        await self.db.flush()
        await self.db.refresh(u)
        return u
