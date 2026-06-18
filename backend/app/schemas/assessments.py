"""Pydantic v2 schemas for the Assessment module."""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import Field, field_validator

from app.schemas.common import BaseSchema

ASSESSMENT_TYPES = ["Training", "Evaluation", "Certification", "Practice"]
ASSESSMENT_STATUSES = ["draft", "active", "archived"]
PARTICIPANT_STATUSES = ["Assigned", "In Progress", "Completed", "Passed", "Failed", "Expired"]


# ── Exercise item within an assessment ───────────────────────────────────────

class AssessmentExerciseCreate(BaseSchema):
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


# ── Assessment ────────────────────────────────────────────────────────────────

class AssessmentCreate(BaseSchema):
    assessment_name: str = Field(min_length=2, max_length=255)
    assessment_code: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None
    instructions: Optional[str] = None
    assessment_type: str = Field(default="Training")
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[Decimal] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    randomize_exercise_order: bool = False
    randomize_variant_selection: bool = False
    certificate_eligible: bool = False
    certificate_validity_months: Optional[int] = Field(default=None, ge=1)
    exercises: List[AssessmentExerciseCreate] = Field(default_factory=list)

    @field_validator("assessment_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("assessment_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ASSESSMENT_TYPES:
            raise ValueError(f"assessment_type must be one of {ASSESSMENT_TYPES}")
        return v


class AssessmentUpdate(BaseSchema):
    assessment_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    assessment_code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = None
    instructions: Optional[str] = None
    assessment_type: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    passing_score: Optional[Decimal] = Field(default=None, ge=0, le=100)
    max_attempts: Optional[int] = Field(default=None, ge=1)
    randomize_exercise_order: Optional[bool] = None
    randomize_variant_selection: Optional[bool] = None
    certificate_eligible: Optional[bool] = None
    certificate_validity_months: Optional[int] = Field(default=None, ge=1)
    exercises: Optional[List[AssessmentExerciseCreate]] = None

    @field_validator("assessment_code")
    @classmethod
    def normalise_code(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v

    @field_validator("assessment_type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ASSESSMENT_TYPES:
            raise ValueError(f"assessment_type must be one of {ASSESSMENT_TYPES}")
        return v


class AssessmentListResponse(BaseSchema):
    id: int
    uuid: str
    assessment_name: str
    assessment_code: str
    assessment_type: str
    duration_minutes: Optional[int] = None
    passing_score: Optional[Decimal] = None
    max_attempts: Optional[int] = None
    certificate_eligible: bool
    status: str
    is_active: bool
    exercise_count: int = 0
    participant_count: int = 0
    created_at: datetime
    updated_at: datetime


class AssessmentResponse(BaseSchema):
    id: int
    uuid: str
    assessment_name: str
    assessment_code: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    assessment_type: str
    duration_minutes: Optional[int] = None
    passing_score: Optional[Decimal] = None
    max_attempts: Optional[int] = None
    randomize_exercise_order: bool
    randomize_variant_selection: bool
    certificate_eligible: bool
    certificate_validity_months: Optional[int] = None
    status: str
    is_active: bool
    exercises: List[AssessmentExerciseResponse] = Field(default_factory=list)
    exercise_count: int = 0
    participant_count: int = 0
    created_at: datetime
    updated_at: datetime


class AssessmentPage(BaseSchema):
    items: List[AssessmentListResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


# ── Schedule ──────────────────────────────────────────────────────────────────

class AssessmentScheduleUpsert(BaseSchema):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: str = Field(default="UTC", max_length=100)
    duration_override: Optional[int] = Field(default=None, ge=1)
    is_open: bool = False


class AssessmentScheduleResponse(BaseSchema):
    id: int
    uuid: str
    assessment_id: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: str
    duration_override: Optional[int] = None
    is_open: bool
    created_at: datetime
    updated_at: datetime


# ── Participant ───────────────────────────────────────────────────────────────

class AssessmentParticipantCreate(BaseSchema):
    user_id: Optional[int] = None
    assignment_status: str = Field(default="Assigned")


class AssessmentParticipantResponse(BaseSchema):
    id: int
    uuid: str
    assessment_id: int
    user_id: Optional[int] = None
    assignment_status: str
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    attempt_count: int
    created_at: datetime
    updated_at: datetime
