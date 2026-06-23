"""Organization Portal — Dashboard stats endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser
from app.models.assessment import Assessment
from app.models.candidate import Candidate
from app.models.organization import Organization
from app.models.organization_subscription import OrganizationSubscription
from app.models.organization_usage import OrganizationUsage
from app.models.plan import Plan
from app.models.user import User
from app.schemas.org_portal import OrgDashboardStats
from app.utils.responses import success_response

router = APIRouter()


@router.get("", summary="Organization dashboard statistics")
async def org_dashboard(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    org_id = ctx.organization_id

    total_users = (await db.execute(
        select(func.count()).where(
            and_(User.organization_id == org_id, User.deleted_at.is_(None), User.user_type != "ADMIN")
        )
    )).scalar_one()

    total_candidates = (await db.execute(
        select(func.count()).where(
            and_(Candidate.organization_id == org_id, Candidate.deleted_at.is_(None))
        )
    )).scalar_one()

    active_assessments = 0
    completed_assessments = 0
    pass_rate = 0.0
    try:
        active_assessments = (await db.execute(
            select(func.count()).where(
                and_(Assessment.organization_id == org_id, Assessment.status == "active", Assessment.deleted_at.is_(None))
            )
        )).scalar_one()
        completed_assessments = (await db.execute(
            select(func.count()).where(
                and_(Assessment.organization_id == org_id, Assessment.status == "completed", Assessment.deleted_at.is_(None))
            )
        )).scalar_one()
    except Exception:
        pass

    org = await db.get(Organization, org_id)
    plan_name = None
    plan_renewal = None
    max_users = org.max_users if org else 10
    max_candidates = 50

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
    if sub_row:
        sub, plan = sub_row
        plan_name = plan.name
        max_candidates = plan.max_candidates
        if sub.end_date:
            plan_renewal = sub.end_date.strftime("%Y-%m-%d")

    usage_result = await db.execute(
        select(OrganizationUsage).where(OrganizationUsage.organization_id == org_id)
    )
    usage = usage_result.scalar_one_or_none()
    users_used = usage.current_users if usage else total_users
    candidates_used = usage.current_candidates if usage else total_candidates

    stats = OrgDashboardStats(
        total_users=total_users,
        total_candidates=total_candidates,
        active_assessments=active_assessments,
        completed_assessments=completed_assessments,
        pass_rate=pass_rate,
        current_plan=plan_name,
        plan_renewal_date=plan_renewal,
        max_users=max_users,
        max_candidates=max_candidates,
        users_used=users_used,
        candidates_used=candidates_used,
    )
    return success_response(data=stats.model_dump())
