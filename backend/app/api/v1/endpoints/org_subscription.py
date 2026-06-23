"""Organization Portal — Subscription view (read-only)."""
from fastapi import APIRouter, Depends
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser
from app.models.organization import Organization
from app.models.organization_subscription import OrganizationSubscription
from app.models.organization_usage import OrganizationUsage
from app.models.plan import Plan
from app.schemas.org_portal import OrgSubscriptionDetail
from app.utils.responses import not_found_response, success_response

router = APIRouter()


@router.get("", summary="View organization subscription details")
async def org_subscription(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    org_id = ctx.organization_id
    org = await db.get(Organization, org_id)
    if not org:
        return not_found_response("Organization not found")

    sub_result = await db.execute(
        select(OrganizationSubscription, Plan)
        .join(Plan, OrganizationSubscription.plan_id == Plan.id)
        .where(
            and_(
                OrganizationSubscription.organization_id == org_id,
                OrganizationSubscription.subscription_status == "Active",
            )
        )
        .order_by(OrganizationSubscription.created_at.desc())
        .limit(1)
    )
    sub_row = sub_result.first()

    if not sub_row:
        return success_response(data={
            "plan_name": "No active subscription",
            "plan_slug": "",
            "billing_cycle": "N/A",
            "subscription_status": org.subscription_status,
            "start_date": None,
            "end_date": None,
            "auto_renew": False,
            "max_users": org.max_users,
            "max_simulators": 0,
            "max_candidates": 0,
            "price_monthly": 0.0,
            "current_users": 0,
            "current_candidates": 0,
            "active_simulators": 0,
            "assessments_this_month": 0,
        })

    sub, plan = sub_row

    usage_result = await db.execute(
        select(OrganizationUsage).where(OrganizationUsage.organization_id == org_id)
    )
    usage = usage_result.scalar_one_or_none()

    detail = OrgSubscriptionDetail(
        plan_name=plan.name,
        plan_slug=plan.slug,
        billing_cycle=sub.billing_cycle,
        subscription_status=sub.subscription_status,
        start_date=sub.start_date.strftime("%Y-%m-%d") if sub.start_date else None,
        end_date=sub.end_date.strftime("%Y-%m-%d") if sub.end_date else None,
        auto_renew=sub.auto_renew,
        max_users=plan.max_users,
        max_simulators=plan.max_simulators,
        max_candidates=plan.max_candidates,
        price_monthly=plan.price_monthly,
        current_users=usage.current_users if usage else 0,
        current_candidates=usage.current_candidates if usage else 0,
        active_simulators=usage.active_simulators if usage else 0,
        assessments_this_month=usage.assessments_this_month if usage else 0,
    )
    return success_response(data=detail.model_dump())
