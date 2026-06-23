"""Roles and Permissions endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.role import RoleClone, RoleCreate, RoleListResponse, RoleUpdate
from app.services.role import RoleService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


@router.get(
    "",
    summary="List roles (paginated)",
    dependencies=[Depends(check_permissions(["roles.view"]))],
)
async def list_roles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = RoleService(db)
    items, total = await service.list_roles(page=page, page_size=page_size, search=search)
    resp = PaginatedResponse[RoleListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/permissions",
    summary="Get all available permissions",
    dependencies=[Depends(check_permissions(["roles.view"]))],
)
async def list_permissions(db: AsyncSession = Depends(get_db)):
    service = RoleService(db)
    perms = await service.get_all_permissions()
    return success_response(data=[p.model_dump() for p in perms])


@router.get(
    "/{uuid}",
    summary="Get role by UUID",
    dependencies=[Depends(check_permissions(["roles.view"]))],
)
async def get_role(uuid: str, db: AsyncSession = Depends(get_db)):
    service = RoleService(db)
    role = await service.get_role(uuid)
    if not role:
        return not_found_response("Role")
    return success_response(data=role.model_dump())


@router.post(
    "",
    summary="Create role",
    dependencies=[Depends(check_permissions(["roles.create"]))],
)
async def create_role(body: RoleCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = RoleService(db)
    try:
        role = await service.create_role(body, created_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=role.model_dump(), message="Role created successfully")


@router.post(
    "/{uuid}/clone",
    summary="Clone a role with its permissions",
    dependencies=[Depends(check_permissions(["roles.create"]))],
)
async def clone_role(
    uuid: str, body: RoleClone, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    service = RoleService(db)
    try:
        role = await service.clone_role(uuid, body, created_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=role.model_dump(), message="Role cloned successfully")


@router.put(
    "/{uuid}",
    summary="Update role",
    dependencies=[Depends(check_permissions(["roles.edit"]))],
)
async def update_role(
    uuid: str, body: RoleUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    service = RoleService(db)
    role = await service.update_role(uuid, body, updated_by_uuid=current_user.uuid)
    if not role:
        return not_found_response("Role")
    return success_response(data=role.model_dump(), message="Role updated successfully")


@router.delete(
    "/{uuid}",
    summary="Delete role",
    dependencies=[Depends(check_permissions(["roles.delete"]))],
)
async def delete_role(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = RoleService(db)
    try:
        ok = await service.delete_role(uuid, deleted_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    if not ok:
        return not_found_response("Role")
    return success_response(message="Role deleted successfully")
