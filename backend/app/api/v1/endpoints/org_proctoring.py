"""Org Portal — Proctoring monitoring endpoints (scoped to organization)."""
import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.models.assessment_checkin import AssessmentCheckin
from app.models.assessment_proctoring_event import AssessmentProctoringEvent
from app.models.candidate import Candidate
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.assessment import Assessment
from app.utils.responses import success_response

router = APIRouter()


@router.get("", summary="Org proctoring overview")
async def org_proctoring(
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
):
    q = select(AssessmentCheckin).where(
        AssessmentCheckin.organization_id == ctx.organization_id
    )
    if search:
        cand_ids = [c.id for c in (await db.execute(
            select(Candidate).where(
                and_(
                    Candidate.organization_id == ctx.organization_id,
                    Candidate.full_name.ilike(f"%{search}%") | Candidate.email.ilike(f"%{search}%"),
                )
            )
        )).scalars().all()]
        if cand_ids:
            q = q.where(AssessmentCheckin.candidate_id.in_(cand_ids))
        else:
            return success_response({
                "items": [], "total": 0, "page": page, "page_size": page_size, "pages": 0,
            })

    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()

    rows = (await db.execute(
        q.order_by(AssessmentCheckin.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    cand_ids2 = {r.candidate_id for r in rows}
    assign_ids = {r.assignment_id for r in rows}

    candidates = {}
    if cand_ids2:
        candidates = {c.id: c for c in (await db.execute(
            select(Candidate).where(Candidate.id.in_(cand_ids2))
        )).scalars().all()}

    assignments = {}
    if assign_ids:
        assignments = {a.id: a for a in (await db.execute(
            select(AssessmentAssignment).where(AssessmentAssignment.id.in_(assign_ids))
        )).scalars().all()}

    campaign_ids = {a.campaign_id for a in assignments.values() if a.campaign_id}
    campaigns = {}
    if campaign_ids:
        campaigns = {c.id: c for c in (await db.execute(
            select(AssessmentCampaign).where(AssessmentCampaign.id.in_(campaign_ids))
        )).scalars().all()}

    assess_ids = {c.assessment_id for c in campaigns.values() if c.assessment_id}
    assessments = {}
    if assess_ids:
        assessments = {a.id: a for a in (await db.execute(
            select(Assessment).where(Assessment.id.in_(assess_ids))
        )).scalars().all()}

    focus_violations_map: dict[int, int] = {}
    if assign_ids:
        fv_rows = await db.execute(
            select(
                AssessmentProctoringEvent.assignment_id,
                func.count(AssessmentProctoringEvent.id).label("cnt"),
            )
            .where(
                and_(
                    AssessmentProctoringEvent.assignment_id.in_(assign_ids),
                    AssessmentProctoringEvent.event_type.in_(["Browser Lost Focus", "Tab Changed", "Window Blur"]),
                )
            )
            .group_by(AssessmentProctoringEvent.assignment_id)
        )
        focus_violations_map = {r.assignment_id: r.cnt for r in fv_rows}

    items = []
    for r in rows:
        cand = candidates.get(r.candidate_id)
        asgn = assignments.get(r.assignment_id)
        camp = campaigns.get(asgn.campaign_id) if asgn and asgn.campaign_id else None
        assess = assessments.get(camp.assessment_id) if camp and camp.assessment_id else None
        items.append({
            "uuid": r.uuid,
            "candidate_name": cand.full_name if cand else None,
            "candidate_email": cand.email if cand else None,
            "assessment_name": assess.assessment_name if assess else None,
            "identity_confirmed": r.identity_confirmed,
            "rules_accepted": r.rules_accepted,
            "is_complete": bool(r.identity_confirmed and r.rules_accepted and r.checked_in_at),
            "has_webcam": bool(r.webcam_snapshot_path),
            "focus_violations": focus_violations_map.get(r.assignment_id, 0),
            "browser_name": r.browser_name,
            "operating_system": r.operating_system,
            "checked_in_at": r.checked_in_at.isoformat() if r.checked_in_at else None,
            "created_at": r.created_at.isoformat(),
        })

    return success_response({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    })
