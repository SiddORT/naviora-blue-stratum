"""Pydantic v2 schemas for the Maritime Master Data Hub."""
from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from app.schemas.common import BaseSchema

# ── Vessel ─────────────────────────────────────────────────────────────────

VESSEL_TYPES = [
    "Container Vessel", "Bulk Carrier", "Oil Tanker", "Chemical Tanker",
    "LNG Carrier", "Ferry", "Tug", "Fishing Vessel", "Naval Vessel",
    "Offshore Vessel", "Custom",
]

MANEUVERABILITY_RATINGS = ["Excellent", "Good", "Fair", "Poor"]


class VesselCreate(BaseSchema):
    vessel_name: str = Field(min_length=2, max_length=255)
    vessel_code: str = Field(min_length=2, max_length=50)
    vessel_type: str = Field(max_length=100)
    imo_category: Optional[str] = Field(default=None, max_length=100)
    length: Optional[float] = Field(default=None, ge=0)
    beam: Optional[float] = Field(default=None, ge=0)
    draft: Optional[float] = Field(default=None, ge=0)
    max_speed: Optional[float] = Field(default=None, ge=0)
    maneuverability_rating: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    status: str = Field(default="active")

    @field_validator("vessel_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class VesselUpdate(BaseSchema):
    vessel_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    vessel_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    vessel_type: Optional[str] = Field(default=None, max_length=100)
    imo_category: Optional[str] = Field(default=None, max_length=100)
    length: Optional[float] = Field(default=None, ge=0)
    beam: Optional[float] = Field(default=None, ge=0)
    draft: Optional[float] = Field(default=None, ge=0)
    max_speed: Optional[float] = Field(default=None, ge=0)
    maneuverability_rating: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("vessel_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class VesselResponse(BaseSchema):
    id: int
    uuid: str
    vessel_name: str
    vessel_code: str
    vessel_type: str
    imo_category: Optional[str] = None
    length: Optional[float] = None
    beam: Optional[float] = None
    draft: Optional[float] = None
    max_speed: Optional[float] = None
    maneuverability_rating: Optional[str] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class VesselListResponse(BaseSchema):
    id: int
    uuid: str
    vessel_name: str
    vessel_code: str
    vessel_type: str
    maneuverability_rating: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── Port ───────────────────────────────────────────────────────────────────

TRAFFIC_DENSITIES = ["Low", "Medium", "High", "Very High"]


class PortCreate(BaseSchema):
    port_name: str = Field(min_length=2, max_length=255)
    port_code: str = Field(min_length=2, max_length=50)
    country: str = Field(min_length=2, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    traffic_density: str = Field(default="Medium")
    description: Optional[str] = None
    status: str = Field(default="active")

    @field_validator("port_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class PortUpdate(BaseSchema):
    port_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    port_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    country: Optional[str] = Field(default=None, min_length=2, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    traffic_density: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("port_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class PortResponse(BaseSchema):
    id: int
    uuid: str
    port_name: str
    port_code: str
    country: str
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    traffic_density: str
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PortListResponse(BaseSchema):
    id: int
    uuid: str
    port_name: str
    port_code: str
    country: str
    city: Optional[str] = None
    traffic_density: str
    status: str
    is_active: bool
    updated_at: datetime


# ── WeatherCondition ───────────────────────────────────────────────────────

PRECIPITATION_LEVELS = ["None", "Light", "Moderate", "Heavy", "Extreme"]


class WeatherConditionCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=100)
    wind_speed: Optional[float] = Field(default=None, ge=0)
    precipitation_level: Optional[str] = Field(default=None, max_length=50)
    visibility_range: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    status: str = Field(default="active")


class WeatherConditionUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    wind_speed: Optional[float] = Field(default=None, ge=0)
    precipitation_level: Optional[str] = Field(default=None, max_length=50)
    visibility_range: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    status: Optional[str] = None


class WeatherConditionResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    wind_speed: Optional[float] = None
    precipitation_level: Optional[str] = None
    visibility_range: Optional[float] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class WeatherConditionListResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    wind_speed: Optional[float] = None
    precipitation_level: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── SeaState ───────────────────────────────────────────────────────────────

class SeaStateCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=100)
    wave_height_min: Optional[float] = Field(default=None, ge=0)
    wave_height_max: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    status: str = Field(default="active")


class SeaStateUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    wave_height_min: Optional[float] = Field(default=None, ge=0)
    wave_height_max: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    status: Optional[str] = None


class SeaStateResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    wave_height_min: Optional[float] = None
    wave_height_max: Optional[float] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SeaStateListResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    wave_height_min: Optional[float] = None
    wave_height_max: Optional[float] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── VisibilityCondition ────────────────────────────────────────────────────

class VisibilityConditionCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=100)
    visibility_distance: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    status: str = Field(default="active")


class VisibilityConditionUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    visibility_distance: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    status: Optional[str] = None


class VisibilityConditionResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    visibility_distance: Optional[float] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class VisibilityConditionListResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    visibility_distance: Optional[float] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── TimeOfDay ──────────────────────────────────────────────────────────────

class TimeOfDayCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None
    status: str = Field(default="active")


class TimeOfDayUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = None
    status: Optional[str] = None


class TimeOfDayResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TimeOfDayListResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── EnvironmentProfile ─────────────────────────────────────────────────────

class EnvironmentProfileCreate(BaseSchema):
    profile_name: str = Field(min_length=2, max_length=255)
    weather_condition_id: Optional[int] = None
    sea_state_id: Optional[int] = None
    visibility_condition_id: Optional[int] = None
    time_of_day_id: Optional[int] = None
    description: Optional[str] = None
    status: str = Field(default="active")


class EnvironmentProfileUpdate(BaseSchema):
    profile_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    weather_condition_id: Optional[int] = None
    sea_state_id: Optional[int] = None
    visibility_condition_id: Optional[int] = None
    time_of_day_id: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None


class EnvironmentProfileResponse(BaseSchema):
    id: int
    uuid: str
    profile_name: str
    weather_condition_id: Optional[int] = None
    sea_state_id: Optional[int] = None
    visibility_condition_id: Optional[int] = None
    time_of_day_id: Optional[int] = None
    weather_condition_name: Optional[str] = None
    sea_state_name: Optional[str] = None
    visibility_condition_name: Optional[str] = None
    time_of_day_name: Optional[str] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EnvironmentProfileListResponse(BaseSchema):
    id: int
    uuid: str
    profile_name: str
    weather_condition_name: Optional[str] = None
    sea_state_name: Optional[str] = None
    visibility_condition_name: Optional[str] = None
    time_of_day_name: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime
