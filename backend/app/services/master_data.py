"""Services for all Maritime Master Data entities."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.environment_profile import EnvironmentProfile
from app.models.port import Port
from app.models.sea_state import SeaState
from app.models.time_of_day import TimeOfDay
from app.models.vessel import Vessel
from app.models.visibility_condition import VisibilityCondition
from app.models.weather_condition import WeatherCondition
from app.repositories.master_data import (
    EnvironmentProfileRepository,
    PortRepository,
    SeaStateRepository,
    TimeOfDayRepository,
    VesselRepository,
    VisibilityConditionRepository,
    WeatherConditionRepository,
)
from app.schemas.master_data import (
    EnvironmentProfileCreate,
    EnvironmentProfileListResponse,
    EnvironmentProfileResponse,
    EnvironmentProfileUpdate,
    PortCreate,
    PortListResponse,
    PortResponse,
    PortUpdate,
    SeaStateCreate,
    SeaStateListResponse,
    SeaStateResponse,
    SeaStateUpdate,
    TimeOfDayCreate,
    TimeOfDayListResponse,
    TimeOfDayResponse,
    TimeOfDayUpdate,
    VesselCreate,
    VesselListResponse,
    VesselResponse,
    VesselUpdate,
    VisibilityConditionCreate,
    VisibilityConditionListResponse,
    VisibilityConditionResponse,
    VisibilityConditionUpdate,
    WeatherConditionCreate,
    WeatherConditionListResponse,
    WeatherConditionResponse,
    WeatherConditionUpdate,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)

_MODULE = "master_data"


# ── Helpers ────────────────────────────────────────────────────────────────

def _f(v) -> Optional[float]:
    """Convert Decimal/None to float/None for Pydantic."""
    return float(v) if v is not None else None


# ── Vessel ─────────────────────────────────────────────────────────────────

def _vessel_response(v: Vessel) -> VesselResponse:
    return VesselResponse(
        id=v.id, uuid=v.uuid,
        vessel_name=v.vessel_name, vessel_code=v.vessel_code, vessel_type=v.vessel_type,
        imo_category=v.imo_category, length=_f(v.length), beam=_f(v.beam),
        draft=_f(v.draft), max_speed=_f(v.max_speed),
        maneuverability_rating=v.maneuverability_rating, description=v.description,
        status=v.status, is_active=v.is_active,
        created_at=v.created_at, updated_at=v.updated_at,
    )


def _vessel_list(v: Vessel) -> VesselListResponse:
    return VesselListResponse(
        id=v.id, uuid=v.uuid, vessel_name=v.vessel_name, vessel_code=v.vessel_code,
        vessel_type=v.vessel_type, maneuverability_rating=v.maneuverability_rating,
        status=v.status, is_active=v.is_active, updated_at=v.updated_at,
    )


class VesselService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = VesselRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, vessel_type, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, vessel_type, status, sort_by, sort_order)
        return [_vessel_list(v) for v in items], total

    async def get(self, uuid: str) -> Optional[VesselResponse]:
        v = await self.repo.get_by_uuid(uuid)
        return _vessel_response(v) if v else None

    async def create(self, data: VesselCreate, by: Optional[str] = None) -> VesselResponse:
        if await self.repo.code_exists(data.vessel_code):
            raise ValueError(f"Vessel code '{data.vessel_code}' already exists")
        v = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="vessel", resource_id=v.uuid,
                             new_values={"vessel_name": v.vessel_name, "vessel_code": v.vessel_code})
        return _vessel_response(v)

    async def update(self, uuid: str, data: VesselUpdate, by: Optional[str] = None) -> Optional[VesselResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "vessel_code" in upd and await self.repo.code_exists(upd["vessel_code"], exclude_uuid=uuid):
            raise ValueError(f"Vessel code '{upd['vessel_code']}' already exists")
        upd["updated_by"] = by
        v = await self.repo.update(v, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="vessel", resource_id=uuid, new_values=upd)
        return _vessel_response(v)

    async def delete(self, uuid: str, by: str) -> bool:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return False
        await self.repo.soft_delete(v, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="vessel", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[VesselResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        v = await self.repo.activate(v, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="vessel", resource_id=uuid)
        return _vessel_response(v)

    async def deactivate(self, uuid: str, by: str) -> Optional[VesselResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        v = await self.repo.deactivate(v, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="vessel", resource_id=uuid)
        return _vessel_response(v)


# ── Port ───────────────────────────────────────────────────────────────────

def _port_response(p: Port) -> PortResponse:
    return PortResponse(
        id=p.id, uuid=p.uuid, port_name=p.port_name, port_code=p.port_code,
        country=p.country, city=p.city, latitude=_f(p.latitude), longitude=_f(p.longitude),
        traffic_density=p.traffic_density, description=p.description,
        status=p.status, is_active=p.is_active, created_at=p.created_at, updated_at=p.updated_at,
    )


def _port_list(p: Port) -> PortListResponse:
    return PortListResponse(
        id=p.id, uuid=p.uuid, port_name=p.port_name, port_code=p.port_code,
        country=p.country, city=p.city, traffic_density=p.traffic_density,
        status=p.status, is_active=p.is_active, updated_at=p.updated_at,
    )


class PortService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = PortRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, country, traffic_density, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, country, traffic_density, status, sort_by, sort_order)
        return [_port_list(p) for p in items], total

    async def get(self, uuid: str) -> Optional[PortResponse]:
        p = await self.repo.get_by_uuid(uuid)
        return _port_response(p) if p else None

    async def create(self, data: PortCreate, by: Optional[str] = None) -> PortResponse:
        if await self.repo.code_exists(data.port_code):
            raise ValueError(f"Port code '{data.port_code}' already exists")
        p = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="port", resource_id=p.uuid,
                             new_values={"port_name": p.port_name, "port_code": p.port_code})
        return _port_response(p)

    async def update(self, uuid: str, data: PortUpdate, by: Optional[str] = None) -> Optional[PortResponse]:
        p = await self.repo.get_by_uuid(uuid)
        if not p:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "port_code" in upd and await self.repo.code_exists(upd["port_code"], exclude_uuid=uuid):
            raise ValueError(f"Port code '{upd['port_code']}' already exists")
        upd["updated_by"] = by
        p = await self.repo.update(p, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="port", resource_id=uuid, new_values=upd)
        return _port_response(p)

    async def delete(self, uuid: str, by: str) -> bool:
        p = await self.repo.get_by_uuid(uuid)
        if not p:
            return False
        await self.repo.soft_delete(p, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="port", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[PortResponse]:
        p = await self.repo.get_by_uuid(uuid)
        if not p:
            return None
        p = await self.repo.activate(p, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="port", resource_id=uuid)
        return _port_response(p)

    async def deactivate(self, uuid: str, by: str) -> Optional[PortResponse]:
        p = await self.repo.get_by_uuid(uuid)
        if not p:
            return None
        p = await self.repo.deactivate(p, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="port", resource_id=uuid)
        return _port_response(p)


# ── WeatherCondition ───────────────────────────────────────────────────────

def _wc_response(w: WeatherCondition) -> WeatherConditionResponse:
    return WeatherConditionResponse(
        id=w.id, uuid=w.uuid, name=w.name, wind_speed=_f(w.wind_speed),
        precipitation_level=w.precipitation_level, visibility_range=_f(w.visibility_range),
        description=w.description, status=w.status, is_active=w.is_active,
        created_at=w.created_at, updated_at=w.updated_at,
    )


def _wc_list(w: WeatherCondition) -> WeatherConditionListResponse:
    return WeatherConditionListResponse(
        id=w.id, uuid=w.uuid, name=w.name, wind_speed=_f(w.wind_speed),
        precipitation_level=w.precipitation_level, status=w.status,
        is_active=w.is_active, updated_at=w.updated_at,
    )


class WeatherConditionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = WeatherConditionRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, sort_by, sort_order)
        return [_wc_list(w) for w in items], total

    async def list_all_active(self):
        items = await self.repo.get_all_active()
        return [_wc_list(w) for w in items]

    async def get(self, uuid: str) -> Optional[WeatherConditionResponse]:
        w = await self.repo.get_by_uuid(uuid)
        return _wc_response(w) if w else None

    async def create(self, data: WeatherConditionCreate, by: Optional[str] = None) -> WeatherConditionResponse:
        if await self.repo.name_exists(data.name):
            raise ValueError(f"Weather condition '{data.name}' already exists")
        w = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="weather_condition", resource_id=w.uuid, new_values={"name": w.name})
        return _wc_response(w)

    async def update(self, uuid: str, data: WeatherConditionUpdate, by: Optional[str] = None) -> Optional[WeatherConditionResponse]:
        w = await self.repo.get_by_uuid(uuid)
        if not w:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "name" in upd and await self.repo.name_exists(upd["name"], exclude_uuid=uuid):
            raise ValueError(f"Weather condition '{upd['name']}' already exists")
        upd["updated_by"] = by
        w = await self.repo.update(w, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="weather_condition", resource_id=uuid, new_values=upd)
        return _wc_response(w)

    async def delete(self, uuid: str, by: str) -> bool:
        w = await self.repo.get_by_uuid(uuid)
        if not w:
            return False
        await self.repo.soft_delete(w, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="weather_condition", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[WeatherConditionResponse]:
        w = await self.repo.get_by_uuid(uuid)
        if not w:
            return None
        w = await self.repo.activate(w, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="weather_condition", resource_id=uuid)
        return _wc_response(w)

    async def deactivate(self, uuid: str, by: str) -> Optional[WeatherConditionResponse]:
        w = await self.repo.get_by_uuid(uuid)
        if not w:
            return None
        w = await self.repo.deactivate(w, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="weather_condition", resource_id=uuid)
        return _wc_response(w)


# ── SeaState ───────────────────────────────────────────────────────────────

def _ss_response(s: SeaState) -> SeaStateResponse:
    return SeaStateResponse(
        id=s.id, uuid=s.uuid, name=s.name,
        wave_height_min=_f(s.wave_height_min), wave_height_max=_f(s.wave_height_max),
        description=s.description, status=s.status, is_active=s.is_active,
        created_at=s.created_at, updated_at=s.updated_at,
    )


def _ss_list(s: SeaState) -> SeaStateListResponse:
    return SeaStateListResponse(
        id=s.id, uuid=s.uuid, name=s.name,
        wave_height_min=_f(s.wave_height_min), wave_height_max=_f(s.wave_height_max),
        status=s.status, is_active=s.is_active, updated_at=s.updated_at,
    )


class SeaStateService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SeaStateRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, sort_by, sort_order)
        return [_ss_list(s) for s in items], total

    async def list_all_active(self):
        items = await self.repo.get_all_active()
        return [_ss_list(s) for s in items]

    async def get(self, uuid: str) -> Optional[SeaStateResponse]:
        s = await self.repo.get_by_uuid(uuid)
        return _ss_response(s) if s else None

    async def create(self, data: SeaStateCreate, by: Optional[str] = None) -> SeaStateResponse:
        if await self.repo.name_exists(data.name):
            raise ValueError(f"Sea state '{data.name}' already exists")
        s = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="sea_state", resource_id=s.uuid, new_values={"name": s.name})
        return _ss_response(s)

    async def update(self, uuid: str, data: SeaStateUpdate, by: Optional[str] = None) -> Optional[SeaStateResponse]:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "name" in upd and await self.repo.name_exists(upd["name"], exclude_uuid=uuid):
            raise ValueError(f"Sea state '{upd['name']}' already exists")
        upd["updated_by"] = by
        s = await self.repo.update(s, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="sea_state", resource_id=uuid, new_values=upd)
        return _ss_response(s)

    async def delete(self, uuid: str, by: str) -> bool:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return False
        await self.repo.soft_delete(s, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="sea_state", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[SeaStateResponse]:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return None
        s = await self.repo.activate(s, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="sea_state", resource_id=uuid)
        return _ss_response(s)

    async def deactivate(self, uuid: str, by: str) -> Optional[SeaStateResponse]:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return None
        s = await self.repo.deactivate(s, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="sea_state", resource_id=uuid)
        return _ss_response(s)


# ── VisibilityCondition ────────────────────────────────────────────────────

def _vc_response(v: VisibilityCondition) -> VisibilityConditionResponse:
    return VisibilityConditionResponse(
        id=v.id, uuid=v.uuid, name=v.name,
        visibility_distance=_f(v.visibility_distance),
        description=v.description, status=v.status, is_active=v.is_active,
        created_at=v.created_at, updated_at=v.updated_at,
    )


def _vc_list(v: VisibilityCondition) -> VisibilityConditionListResponse:
    return VisibilityConditionListResponse(
        id=v.id, uuid=v.uuid, name=v.name,
        visibility_distance=_f(v.visibility_distance),
        status=v.status, is_active=v.is_active, updated_at=v.updated_at,
    )


class VisibilityConditionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = VisibilityConditionRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, sort_by, sort_order)
        return [_vc_list(v) for v in items], total

    async def list_all_active(self):
        items = await self.repo.get_all_active()
        return [_vc_list(v) for v in items]

    async def get(self, uuid: str) -> Optional[VisibilityConditionResponse]:
        v = await self.repo.get_by_uuid(uuid)
        return _vc_response(v) if v else None

    async def create(self, data: VisibilityConditionCreate, by: Optional[str] = None) -> VisibilityConditionResponse:
        if await self.repo.name_exists(data.name):
            raise ValueError(f"Visibility condition '{data.name}' already exists")
        v = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="visibility_condition", resource_id=v.uuid, new_values={"name": v.name})
        return _vc_response(v)

    async def update(self, uuid: str, data: VisibilityConditionUpdate, by: Optional[str] = None) -> Optional[VisibilityConditionResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "name" in upd and await self.repo.name_exists(upd["name"], exclude_uuid=uuid):
            raise ValueError(f"Visibility condition '{upd['name']}' already exists")
        upd["updated_by"] = by
        v = await self.repo.update(v, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="visibility_condition", resource_id=uuid, new_values=upd)
        return _vc_response(v)

    async def delete(self, uuid: str, by: str) -> bool:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return False
        await self.repo.soft_delete(v, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="visibility_condition", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[VisibilityConditionResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        v = await self.repo.activate(v, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="visibility_condition", resource_id=uuid)
        return _vc_response(v)

    async def deactivate(self, uuid: str, by: str) -> Optional[VisibilityConditionResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        v = await self.repo.deactivate(v, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="visibility_condition", resource_id=uuid)
        return _vc_response(v)


# ── TimeOfDay ──────────────────────────────────────────────────────────────

def _tod_response(t: TimeOfDay) -> TimeOfDayResponse:
    return TimeOfDayResponse(
        id=t.id, uuid=t.uuid, name=t.name, description=t.description,
        status=t.status, is_active=t.is_active, created_at=t.created_at, updated_at=t.updated_at,
    )


def _tod_list(t: TimeOfDay) -> TimeOfDayListResponse:
    return TimeOfDayListResponse(
        id=t.id, uuid=t.uuid, name=t.name, description=t.description,
        status=t.status, is_active=t.is_active, updated_at=t.updated_at,
    )


class TimeOfDayService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = TimeOfDayRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, sort_by, sort_order)
        return [_tod_list(t) for t in items], total

    async def list_all_active(self):
        items = await self.repo.get_all_active()
        return [_tod_list(t) for t in items]

    async def get(self, uuid: str) -> Optional[TimeOfDayResponse]:
        t = await self.repo.get_by_uuid(uuid)
        return _tod_response(t) if t else None

    async def create(self, data: TimeOfDayCreate, by: Optional[str] = None) -> TimeOfDayResponse:
        if await self.repo.name_exists(data.name):
            raise ValueError(f"Time of day '{data.name}' already exists")
        t = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="time_of_day", resource_id=t.uuid, new_values={"name": t.name})
        return _tod_response(t)

    async def update(self, uuid: str, data: TimeOfDayUpdate, by: Optional[str] = None) -> Optional[TimeOfDayResponse]:
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "name" in upd and await self.repo.name_exists(upd["name"], exclude_uuid=uuid):
            raise ValueError(f"Time of day '{upd['name']}' already exists")
        upd["updated_by"] = by
        t = await self.repo.update(t, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="time_of_day", resource_id=uuid, new_values=upd)
        return _tod_response(t)

    async def delete(self, uuid: str, by: str) -> bool:
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return False
        await self.repo.soft_delete(t, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="time_of_day", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[TimeOfDayResponse]:
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return None
        t = await self.repo.activate(t, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="time_of_day", resource_id=uuid)
        return _tod_response(t)

    async def deactivate(self, uuid: str, by: str) -> Optional[TimeOfDayResponse]:
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return None
        t = await self.repo.deactivate(t, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="time_of_day", resource_id=uuid)
        return _tod_response(t)


# ── EnvironmentProfile ─────────────────────────────────────────────────────

def _ep_response(e: EnvironmentProfile) -> EnvironmentProfileResponse:
    return EnvironmentProfileResponse(
        id=e.id, uuid=e.uuid, profile_name=e.profile_name,
        weather_condition_id=e.weather_condition_id,
        sea_state_id=e.sea_state_id,
        visibility_condition_id=e.visibility_condition_id,
        time_of_day_id=e.time_of_day_id,
        weather_condition_name=e.weather_condition.name if e.weather_condition else None,
        sea_state_name=e.sea_state.name if e.sea_state else None,
        visibility_condition_name=e.visibility_condition.name if e.visibility_condition else None,
        time_of_day_name=e.time_of_day.name if e.time_of_day else None,
        description=e.description, status=e.status, is_active=e.is_active,
        created_at=e.created_at, updated_at=e.updated_at,
    )


def _ep_list(e: EnvironmentProfile) -> EnvironmentProfileListResponse:
    return EnvironmentProfileListResponse(
        id=e.id, uuid=e.uuid, profile_name=e.profile_name,
        weather_condition_name=e.weather_condition.name if e.weather_condition else None,
        sea_state_name=e.sea_state.name if e.sea_state else None,
        visibility_condition_name=e.visibility_condition.name if e.visibility_condition else None,
        time_of_day_name=e.time_of_day.name if e.time_of_day else None,
        status=e.status, is_active=e.is_active, updated_at=e.updated_at,
    )


class EnvironmentProfileService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = EnvironmentProfileRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, sort_by, sort_order)
        return [_ep_list(e) for e in items], total

    async def get(self, uuid: str) -> Optional[EnvironmentProfileResponse]:
        e = await self.repo.get_by_uuid(uuid)
        return _ep_response(e) if e else None

    async def create(self, data: EnvironmentProfileCreate, by: Optional[str] = None) -> EnvironmentProfileResponse:
        e = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        e = await self.repo.get_by_uuid(e.uuid)
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="environment_profile", resource_id=e.uuid, new_values={"profile_name": e.profile_name})
        return _ep_response(e)

    async def update(self, uuid: str, data: EnvironmentProfileUpdate, by: Optional[str] = None) -> Optional[EnvironmentProfileResponse]:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return None
        upd = data.model_dump(exclude_unset=True)
        upd["updated_by"] = by
        await self.repo.update(e, upd)
        e = await self.repo.get_by_uuid(uuid)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="environment_profile", resource_id=uuid, new_values=upd)
        return _ep_response(e)

    async def delete(self, uuid: str, by: str) -> bool:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return False
        await self.repo.soft_delete(e, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="environment_profile", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[EnvironmentProfileResponse]:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return None
        await self.repo.activate(e, by)
        e = await self.repo.get_by_uuid(uuid)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="environment_profile", resource_id=uuid)
        return _ep_response(e)

    async def deactivate(self, uuid: str, by: str) -> Optional[EnvironmentProfileResponse]:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return None
        await self.repo.deactivate(e, by)
        e = await self.repo.get_by_uuid(uuid)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="environment_profile", resource_id=uuid)
        return _ep_response(e)
