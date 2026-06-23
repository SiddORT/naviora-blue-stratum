"""Candidate Portal — Assignments & Assessment endpoints."""
import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.helpers.pagination import PaginatedResponse
from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.assessment_exercise import AssessmentExercise
from app.models.simulator_session import SimulatorSession
from app.utils.responses import not_found_response, success_response

router = APIRouter()


def _assignment_to_dict(assignment: AssessmentAssignment, campaign: AssessmentCampaign | None,
                        assessment: Assessment | None, exercise_count: int,
                        active_session: SimulatorSession | None) -> dict:
    can_start = (
        assignment.assignment_status in ("Assigned", "In Progress")
        and (campaign is None or campaign.status in ("Active", "Published"))
        and (assignment.due_date is None or assignment.due_date > datetime.now(timezone.utc))
    )
    return {
        "uuid": assignment.uuid,
        "assignment_status": assignment.assignment_status,
        "result_status": assignment.result_status,
        "attempt_count": assignment.attempt_count,
        "final_score": float(assignment.final_score) if assignment.final_score else None,
        "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
        "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
        "started_at": assignment.started_at.isoformat() if assignment.started_at else None,
        "completed_at": assignment.completed_at.isoformat() if assignment.completed_at else None,
        "campaign_name": campaign.campaign_name if campaign else None,
        "campaign_code": campaign.campaign_code if campaign else None,
        "assessment_name": assessment.assessment_name if assessment else None,
        "assessment_code": assessment.assessment_code if assessment else None,
        "assessment_type": assessment.assessment_type if assessment else None,
        "exercise_count": exercise_count,
        "can_start": can_start,
        "active_session_uuid": active_session.uuid if active_session else None,
    }


@router.get("", summary="List my assignments")
async def list_my_assignments(
    candidate: CurrentCandidate,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(AssessmentAssignment).where(
        and_(
            AssessmentAssignment.candidate_id == candidate.id,
            AssessmentAssignment.deleted_at.is_(None),
        )
    )
    if status_filter:
        base_q = base_q.where(AssessmentAssignment.assignment_status == status_filter)

    count_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    rows = (await db.execute(
        base_q.order_by(AssessmentAssignment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )).scalars().all()

    # Resolve campaigns / assessments in bulk
    campaign_ids = [r.campaign_id for r in rows if r.campaign_id]
    campaigns: dict[int, AssessmentCampaign] = {}
    if campaign_ids:
        camp_rows = (await db.execute(
            select(AssessmentCampaign).where(AssessmentCampaign.id.in_(campaign_ids))
        )).scalars().all()
        campaigns = {c.id: c for c in camp_rows}

    assessment_ids = [campaigns[r.campaign_id].assessment_id
                      for r in rows
                      if r.campaign_id and r.campaign_id in campaigns
                      and campaigns[r.campaign_id].assessment_id]
    assessments: dict[int, Assessment] = {}
    if assessment_ids:
        assess_rows = (await db.execute(
            select(Assessment).where(Assessment.id.in_(assessment_ids))
        )).scalars().all()
        assessments = {a.id: a for a in assess_rows}

    # Exercise counts
    exercise_counts: dict[int, int] = {}
    if assessment_ids:
        for aid in assessment_ids:
            cnt = (await db.execute(
                select(func.count()).where(AssessmentExercise.assessment_id == aid)
            )).scalar_one()
            exercise_counts[aid] = cnt

    # Active sessions
    assignment_ids = [r.id for r in rows]
    active_sessions: dict[int, SimulatorSession] = {}
    if assignment_ids:
        sess_rows = (await db.execute(
            select(SimulatorSession).where(
                and_(
                    SimulatorSession.assignment_id.in_(assignment_ids),
                    SimulatorSession.status.in_(["Pending", "Launching", "Running"]),
                )
            )
        )).scalars().all()
        for s in sess_rows:
            if s.assignment_id not in active_sessions:
                active_sessions[s.assignment_id] = s

    items = []
    for row in rows:
        campaign = campaigns.get(row.campaign_id) if row.campaign_id else None
        assessment_obj = None
        if campaign and campaign.assessment_id:
            assessment_obj = assessments.get(campaign.assessment_id)
        ex_count = exercise_counts.get(campaign.assessment_id, 0) if campaign and campaign.assessment_id else 0
        active_sess = active_sessions.get(row.id)
        items.append(_assignment_to_dict(row, campaign, assessment_obj, ex_count, active_sess))

    return success_response(
        data=PaginatedResponse(
            items=items, total=total, page=page, page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        ).model_dump()
    )


@router.get("/{uuid}", summary="Get assignment detail")
async def get_assignment_detail(
    uuid: str,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == uuid,
                AssessmentAssignment.candidate_id == candidate.id,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        return not_found_response("Assignment")

    campaign = await db.get(AssessmentCampaign, assignment.campaign_id) if assignment.campaign_id else None
    assessment_obj = None
    exercise_count = 0
    if campaign and campaign.assessment_id:
        assessment_obj = await db.get(Assessment, campaign.assessment_id)
        exercise_count = (await db.execute(
            select(func.count()).where(AssessmentExercise.assessment_id == campaign.assessment_id)
        )).scalar_one()

    active_sess = None
    sess_result = await db.execute(
        select(SimulatorSession).where(
            and_(
                SimulatorSession.assignment_id == assignment.id,
                SimulatorSession.status.in_(["Pending", "Launching", "Running"]),
            )
        ).limit(1)
    )
    active_sess = sess_result.scalar_one_or_none()

    return success_response(
        data=_assignment_to_dict(assignment, campaign, assessment_obj, exercise_count, active_sess)
    )
