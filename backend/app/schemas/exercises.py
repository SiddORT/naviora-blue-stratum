"""Pydantic v2 schemas for the Exercise Builder module."""
from datetime import datetime
from typing import List, Optional

from pydantic import Field, field_validator

from app.schemas.common import BaseSchema

# ── Constants ───────────────────────────────────────────────────────────────

DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]
GENERATION_MODES = ["MANUAL", "RANDOMIZED", "PARAMETERIZED"]
EXERCISE_STATUSES = ["draft", "active", "archived"]
SCENARIO_TYPES = [
    "Head-On", "Crossing", "Overtaking", "Restricted Visibility",
    "Traffic Separation Scheme", "Port Entry", "Port Exit", "Pilotage",
    "Multi Vessel Encounter", "Emergency Response", "Engine Failure",
    "Steering Failure", "Man Overboard",
]


# ── Exercise Category ────────────────────────────────────────────────────────

class ExerciseCategoryCreate(BaseSchema):
    category_name: str = Field(min_length=2, max_length=255)
    category_code: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None
    status: str = Field(default="active")

    @field_validator("category_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class ExerciseCategoryUpdate(BaseSchema):
    category_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    category_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("category_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class ExerciseCategoryResponse(BaseSchema):
    id: int
    uuid: str
    category_name: str
    category_code: str
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ExerciseCategoryListResponse(BaseSchema):
    id: int
    uuid: str
    category_name: str
    category_code: str
    description: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── Objective ────────────────────────────────────────────────────────────────

class ObjectiveCreate(BaseSchema):
    objective_name: str = Field(min_length=2, max_length=255)
    objective_code: str = Field(min_length=2, max_length=50)
    competency_area: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="active")

    @field_validator("objective_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class ObjectiveUpdate(BaseSchema):
    objective_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    objective_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    competency_area: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("objective_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class ObjectiveResponse(BaseSchema):
    id: int
    uuid: str
    objective_name: str
    objective_code: str
    competency_area: Optional[str] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ObjectiveListResponse(BaseSchema):
    id: int
    uuid: str
    objective_name: str
    objective_code: str
    competency_area: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── Scenario ─────────────────────────────────────────────────────────────────

class ScenarioCreate(BaseSchema):
    scenario_name: str = Field(min_length=2, max_length=255)
    scenario_code: str = Field(min_length=2, max_length=50)
    scenario_type: Optional[str] = Field(default=None, max_length=100)
    difficulty: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    status: str = Field(default="active")

    @field_validator("scenario_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class ScenarioUpdate(BaseSchema):
    scenario_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    scenario_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    scenario_type: Optional[str] = Field(default=None, max_length=100)
    difficulty: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("scenario_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class ScenarioResponse(BaseSchema):
    id: int
    uuid: str
    scenario_name: str
    scenario_code: str
    scenario_type: Optional[str] = None
    difficulty: Optional[str] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ScenarioListResponse(BaseSchema):
    id: int
    uuid: str
    scenario_name: str
    scenario_code: str
    scenario_type: Optional[str] = None
    difficulty: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── Exercise ─────────────────────────────────────────────────────────────────

class ExerciseCreate(BaseSchema):
    exercise_name: str = Field(min_length=2, max_length=255)
    exercise_code: str = Field(min_length=2, max_length=50)
    category_id: Optional[int] = None
    scenario_id: Optional[int] = None
    description: Optional[str] = None
    difficulty: Optional[str] = Field(default=None, max_length=50)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    estimated_duration: Optional[int] = Field(default=None, ge=1)
    generation_mode: str = Field(default="MANUAL")
    status: str = Field(default="draft")
    objective_ids: List[int] = Field(default_factory=list)

    @field_validator("exercise_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class ExerciseUpdate(BaseSchema):
    exercise_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    exercise_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    category_id: Optional[int] = None
    scenario_id: Optional[int] = None
    description: Optional[str] = None
    difficulty: Optional[str] = Field(default=None, max_length=50)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    estimated_duration: Optional[int] = Field(default=None, ge=1)
    generation_mode: Optional[str] = None
    status: Optional[str] = None
    objective_ids: Optional[List[int]] = None
    change_summary: Optional[str] = None

    @field_validator("exercise_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class ExerciseResponse(BaseSchema):
    id: int
    uuid: str
    exercise_name: str
    exercise_code: str
    category_id: Optional[int] = None
    scenario_id: Optional[int] = None
    category_name: Optional[str] = None
    scenario_name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    passing_score: Optional[float] = None
    max_attempts: Optional[int] = None
    estimated_duration: Optional[int] = None
    generation_mode: str
    status: str
    is_active: bool
    version_number: int
    variant_count: int = 0
    objective_ids: List[int] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ExerciseListResponse(BaseSchema):
    id: int
    uuid: str
    exercise_name: str
    exercise_code: str
    category_name: Optional[str] = None
    scenario_name: Optional[str] = None
    difficulty: Optional[str] = None
    status: str
    is_active: bool
    version_number: int
    variant_count: int = 0
    updated_at: datetime


# ── Exercise Variant ─────────────────────────────────────────────────────────

class ExerciseVariantCreate(BaseSchema):
    variant_name: str = Field(min_length=2, max_length=255)
    variant_code: str = Field(min_length=2, max_length=50)
    exercise_id: int
    port_id: Optional[int] = None
    environment_profile_id: Optional[int] = None
    primary_vessel_id: Optional[int] = None
    secondary_vessel_id: Optional[int] = None
    tertiary_vessel_id: Optional[int] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    description: Optional[str] = None
    status: str = Field(default="draft")

    @field_validator("variant_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class ExerciseVariantUpdate(BaseSchema):
    variant_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    variant_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    exercise_id: Optional[int] = None
    port_id: Optional[int] = None
    environment_profile_id: Optional[int] = None
    primary_vessel_id: Optional[int] = None
    secondary_vessel_id: Optional[int] = None
    tertiary_vessel_id: Optional[int] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("variant_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class ExerciseVariantResponse(BaseSchema):
    id: int
    uuid: str
    variant_name: str
    variant_code: str
    exercise_id: int
    exercise_name: Optional[str] = None
    port_id: Optional[int] = None
    environment_profile_id: Optional[int] = None
    primary_vessel_id: Optional[int] = None
    secondary_vessel_id: Optional[int] = None
    tertiary_vessel_id: Optional[int] = None
    port_name: Optional[str] = None
    environment_profile_name: Optional[str] = None
    primary_vessel_name: Optional[str] = None
    secondary_vessel_name: Optional[str] = None
    tertiary_vessel_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    passing_score: Optional[float] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ExerciseVariantListResponse(BaseSchema):
    id: int
    uuid: str
    variant_name: str
    variant_code: str
    exercise_id: int
    exercise_name: Optional[str] = None
    port_name: Optional[str] = None
    environment_profile_name: Optional[str] = None
    primary_vessel_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: str
    is_active: bool
    updated_at: datetime
