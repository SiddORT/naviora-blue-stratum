"""Organization Portal — Profile view."""
from fastapi import APIRouter, Depends
from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser
from app.models.audit_log import AuditLog
from app.models.organization import Organization
from app.models.organization_subscription import OrganizationSubscription
from app.models.plan import Plan
from app.schemas.org_portal import OrgProfileResponse
from app.utils.responses import not_found_response, success_response

router = APIRouter()


@router.get("", summary="Get organization profile")
async def get_org_profile(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    org = await db.get(Organization, ctx.organization_id)
    if not org:
        return not_found_response("Organization not found")

    sub_result = await db.execute(
        select(OrganizationSubscription, Plan)
        .join(Plan, OrganizationSubscription.plan_id == Plan.id)
        .where(
            and_(
                OrganizationSubscription.organization_id == ctx.organization_id,
                OrganizationSubscription.subscription_status == "Active",
            )
        )
        .order_by(OrganizationSubscription.created_at.desc())
        .limit(1)
    )
    sub_row = sub_result.first()
    plan_info = None
    if sub_row:
        sub, plan = sub_row
        plan_info = {
            "plan_name": plan.name,
            "plan_slug": plan.slug,
            "subscription_status": sub.subscription_status,
            "billing_cycle": sub.billing_cycle,
            "start_date": sub.start_date.strftime("%Y-%m-%d") if sub.start_date else None,
            "end_date": sub.end_date.strftime("%Y-%m-%d") if sub.end_date else None,
        }

    activity_result = await db.execute(
        select(AuditLog)
        .where(
            AuditLog.resource_type.in_(["organization", "user", "candidate"])
        )
        .order_by(desc(AuditLog.created_at))
        .limit(10)
    )
    activity = activity_result.scalars().all()
    activity_items = [
        {
            "action": a.action,
            "resource_type": a.resource_type,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activity
    ]

    return success_response(data={
        "organization": OrgProfileResponse.model_validate(org).model_dump(),
        "subscription": plan_info,
        "activity": activity_items,
    })
