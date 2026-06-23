"""Organization Assignment endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.org_assignment import OrgAssignmentCreate, OrgAssignmentResponse, OrgAssignmentUpdate
from app.services.org_assignment import OrgAssignmentService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


@router.get(
    "",
    summary="List organization assignments (paginated)",
    dependencies=[Depends(check_permissions(["users.view"]))],
)
async def list_assignments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    user_id: Optional[int] = Query(default=None),
    organization_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = OrgAssignmentService(db)
    items, total = await service.list_assignments(
        page=page, page_size=page_size,
        user_id=user_id, organization_id=organization_id, search=search,
    )
    resp = PaginatedResponse[OrgAssignmentResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.post(
    "",
    summary="Create organization assignment",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def create_assignment(
    body: OrgAssignmentCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = OrgAssignmentService(db)
    try:
        a = await service.create_assignment(body, assigned_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=a.model_dump(), message="Assignment created successfully")


@router.put(
    "/{record_id}",
    summary="Update organization assignment",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def update_assignment(
    record_id: int,
    body: OrgAssignmentUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = OrgAssignmentService(db)
    a = await service.update_assignment(record_id, body, updated_by_uuid=current_user.uuid)
    if not a:
        return not_found_response("Assignment")
    return success_response(data=a.model_dump(), message="Assignment updated")


@router.delete(
    "/{record_id}",
    summary="Delete organization assignment",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def delete_assignment(
    record_id: int,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = OrgAssignmentService(db)
    ok = await service.delete_assignment(record_id, deleted_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("Assignment")
    return success_response(message="Assignment removed")
