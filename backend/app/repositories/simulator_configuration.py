"""SimulatorConfiguration repository."""
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.simulator_configuration import SimulatorConfiguration
from app.repositories.base import BaseRepository


class SimulatorConfigurationRepository(BaseRepository[SimulatorConfiguration]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(SimulatorConfiguration, db)

    async def get_by_uuid_with_vendor(self, uuid: str) -> Optional[SimulatorConfiguration]:
        query = (
            select(SimulatorConfiguration)
            .options(selectinload(SimulatorConfiguration.vendor))
            .where(
                and_(SimulatorConfiguration.uuid == uuid, SimulatorConfiguration.deleted_at.is_(None))
            )
        )
        return (await self.db.execute(query)).scalar_one_or_none()

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        authentication_type: Optional[str] = None,
        status: Optional[str] = None,
        simulator_vendor_id: Optional[int] = None,
    ) -> tuple[list[SimulatorConfiguration], int]:
        base = (
            select(SimulatorConfiguration)
            .options(selectinload(SimulatorConfiguration.vendor))
            .where(SimulatorConfiguration.deleted_at.is_(None))
        )

        if status:
            base = base.where(SimulatorConfiguration.status == status)
        if authentication_type:
            base = base.where(SimulatorConfiguration.authentication_type == authentication_type)
        if simulator_vendor_id:
            base = base.where(SimulatorConfiguration.simulator_vendor_id == simulator_vendor_id)
        if search:
            pattern = f"%{search}%"
            base = base.where(
                or_(
                    SimulatorConfiguration.configuration_name.ilike(pattern),
                    SimulatorConfiguration.base_url.ilike(pattern),
                )
            )

        total = (await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )).scalar_one()

        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base.order_by(SimulatorConfiguration.updated_at.desc()).offset(offset).limit(page_size)
        )).scalars().all()

        return list(rows), total
