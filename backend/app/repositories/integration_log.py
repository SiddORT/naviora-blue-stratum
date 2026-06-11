"""IntegrationLog repository."""
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.integration_log import IntegrationLog
from app.repositories.base import BaseRepository


class IntegrationLogRepository(BaseRepository[IntegrationLog]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(IntegrationLog, db)

    async def get_by_uuid_with_vendor(self, uuid: str) -> Optional[IntegrationLog]:
        query = (
            select(IntegrationLog)
            .options(selectinload(IntegrationLog.vendor))
            .where(IntegrationLog.uuid == uuid)
        )
        return (await self.db.execute(query)).scalar_one_or_none()

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        simulator_vendor_id: Optional[int] = None,
    ) -> tuple[list[IntegrationLog], int]:
        base = (
            select(IntegrationLog)
            .options(selectinload(IntegrationLog.vendor))
        )

        if status:
            base = base.where(IntegrationLog.status == status)
        if simulator_vendor_id:
            base = base.where(IntegrationLog.simulator_vendor_id == simulator_vendor_id)
        if search:
            pattern = f"%{search}%"
            base = base.where(
                or_(
                    IntegrationLog.request_type.ilike(pattern),
                    IntegrationLog.status.ilike(pattern),
                )
            )

        total = (await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )).scalar_one()

        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base.order_by(IntegrationLog.created_at.desc()).offset(offset).limit(page_size)
        )).scalars().all()

        return list(rows), total
