"""Pydantic v2 schemas for the Assessment module."""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import Field, field_validator

from app.schemas.common import BaseSchema

ASSESSMENT_TYPES = ["Training", "Evaluation", "Certification", "Practice"]
ASSESSMENT_STATUSES = ["draft", "active", "archived"]
ASSIGNMENT_STATUSES = ["Assigned", "In Progress", "Completed", "Passed", "Failed", "Expired", "Cancelled"]
RESULT_STATUSES = ["Pending", "Passed", "Failed"]
SCHEDULE_TYPES = ["Always Open", "Scheduled Window"]
SCHEDULE_STATUSES = ["Draft", "Active", "Archived"]
ATTEMPT_RESULT_STATUSES = ["Pending", "Passed", "Failed", "Abandoned"]


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
    schedule_type: str = Field(default="Always Open")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: str = Field(default="UTC", max_length=100)
    duration_override: Optional[int] = Field(default=None, ge=1)
    allow_late_start: bool = False
    grace_period_minutes: Optional[int] = Field(default=None, ge=0)
    schedule_status: str = Field(default="Draft")
    is_open: bool = False

    @field_validator("schedule_type")
    @classmethod
    def validate_schedule_type(cls, v: str) -> str:
        if v not in SCHEDULE_TYPES:
            raise ValueError(f"schedule_type must be one of {SCHEDULE_TYPES}")
        return v

    @field_validator("schedule_status")
    @classmethod
    def validate_schedule_status(cls, v: str) -> str:
        if v not in SCHEDULE_STATUSES:
            raise ValueError(f"schedule_status must be one of {SCHEDULE_STATUSES}")
        return v


class AssessmentScheduleResponse(BaseSchema):
    id: int
    uuid: str
    assessment_id: int
    schedule_type: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: str
    duration_override: Optional[int] = None
    allow_late_start: bool
    grace_period_minutes: Optional[int] = None
    schedule_status: str
    is_open: bool
    created_at: datetime
    updated_at: datetime


# ── Participant ───────────────────────────────────────────────────────────────

class AssessmentParticipantCreate(BaseSchema):
    user_id: int
    max_attempts_override: Optional[int] = Field(default=None, ge=1)
    remarks: Optional[str] = None


class AssessmentParticipantUpdate(BaseSchema):
    assignment_status: Optional[str] = None
    max_attempts_override: Optional[int] = Field(default=None, ge=1)
    result_status: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("assignment_status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ASSIGNMENT_STATUSES:
            raise ValueError(f"assignment_status must be one of {ASSIGNMENT_STATUSES}")
        return v


class AssessmentParticipantBulkAssign(BaseSchema):
    user_ids: List[int] = Field(min_length=1)
    max_attempts_override: Optional[int] = Field(default=None, ge=1)
    remarks: Optional[str] = None


class AssessmentParticipantResponse(BaseSchema):
    id: int
    uuid: str
    assessment_id: int
    user_id: Optional[int] = None
    assigned_by: Optional[str] = None
    assignment_status: str
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    attempt_count: int
    max_attempts_override: Optional[int] = None
    result_status: str
    remarks: Optional[str] = None
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AssessmentParticipantPage(BaseSchema):
    items: List[AssessmentParticipantResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class BulkAssignResult(BaseSchema):
    assigned: int
    skipped: int
    skipped_user_ids: List[int] = Field(default_factory=list)


# ── Attempt ───────────────────────────────────────────────────────────────────

class AssessmentAttemptResponse(BaseSchema):
    id: int
    uuid: str
    assessment_participant_id: int
    attempt_number: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    simulator_session_id: Optional[int] = None
    score: Optional[Decimal] = None
    result_status: str
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Progress summary ──────────────────────────────────────────────────────────

class AssessmentProgressSummary(BaseSchema):
    total_participants: int
    not_started: int
    in_progress: int
    completed: int
    passed: int
    failed: int
    expired: int
    cancelled: int
