"""SimulatorSession repository."""
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.simulator_session import SimulatorSession
from app.repositories.base import BaseRepository


class SimulatorSessionRepository(BaseRepository[SimulatorSession]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(SimulatorSession, db)

    async def get_by_uuid_with_vendor(self, uuid: str) -> Optional[SimulatorSession]:
        query = (
            select(SimulatorSession)
            .options(selectinload(SimulatorSession.vendor))
            .where(
                and_(SimulatorSession.uuid == uuid, SimulatorSession.deleted_at.is_(None))
            )
        )
        return (await self.db.execute(query)).scalar_one_or_none()

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        simulator_vendor_id: Optional[int] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[SimulatorSession], int]:
        base = (
            select(SimulatorSession)
            .options(selectinload(SimulatorSession.vendor))
            .where(SimulatorSession.deleted_at.is_(None))
        )

        if status:
            base = base.where(SimulatorSession.status == status)
        if simulator_vendor_id:
            base = base.where(SimulatorSession.simulator_vendor_id == simulator_vendor_id)
        if search:
            pattern = f"%{search}%"
            base = base.where(SimulatorSession.session_reference.ilike(pattern))

        total = (await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )).scalar_one()

        col = getattr(SimulatorSession, sort_by, SimulatorSession.created_at)
        ordered = col.desc() if sort_order == "desc" else col.asc()
        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base.order_by(ordered).offset(offset).limit(page_size)
        )).scalars().all()

        return list(rows), total
