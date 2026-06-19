"""Assessment module — API endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.assessments import (
    AssessmentAttemptResponse,
    AssessmentCreate,
    AssessmentListResponse,
    AssessmentPage,
    AssessmentParticipantBulkAssign,
    AssessmentParticipantCreate,
    AssessmentParticipantPage,
    AssessmentParticipantResponse,
    AssessmentParticipantUpdate,
    AssessmentProgressSummary,
    AssessmentResponse,
    AssessmentScheduleResponse,
    AssessmentScheduleUpsert,
    AssessmentUpdate,
    BulkAssignResult,
)
from app.schemas.common import SuccessResponse
from app.services.assessments import AssessmentService

router = APIRouter()


def _svc(db: AsyncSession = Depends(get_db)) -> AssessmentService:
    return AssessmentService(db)


# ── List + Create ─────────────────────────────────────────────────────────────

@router.get("", response_model=SuccessResponse[AssessmentPage])
async def list_assessments(
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    assessment_type: Optional[str] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    svc: AssessmentService = Depends(_svc),
):
    data = await svc.list(
        page=page, page_size=page_size, search=search,
        status=status, assessment_type=assessment_type,
        sort_by=sort_by, sort_order=sort_order,
    )
    return SuccessResponse(data=data)


@router.get("/all-active", response_model=SuccessResponse[List[AssessmentListResponse]])
async def list_all_active(
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    data = await svc.list_all_active()
    return SuccessResponse(data=data)


@router.post("", response_model=SuccessResponse[AssessmentResponse], status_code=201)
async def create_assessment(
    body: AssessmentCreate,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.create(body, by=current_user.uuid)
        return SuccessResponse(data=data, message="Assessment created")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Single assessment ─────────────────────────────────────────────────────────

@router.get("/{uuid}", response_model=SuccessResponse[AssessmentResponse])
async def get_assessment(
    uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.get(uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{uuid}", response_model=SuccessResponse[AssessmentResponse])
async def update_assessment(
    uuid: str,
    body: AssessmentUpdate,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.update(uuid, body, by=current_user.uuid)
        return SuccessResponse(data=data, message="Assessment updated")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{uuid}", response_model=SuccessResponse[None])
async def delete_assessment(
    uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        await svc.delete(uuid, by=current_user.uuid)
        return SuccessResponse(data=None, message="Assessment deleted")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{uuid}/activate", response_model=SuccessResponse[AssessmentResponse])
async def activate_assessment(
    uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.activate(uuid, by=current_user.uuid)
        return SuccessResponse(data=data, message="Assessment activated")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{uuid}/archive", response_model=SuccessResponse[AssessmentResponse])
async def archive_assessment(
    uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.archive(uuid, by=current_user.uuid)
        return SuccessResponse(data=data, message="Assessment archived")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Schedule ──────────────────────────────────────────────────────────────────

@router.get("/{uuid}/schedule", response_model=SuccessResponse[Optional[AssessmentScheduleResponse]])
async def get_schedule(
    uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.get_schedule(uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{uuid}/schedule", response_model=SuccessResponse[AssessmentScheduleResponse])
async def upsert_schedule(
    uuid: str,
    body: AssessmentScheduleUpsert,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.upsert_schedule(uuid, body, by=current_user.uuid)
        return SuccessResponse(data=data, message="Schedule saved")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Participants ──────────────────────────────────────────────────────────────

@router.get("/{uuid}/participants", response_model=SuccessResponse[AssessmentParticipantPage])
async def list_participants(
    uuid: str,
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    assignment_status: Optional[str] = Query(default=None),
    result_status: Optional[str] = Query(default=None),
    sort_by: str = Query(default="assigned_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.list_participants(
            uuid,
            page=page, page_size=page_size,
            search=search,
            assignment_status=assignment_status,
            result_status=result_status,
            sort_by=sort_by, sort_order=sort_order,
        )
        return SuccessResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{uuid}/participants", response_model=SuccessResponse[AssessmentParticipantResponse], status_code=201)
async def add_participant(
    uuid: str,
    body: AssessmentParticipantCreate,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.add_participant(uuid, body, by=current_user.uuid)
        return SuccessResponse(data=data, message="Participant assigned")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{uuid}/participants/bulk-assign", response_model=SuccessResponse[BulkAssignResult])
async def bulk_assign_participants(
    uuid: str,
    body: AssessmentParticipantBulkAssign,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.bulk_assign_participants(uuid, body, by=current_user.uuid)
        return SuccessResponse(data=data, message=f"Bulk assign complete: {data.assigned} assigned, {data.skipped} skipped")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{uuid}/participants/{participant_uuid}", response_model=SuccessResponse[AssessmentParticipantResponse])
async def update_participant(
    uuid: str,
    participant_uuid: str,
    body: AssessmentParticipantUpdate,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.update_participant(uuid, participant_uuid, body, by=current_user.uuid)
        return SuccessResponse(data=data, message="Participant updated")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{uuid}/participants/{participant_uuid}", response_model=SuccessResponse[None])
async def remove_participant(
    uuid: str,
    participant_uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        await svc.remove_participant(uuid, participant_uuid, by=current_user.uuid)
        return SuccessResponse(data=None, message="Participant removed")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Progress ──────────────────────────────────────────────────────────────────

@router.get("/{uuid}/progress", response_model=SuccessResponse[AssessmentProgressSummary])
async def get_progress_summary(
    uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.get_progress_summary(uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{uuid}/progress/participants", response_model=SuccessResponse[AssessmentParticipantPage])
async def get_progress_participants(
    uuid: str,
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    assignment_status: Optional[str] = Query(default=None),
    result_status: Optional[str] = Query(default=None),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.list_participants(
            uuid,
            page=page, page_size=page_size,
            search=search,
            assignment_status=assignment_status,
            result_status=result_status,
        )
        return SuccessResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Attempts ──────────────────────────────────────────────────────────────────

@router.get("/participants/{participant_uuid}/attempts", response_model=SuccessResponse[List[AssessmentAttemptResponse]])
async def list_attempts(
    participant_uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.list_attempts(participant_uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/attempts/{attempt_uuid}", response_model=SuccessResponse[AssessmentAttemptResponse])
async def get_attempt(
    attempt_uuid: str,
    current_user: CurrentUser,
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.get_attempt(attempt_uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
