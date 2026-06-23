"""Pydantic schemas for Assessment Campaigns and Assignments (Org Portal)."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ── Campaign ──────────────────────────────────────────────────────────────────

class CampaignCreate(BaseModel):
    campaign_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    assessment_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timezone: str = "UTC"
    duration_override_minutes: Optional[int] = None
    passing_score_override: Optional[Decimal] = None
    max_attempts_override: Optional[int] = None
    randomize_exercises: bool = False
    randomize_variants: bool = False


class CampaignUpdate(BaseModel):
    campaign_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    assessment_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timezone: Optional[str] = None
    duration_override_minutes: Optional[int] = None
    passing_score_override: Optional[Decimal] = None
    max_attempts_override: Optional[int] = None
    randomize_exercises: Optional[bool] = None
    randomize_variants: Optional[bool] = None


class AssessmentSnippet(BaseModel):
    uuid: str
    assessment_name: str
    assessment_code: str
    duration_minutes: Optional[int] = None
    passing_score: Optional[Decimal] = None
    max_attempts: Optional[int] = None
    exercise_count: int = 0

    model_config = {"from_attributes": True}


class CampaignResponse(BaseModel):
    uuid: str
    campaign_name: str
    campaign_code: str
    description: Optional[str] = None
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timezone: str
    duration_override_minutes: Optional[int] = None
    passing_score_override: Optional[Decimal] = None
    max_attempts_override: Optional[int] = None
    randomize_exercises: bool
    randomize_variants: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    assessment: Optional[AssessmentSnippet] = None
    assignment_count: int = 0

    model_config = {"from_attributes": True}


class CampaignListItem(BaseModel):
    uuid: str
    campaign_name: str
    campaign_code: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    assignment_count: int = 0
    assessment_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Assignment ────────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    candidate_id: int
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class BulkAssignCreate(BaseModel):
    candidate_ids: list[int] = Field(..., min_length=1)
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class AssignmentUpdate(BaseModel):
    assignment_status: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class CandidateSnippet(BaseModel):
    uuid: str
    full_name: str
    email: str
    rank_or_designation: Optional[str] = None
    seafarer_id: Optional[str] = None

    model_config = {"from_attributes": True}


class ActivityLogItem(BaseModel):
    id: int
    activity_type: str
    activity_description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AssignmentResponse(BaseModel):
    uuid: str
    assignment_status: str
    result_status: str
    attempt_count: int
    final_score: Optional[Decimal] = None
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    candidate: Optional[CandidateSnippet] = None
    campaign_name: Optional[str] = None
    campaign_code: Optional[str] = None
    assessment_name: Optional[str] = None
    activity_logs: list[ActivityLogItem] = []

    model_config = {"from_attributes": True}


class AssignmentListItem(BaseModel):
    uuid: str
    assignment_status: str
    result_status: str
    attempt_count: int
    final_score: Optional[Decimal] = None
    due_date: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    rank_or_designation: Optional[str] = None
    campaign_name: Optional[str] = None
    assessment_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Progress ──────────────────────────────────────────────────────────────────

class ProgressRow(BaseModel):
    assignment_uuid: str
    candidate_name: str
    candidate_email: str
    rank_or_designation: Optional[str] = None
    assessment_name: Optional[str] = None
    campaign_name: str
    assignment_status: str
    result_status: str
    attempt_count: int
    final_score: Optional[Decimal] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    due_date: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Calendar ──────────────────────────────────────────────────────────────────

class CalendarEvent(BaseModel):
    id: str
    title: str
    campaign_code: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    assignment_count: int = 0
    assessment_name: Optional[str] = None

    model_config = {"from_attributes": True}
