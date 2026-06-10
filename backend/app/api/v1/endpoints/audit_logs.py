"""Audit log endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.repositories.audit_log import AuditLogRepository
from app.utils.responses import success_response

router = APIRouter()


@router.get(
    "",
    summary="List audit logs (paginated)",
    dependencies=[Depends(check_permissions(["audit_logs.view"]))],
)
async def list_audit_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: Optional[str] = Query(default=None),
    module: Optional[str] = Query(default=None),
    action: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    repo = AuditLogRepository(db)
    items, total = await repo.get_paginated(
        page=page, page_size=page_size,
        user_id=user_id, module=module, action=action,
    )
    data = [
        {
            "id": log.id,
            "user_id": log.user_id,
            "module": log.module,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log in items
    ]
    return success_response(data={
        "items": data,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": max(1, math.ceil(total / page_size)),
    })
