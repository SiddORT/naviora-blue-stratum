"""Candidate Portal — Proctoring event logging endpoint."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_proctoring_event import AssessmentProctoringEvent
from app.utils.responses import error_response, success_response

router = APIRouter()


class ProctoringEventRequest(BaseModel):
    assignment_uuid: str
    event_type: str
    event_timestamp: datetime | None = None
    session_uuid: str | None = None
    remarks: str | None = None


@router.post("", summary="Log a proctoring event")
async def log_event(
    body: ProctoringEventRequest,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    assignment = (await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == body.assignment_uuid,
                AssessmentAssignment.candidate_id == candidate.id,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )).scalar_one_or_none()

    if not assignment:
        return error_response("Assignment not found or access denied", 404)

    session_id = None
    if body.session_uuid:
        from app.models.simulator_session import SimulatorSession
        sess = (await db.execute(
            select(SimulatorSession).where(SimulatorSession.uuid == body.session_uuid)
        )).scalar_one_or_none()
        if sess:
            session_id = sess.id

    event = AssessmentProctoringEvent(
        assignment_id=assignment.id,
        candidate_id=candidate.id,
        session_id=session_id,
        event_type=body.event_type,
        event_timestamp=body.event_timestamp or datetime.now(timezone.utc),
        remarks=body.remarks,
    )
    db.add(event)
    await db.commit()

    return success_response({"logged": True, "event_type": body.event_type})
