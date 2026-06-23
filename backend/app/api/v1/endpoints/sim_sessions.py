"""Admin — Simulator Session management endpoints."""
import math
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors import get_connector
from app.db.session import get_db
from app.dependencies.auth import CurrentUser, require_admin
from app.helpers.pagination import PaginatedResponse
from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.candidate import Candidate
from app.models.exercise import Exercise
from app.models.exercise_variant import ExerciseVariant
from app.models.organization import Organization
from app.models.runtime_configuration import RuntimeConfiguration
from app.models.session_log import SessionLog
from app.models.simulator_session import SimulatorSession
from app.models.simulator_vendor import SimulatorVendor
from app.schemas.sessions import ManualResultInput
from app.services.audit import AuditService
from app.utils.responses import error_response, not_found_response, success_response

router = APIRouter()


def _ref() -> str:
    return "SES-" + secrets.token_hex(6).upper()


async def _get_session(uuid: str, db: AsyncSession) -> SimulatorSession | None:
    result = await db.execute(
        select(SimulatorSession).where(
            and_(SimulatorSession.uuid == uuid, SimulatorSession.deleted_at.is_(None))
        )
    )
    return result.scalar_one_or_none()


async def _build_detail(s: SimulatorSession, db: AsyncSession) -> dict:
    candidate = await db.get(Candidate, s.candidate_fk_id) if s.candidate_fk_id else None
    assessment = await db.get(Assessment, s.assessment_fk_id) if s.assessment_fk_id else None
    exercise = await db.get(Exercise, s.exercise_fk_id) if s.exercise_fk_id else None
    variant = await db.get(ExerciseVariant, s.variant_id) if s.variant_id else None
    vendor = await db.get(SimulatorVendor, s.simulator_vendor_id) if s.simulator_vendor_id else None
    campaign = await db.get(AssessmentCampaign, s.campaign_id) if s.campaign_id else None
    org = await db.get(Organization, s.organization_id) if s.organization_id else None

    # Logs
    log_rows = (await db.execute(
        select(SessionLog)
        .where(SessionLog.simulator_session_id == s.id)
        .order_by(SessionLog.created_at.asc())
        .limit(100)
    )).scalars().all()

    return {
        "uuid": s.uuid,
        "session_reference": s.session_reference,
        "status": s.status,
        "runtime_mode": s.runtime_mode,
        "result_received": s.result_received,
        "launch_payload": s.launch_payload,
        "raw_result": s.raw_result,
        "failure_reason": s.failure_reason,
        "launched_by": s.launched_by,
        "started_at": s.started_at.isoformat() if s.started_at else None,
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        "cancelled_at": s.cancelled_at.isoformat() if s.cancelled_at else None,
        "created_at": s.created_at.isoformat(),
        "updated_at": s.updated_at.isoformat(),
        "candidate_name": candidate.full_name if candidate else None,
        "candidate_email": candidate.email if candidate else None,
        "assessment_name": assessment.assessment_name if assessment else None,
        "exercise_name": exercise.exercise_name if exercise else None,
        "variant_name": variant.variant_name if variant else None,
        "vendor_name": vendor.name if vendor else None,
        "campaign_name": campaign.campaign_name if campaign else None,
        "organization_name": org.name if org else None,
        "logs": [
            {
                "id": lg.id,
                "log_level": lg.log_level,
                "event_type": lg.event_type,
                "event_message": lg.event_message,
                "payload": lg.payload,
                "created_at": lg.created_at.isoformat(),
            }
            for lg in log_rows
        ],
    }


@router.get("", summary="List all simulator sessions")
async def list_sessions(
    _: None = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: str | None = Query(None),
    runtime_mode: str | None = Query(None),
    org_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(SimulatorSession).where(SimulatorSession.deleted_at.is_(None))
    if status:
        base_q = base_q.where(SimulatorSession.status == status)
    if runtime_mode:
        base_q = base_q.where(SimulatorSession.runtime_mode == runtime_mode)
    if org_id:
        base_q = base_q.where(SimulatorSession.organization_id == org_id)

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar_one()
    rows = (await db.execute(
        base_q.order_by(SimulatorSession.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    # Bulk-resolve candidates
    cand_ids = list({r.candidate_fk_id for r in rows if r.candidate_fk_id})
    candidates: dict[int, Candidate] = {}
    if cand_ids:
        c_rows = (await db.execute(select(Candidate).where(Candidate.id.in_(cand_ids)))).scalars().all()
        candidates = {c.id: c for c in c_rows}

    campaign_ids = list({r.campaign_id for r in rows if r.campaign_id})
    campaigns: dict[int, AssessmentCampaign] = {}
    if campaign_ids:
        ca_rows = (await db.execute(select(AssessmentCampaign).where(AssessmentCampaign.id.in_(campaign_ids)))).scalars().all()
        campaigns = {c.id: c for c in ca_rows}

    items = []
    for r in rows:
        cand = candidates.get(r.candidate_fk_id) if r.candidate_fk_id else None
        camp = campaigns.get(r.campaign_id) if r.campaign_id else None
        items.append({
            "uuid": r.uuid,
            "session_reference": r.session_reference,
            "status": r.status,
            "runtime_mode": r.runtime_mode,
            "candidate_name": cand.full_name if cand else None,
            "candidate_email": cand.email if cand else None,
            "campaign_name": camp.campaign_name if camp else None,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "result_received": r.result_received,
            "created_at": r.created_at.isoformat(),
        })

    return success_response(
        data=PaginatedResponse(
            items=items, total=total, page=page, page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        ).model_dump()
    )


@router.get("/stats", summary="Session status statistics")
async def session_stats(
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    status_list = ["Pending", "Launching", "Running", "Completed", "Failed", "Cancelled", "Timed Out"]
    stats: dict[str, int] = {}
    for st in status_list:
        cnt = (await db.execute(
            select(func.count()).where(
                and_(SimulatorSession.status == st, SimulatorSession.deleted_at.is_(None))
            )
        )).scalar_one()
        stats[st.lower().replace(" ", "_")] = cnt
    today_cnt = (await db.execute(
        select(func.count()).where(
            and_(
                SimulatorSession.created_at >= today_start,
                SimulatorSession.deleted_at.is_(None),
            )
        )
    )).scalar_one()
    total = sum(stats.values())
    return success_response(data={"total": total, "sessions_today": today_cnt, **stats})


@router.get("/{uuid}", summary="Get session detail")
async def get_session(
    uuid: str,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    s = await _get_session(uuid, db)
    if not s:
        return not_found_response("Session")
    return success_response(data=await _build_detail(s, db))


@router.post("/{uuid}/cancel", summary="Cancel a session")
async def cancel_session(
    uuid: str,
    current_user: CurrentUser,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    s = await _get_session(uuid, db)
    if not s:
        return not_found_response("Session")

    if s.status in ("Completed", "Cancelled", "Failed"):
        return error_response(f"Session is already {s.status}", 400)

    connector_cls = get_connector(s.runtime_mode)
    connector = connector_cls()
    await connector.terminate_session(s.session_reference)

    s.status = "Cancelled"
    s.cancelled_at = datetime.now(timezone.utc)
    s.updated_by = current_user.uuid

    log = SessionLog(
        simulator_session_id=s.id,
        log_level="Warning",
        event_type="Session Cancelled",
        event_message=f"Cancelled by admin {current_user.uuid}",
    )
    db.add(log)
    await db.commit()

    audit = AuditService(db)
    await audit.log("simulators", "session.cancelled", current_user.uuid, "SimulatorSession", str(s.id), {})

    return success_response(message="Session cancelled")


@router.post("/{uuid}/manual-result", summary="Submit manual result for a session")
async def submit_manual_result(
    uuid: str,
    body: ManualResultInput,
    current_user: CurrentUser,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    s = await _get_session(uuid, db)
    if not s:
        return not_found_response("Session")

    if s.status not in ("Running", "Launching", "Pending"):
        return error_response(f"Session is {s.status} — cannot submit result", 400)

    s.status = "Completed"
    s.result_received = True
    s.raw_result = {"result": body.result, "score": body.score, "remarks": body.remarks, "manual": True}
    s.completed_at = datetime.now(timezone.utc)
    s.updated_by = current_user.uuid

    log = SessionLog(
        simulator_session_id=s.id,
        log_level="Info",
        event_type="Result Received",
        event_message=f"Manual result submitted: {body.result}",
        payload=s.raw_result,
    )
    db.add(log)
    await db.commit()

    return success_response(message="Manual result recorded")
