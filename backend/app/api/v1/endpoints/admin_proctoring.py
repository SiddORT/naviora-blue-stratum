"""Admin Portal — Proctoring dashboard and monitoring endpoints."""
import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.models.assessment_checkin import AssessmentCheckin
from app.models.assessment_proctoring_event import AssessmentProctoringEvent
from app.models.candidate import Candidate
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.assessment import Assessment
from app.utils.responses import success_response

router = APIRouter(dependencies=[Depends(check_permissions(["assessments.view"]))])


@router.get("/summary", summary="Admin proctoring dashboard summary")
async def proctoring_summary(db: AsyncSession = Depends(get_db)):
    from datetime import date, timedelta, timezone
    import datetime as dt
    today_start = dt.datetime.combine(date.today(), dt.time.min).replace(tzinfo=dt.timezone.utc)
    today_end = dt.datetime.combine(date.today(), dt.time.max).replace(tzinfo=dt.timezone.utc)

    checkins_today = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentCheckin).where(
                AssessmentCheckin.checked_in_at >= today_start
            ).subquery()
        )
    )).scalar_one()

    total_checkins = (await db.execute(
        select(func.count()).select_from(select(AssessmentCheckin).subquery())
    )).scalar_one()

    focus_violations = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentProctoringEvent).where(
                AssessmentProctoringEvent.event_type.in_(["Browser Lost Focus", "Tab Changed", "Window Blur"])
            ).subquery()
        )
    )).scalar_one()

    disconnections = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentProctoringEvent).where(
                AssessmentProctoringEvent.event_type == "Candidate Disconnected"
            ).subquery()
        )
    )).scalar_one()

    integrity_events = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentProctoringEvent).subquery()
        )
    )).scalar_one()

    return success_response({
        "checkins_today": checkins_today,
        "total_checkins": total_checkins,
        "focus_violations": focus_violations,
        "disconnected_sessions": disconnections,
        "total_integrity_events": integrity_events,
    })


@router.get("/checkins", summary="List all check-ins")
async def list_checkins(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
):
    q = select(AssessmentCheckin)
    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()

    rows = (await db.execute(
        q.order_by(AssessmentCheckin.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    cand_ids = {r.candidate_id for r in rows}
    assign_ids = {r.assignment_id for r in rows}

    candidates = {}
    if cand_ids:
        candidates = {c.id: c for c in (await db.execute(
            select(Candidate).where(Candidate.id.in_(cand_ids))
        )).scalars().all()}

    assignments = {}
    if assign_ids:
        assignments = {a.id: a for a in (await db.execute(
            select(AssessmentAssignment).where(AssessmentAssignment.id.in_(assign_ids))
        )).scalars().all()}

    campaign_ids = {a.campaign_id for a in assignments.values() if a.campaign_id}
    campaigns = {}
    if campaign_ids:
        camps = (await db.execute(
            select(AssessmentCampaign).where(AssessmentCampaign.id.in_(campaign_ids))
        )).scalars().all()
        campaigns = {c.id: c for c in camps}

    assess_ids = {c.assessment_id for c in campaigns.values() if c.assessment_id}
    assessments = {}
    if assess_ids:
        assessments = {a.id: a for a in (await db.execute(
            select(Assessment).where(Assessment.id.in_(assess_ids))
        )).scalars().all()}

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
            "browser_name": r.browser_name,
            "operating_system": r.operating_system,
            "device_type": r.device_type,
            "ip_address": r.ip_address,
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


@router.get("/events", summary="List proctoring events")
async def list_events(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    event_type: str | None = Query(None),
):
    q = select(AssessmentProctoringEvent)
    if event_type:
        q = q.where(AssessmentProctoringEvent.event_type == event_type)

    total = (await db.execute(
        select(func.count()).select_from(q.subquery())
    )).scalar_one()

    rows = (await db.execute(
        q.order_by(AssessmentProctoringEvent.event_timestamp.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    cand_ids = {r.candidate_id for r in rows}
    candidates = {}
    if cand_ids:
        candidates = {c.id: c for c in (await db.execute(
            select(Candidate).where(Candidate.id.in_(cand_ids))
        )).scalars().all()}

    items = [
        {
            "uuid": r.uuid,
            "candidate_name": candidates.get(r.candidate_id, type("X", (), {"full_name": None})()).full_name,
            "event_type": r.event_type,
            "event_timestamp": r.event_timestamp.isoformat(),
            "remarks": r.remarks,
            "assignment_id": r.assignment_id,
            "session_id": r.session_id,
        }
        for r in rows
    ]

    return success_response({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    })
