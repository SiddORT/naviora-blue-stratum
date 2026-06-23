"""Organization Portal — Campaign Assignment Engine endpoints."""
import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.helpers.pagination import PaginatedResponse
from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.assignment_activity_log import AssignmentActivityLog
from app.models.candidate import Candidate
from app.schemas.org_campaigns import (
    ActivityLogItem,
    AssignmentCreate,
    AssignmentListItem,
    AssignmentResponse,
    BulkAssignCreate,
    CandidateSnippet,
)
from app.services.audit import AuditService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


async def _get_org_campaign_ids(org_id: int, db: AsyncSession) -> list[int]:
    result = await db.execute(
        select(AssessmentCampaign.id).where(
            and_(AssessmentCampaign.organization_id == org_id, AssessmentCampaign.deleted_at.is_(None))
        )
    )
    return list(result.scalars().all())


async def _get_campaign(campaign_uuid: str, org_id: int, db: AsyncSession) -> AssessmentCampaign | None:
    result = await db.execute(
        select(AssessmentCampaign).where(
            and_(
                AssessmentCampaign.uuid == campaign_uuid,
                AssessmentCampaign.organization_id == org_id,
                AssessmentCampaign.deleted_at.is_(None),
            )
        )
    )
    return result.scalar_one_or_none()


async def _log_activity(db: AsyncSession, assignment_id: int, activity_type: str, description: str | None = None) -> None:
    log = AssignmentActivityLog(
        assignment_id=assignment_id,
        activity_type=activity_type,
        activity_description=description,
    )
    db.add(log)


async def _build_assignment_response(a: AssessmentAssignment, db: AsyncSession) -> dict:
    candidate = None
    campaign_name = None
    campaign_code = None
    assessment_name = None

    if a.candidate_id:
        c = (await db.execute(select(Candidate).where(Candidate.id == a.candidate_id))).scalar_one_or_none()
        if c:
            candidate = CandidateSnippet(
                uuid=c.uuid, full_name=c.full_name, email=c.email,
                rank_or_designation=c.rank_or_designation, seafarer_id=c.seafarer_id,
            ).model_dump()

    if a.campaign_id:
        camp = (await db.execute(select(AssessmentCampaign).where(AssessmentCampaign.id == a.campaign_id))).scalar_one_or_none()
        if camp:
            campaign_name = camp.campaign_name
            campaign_code = camp.campaign_code
            if camp.assessment_id:
                asmt = (await db.execute(select(Assessment).where(Assessment.id == camp.assessment_id))).scalar_one_or_none()
                if asmt:
                    assessment_name = asmt.assessment_name

    logs_rows = (await db.execute(
        select(AssignmentActivityLog)
        .where(AssignmentActivityLog.assignment_id == a.id)
        .order_by(AssignmentActivityLog.created_at.desc())
        .limit(20)
    )).scalars().all()

    return AssignmentResponse(
        uuid=a.uuid,
        assignment_status=a.assignment_status,
        result_status=a.result_status,
        attempt_count=a.attempt_count,
        final_score=a.final_score,
        assigned_at=a.assigned_at,
        started_at=a.started_at,
        completed_at=a.completed_at,
        due_date=a.due_date,
        notes=a.notes,
        created_at=a.created_at,
        updated_at=a.updated_at,
        candidate=candidate,
        campaign_name=campaign_name,
        campaign_code=campaign_code,
        assessment_name=assessment_name,
        activity_logs=[ActivityLogItem(
            id=l.id, activity_type=l.activity_type,
            activity_description=l.activity_description, created_at=l.created_at,
        ) for l in logs_rows],
    ).model_dump()


# ── Campaign-scoped ───────────────────────────────────────────────────────────

@router.get("/campaigns/{campaign_uuid}/assignments", summary="List assignments for a campaign")
async def list_campaign_assignments(
    campaign_uuid: str,
    ctx: CurrentOrgUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    camp = await _get_campaign(campaign_uuid, ctx.organization_id, db)
    if not camp:
        return not_found_response("Campaign not found")

    base = select(AssessmentAssignment).where(
        and_(AssessmentAssignment.campaign_id == camp.id, AssessmentAssignment.deleted_at.is_(None))
    )
    if status:
        base = base.where(AssessmentAssignment.assignment_status == status)
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
        base.order_by(AssessmentAssignment.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    items = []
    for a in rows:
        c = (await db.execute(select(Candidate).where(Candidate.id == a.candidate_id))).scalar_one_or_none()
        items.append(AssignmentListItem(
            uuid=a.uuid, assignment_status=a.assignment_status, result_status=a.result_status,
            attempt_count=a.attempt_count, final_score=a.final_score, due_date=a.due_date,
            assigned_at=a.assigned_at, completed_at=a.completed_at,
            candidate_name=c.full_name if c else None,
            candidate_email=c.email if c else None,
            rank_or_designation=c.rank_or_designation if c else None,
            campaign_name=camp.campaign_name,
        ))

    resp = PaginatedResponse[AssignmentListItem](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.post("/campaigns/{campaign_uuid}/assignments", summary="Assign a single candidate to a campaign")
async def assign_candidate(
    campaign_uuid: str,
    body: AssignmentCreate,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    camp = await _get_campaign(campaign_uuid, ctx.organization_id, db)
    if not camp:
        return not_found_response("Campaign not found")
    if camp.status not in ("Published", "Active"):
        return error_response(message="Assignments can only be created for Published or Active campaigns", status_code=400)

    cand = (await db.execute(
        select(Candidate).where(
            and_(Candidate.id == body.candidate_id, Candidate.organization_id == ctx.organization_id, Candidate.deleted_at.is_(None))
        )
    )).scalar_one_or_none()
    if not cand:
        return not_found_response("Candidate not found in this organization")

    existing = (await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.campaign_id == camp.id,
                AssessmentAssignment.candidate_id == body.candidate_id,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )).scalar_one_or_none()
    if existing:
        return error_response(message="Candidate is already assigned to this campaign", status_code=409)

    now = datetime.now(timezone.utc)
    a = AssessmentAssignment(
        campaign_id=camp.id, candidate_id=body.candidate_id,
        assignment_status="Assigned", assigned_at=now,
        due_date=body.due_date, notes=body.notes, created_by=ctx.user.uuid,
    )
    db.add(a)
    await db.flush()
    await _log_activity(db, a.id, "Assignment Created", f"Assigned to campaign: {camp.campaign_name}")

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="assignment.created", user_id=ctx.user.uuid,
        resource_type="assessment_assignment", resource_id=a.uuid,
        new_values={"campaign_id": camp.id, "candidate_id": body.candidate_id},
    )
    await db.commit()
    await db.refresh(a)
    return created_response(data=await _build_assignment_response(a, db), message="Candidate assigned successfully")


@router.post("/campaigns/{campaign_uuid}/assignments/bulk", summary="Bulk assign candidates to a campaign")
async def bulk_assign_candidates(
    campaign_uuid: str,
    body: BulkAssignCreate,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    camp = await _get_campaign(campaign_uuid, ctx.organization_id, db)
    if not camp:
        return not_found_response("Campaign not found")
    if camp.status not in ("Published", "Active"):
        return error_response(message="Assignments can only be created for Published or Active campaigns", status_code=400)

    now = datetime.now(timezone.utc)
    assigned = 0
    skipped = 0
    errors: list[str] = []

    for cand_id in body.candidate_ids:
        cand = (await db.execute(
            select(Candidate).where(
                and_(Candidate.id == cand_id, Candidate.organization_id == ctx.organization_id, Candidate.deleted_at.is_(None))
            )
        )).scalar_one_or_none()
        if not cand:
            errors.append(f"Candidate {cand_id} not found")
            continue

        existing = (await db.execute(
            select(AssessmentAssignment).where(
                and_(
                    AssessmentAssignment.campaign_id == camp.id,
                    AssessmentAssignment.candidate_id == cand_id,
                    AssessmentAssignment.deleted_at.is_(None),
                )
            )
        )).scalar_one_or_none()
        if existing:
            skipped += 1
            continue

        a = AssessmentAssignment(
            campaign_id=camp.id, candidate_id=cand_id,
            assignment_status="Assigned", assigned_at=now,
            due_date=body.due_date, notes=body.notes, created_by=ctx.user.uuid,
        )
        db.add(a)
        await db.flush()
        await _log_activity(db, a.id, "Assignment Created", f"Bulk assigned to: {camp.campaign_name}")
        assigned += 1

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="assignment.bulk_created", user_id=ctx.user.uuid,
        resource_type="assessment_campaign", resource_id=camp.uuid,
        new_values={"assigned": assigned, "skipped": skipped},
    )
    await db.commit()
    return success_response(
        data={"assigned": assigned, "skipped": skipped, "errors": errors},
        message=f"{assigned} candidate(s) assigned successfully",
    )


# ── Org-wide assignment endpoints ─────────────────────────────────────────────

@router.get("/assignments", summary="List all assignments across this organization")
async def list_all_assignments(
    ctx: CurrentOrgUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    campaign_uuid: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    org_campaign_ids = await _get_org_campaign_ids(ctx.organization_id, db)
    if not org_campaign_ids:
        from app.helpers.pagination import PaginatedResponse
        resp = PaginatedResponse[AssignmentListItem](items=[], page=page, page_size=page_size, total=0, total_pages=1)
        return success_response(data=resp.model_dump())

    base = select(AssessmentAssignment).where(
        and_(AssessmentAssignment.campaign_id.in_(org_campaign_ids), AssessmentAssignment.deleted_at.is_(None))
    )
    if status:
        base = base.where(AssessmentAssignment.assignment_status == status)
    if campaign_uuid:
        camp = (await db.execute(
            select(AssessmentCampaign).where(AssessmentCampaign.uuid == campaign_uuid)
        )).scalar_one_or_none()
        if camp:
            base = base.where(AssessmentAssignment.campaign_id == camp.id)
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
        base.order_by(AssessmentAssignment.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    items = []
    for a in rows:
        cand = (await db.execute(select(Candidate).where(Candidate.id == a.candidate_id))).scalar_one_or_none()
        camp = (await db.execute(select(AssessmentCampaign).where(AssessmentCampaign.id == a.campaign_id))).scalar_one_or_none()
        asmt_name = None
        if camp and camp.assessment_id:
            asmt = (await db.execute(select(Assessment).where(Assessment.id == camp.assessment_id))).scalar_one_or_none()
            asmt_name = asmt.assessment_name if asmt else None
        items.append(AssignmentListItem(
            uuid=a.uuid, assignment_status=a.assignment_status, result_status=a.result_status,
            attempt_count=a.attempt_count, final_score=a.final_score, due_date=a.due_date,
            assigned_at=a.assigned_at, completed_at=a.completed_at,
            candidate_name=cand.full_name if cand else None,
            candidate_email=cand.email if cand else None,
            rank_or_designation=cand.rank_or_designation if cand else None,
            campaign_name=camp.campaign_name if camp else None,
            assessment_name=asmt_name,
        ))

    resp = PaginatedResponse[AssignmentListItem](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get("/assignments/{uuid}", summary="Get assignment detail")
async def get_assignment(uuid: str, ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    org_campaign_ids = await _get_org_campaign_ids(ctx.organization_id, db)
    a = (await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == uuid,
                AssessmentAssignment.campaign_id.in_(org_campaign_ids),
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )).scalar_one_or_none()
    if not a:
        return not_found_response("Assignment not found")
    return success_response(data=await _build_assignment_response(a, db))


@router.patch("/assignments/{uuid}/status", summary="Update assignment status")
async def update_assignment_status(
    uuid: str,
    body: dict,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    org_campaign_ids = await _get_org_campaign_ids(ctx.organization_id, db)
    a = (await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == uuid,
                AssessmentAssignment.campaign_id.in_(org_campaign_ids),
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )).scalar_one_or_none()
    if not a:
        return not_found_response("Assignment not found")

    valid = ["Assigned", "In Progress", "Completed", "Passed", "Failed", "Expired", "Cancelled"]
    new_status = body.get("status")
    if new_status not in valid:
        return error_response(message=f"Invalid status. Must be one of: {', '.join(valid)}", status_code=400)

    old_status = a.assignment_status
    a.assignment_status = new_status
    a.updated_by = ctx.user.uuid
    await db.flush()
    await _log_activity(db, a.id, "Status Changed", f"Status: {old_status} → {new_status}")

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="assignment.status_changed", user_id=ctx.user.uuid,
        resource_type="assessment_assignment", resource_id=uuid,
        new_values={"old_status": old_status, "new_status": new_status},
    )
    await db.commit()
    return success_response(message=f"Assignment status updated to {new_status}")


@router.delete("/assignments/{uuid}", summary="Cancel an assignment")
async def cancel_assignment(
    uuid: str,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    org_campaign_ids = await _get_org_campaign_ids(ctx.organization_id, db)
    a = (await db.execute(
        select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.uuid == uuid,
                AssessmentAssignment.campaign_id.in_(org_campaign_ids),
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )).scalar_one_or_none()
    if not a:
        return not_found_response("Assignment not found")
    if a.assignment_status in ("Completed", "Passed", "Failed"):
        return error_response(message="Completed assignments cannot be removed", status_code=400)

    a.soft_delete(ctx.user.uuid)
    await db.commit()

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="assignment.cancelled", user_id=ctx.user.uuid,
        resource_type="assessment_assignment", resource_id=uuid,
        new_values={"action": "cancelled"},
    )
    return success_response(message="Assignment cancelled")
