"""Organization management endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationListResponse,
    OrganizationUpdate,
)
from app.services.organization import OrganizationService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


@router.get(
    "",
    summary="List organizations (paginated)",
    dependencies=[Depends(check_permissions(["organizations.view"]))],
)
async def list_organizations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    items, total = await service.list_organizations(
        page=page, page_size=page_size, search=search, status=status
    )
    resp = PaginatedResponse[OrganizationListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/{uuid}",
    summary="Get organization by UUID",
    dependencies=[Depends(check_permissions(["organizations.view"]))],
)
async def get_organization(uuid: str, db: AsyncSession = Depends(get_db)):
    service = OrganizationService(db)
    org = await service.get_organization(uuid)
    if not org:
        return not_found_response("Organization")
    return success_response(data=org.model_dump())


@router.post(
    "",
    summary="Create organization",
    dependencies=[Depends(check_permissions(["organizations.create"]))],
)
async def create_organization(
    body: OrganizationCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    try:
        org = await service.create_organization(body, created_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=org.model_dump(), message="Organization created successfully")


@router.put(
    "/{uuid}",
    summary="Update organization",
    dependencies=[Depends(check_permissions(["organizations.edit"]))],
)
async def update_organization(
    uuid: str,
    body: OrganizationUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    org = await service.update_organization(uuid, body, updated_by_uuid=current_user.uuid)
    if not org:
        return not_found_response("Organization")
    return success_response(data=org.model_dump(), message="Organization updated successfully")


@router.delete(
    "/{uuid}",
    summary="Soft-delete organization",
    dependencies=[Depends(check_permissions(["organizations.delete"]))],
)
async def delete_organization(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = OrganizationService(db)
    ok = await service.delete_organization(uuid, deleted_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("Organization")
    return success_response(message="Organization deleted successfully")
