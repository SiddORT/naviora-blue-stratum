"""User Invitation endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.invitation import InvitationCreate, InvitationListResponse
from app.services.invitation import InvitationService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


@router.get(
    "",
    summary="List invitations (paginated)",
    dependencies=[Depends(check_permissions(["users.view"]))],
)
async def list_invitations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = InvitationService(db)
    items, total = await service.list_invitations(
        page=page, page_size=page_size, search=search, status=status
    )
    resp = PaginatedResponse[InvitationListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/{uuid}",
    summary="Get invitation by UUID",
    dependencies=[Depends(check_permissions(["users.view"]))],
)
async def get_invitation(uuid: str, db: AsyncSession = Depends(get_db)):
    service = InvitationService(db)
    inv = await service.get_invitation(uuid)
    if not inv:
        return not_found_response("Invitation")
    return success_response(data=inv.model_dump())


@router.post(
    "",
    summary="Create and send invitation",
    dependencies=[Depends(check_permissions(["users.create"]))],
)
async def create_invitation(
    body: InvitationCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = InvitationService(db)
    inv = await service.create_invitation(
        body,
        created_by_user_id=current_user.id,
        created_by_uuid=current_user.uuid,
    )
    return created_response(data=inv.model_dump(), message="Invitation created successfully")


@router.post(
    "/{uuid}/revoke",
    summary="Revoke a pending invitation",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def revoke_invitation(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = InvitationService(db)
    try:
        ok = await service.revoke_invitation(uuid, revoked_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    if not ok:
        return not_found_response("Invitation")
    return success_response(message="Invitation revoked")


@router.post(
    "/{uuid}/resend",
    summary="Resend a pending or expired invitation",
    dependencies=[Depends(check_permissions(["users.edit"]))],
)
async def resend_invitation(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = InvitationService(db)
    try:
        inv = await service.resend_invitation(uuid, resent_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    if not inv:
        return not_found_response("Invitation")
    return success_response(data=inv.model_dump(), message="Invitation resent")


@router.delete(
    "/{uuid}",
    summary="Delete invitation",
    dependencies=[Depends(check_permissions(["users.delete"]))],
)
async def delete_invitation(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = InvitationService(db)
    ok = await service.delete_invitation(uuid, deleted_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("Invitation")
    return success_response(message="Invitation deleted")
