"""Candidate Portal — Simulator Session endpoints."""
import math
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors import get_connector
from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.helpers.pagination import PaginatedResponse
from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.assessment_exercise import AssessmentExercise
from app.models.exercise import Exercise
from app.models.exercise_variant import ExerciseVariant
from app.models.runtime_configuration import RuntimeConfiguration
from app.models.session_log import SessionLog
from app.models.simulator_session import SimulatorSession
from app.models.simulator_vendor import SimulatorVendor
from app.schemas.sessions import ManualResultInput, SessionCreateRequest
from app.utils.responses import error_response, not_found_response, success_response

router = APIRouter()


def _ref() -> str:
    return "SES-" + secrets.token_hex(6).upper()


def _session_dict(s: SimulatorSession, exercise_name: str | None = None, variant_name: str | None = None,
                  assessment_name: str | None = None) -> dict:
    return {
        "uuid": s.uuid,
        "session_reference": s.session_reference,
        "status": s.status,
        "runtime_mode": s.runtime_mode,
        "assessment_name": assessment_name,
        "exercise_name": exercise_name,
        "variant_name": variant_name,
        "started_at": s.started_at.isoformat() if s.started_at else None,
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        "cancelled_at": s.cancelled_at.isoformat() if s.cancelled_at else None,
        "result_received": s.result_received,
        "raw_result": s.raw_result,
        "failure_reason": s.failure_reason,
        "created_at": s.created_at.isoformat(),
    }


async def _resolve_names(session: SimulatorSession, db: AsyncSession) -> tuple[str | None, str | None, str | None]:
    assessment_name: str | None = None
    exercise_name: str | None = None
    variant_name: str | None = None
    if session.assessment_fk_id:
        a = await db.get(Assessment, session.assessment_fk_id)
        if a:
            assessment_name = a.assessment_name
    if session.exercise_fk_id:
        e = await db.get(Exercise, session.exercise_fk_id)
        if e:
            exercise_name = e.exercise_name
    if session.variant_id:
        v = await db.get(ExerciseVariant, session.variant_id)
        if v:
            variant_name = v.variant_name
    return assessment_name, exercise_name, variant_name


@router.get("", summary="List my sessions")
async def list_my_sessions(
    candidate: CurrentCandidate,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(SimulatorSession).where(
        and_(
            SimulatorSession.candidate_fk_id == candidate.id,
            SimulatorSession.deleted_at.is_(None),
        )
    )
    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar_one()
    sessions = (await db.execute(
        base_q.order_by(SimulatorSession.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    items = []
    for s in sessions:
        aname, ename, vname = await _resolve_names(s, db)
        items.append(_session_dict(s, ename, vname, aname))

    return success_response(
        data=PaginatedResponse(
            items=items, total=total, page=page, page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        ).model_dump()
    )


@router.get("/{uuid}", summary="Get session detail")
async def get_session_detail(
    uuid: str,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SimulatorSession).where(
            and_(SimulatorSession.uuid == uuid, SimulatorSession.candidate_fk_id == candidate.id)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        return not_found_response("Session")

    aname, ename, vname = await _resolve_names(session, db)
    return success_response(data=_session_dict(session, ename, vname, aname))


@router.post("", summary="Start a new session for an assignment")
async def start_session(
    body: SessionCreateRequest,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    # Resolve assignment
    result = await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == body.assignment_uuid,
                AssessmentAssignment.candidate_id == candidate.id,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        return not_found_response("Assignment")

    if assignment.assignment_status not in ("Assigned", "In Progress"):
        return error_response("Assignment is not available to start", 400)

    # Check for existing active session
    existing = (await db.execute(
        select(SimulatorSession).where(
            and_(
                SimulatorSession.assignment_id == assignment.id,
                SimulatorSession.status.in_(["Pending", "Launching", "Running"]),
            )
        )
    )).scalar_one_or_none()
    if existing:
        aname, ename, vname = await _resolve_names(existing, db)
        return success_response(data=_session_dict(existing, ename, vname, aname), message="Active session already exists")

    # Resolve campaign and assessment
    campaign = await db.get(AssessmentCampaign, assignment.campaign_id) if assignment.campaign_id else None
    assessment_obj = None
    exercise_fk_id = None
    assessment_fk_id = None
    if campaign and campaign.assessment_id:
        assessment_obj = await db.get(Assessment, campaign.assessment_id)
        assessment_fk_id = campaign.assessment_id
        # Pick the first active exercise in the assessment
        ex_row = (await db.execute(
            select(AssessmentExercise).where(
                AssessmentExercise.assessment_id == campaign.assessment_id
            ).order_by(AssessmentExercise.sequence_number).limit(1)
        )).scalar_one_or_none()
        if ex_row:
            exercise_fk_id = ex_row.exercise_id

    # Determine runtime mode
    runtime_mode = body.runtime_mode or "MANUAL"

    # Find a runtime config for the mode if available
    runtime_config = None
    if exercise_fk_id:
        rc_result = await db.execute(
            select(RuntimeConfiguration).where(
                and_(
                    RuntimeConfiguration.runtime_mode == runtime_mode,
                    RuntimeConfiguration.status == "active",
                    RuntimeConfiguration.is_default == True,  # noqa: E712
                )
            ).limit(1)
        )
        runtime_config = rc_result.scalar_one_or_none()

    session_ref = _ref()
    session = SimulatorSession(
        session_reference=session_ref,
        organization_id=candidate.organization_id,
        campaign_id=assignment.campaign_id,
        assignment_id=assignment.id,
        candidate_fk_id=candidate.id,
        assessment_fk_id=assessment_fk_id,
        exercise_fk_id=exercise_fk_id,
        runtime_mode=runtime_mode,
        runtime_config_id=runtime_config.id if runtime_config else None,
        status="Pending",
        launched_by=candidate.uuid,
        launch_payload={"assignment_uuid": body.assignment_uuid, "notes": body.notes},
    )
    db.add(session)
    await db.flush()

    # Trigger connector
    connector_cls = get_connector(runtime_mode)
    config_dict = {}
    if runtime_config:
        config_dict = {
            "api_endpoint": runtime_config.api_endpoint,
            "executable_path": runtime_config.executable_path,
            "working_directory": runtime_config.working_directory,
            "launch_arguments": runtime_config.launch_arguments,
            "result_directory": runtime_config.result_directory,
        }
    connector = connector_cls(config=config_dict)
    launch_result = await connector.launch_session({"session_reference": session_ref, "candidate_uuid": candidate.uuid})

    if launch_result.get("success"):
        session.status = "Launching" if runtime_mode == "CLOUD_API" else "Running"
        session.started_at = datetime.now(timezone.utc)
    else:
        session.status = "Failed"
        session.failure_reason = launch_result.get("error", "Launch failed")

    # Update assignment
    if assignment.assignment_status == "Assigned":
        assignment.assignment_status = "In Progress"
        assignment.started_at = datetime.now(timezone.utc)
    assignment.attempt_count = (assignment.attempt_count or 0) + 1

    # Log
    log = SessionLog(
        simulator_session_id=session.id,
        log_level="Info" if launch_result.get("success") else "Error",
        event_type="Launch Requested",
        event_message=f"Session launched via {runtime_mode}",
        payload=launch_result,
    )
    db.add(log)

    await db.commit()

    aname, ename, vname = await _resolve_names(session, db)
    return success_response(data=_session_dict(session, ename, vname, aname), message="Session started")
