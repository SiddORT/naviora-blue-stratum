"""Permissions endpoints — list and browse all permissions."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.repositories.role import PermissionRepository
from app.schemas.role import PermissionResponse
from app.utils.responses import not_found_response, success_response

router = APIRouter()


@router.get(
    "",
    summary="List all permissions (paginated)",
    dependencies=[Depends(check_permissions(["roles.view"]))],
)
async def list_permissions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    search: Optional[str] = Query(default=None),
    module: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    repo = PermissionRepository(db)
    items, total = await repo.get_all_paginated(
        page=page, page_size=page_size, search=search, module=module
    )
    perms = [
        PermissionResponse(
            id=p.id, uuid=p.uuid, name=p.name, slug=p.slug,
            module=p.module, action=p.action, description=p.description, is_active=p.is_active,
        )
        for p in items
    ]
    resp = PaginatedResponse[PermissionResponse](
        items=perms, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/modules",
    summary="List distinct permission modules",
    dependencies=[Depends(check_permissions(["roles.view"]))],
)
async def list_modules(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import distinct, select
    from app.models.permission import Permission
    result = await db.execute(
        select(distinct(Permission.module)).where(Permission.deleted_at.is_(None)).order_by(Permission.module)
    )
    modules = [row[0] for row in result.all()]
    return success_response(data=modules)


@router.get(
    "/{uuid}",
    summary="Get permission by UUID",
    dependencies=[Depends(check_permissions(["roles.view"]))],
)
async def get_permission(uuid: str, db: AsyncSession = Depends(get_db)):
    repo = PermissionRepository(db)
    perm = await repo.get_by_uuid(uuid)
    if not perm:
        return not_found_response("Permission")
    return success_response(data=PermissionResponse(
        id=perm.id, uuid=perm.uuid, name=perm.name, slug=perm.slug,
        module=perm.module, action=perm.action, description=perm.description, is_active=perm.is_active,
    ).model_dump())
