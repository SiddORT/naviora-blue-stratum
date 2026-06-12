"""Repositories for all Maritime Master Data entities."""
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.environment_profile import EnvironmentProfile
from app.models.port import Port
from app.models.sea_state import SeaState
from app.models.time_of_day import TimeOfDay
from app.models.vessel import Vessel
from app.models.visibility_condition import VisibilityCondition
from app.models.weather_condition import WeatherCondition
from app.repositories.base import BaseRepository

# ── Vessel ─────────────────────────────────────────────────────────────────


class VesselRepository(BaseRepository[Vessel]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Vessel, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(Vessel).where(
            and_(Vessel.vessel_code == code, Vessel.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(Vessel.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        vessel_type: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "vessel_name",
        sort_order: str = "asc",
    ) -> tuple[list[Vessel], int]:
        q = select(Vessel).where(Vessel.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(Vessel.vessel_name.ilike(term), Vessel.vessel_code.ilike(term)))
        if vessel_type:
            q = q.where(Vessel.vessel_type == vessel_type)
        if status:
            q = q.where(Vessel.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(Vessel, sort_by, Vessel.vessel_name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_all_active(self) -> list[Vessel]:
        q = select(Vessel).where(
            and_(Vessel.deleted_at.is_(None), Vessel.status == "active")
        ).order_by(Vessel.vessel_name)
        return list((await self.db.execute(q)).scalars().all())


# ── Port ───────────────────────────────────────────────────────────────────


class PortRepository(BaseRepository[Port]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Port, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(Port).where(and_(Port.port_code == code, Port.deleted_at.is_(None)))
        if exclude_uuid:
            q = q.where(Port.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        country: Optional[str] = None,
        traffic_density: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "port_name",
        sort_order: str = "asc",
    ) -> tuple[list[Port], int]:
        q = select(Port).where(Port.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(Port.port_name.ilike(term), Port.country.ilike(term), Port.city.ilike(term)))
        if country:
            q = q.where(Port.country.ilike(f"%{country}%"))
        if traffic_density:
            q = q.where(Port.traffic_density == traffic_density)
        if status:
            q = q.where(Port.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(Port, sort_by, Port.port_name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_all_active(self) -> list[Port]:
        q = select(Port).where(
            and_(Port.deleted_at.is_(None), Port.status == "active")
        ).order_by(Port.port_name)
        return list((await self.db.execute(q)).scalars().all())


# ── WeatherCondition ───────────────────────────────────────────────────────


class WeatherConditionRepository(BaseRepository[WeatherCondition]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WeatherCondition, db)

    async def name_exists(self, name: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(WeatherCondition).where(
            and_(WeatherCondition.name == name, WeatherCondition.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(WeatherCondition.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> tuple[list[WeatherCondition], int]:
        q = select(WeatherCondition).where(WeatherCondition.deleted_at.is_(None))
        if search:
            q = q.where(WeatherCondition.name.ilike(f"%{search}%"))
        if status:
            q = q.where(WeatherCondition.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(WeatherCondition, sort_by, WeatherCondition.name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_all_active(self) -> list[WeatherCondition]:
        q = select(WeatherCondition).where(
            and_(WeatherCondition.deleted_at.is_(None), WeatherCondition.status == "active")
        ).order_by(WeatherCondition.name)
        return list((await self.db.execute(q)).scalars().all())


# ── SeaState ───────────────────────────────────────────────────────────────


class SeaStateRepository(BaseRepository[SeaState]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(SeaState, db)

    async def name_exists(self, name: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(SeaState).where(and_(SeaState.name == name, SeaState.deleted_at.is_(None)))
        if exclude_uuid:
            q = q.where(SeaState.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> tuple[list[SeaState], int]:
        q = select(SeaState).where(SeaState.deleted_at.is_(None))
        if search:
            q = q.where(SeaState.name.ilike(f"%{search}%"))
        if status:
            q = q.where(SeaState.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(SeaState, sort_by, SeaState.name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_all_active(self) -> list[SeaState]:
        q = select(SeaState).where(
            and_(SeaState.deleted_at.is_(None), SeaState.status == "active")
        ).order_by(SeaState.name)
        return list((await self.db.execute(q)).scalars().all())


# ── VisibilityCondition ────────────────────────────────────────────────────


class VisibilityConditionRepository(BaseRepository[VisibilityCondition]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(VisibilityCondition, db)

    async def name_exists(self, name: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(VisibilityCondition).where(
            and_(VisibilityCondition.name == name, VisibilityCondition.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(VisibilityCondition.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> tuple[list[VisibilityCondition], int]:
        q = select(VisibilityCondition).where(VisibilityCondition.deleted_at.is_(None))
        if search:
            q = q.where(VisibilityCondition.name.ilike(f"%{search}%"))
        if status:
            q = q.where(VisibilityCondition.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(VisibilityCondition, sort_by, VisibilityCondition.name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_all_active(self) -> list[VisibilityCondition]:
        q = select(VisibilityCondition).where(
            and_(VisibilityCondition.deleted_at.is_(None), VisibilityCondition.status == "active")
        ).order_by(VisibilityCondition.name)
        return list((await self.db.execute(q)).scalars().all())


# ── TimeOfDay ──────────────────────────────────────────────────────────────


class TimeOfDayRepository(BaseRepository[TimeOfDay]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(TimeOfDay, db)

    async def name_exists(self, name: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(TimeOfDay).where(and_(TimeOfDay.name == name, TimeOfDay.deleted_at.is_(None)))
        if exclude_uuid:
            q = q.where(TimeOfDay.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> tuple[list[TimeOfDay], int]:
        q = select(TimeOfDay).where(TimeOfDay.deleted_at.is_(None))
        if search:
            q = q.where(TimeOfDay.name.ilike(f"%{search}%"))
        if status:
            q = q.where(TimeOfDay.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(TimeOfDay, sort_by, TimeOfDay.name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_all_active(self) -> list[TimeOfDay]:
        q = select(TimeOfDay).where(
            and_(TimeOfDay.deleted_at.is_(None), TimeOfDay.status == "active")
        ).order_by(TimeOfDay.name)
        return list((await self.db.execute(q)).scalars().all())


# ── EnvironmentProfile ─────────────────────────────────────────────────────


class EnvironmentProfileRepository(BaseRepository[EnvironmentProfile]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(EnvironmentProfile, db)

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "profile_name",
        sort_order: str = "asc",
    ) -> tuple[list[EnvironmentProfile], int]:
        base_q = select(EnvironmentProfile).where(EnvironmentProfile.deleted_at.is_(None))
        if search:
            base_q = base_q.where(EnvironmentProfile.profile_name.ilike(f"%{search}%"))
        if status:
            base_q = base_q.where(EnvironmentProfile.status == status)
        total = (await self.db.execute(select(func.count()).select_from(base_q.subquery()))).scalar_one()
        col = getattr(EnvironmentProfile, sort_by, EnvironmentProfile.profile_name)
        q = base_q.options(
            selectinload(EnvironmentProfile.weather_condition),
            selectinload(EnvironmentProfile.sea_state),
            selectinload(EnvironmentProfile.visibility_condition),
            selectinload(EnvironmentProfile.time_of_day),
        ).order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_by_uuid(self, uuid: str, include_deleted: bool = False) -> Optional[EnvironmentProfile]:
        q = select(EnvironmentProfile).where(EnvironmentProfile.uuid == uuid).options(
            selectinload(EnvironmentProfile.weather_condition),
            selectinload(EnvironmentProfile.sea_state),
            selectinload(EnvironmentProfile.visibility_condition),
            selectinload(EnvironmentProfile.time_of_day),
        )
        if not include_deleted:
            q = q.where(EnvironmentProfile.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_all_active(self) -> list[EnvironmentProfile]:
        q = select(EnvironmentProfile).where(
            and_(EnvironmentProfile.deleted_at.is_(None), EnvironmentProfile.status == "active")
        ).options(
            selectinload(EnvironmentProfile.weather_condition),
            selectinload(EnvironmentProfile.sea_state),
            selectinload(EnvironmentProfile.visibility_condition),
            selectinload(EnvironmentProfile.time_of_day),
        ).order_by(EnvironmentProfile.profile_name)
        return list((await self.db.execute(q)).scalars().all())
