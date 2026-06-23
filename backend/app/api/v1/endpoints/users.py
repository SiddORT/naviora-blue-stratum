"""User management endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.user import (
    UserCreate, UserListResponse, UserResponse, UserUpdate,
    UserRoleAssign, UserStatusUpdate, UserAdminResetPassword,
)
from app.services.user import UserService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


@router.get(
    "",
    summary="List users (paginated)",
    dependencies=[Depends(check_permissions(["users.view"]))],
)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    search: Optional[str] = Query(default=None),
    organization_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    user_type: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    items, total = await service.list_users(
        page=page, page_size=page_size,
        search=search, organization_id=organization_id,
        status=status, user_type=user_type,
    )
    resp = PaginatedResponse[UserListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/{uuid}",
    summary="Get user by UUID",
    dependencies=[Depends(check_permissions(["users.view"]))],
)
async def get_user(uuid: str, db: AsyncSession = Depends(get_db)):
    service = UserService(db)
    user = await service.get_user(uuid)
    if not user:
        return not_found_response("User")
    return success_response(data=user.model_dump())


@router.post(
    "",
    summary="Create user",
    dependencies=[Depends(check_permissions(["users.create"]))],
)
async def create_user(
    body: UserCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    try:
        user = await service.create_user(body, created_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=user.model_dump(), message="User created successfully")


@router.put(
    "/{uuid}",
    summary="Update user",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def update_user(
    uuid: str,
    body: UserUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.update_user(uuid, body, updated_by_uuid=current_user.uuid)
    if not user:
        return not_found_response("User")
    return success_response(data=user.model_dump(), message="User updated successfully")


@router.post(
    "/{uuid}/assign-roles",
    summary="Replace user's roles",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def assign_roles(
    uuid: str,
    body: UserRoleAssign,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.assign_roles(uuid, body, updated_by_uuid=current_user.uuid)
    if not user:
        return not_found_response("User")
    return success_response(data=user.model_dump(), message="Roles assigned successfully")


@router.post(
    "/{uuid}/set-status",
    summary="Set user status (active/inactive/suspended)",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def set_status(
    uuid: str,
    body: UserStatusUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.set_status(uuid, body, updated_by_uuid=current_user.uuid)
    if not user:
        return not_found_response("User")
    return success_response(data=user.model_dump(), message="User status updated")


@router.post(
    "/{uuid}/reset-password",
    summary="Admin-initiated password reset for a user",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def admin_reset_password(
    uuid: str,
    body: UserAdminResetPassword,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    ok = await service.admin_reset_password(uuid, body, updated_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("User")
    return success_response(message="Password reset successfully")


@router.delete(
    "/{uuid}",
    summary="Soft-delete user",
    dependencies=[Depends(check_permissions(["users.delete"]))],
)
async def delete_user(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = UserService(db)
    ok = await service.delete_user(uuid, deleted_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("User")
    return success_response(message="User deleted successfully")
