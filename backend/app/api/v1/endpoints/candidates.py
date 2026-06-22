"""Candidate management endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.candidate import CandidateCreate, CandidateListResponse, CandidateResponse, CandidateUpdate
from app.services.candidate import CandidateService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


@router.get(
    "",
    summary="List candidates (paginated)",
    dependencies=[Depends(check_permissions(["candidates.view"]))],
)
async def list_candidates(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    organization_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = CandidateService(db)
    items, total = await service.list_candidates(
        page=page, page_size=page_size,
        search=search, organization_id=organization_id, status=status,
    )
    resp = PaginatedResponse[CandidateListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/{uuid}",
    summary="Get candidate by UUID",
    dependencies=[Depends(check_permissions(["candidates.view"]))],
)
async def get_candidate(uuid: str, db: AsyncSession = Depends(get_db)):
    service = CandidateService(db)
    candidate = await service.get_candidate(uuid)
    if not candidate:
        return not_found_response("Candidate")
    return success_response(data=candidate.model_dump())


@router.post(
    "",
    summary="Create candidate",
    dependencies=[Depends(check_permissions(["candidates.create"]))],
)
async def create_candidate(
    body: CandidateCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = CandidateService(db)
    try:
        candidate = await service.create_candidate(body, created_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=candidate.model_dump(), message="Candidate created successfully")


@router.put(
    "/{uuid}",
    summary="Update candidate",
    dependencies=[Depends(check_permissions(["candidates.edit"]))],
)
async def update_candidate(
    uuid: str,
    body: CandidateUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = CandidateService(db)
    try:
        candidate = await service.update_candidate(uuid, body, updated_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    if not candidate:
        return not_found_response("Candidate")
    return success_response(data=candidate.model_dump(), message="Candidate updated successfully")


@router.delete(
    "/{uuid}",
    summary="Soft-delete candidate",
    dependencies=[Depends(check_permissions(["candidates.delete"]))],
)
async def delete_candidate(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = CandidateService(db)
    ok = await service.delete_candidate(uuid, deleted_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("Candidate")
    return success_response(message="Candidate deleted successfully")
