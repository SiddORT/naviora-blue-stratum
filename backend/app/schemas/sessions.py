"""Pydantic schemas for Sprint 2.9 — Simulator Runtime."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Runtime Configuration ─────────────────────────────────────────────────────

class RuntimeConfigCreate(BaseModel):
    simulator_vendor_id: int
    config_name: str
    runtime_mode: str = "CLOUD_API"
    api_endpoint: Optional[str] = None
    executable_path: Optional[str] = None
    working_directory: Optional[str] = None
    launch_arguments: Optional[str] = None
    result_directory: Optional[str] = None
    auto_sync: bool = False
    is_default: bool = False
    notes: Optional[str] = None


class RuntimeConfigUpdate(BaseModel):
    config_name: Optional[str] = None
    runtime_mode: Optional[str] = None
    api_endpoint: Optional[str] = None
    executable_path: Optional[str] = None
    working_directory: Optional[str] = None
    launch_arguments: Optional[str] = None
    result_directory: Optional[str] = None
    auto_sync: Optional[bool] = None
    is_default: Optional[bool] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class RuntimeConfigResponse(BaseModel):
    id: int
    uuid: str
    simulator_vendor_id: int
    vendor_name: Optional[str] = None
    vendor_code: Optional[str] = None
    config_name: str
    runtime_mode: str
    api_endpoint: Optional[str] = None
    executable_path: Optional[str] = None
    working_directory: Optional[str] = None
    launch_arguments: Optional[str] = None
    result_directory: Optional[str] = None
    auto_sync: bool
    is_default: bool
    notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Simulator Session ──────────────────────────────────────────────────────────

class SessionCreateRequest(BaseModel):
    """Candidate or org-admin initiates a session from an assignment."""
    assignment_uuid: str
    runtime_mode: Optional[str] = None
    notes: Optional[str] = None


class ManualResultInput(BaseModel):
    result: str = Field(..., description="Pass | Fail")
    score: Optional[float] = None
    remarks: Optional[str] = None


class SessionListItem(BaseModel):
    uuid: str
    session_reference: str
    status: str
    runtime_mode: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    assessment_name: Optional[str] = None
    exercise_name: Optional[str] = None
    variant_name: Optional[str] = None
    vendor_name: Optional[str] = None
    campaign_name: Optional[str] = None
    organization_name: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime


class SessionLogItem(BaseModel):
    id: int
    log_level: str
    event_type: str
    event_message: Optional[str] = None
    payload: Optional[dict[str, Any]] = None
    created_at: datetime


class SessionDetail(BaseModel):
    uuid: str
    session_reference: str
    status: str
    runtime_mode: str
    result_received: bool
    launch_payload: Optional[dict[str, Any]] = None
    raw_result: Optional[dict[str, Any]] = None
    failure_reason: Optional[str] = None
    launched_by: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    # Related info
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    assessment_name: Optional[str] = None
    exercise_name: Optional[str] = None
    variant_name: Optional[str] = None
    vendor_name: Optional[str] = None
    campaign_name: Optional[str] = None
    organization_name: Optional[str] = None
    logs: list[SessionLogItem] = []


class SessionStats(BaseModel):
    total: int
    pending: int
    launching: int
    running: int
    completed: int
    failed: int
    cancelled: int
    timed_out: int
    sessions_today: int


# ── Desktop Agent ─────────────────────────────────────────────────────────────

class AgentResponse(BaseModel):
    uuid: str
    agent_name: str
    machine_name: str
    version: Optional[str] = None
    status: str
    ip_address: Optional[str] = None
    last_heartbeat: Optional[datetime] = None
    runtime_mode: str
    created_at: datetime
    updated_at: datetime


class AgentStatusUpdate(BaseModel):
    status: str


# ── Candidate Portal ──────────────────────────────────────────────────────────

class CandidateLoginRequest(BaseModel):
    email: str
    password: str


class CandidateAssignmentItem(BaseModel):
    uuid: str
    assignment_status: str
    result_status: str
    attempt_count: int
    final_score: Optional[float] = None
    due_date: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    campaign_name: Optional[str] = None
    assessment_name: Optional[str] = None
    assessment_code: Optional[str] = None
    assessment_type: Optional[str] = None
    exercise_count: int = 0
    can_start: bool = False
    active_session_uuid: Optional[str] = None


class CandidateSessionItem(BaseModel):
    uuid: str
    session_reference: str
    status: str
    runtime_mode: str
    assessment_name: Optional[str] = None
    exercise_name: Optional[str] = None
    variant_name: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
