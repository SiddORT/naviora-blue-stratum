"""Maritime Master Data Hub — API endpoints for all 7 sub-modules."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.schemas.master_data import (
    EnvironmentProfileCreate,
    EnvironmentProfileUpdate,
    PortCreate,
    PortUpdate,
    SeaStateCreate,
    SeaStateUpdate,
    TimeOfDayCreate,
    TimeOfDayUpdate,
    VesselCreate,
    VesselUpdate,
    VisibilityConditionCreate,
    VisibilityConditionUpdate,
    WeatherConditionCreate,
    WeatherConditionUpdate,
)
from app.services.master_data import (
    EnvironmentProfileService,
    PortService,
    SeaStateService,
    TimeOfDayService,
    VesselService,
    VisibilityConditionService,
    WeatherConditionService,
)
from app.utils.responses import (
    created_response,
    error_response,
    not_found_response,
    success_response,
)

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _paginate(items, total, page, page_size):
    return {
        "items": [i.model_dump() for i in items],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": max(1, math.ceil(total / page_size)),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Vessel Library
# ─────────────────────────────────────────────────────────────────────────────

vessels = APIRouter(prefix="/vessels", tags=["Master Data — Vessels"])


@vessels.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_vessels(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    vessel_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("vessel_name"),
    sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    svc = VesselService(db)
    items, total = await svc.list(page, page_size, search, vessel_type, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@vessels.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_vessel(body: VesselCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    svc = VesselService(db)
    try:
        result = await svc.create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Vessel created successfully")


@vessels.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_vessels_all_active(db: AsyncSession = Depends(get_db)):
    items = await VesselService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@vessels.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_vessel(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await VesselService(db).get(uuid)
    if not result:
        return not_found_response("Vessel")
    return success_response(data=result.model_dump())


@vessels.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_vessel(uuid: str, body: VesselUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    svc = VesselService(db)
    try:
        result = await svc.update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Vessel")
    return success_response(data=result.model_dump(), message="Vessel updated successfully")


@vessels.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_vessel(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await VesselService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Vessel")
    return success_response(message="Vessel deleted successfully")


@vessels.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_vessel(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await VesselService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Vessel")
    return success_response(data=result.model_dump(), message="Vessel activated")


@vessels.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_vessel(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await VesselService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Vessel")
    return success_response(data=result.model_dump(), message="Vessel deactivated")


router.include_router(vessels)

# ─────────────────────────────────────────────────────────────────────────────
# Port Library
# ─────────────────────────────────────────────────────────────────────────────

ports = APIRouter(prefix="/ports", tags=["Master Data — Ports"])


@ports.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_ports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    traffic_density: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("port_name"),
    sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    svc = PortService(db)
    items, total = await svc.list(page, page_size, search, country, traffic_density, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@ports.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_port(body: PortCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    svc = PortService(db)
    try:
        result = await svc.create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Port created successfully")


@ports.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_ports_all_active(db: AsyncSession = Depends(get_db)):
    items = await PortService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@ports.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_port(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await PortService(db).get(uuid)
    if not result:
        return not_found_response("Port")
    return success_response(data=result.model_dump())


@ports.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_port(uuid: str, body: PortUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    svc = PortService(db)
    try:
        result = await svc.update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Port")
    return success_response(data=result.model_dump(), message="Port updated successfully")


@ports.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_port(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await PortService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Port")
    return success_response(message="Port deleted successfully")


@ports.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_port(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await PortService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Port")
    return success_response(data=result.model_dump(), message="Port activated")


@ports.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_port(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await PortService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Port")
    return success_response(data=result.model_dump(), message="Port deactivated")


router.include_router(ports)

# ─────────────────────────────────────────────────────────────────────────────
# Weather Conditions
# ─────────────────────────────────────────────────────────────────────────────

weather = APIRouter(prefix="/weather-conditions", tags=["Master Data — Weather"])


@weather.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_weather(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await WeatherConditionService(db).list(page, page_size, search, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@weather.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_weather_all_active(db: AsyncSession = Depends(get_db)):
    items = await WeatherConditionService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@weather.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_weather(body: WeatherConditionCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await WeatherConditionService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Weather condition created")


@weather.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_weather(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await WeatherConditionService(db).get(uuid)
    if not result:
        return not_found_response("Weather condition")
    return success_response(data=result.model_dump())


@weather.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_weather(uuid: str, body: WeatherConditionUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await WeatherConditionService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Weather condition")
    return success_response(data=result.model_dump(), message="Weather condition updated")


@weather.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_weather(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await WeatherConditionService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Weather condition")
    return success_response(message="Weather condition deleted")


@weather.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_weather(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await WeatherConditionService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Weather condition")
    return success_response(data=result.model_dump(), message="Activated")


@weather.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_weather(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await WeatherConditionService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Weather condition")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(weather)

# ─────────────────────────────────────────────────────────────────────────────
# Sea States
# ─────────────────────────────────────────────────────────────────────────────

sea_states = APIRouter(prefix="/sea-states", tags=["Master Data — Sea States"])


@sea_states.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_sea_states(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await SeaStateService(db).list(page, page_size, search, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@sea_states.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_sea_states_all_active(db: AsyncSession = Depends(get_db)):
    items = await SeaStateService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@sea_states.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_sea_state(body: SeaStateCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await SeaStateService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Sea state created")


@sea_states.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_sea_state(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await SeaStateService(db).get(uuid)
    if not result:
        return not_found_response("Sea state")
    return success_response(data=result.model_dump())


@sea_states.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_sea_state(uuid: str, body: SeaStateUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await SeaStateService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Sea state")
    return success_response(data=result.model_dump(), message="Sea state updated")


@sea_states.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_sea_state(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await SeaStateService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Sea state")
    return success_response(message="Sea state deleted")


@sea_states.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_sea_state(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await SeaStateService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Sea state")
    return success_response(data=result.model_dump(), message="Activated")


@sea_states.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_sea_state(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await SeaStateService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Sea state")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(sea_states)

# ─────────────────────────────────────────────────────────────────────────────
# Visibility Conditions
# ─────────────────────────────────────────────────────────────────────────────

visibility = APIRouter(prefix="/visibility-conditions", tags=["Master Data — Visibility"])


@visibility.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_visibility(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await VisibilityConditionService(db).list(page, page_size, search, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@visibility.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_visibility_all_active(db: AsyncSession = Depends(get_db)):
    items = await VisibilityConditionService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@visibility.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_visibility(body: VisibilityConditionCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await VisibilityConditionService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Visibility condition created")


@visibility.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_visibility(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await VisibilityConditionService(db).get(uuid)
    if not result:
        return not_found_response("Visibility condition")
    return success_response(data=result.model_dump())


@visibility.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_visibility(uuid: str, body: VisibilityConditionUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await VisibilityConditionService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Visibility condition")
    return success_response(data=result.model_dump(), message="Visibility condition updated")


@visibility.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_visibility(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await VisibilityConditionService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Visibility condition")
    return success_response(message="Visibility condition deleted")


@visibility.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_visibility(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await VisibilityConditionService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Visibility condition")
    return success_response(data=result.model_dump(), message="Activated")


@visibility.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_visibility(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await VisibilityConditionService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Visibility condition")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(visibility)

# ─────────────────────────────────────────────────────────────────────────────
# Time of Day
# ─────────────────────────────────────────────────────────────────────────────

time_of_day = APIRouter(prefix="/time-of-day", tags=["Master Data — Time of Day"])


@time_of_day.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_time_of_day(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await TimeOfDayService(db).list(page, page_size, search, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@time_of_day.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_time_of_day_all_active(db: AsyncSession = Depends(get_db)):
    items = await TimeOfDayService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@time_of_day.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_time_of_day(body: TimeOfDayCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await TimeOfDayService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Time of day created")


@time_of_day.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_time_of_day(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await TimeOfDayService(db).get(uuid)
    if not result:
        return not_found_response("Time of day")
    return success_response(data=result.model_dump())


@time_of_day.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_time_of_day(uuid: str, body: TimeOfDayUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await TimeOfDayService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Time of day")
    return success_response(data=result.model_dump(), message="Time of day updated")


@time_of_day.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_time_of_day(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await TimeOfDayService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Time of day")
    return success_response(message="Time of day deleted")


@time_of_day.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_time_of_day(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await TimeOfDayService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Time of day")
    return success_response(data=result.model_dump(), message="Activated")


@time_of_day.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_time_of_day(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await TimeOfDayService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Time of day")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(time_of_day)

# ─────────────────────────────────────────────────────────────────────────────
# Environment Profiles
# ─────────────────────────────────────────────────────────────────────────────

env_profiles = APIRouter(prefix="/environment-profiles", tags=["Master Data — Environment Profiles"])


@env_profiles.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_env_profiles(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("profile_name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await EnvironmentProfileService(db).list(page, page_size, search, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@env_profiles.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_env_profile(body: EnvironmentProfileCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await EnvironmentProfileService(db).create(body, by=current_user.uuid)
    return created_response(data=result.model_dump(), message="Environment profile created")


@env_profiles.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_env_profiles_all_active(db: AsyncSession = Depends(get_db)):
    items = await EnvironmentProfileService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@env_profiles.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_env_profile(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await EnvironmentProfileService(db).get(uuid)
    if not result:
        return not_found_response("Environment profile")
    return success_response(data=result.model_dump())


@env_profiles.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_env_profile(uuid: str, body: EnvironmentProfileUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await EnvironmentProfileService(db).update(uuid, body, by=current_user.uuid)
    if not result:
        return not_found_response("Environment profile")
    return success_response(data=result.model_dump(), message="Environment profile updated")


@env_profiles.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_env_profile(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await EnvironmentProfileService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Environment profile")
    return success_response(message="Environment profile deleted")


@env_profiles.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_env_profile(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await EnvironmentProfileService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Environment profile")
    return success_response(data=result.model_dump(), message="Activated")


@env_profiles.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_env_profile(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await EnvironmentProfileService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Environment profile")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(env_profiles)
