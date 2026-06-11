"""SimulatorVendor repository."""
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulator_vendor import SimulatorVendor
from app.repositories.base import BaseRepository


class SimulatorVendorRepository(BaseRepository[SimulatorVendor]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(SimulatorVendor, db)

    async def get_by_code(self, code: str) -> Optional[SimulatorVendor]:
        query = select(SimulatorVendor).where(
            and_(SimulatorVendor.code == code, SimulatorVendor.deleted_at.is_(None))
        )
        return (await self.db.execute(query)).scalar_one_or_none()

    async def code_exists(self, code: str, exclude_id: Optional[int] = None) -> bool:
        query = select(func.count()).where(
            and_(SimulatorVendor.code == code, SimulatorVendor.deleted_at.is_(None))
        )
        if exclude_id:
            query = query.where(SimulatorVendor.id != exclude_id)
        return (await self.db.execute(query)).scalar_one() > 0

    async def name_exists(self, name: str, exclude_id: Optional[int] = None) -> bool:
        query = select(func.count()).where(
            and_(SimulatorVendor.name == name, SimulatorVendor.deleted_at.is_(None))
        )
        if exclude_id:
            query = query.where(SimulatorVendor.id != exclude_id)
        return (await self.db.execute(query)).scalar_one() > 0

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        integration_type: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[SimulatorVendor], int]:
        base = select(SimulatorVendor).where(SimulatorVendor.deleted_at.is_(None))

        if status:
            base = base.where(SimulatorVendor.status == status)
        if integration_type:
            base = base.where(SimulatorVendor.integration_type == integration_type)
        if search:
            pattern = f"%{search}%"
            base = base.where(
                or_(
                    SimulatorVendor.name.ilike(pattern),
                    SimulatorVendor.code.ilike(pattern),
                    SimulatorVendor.vendor_name.ilike(pattern),
                )
            )

        total = (await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )).scalar_one()

        col = getattr(SimulatorVendor, sort_by, SimulatorVendor.created_at)
        ordered = col.desc() if sort_order == "desc" else col.asc()
        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base.order_by(ordered).offset(offset).limit(page_size)
        )).scalars().all()

        return list(rows), total
