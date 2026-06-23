"""Organization Portal — Candidate Progress dashboard endpoint."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser
from app.helpers.pagination import PaginatedResponse
from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.candidate import Candidate
from app.schemas.org_campaigns import ProgressRow
from app.utils.responses import success_response

router = APIRouter()


@router.get("", summary="Candidate progress across all campaigns")
async def get_progress(
    ctx: CurrentOrgUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    result_status: Optional[str] = Query(default=None),
    campaign_uuid: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    # Get org campaign IDs
    org_campaign_ids = (await db.execute(
        select(AssessmentCampaign.id).where(
            and_(AssessmentCampaign.organization_id == ctx.organization_id, AssessmentCampaign.deleted_at.is_(None))
        )
    )).scalars().all()

    if not org_campaign_ids:
        resp = PaginatedResponse[ProgressRow](items=[], page=page, page_size=page_size, total=0, total_pages=1)
        return success_response(data=resp.model_dump())

    base = select(AssessmentAssignment).where(
        and_(AssessmentAssignment.campaign_id.in_(org_campaign_ids), AssessmentAssignment.deleted_at.is_(None))
    )
    if status:
        base = base.where(AssessmentAssignment.assignment_status == status)
    if result_status:
        base = base.where(AssessmentAssignment.result_status == result_status)
    if campaign_uuid:
        camp_row = (await db.execute(
            select(AssessmentCampaign.id).where(AssessmentCampaign.uuid == campaign_uuid)
        )).scalar_one_or_none()
        if camp_row:
            base = base.where(AssessmentAssignment.campaign_id == camp_row)
    if search:
        cand_ids = (await db.execute(
            select(Candidate.id).where(
                and_(
                    Candidate.organization_id == ctx.organization_id,
                    (Candidate.full_name.ilike(f"%{search}%") | Candidate.email.ilike(f"%{search}%")),
                )
            )
        )).scalars().all()
        base = base.where(AssessmentAssignment.candidate_id.in_(cand_ids))

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(
        base.order_by(AssessmentAssignment.updated_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    items = []
    for a in rows:
        cand = (await db.execute(select(Candidate).where(Candidate.id == a.candidate_id))).scalar_one_or_none()
        camp = (await db.execute(select(AssessmentCampaign).where(AssessmentCampaign.id == a.campaign_id))).scalar_one_or_none()
        asmt_name = None
        if camp and camp.assessment_id:
            asmt = (await db.execute(select(Assessment).where(Assessment.id == camp.assessment_id))).scalar_one_or_none()
            asmt_name = asmt.assessment_name if asmt else None

        items.append(ProgressRow(
            assignment_uuid=a.uuid,
            candidate_name=cand.full_name if cand else "Unknown",
            candidate_email=cand.email if cand else "",
            rank_or_designation=cand.rank_or_designation if cand else None,
            assessment_name=asmt_name,
            campaign_name=camp.campaign_name if camp else "",
            assignment_status=a.assignment_status,
            result_status=a.result_status,
            attempt_count=a.attempt_count,
            final_score=a.final_score,
            assigned_at=a.assigned_at,
            completed_at=a.completed_at,
            due_date=a.due_date,
        ))

    resp = PaginatedResponse[ProgressRow](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get("/summary", summary="Progress summary statistics")
async def progress_summary(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    org_campaign_ids = (await db.execute(
        select(AssessmentCampaign.id).where(
            and_(AssessmentCampaign.organization_id == ctx.organization_id, AssessmentCampaign.deleted_at.is_(None))
        )
    )).scalars().all()

    if not org_campaign_ids:
        return success_response(data={
            "total": 0, "assigned": 0, "in_progress": 0, "completed": 0,
            "passed": 0, "failed": 0, "expired": 0,
            "pass_rate": 0.0, "completion_rate": 0.0,
        })

    base_filter = and_(
        AssessmentAssignment.campaign_id.in_(org_campaign_ids),
        AssessmentAssignment.deleted_at.is_(None),
    )

    async def count_status(s: str) -> int:
        r = await db.execute(
            select(func.count()).where(and_(base_filter, AssessmentAssignment.assignment_status == s))
        )
        return r.scalar_one()

    total = (await db.execute(select(func.count()).where(base_filter))).scalar_one()
    assigned = await count_status("Assigned")
    in_progress = await count_status("In Progress")
    completed = await count_status("Completed")
    passed = await count_status("Passed")
    failed = await count_status("Failed")
    expired = await count_status("Expired")

    terminal = completed + passed + failed
    pass_rate = round((passed / terminal * 100), 1) if terminal > 0 else 0.0
    completion_rate = round((terminal / total * 100), 1) if total > 0 else 0.0

    return success_response(data={
        "total": total,
        "assigned": assigned,
        "in_progress": in_progress,
        "completed": completed,
        "passed": passed,
        "failed": failed,
        "expired": expired,
        "pass_rate": pass_rate,
        "completion_rate": completion_rate,
    })
