"""Candidate Portal — Dashboard statistics and quick-overview endpoint."""
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.models.assessment_assignment import AssessmentAssignment
from app.models.simulator_session import SimulatorSession
from app.models.certificate import Certificate
from app.utils.responses import success_response

router = APIRouter()


@router.get("", summary="Candidate dashboard statistics")
async def get_dashboard(candidate: CurrentCandidate, db: AsyncSession = Depends(get_db)):
    base = and_(
        AssessmentAssignment.candidate_id == candidate.id,
        AssessmentAssignment.deleted_at.is_(None),
    )

    total = (await db.execute(
        select(func.count()).select_from(select(AssessmentAssignment).where(base).subquery())
    )).scalar_one()

    in_progress = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentAssignment).where(
                and_(base, AssessmentAssignment.assignment_status == "In Progress")
            ).subquery()
        )
    )).scalar_one()

    completed = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentAssignment).where(
                and_(base, AssessmentAssignment.assignment_status == "Completed")
            ).subquery()
        )
    )).scalar_one()

    assigned = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentAssignment).where(
                and_(base, AssessmentAssignment.assignment_status == "Assigned")
            ).subquery()
        )
    )).scalar_one()

    passed = (await db.execute(
        select(func.count()).select_from(
            select(AssessmentAssignment).where(
                and_(base, AssessmentAssignment.result_status == "Passed")
            ).subquery()
        )
    )).scalar_one()

    total_sessions = (await db.execute(
        select(func.count()).select_from(
            select(SimulatorSession).where(
                and_(
                    SimulatorSession.candidate_fk_id == candidate.id,
                    SimulatorSession.deleted_at.is_(None),
                )
            ).subquery()
        )
    )).scalar_one()

    total_certificates = (await db.execute(
        select(func.count()).select_from(
            select(Certificate).where(
                and_(
                    Certificate.candidate_id == candidate.id,
                    Certificate.deleted_at.is_(None),
                    Certificate.status == "Issued",
                )
            ).subquery()
        )
    )).scalar_one()

    recent_assignments = (await db.execute(
        select(AssessmentAssignment).where(base)
        .order_by(AssessmentAssignment.created_at.desc())
        .limit(5)
    )).scalars().all()

    recent = []
    from app.models.assessment_campaign import AssessmentCampaign
    from app.models.assessment import Assessment
    for a in recent_assignments:
        campaign = await db.get(AssessmentCampaign, a.campaign_id) if a.campaign_id else None
        assessment = await db.get(Assessment, campaign.assessment_id) if campaign and campaign.assessment_id else None
        can_start = (
            a.assignment_status in ("Assigned", "In Progress")
            and (campaign is None or campaign.status in ("Active", "Published"))
        )
        recent.append({
            "uuid": a.uuid,
            "assignment_status": a.assignment_status,
            "assessment_name": assessment.assessment_name if assessment else None,
            "campaign_name": campaign.campaign_name if campaign else None,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "can_start": can_start,
        })

    return success_response({
        "stats": {
            "total_assignments": total,
            "in_progress": in_progress,
            "completed": completed,
            "assigned": assigned,
            "passed": passed,
            "total_sessions": total_sessions,
            "total_certificates": total_certificates,
        },
        "recent_assignments": recent,
    })
