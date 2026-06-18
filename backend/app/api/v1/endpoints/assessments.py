"""Assessment module — API endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.schemas.assessments import (
    AssessmentCreate,
    AssessmentPage,
    AssessmentParticipantCreate,
    AssessmentParticipantResponse,
    AssessmentResponse,
    AssessmentScheduleResponse,
    AssessmentScheduleUpsert,
    AssessmentUpdate,
    AssessmentListResponse,
)
from app.schemas.common import SuccessResponse
from app.services.assessments import AssessmentService

router = APIRouter()


def _svc(db: AsyncSession = Depends(get_db)) -> AssessmentService:
    return AssessmentService(db)


# ── List + Create ─────────────────────────────────────────────────────────────

@router.get("", response_model=SuccessResponse[AssessmentPage])
async def list_assessments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    assessment_type: Optional[str] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    data = await svc.list(
        page=page, page_size=page_size, search=search,
        status=status, assessment_type=assessment_type,
        sort_by=sort_by, sort_order=sort_order,
    )
    return SuccessResponse(data=data)


@router.get("/all-active", response_model=SuccessResponse[list[AssessmentListResponse]])
async def list_all_active(
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    data = await svc.list_all_active()
    return SuccessResponse(data=data)


@router.post("", response_model=SuccessResponse[AssessmentResponse], status_code=201)
async def create_assessment(
    body: AssessmentCreate,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.create(body, by=current_user.get("uuid"))
        return SuccessResponse(data=data, message="Assessment created")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))


# ── Single assessment ─────────────────────────────────────────────────────────

@router.get("/{uuid}", response_model=SuccessResponse[AssessmentResponse])
async def get_assessment(
    uuid: str,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.get(uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{uuid}", response_model=SuccessResponse[AssessmentResponse])
async def update_assessment(
    uuid: str,
    body: AssessmentUpdate,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.update(uuid, body, by=current_user.get("uuid"))
        return SuccessResponse(data=data, message="Assessment updated")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{uuid}", response_model=SuccessResponse[None])
async def delete_assessment(
    uuid: str,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        await svc.delete(uuid, by=current_user.get("uuid"))
        return SuccessResponse(data=None, message="Assessment deleted")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{uuid}/activate", response_model=SuccessResponse[AssessmentResponse])
async def activate_assessment(
    uuid: str,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.activate(uuid, by=current_user.get("uuid"))
        return SuccessResponse(data=data, message="Assessment activated")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{uuid}/archive", response_model=SuccessResponse[AssessmentResponse])
async def archive_assessment(
    uuid: str,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.archive(uuid, by=current_user.get("uuid"))
        return SuccessResponse(data=data, message="Assessment archived")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


# ── Schedule ──────────────────────────────────────────────────────────────────

@router.get("/{uuid}/schedule", response_model=SuccessResponse[Optional[AssessmentScheduleResponse]])
async def get_schedule(
    uuid: str,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.get_schedule(uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{uuid}/schedule", response_model=SuccessResponse[AssessmentScheduleResponse])
async def upsert_schedule(
    uuid: str,
    body: AssessmentScheduleUpsert,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.upsert_schedule(uuid, body, by=current_user.get("uuid"))
        return SuccessResponse(data=data, message="Schedule saved")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


# ── Participants ──────────────────────────────────────────────────────────────

@router.get("/{uuid}/participants", response_model=SuccessResponse[list[AssessmentParticipantResponse]])
async def get_participants(
    uuid: str,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.get_participants(uuid)
        return SuccessResponse(data=data)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{uuid}/participants", response_model=SuccessResponse[AssessmentParticipantResponse], status_code=201)
async def add_participant(
    uuid: str,
    body: AssessmentParticipantCreate,
    current_user: dict = Depends(CurrentUser),
    svc: AssessmentService = Depends(_svc),
):
    try:
        data = await svc.add_participant(uuid, body, by=current_user.get("uuid"))
        return SuccessResponse(data=data, message="Participant added")
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
