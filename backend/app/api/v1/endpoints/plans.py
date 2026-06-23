"""Plans & Entitlements API endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.common import SuccessResponse
from app.schemas.plans import (
    EntitlementLimits,
    FeatureCreate,
    FeaturePage,
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
)
from app.services.plans import (
    EntitlementService,
    FeatureService,
    PlanService,
    SubscriptionService,
    UsageService,
)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Features
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/features/all-active", response_model=SuccessResponse[list[FeatureResponse]])
async def list_all_active_features(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await FeatureService(db).list_all_active())


@router.get("/features", response_model=SuccessResponse[FeaturePage])
async def list_features(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await FeatureService(db).list(page, page_size, search, category, status))


@router.post("/features", response_model=SuccessResponse[FeatureResponse], status_code=201)
async def create_feature(
    body: FeatureCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await FeatureService(db).create(body, by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/features/{uuid}", response_model=SuccessResponse[FeatureResponse])
async def get_feature(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await FeatureService(db).get(uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/features/{uuid}", response_model=SuccessResponse[FeatureResponse])
async def update_feature(
    uuid: str,
    body: FeatureUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await FeatureService(db).update(uuid, body, by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/features/{uuid}", response_model=SuccessResponse[None])
async def delete_feature(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        await FeatureService(db).delete(uuid, by=current_user.uuid)
        return SuccessResponse(data=None)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Plans
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/plans", response_model=SuccessResponse[PlanPage])
async def list_plans(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "display_order",
    sort_order: str = "asc",
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await PlanService(db).list(page, page_size, search, status, sort_by, sort_order))


@router.post("/plans", response_model=SuccessResponse[PlanResponse], status_code=201)
async def create_plan(
    body: PlanCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).create(body, by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/plans/{uuid}", response_model=SuccessResponse[PlanResponse])
async def get_plan(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).get(uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/plans/{uuid}", response_model=SuccessResponse[PlanResponse])
async def update_plan(
    uuid: str,
    body: PlanUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).update(uuid, body, by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/plans/{uuid}", response_model=SuccessResponse[None])
async def delete_plan(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        await PlanService(db).delete(uuid, by=current_user.uuid)
        return SuccessResponse(data=None)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/plans/{uuid}/clone", response_model=SuccessResponse[PlanResponse])
async def clone_plan(
    uuid: str,
    body: dict,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).clone(uuid, body["plan_name"], body["plan_code"], by=current_user.uuid))
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/plans/{uuid}/activate", response_model=SuccessResponse[PlanResponse])
async def activate_plan(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).update(uuid, PlanUpdate(status="Active"), by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/plans/{uuid}/archive", response_model=SuccessResponse[PlanResponse])
async def archive_plan(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).update(uuid, PlanUpdate(status="Archived"), by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Plan Features ──────────────────────────────────────────────────────────────

@router.get("/plans/{uuid}/features", response_model=SuccessResponse[list[PlanFeatureItem]])
async def get_plan_features(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).get_plan_features(uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/plans/{uuid}/features", response_model=SuccessResponse[PlanFeatureItem])
async def upsert_plan_feature(
    uuid: str,
    body: PlanFeatureUpsert,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).upsert_plan_feature(uuid, body))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/plans/{uuid}/features/{feature_id}", response_model=SuccessResponse[None])
async def remove_plan_feature(
    uuid: str,
    feature_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await PlanService(db).remove_plan_feature(uuid, feature_id)
    return SuccessResponse(data=None)


# ── Plan Exercises ─────────────────────────────────────────────────────────────

@router.get("/plans/{uuid}/exercises", response_model=SuccessResponse[list[PlanExerciseItem]])
async def get_plan_exercises(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).get_plan_exercises(uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/plans/{uuid}/exercises", response_model=SuccessResponse[None])
async def upsert_plan_exercise(
    uuid: str,
    body: PlanExerciseUpsert,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        await PlanService(db).upsert_plan_exercise(uuid, body)
        return SuccessResponse(data=None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/plans/{uuid}/exercises/{exercise_id}", response_model=SuccessResponse[None])
async def remove_plan_exercise(
    uuid: str,
    exercise_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await PlanService(db).remove_plan_exercise(uuid, exercise_id)
    return SuccessResponse(data=None)


# ── Plan Simulators ────────────────────────────────────────────────────────────

@router.get("/plans/{uuid}/simulators", response_model=SuccessResponse[list[PlanSimulatorItem]])
async def get_plan_simulators(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await PlanService(db).get_plan_simulators(uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/plans/{uuid}/simulators", response_model=SuccessResponse[None])
async def upsert_plan_simulator(
    uuid: str,
    body: PlanSimulatorUpsert,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        await PlanService(db).upsert_plan_simulator(uuid, body)
        return SuccessResponse(data=None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/plans/{uuid}/simulators/{vendor_id}", response_model=SuccessResponse[None])
async def remove_plan_simulator(
    uuid: str,
    vendor_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await PlanService(db).remove_plan_simulator(uuid, vendor_id)
    return SuccessResponse(data=None)


# ─────────────────────────────────────────────────────────────────────────────
# Subscriptions
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/subscriptions", response_model=SuccessResponse[SubscriptionPage])
async def list_subscriptions(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    organization_id: Optional[int] = None,
    plan_id: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await SubscriptionService(db).list(page, page_size, organization_id, plan_id, status))


@router.post("/subscriptions", response_model=SuccessResponse[SubscriptionResponse], status_code=201)
async def create_subscription(
    body: SubscriptionCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await SubscriptionService(db).create(body, by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscriptions/org/{org_id}/active", response_model=SuccessResponse[Optional[SubscriptionResponse]])
async def get_active_subscription_for_org(
    org_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await SubscriptionService(db).get_active_for_org(org_id))


@router.get("/subscriptions/{uuid}", response_model=SuccessResponse[SubscriptionResponse])
async def get_subscription(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await SubscriptionService(db).get(uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/subscriptions/{uuid}", response_model=SuccessResponse[SubscriptionResponse])
async def update_subscription(
    uuid: str,
    body: SubscriptionUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    try:
        return SuccessResponse(data=await SubscriptionService(db).update(uuid, body, by=current_user.uuid))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Usage
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/usage", response_model=SuccessResponse[UsagePage])
async def list_usage(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await UsageService(db).list(page, page_size))


@router.get("/usage/org/{org_id}", response_model=SuccessResponse[Optional[UsageResponse]])
async def get_usage_for_org(
    org_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await UsageService(db).get_for_org(org_id))


# ─────────────────────────────────────────────────────────────────────────────
# Entitlements
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/entitlements/org/{org_id}/limits", response_model=SuccessResponse[Optional[EntitlementLimits]])
async def get_org_limits(
    org_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await EntitlementService(db).get_organization_limits(org_id))


@router.get("/entitlements/org/{org_id}/feature/{feature_code}", response_model=SuccessResponse[bool])
async def check_feature_access(
    org_id: int,
    feature_code: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    return SuccessResponse(data=await EntitlementService(db).can_access_feature(org_id, feature_code))
