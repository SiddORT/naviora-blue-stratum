"""Pydantic v2 schemas for the Assessment Engine module."""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import Field, field_validator

from app.schemas.common import BaseSchema

# ── Constants ───────────────────────────────────────────────────────────────

ASSESSMENT_STATUSES = ["draft", "active", "archived"]
VARIANT_SELECTION_MODES = ["MANUAL", "RANDOM", "ALL_VARIANTS"]


# ── Assessment Category ──────────────────────────────────────────────────────

class AssessmentCategoryCreate(BaseSchema):
    category_name: str = Field(min_length=2, max_length=255)
    category_code: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None
    status: str = Field(default="active")

    @field_validator("category_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class AssessmentCategoryUpdate(BaseSchema):
    category_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    category_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("category_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class AssessmentCategoryResponse(BaseSchema):
    id: int
    uuid: str
    category_name: str
    category_code: str
    description: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AssessmentCategoryListResponse(BaseSchema):
    id: int
    uuid: str
    category_name: str
    category_code: str
    description: Optional[str] = None
    status: str
    is_active: bool
    updated_at: datetime


# ── Assessment Exercise (junction) ───────────────────────────────────────────

class AssessmentExerciseItem(BaseSchema):
    exercise_id: int
    sequence_number: int = Field(default=1, ge=1)
    weightage: float = Field(default=0.0, ge=0, le=100)
    mandatory: bool = True


class AssessmentExerciseResponse(BaseSchema):
    id: int
    exercise_id: int
    exercise_uuid: Optional[str] = None
    exercise_name: Optional[str] = None
    exercise_code: Optional[str] = None
    sequence_number: int
    weightage: float
    mandatory: bool


# ── Assessment Template ──────────────────────────────────────────────────────

class AssessmentTemplateCreate(BaseSchema):
    assessment_name: str = Field(min_length=2, max_length=255)
    assessment_code: str = Field(min_length=2, max_length=50)
    category_id: Optional[int] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    variant_selection_mode: str = Field(default="MANUAL")
    randomize_exercise_order: bool = False
    randomize_variant_selection: bool = False
    status: str = Field(default="draft")
    exercises: List[AssessmentExerciseItem] = Field(default_factory=list)

    @field_validator("assessment_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()


class AssessmentTemplateUpdate(BaseSchema):
    assessment_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    assessment_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    category_id: Optional[int] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[float] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    variant_selection_mode: Optional[str] = None
    randomize_exercise_order: Optional[bool] = None
    randomize_variant_selection: Optional[bool] = None
    status: Optional[str] = None
    exercises: Optional[List[AssessmentExerciseItem]] = None

    @field_validator("assessment_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class AssessmentTemplateResponse(BaseSchema):
    id: int
    uuid: str
    assessment_name: str
    assessment_code: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = None
    passing_score: Optional[float] = None
    max_attempts: Optional[int] = None
    variant_selection_mode: str
    randomize_exercise_order: bool
    randomize_variant_selection: bool
    status: str
    version_number: int
    exercises_count: int = 0
    exercises: List[AssessmentExerciseResponse] = Field(default_factory=list)
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AssessmentTemplateListResponse(BaseSchema):
    id: int
    uuid: str
    assessment_name: str
    assessment_code: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    passing_score: Optional[float] = None
    duration_minutes: Optional[int] = None
    status: str
    version_number: int
    exercises_count: int = 0
    is_active: bool
    updated_at: datetime


# ── Assessment Rule ──────────────────────────────────────────────────────────

class AssessmentRuleCreate(BaseSchema):
    assessment_id: int
    minimum_pass_score: Optional[float] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    assessment_duration: Optional[int] = Field(default=None, ge=1)
    allow_reassessment: bool = True
    reassessment_wait_days: Optional[int] = Field(default=None, ge=0)
    variant_selection_mode: str = Field(default="MANUAL")
    randomize_exercises: bool = False
    randomize_variants: bool = False
    auto_fail_on_collision: bool = False
    auto_fail_on_major_violation: bool = False


class AssessmentRuleUpdate(BaseSchema):
    minimum_pass_score: Optional[float] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    assessment_duration: Optional[int] = Field(default=None, ge=1)
    allow_reassessment: Optional[bool] = None
    reassessment_wait_days: Optional[int] = Field(default=None, ge=0)
    variant_selection_mode: Optional[str] = None
    randomize_exercises: Optional[bool] = None
    randomize_variants: Optional[bool] = None
    auto_fail_on_collision: Optional[bool] = None
    auto_fail_on_major_violation: Optional[bool] = None


class AssessmentRuleResponse(BaseSchema):
    id: int
    uuid: str
    assessment_id: int
    assessment_name: Optional[str] = None
    assessment_code: Optional[str] = None
    minimum_pass_score: Optional[float] = None
    max_attempts: Optional[int] = None
    assessment_duration: Optional[int] = None
    allow_reassessment: bool
    reassessment_wait_days: Optional[int] = None
    variant_selection_mode: str
    randomize_exercises: bool
    randomize_variants: bool
    auto_fail_on_collision: bool
    auto_fail_on_major_violation: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AssessmentRuleListResponse(BaseSchema):
    id: int
    uuid: str
    assessment_id: int
    assessment_name: Optional[str] = None
    assessment_code: Optional[str] = None
    minimum_pass_score: Optional[float] = None
    max_attempts: Optional[int] = None
    assessment_duration: Optional[int] = None
    variant_selection_mode: str
    allow_reassessment: bool
    is_active: bool
    updated_at: datetime


# ── Assessment Version ───────────────────────────────────────────────────────

class AssessmentVersionResponse(BaseSchema):
    id: int
    assessment_id: int
    version_number: int
    change_summary: Optional[str] = None
    created_at: datetime
    created_by: Optional[str] = None


# ── Clone ────────────────────────────────────────────────────────────────────

class AssessmentCloneRequest(BaseSchema):
    new_name: str = Field(min_length=2, max_length=255)
    new_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
