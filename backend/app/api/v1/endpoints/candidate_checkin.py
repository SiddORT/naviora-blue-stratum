"""Candidate Portal — Assessment check-in endpoints."""
import os
import shutil
import uuid as _uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_checkin import AssessmentCheckin
from app.utils.responses import error_response, not_found_response, success_response

router = APIRouter()

UPLOAD_DIR = "uploads/webcam_snapshots"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _checkin_dict(c: AssessmentCheckin) -> dict:
    return {
        "uuid": c.uuid,
        "assignment_id": c.assignment_id,
        "identity_confirmed": c.identity_confirmed,
        "rules_accepted": c.rules_accepted,
        "webcam_snapshot_path": c.webcam_snapshot_path,
        "browser_name": c.browser_name,
        "browser_version": c.browser_version,
        "operating_system": c.operating_system,
        "device_type": c.device_type,
        "screen_resolution": c.screen_resolution,
        "ip_address": c.ip_address,
        "timezone_name": c.timezone_name,
        "rules_version": c.rules_version,
        "checked_in_at": c.checked_in_at.isoformat() if c.checked_in_at else None,
        "created_at": c.created_at.isoformat(),
    }


class CheckinSubmitRequest(BaseModel):
    identity_confirmed: bool = False
    rules_accepted: bool = False
    browser_name: str | None = None
    browser_version: str | None = None
    operating_system: str | None = None
    device_type: str | None = None
    screen_resolution: str | None = None
    timezone_name: str | None = None
    rules_version: str = "1.0"


async def _get_assignment(uuid: str, candidate: CurrentCandidate, db: AsyncSession):
    result = await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == uuid,
                AssessmentAssignment.candidate_id == candidate.id,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )
    return result.scalar_one_or_none()


@router.get("/{assignment_uuid}", summary="Get check-in status for an assignment")
async def get_checkin(
    assignment_uuid: str,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    assignment = await _get_assignment(assignment_uuid, candidate, db)
    if not assignment:
        return not_found_response("Assignment")

    checkin = (await db.execute(
        select(AssessmentCheckin).where(
            and_(
                AssessmentCheckin.assignment_id == assignment.id,
                AssessmentCheckin.candidate_id == candidate.id,
            )
        ).order_by(AssessmentCheckin.created_at.desc()).limit(1)
    )).scalar_one_or_none()

    return success_response({
        "has_checkin": checkin is not None,
        "checkin": _checkin_dict(checkin) if checkin else None,
        "is_complete": bool(checkin and checkin.identity_confirmed and checkin.rules_accepted and checkin.checked_in_at),
    })


@router.post("/{assignment_uuid}", summary="Submit check-in for an assignment")
async def submit_checkin(
    assignment_uuid: str,
    body: CheckinSubmitRequest,
    request: Request,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    assignment = await _get_assignment(assignment_uuid, candidate, db)
    if not assignment:
        return not_found_response("Assignment")

    if assignment.assignment_status not in ("Assigned", "In Progress"):
        return error_response("Assignment is not in a startable state", 400)

    existing = (await db.execute(
        select(AssessmentCheckin).where(
            and_(
                AssessmentCheckin.assignment_id == assignment.id,
                AssessmentCheckin.candidate_id == candidate.id,
            )
        ).limit(1)
    )).scalar_one_or_none()

    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    is_complete = body.identity_confirmed and body.rules_accepted
    checked_in_at = datetime.now(timezone.utc) if is_complete else None

    if existing:
        existing.identity_confirmed = body.identity_confirmed
        existing.rules_accepted = body.rules_accepted
        existing.browser_name = body.browser_name
        existing.browser_version = body.browser_version
        existing.operating_system = body.operating_system
        existing.device_type = body.device_type
        existing.screen_resolution = body.screen_resolution
        existing.timezone_name = body.timezone_name
        existing.rules_version = body.rules_version
        existing.ip_address = ip
        existing.user_agent = user_agent
        if is_complete and not existing.checked_in_at:
            existing.checked_in_at = checked_in_at
        checkin = existing
    else:
        checkin = AssessmentCheckin(
            assignment_id=assignment.id,
            candidate_id=candidate.id,
            organization_id=candidate.organization_id,
            identity_confirmed=body.identity_confirmed,
            rules_accepted=body.rules_accepted,
            browser_name=body.browser_name,
            browser_version=body.browser_version,
            operating_system=body.operating_system,
            device_type=body.device_type,
            screen_resolution=body.screen_resolution,
            timezone_name=body.timezone_name,
            rules_version=body.rules_version,
            ip_address=ip,
            user_agent=user_agent,
            checked_in_at=checked_in_at,
        )
        db.add(checkin)

    if is_complete and assignment.assignment_status == "Assigned":
        assignment.assignment_status = "In Progress"

    await db.commit()
    await db.refresh(checkin)

    return success_response({
        "checkin": _checkin_dict(checkin),
        "is_complete": is_complete,
        "message": "Check-in complete. You may now start the assessment." if is_complete else "Check-in saved.",
    })


@router.post("/{assignment_uuid}/webcam", summary="Upload webcam snapshot for check-in")
async def upload_webcam(
    assignment_uuid: str,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    assignment = await _get_assignment(assignment_uuid, candidate, db)
    if not assignment:
        return not_found_response("Assignment")

    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        return error_response("Only JPEG, PNG and WebP images are allowed", 400)

    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1]

    filename = f"{candidate.uuid}_{assignment.uuid}_{_uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    snap_path = f"/uploads/webcam_snapshots/{filename}"

    checkin = (await db.execute(
        select(AssessmentCheckin).where(
            and_(
                AssessmentCheckin.assignment_id == assignment.id,
                AssessmentCheckin.candidate_id == candidate.id,
            )
        ).limit(1)
    )).scalar_one_or_none()

    if checkin:
        checkin.webcam_snapshot_path = snap_path
    else:
        checkin = AssessmentCheckin(
            assignment_id=assignment.id,
            candidate_id=candidate.id,
            organization_id=candidate.organization_id,
            webcam_snapshot_path=snap_path,
        )
        db.add(checkin)

    await db.commit()
    return success_response({"webcam_snapshot_path": snap_path})
