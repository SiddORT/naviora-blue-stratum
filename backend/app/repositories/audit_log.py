"""AuditLog repository — write-only, never updated."""
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        user_id: Optional[str],
        module: str,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            module=module,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        user_id: Optional[str] = None,
        module: Optional[str] = None,
        action: Optional[str] = None,
    ) -> tuple[list[AuditLog], int]:
        base_query = select(AuditLog)
        if user_id:
            base_query = base_query.where(AuditLog.user_id == user_id)
        if module:
            base_query = base_query.where(AuditLog.module == module)
        if action:
            base_query = base_query.where(AuditLog.action == action)

        total = (await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )).scalar_one()
        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base_query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)
        )).scalars().all()
        return list(rows), total
