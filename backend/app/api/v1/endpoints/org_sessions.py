"""Organization Portal — Simulator Session endpoints."""
import math
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors import get_connector
from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.helpers.pagination import PaginatedResponse
from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.candidate import Candidate
from app.models.exercise import Exercise
from app.models.exercise_variant import ExerciseVariant
from app.models.runtime_configuration import RuntimeConfiguration
from app.models.session_log import SessionLog
from app.models.simulator_session import SimulatorSession
from app.models.simulator_vendor import SimulatorVendor
from app.schemas.sessions import ManualResultInput, SessionCreateRequest
from app.services.audit import AuditService
from app.utils.responses import error_response, not_found_response, success_response

router = APIRouter()


def _ref() -> str:
    return "SES-" + secrets.token_hex(6).upper()


def _session_item(s: SimulatorSession, candidate: Candidate | None = None,
                  campaign: AssessmentCampaign | None = None, assessment: Assessment | None = None,
                  exercise: Exercise | None = None, variant: ExerciseVariant | None = None,
                  vendor_name: str | None = None) -> dict:
    return {
        "uuid": s.uuid,
        "session_reference": s.session_reference,
        "status": s.status,
        "runtime_mode": s.runtime_mode,
        "candidate_name": candidate.full_name if candidate else None,
        "candidate_email": candidate.email if candidate else None,
        "campaign_name": campaign.campaign_name if campaign else None,
        "assessment_name": assessment.assessment_name if assessment else None,
        "exercise_name": exercise.exercise_name if exercise else None,
        "variant_name": variant.variant_name if variant else None,
        "vendor_name": vendor_name,
        "organization_name": None,
        "started_at": s.started_at.isoformat() if s.started_at else None,
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        "result_received": s.result_received,
        "created_at": s.created_at.isoformat(),
    }


@router.get("", summary="List org sessions")
async def list_org_sessions(
    ctx: CurrentOrgUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: str | None = Query(None),
    runtime_mode: str | None = Query(None),
    campaign_uuid: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(SimulatorSession).where(
        and_(
            SimulatorSession.organization_id == ctx.organization_id,
            SimulatorSession.deleted_at.is_(None),
        )
    )
    if status:
        base_q = base_q.where(SimulatorSession.status == status)
    if runtime_mode:
        base_q = base_q.where(SimulatorSession.runtime_mode == runtime_mode)
    if campaign_uuid:
        camp_res = await db.execute(
            select(AssessmentCampaign).where(
                and_(AssessmentCampaign.uuid == campaign_uuid, AssessmentCampaign.organization_id == ctx.organization_id)
            )
        )
        camp = camp_res.scalar_one_or_none()
        if camp:
            base_q = base_q.where(SimulatorSession.campaign_id == camp.id)

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar_one()
    rows = (await db.execute(
        base_q.order_by(SimulatorSession.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    cand_ids = list({r.candidate_fk_id for r in rows if r.candidate_fk_id})
    candidates: dict[int, Candidate] = {}
    if cand_ids:
        c_rows = (await db.execute(select(Candidate).where(Candidate.id.in_(cand_ids)))).scalars().all()
        candidates = {c.id: c for c in c_rows}

    camp_ids = list({r.campaign_id for r in rows if r.campaign_id})
    campaigns: dict[int, AssessmentCampaign] = {}
    if camp_ids:
        ca_rows = (await db.execute(select(AssessmentCampaign).where(AssessmentCampaign.id.in_(camp_ids)))).scalars().all()
        campaigns = {c.id: c for c in ca_rows}

    vendor_ids = list({r.simulator_vendor_id for r in rows if r.simulator_vendor_id})
    vendors: dict[int, SimulatorVendor] = {}
    if vendor_ids:
        v_rows = (await db.execute(select(SimulatorVendor).where(SimulatorVendor.id.in_(vendor_ids)))).scalars().all()
        vendors = {v.id: v for v in v_rows}

    items = [
        _session_item(r, candidates.get(r.candidate_fk_id) if r.candidate_fk_id else None,
                      campaigns.get(r.campaign_id) if r.campaign_id else None,
                      vendor_name=vendors[r.simulator_vendor_id].name if r.simulator_vendor_id and r.simulator_vendor_id in vendors else None)
        for r in rows
    ]
    return success_response(
        data=PaginatedResponse(
            items=items, total=total, page=page, page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        ).model_dump()
    )


@router.get("/stats", summary="Org session stats")
async def org_session_stats(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    status_list = ["Pending", "Launching", "Running", "Completed", "Failed", "Cancelled", "Timed Out"]
    stats: dict[str, int] = {}
    for st in status_list:
        cnt = (await db.execute(
            select(func.count()).where(
                and_(
                    SimulatorSession.organization_id == ctx.organization_id,
                    SimulatorSession.status == st,
                    SimulatorSession.deleted_at.is_(None),
                )
            )
        )).scalar_one()
        stats[st] = cnt
    total = sum(stats.values())
    return success_response(data={"total": total, "by_status": stats})


@router.get("/{uuid}", summary="Get session detail")
async def get_org_session(
    uuid: str,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SimulatorSession).where(
            and_(
                SimulatorSession.uuid == uuid,
                SimulatorSession.organization_id == ctx.organization_id,
                SimulatorSession.deleted_at.is_(None),
            )
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        return not_found_response("Session")

    candidate = await db.get(Candidate, s.candidate_fk_id) if s.candidate_fk_id else None
    assessment = await db.get(Assessment, s.assessment_fk_id) if s.assessment_fk_id else None
    exercise = await db.get(Exercise, s.exercise_fk_id) if s.exercise_fk_id else None
    variant = await db.get(ExerciseVariant, s.variant_id) if s.variant_id else None
    campaign = await db.get(AssessmentCampaign, s.campaign_id) if s.campaign_id else None
    vendor = await db.get(SimulatorVendor, s.simulator_vendor_id) if s.simulator_vendor_id else None

    log_rows = (await db.execute(
        select(SessionLog).where(SessionLog.simulator_session_id == s.id)
        .order_by(SessionLog.created_at.asc()).limit(100)
    )).scalars().all()

    return success_response(data={
        **_session_item(s, candidate, campaign, assessment, exercise, variant, vendor.name if vendor else None),
        "result_received": s.result_received,
        "raw_result": s.raw_result,
        "failure_reason": s.failure_reason,
        "launch_payload": s.launch_payload,
        "started_at": s.started_at.isoformat() if s.started_at else None,
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        "cancelled_at": s.cancelled_at.isoformat() if s.cancelled_at else None,
        "updated_at": s.updated_at.isoformat(),
        "logs": [
            {"log_level": lg.log_level, "event_type": lg.event_type,
             "event_message": lg.event_message, "created_at": lg.created_at.isoformat()}
            for lg in log_rows
        ],
    })


@router.post("/{uuid}/launch", summary="Launch a session on behalf of a candidate")
async def launch_session(
    uuid: str,
    body: SessionCreateRequest,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Instructor/admin launches a manual or cloud session for a candidate."""
    # Resolve assignment
    result = await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == body.assignment_uuid,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        return not_found_response("Assignment")

    # Ensure assignment belongs to this org
    campaign = await db.get(AssessmentCampaign, assignment.campaign_id) if assignment.campaign_id else None
    if not campaign or campaign.organization_id != ctx.organization_id:
        return not_found_response("Assignment")

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
        return success_response(data={"uuid": existing.uuid}, message="Active session already exists")

    assessment_fk_id = campaign.assessment_id if campaign else None
    runtime_mode = body.runtime_mode or "MANUAL"

    session_ref = _ref()
    session = SimulatorSession(
        session_reference=session_ref,
        organization_id=ctx.organization_id,
        campaign_id=assignment.campaign_id,
        assignment_id=assignment.id,
        candidate_fk_id=assignment.candidate_id,
        assessment_fk_id=assessment_fk_id,
        runtime_mode=runtime_mode,
        status="Pending",
        launched_by=ctx.user.uuid,
        launch_payload={"notes": body.notes},
    )
    db.add(session)
    await db.flush()

    connector_cls = get_connector(runtime_mode)
    connector = connector_cls()
    launch_result = await connector.launch_session({"session_reference": session_ref})

    if launch_result.get("success"):
        session.status = "Running" if runtime_mode == "MANUAL" else "Launching"
        session.started_at = datetime.now(timezone.utc)
    else:
        session.status = "Failed"
        session.failure_reason = launch_result.get("error", "Launch failed")

    assignment.assignment_status = "In Progress"
    if not assignment.started_at:
        assignment.started_at = datetime.now(timezone.utc)

    log = SessionLog(
        simulator_session_id=session.id,
        log_level="Info",
        event_type="Launch Requested",
        event_message=f"Launched by org admin {ctx.user.uuid}",
        payload=launch_result,
    )
    db.add(log)
    await db.commit()

    audit = AuditService(db)
    await audit.log("org_portal", "session.launched", ctx.user.uuid, "SimulatorSession", str(session.id), {})

    return success_response(data={"uuid": session.uuid, "session_reference": session_ref}, message="Session launched")


@router.post("/{uuid}/manual-result", summary="Submit manual assessment result")
async def submit_manual_result(
    uuid: str,
    body: ManualResultInput,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SimulatorSession).where(
            and_(
                SimulatorSession.uuid == uuid,
                SimulatorSession.organization_id == ctx.organization_id,
                SimulatorSession.deleted_at.is_(None),
            )
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        return not_found_response("Session")

    if s.status not in ("Running", "Launching", "Pending"):
        return error_response(f"Session is {s.status}", 400)

    s.status = "Completed"
    s.result_received = True
    s.raw_result = {"result": body.result, "score": body.score, "remarks": body.remarks, "manual": True}
    s.completed_at = datetime.now(timezone.utc)
    s.updated_by = ctx.user.uuid

    log = SessionLog(
        simulator_session_id=s.id,
        log_level="Info",
        event_type="Result Received",
        event_message=f"Manual result: {body.result}",
        payload=s.raw_result,
    )
    db.add(log)
    await db.commit()

    return success_response(message="Result recorded")
