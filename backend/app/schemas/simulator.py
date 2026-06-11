"""Simulator module — request/response schemas for vendors, configs, sessions, logs."""
from datetime import datetime
from typing import Any, Optional

from pydantic import Field

from app.schemas.common import BaseSchema


# ── Enums ──────────────────────────────────────────────────────────────────

INTEGRATION_TYPES = ["REST_API", "WEBSOCKET", "FILE_IMPORT", "CUSTOM"]
AUTH_TYPES = ["API_KEY", "BEARER", "BASIC", "NONE"]
SESSION_STATUSES = ["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]
VENDOR_STATUSES = ["active", "inactive", "deprecated"]


# ── Simulator Vendor ───────────────────────────────────────────────────────

class SimulatorVendorCreate(BaseSchema):
    name: str = Field(min_length=2, max_length=255)
    code: str = Field(min_length=2, max_length=50, pattern=r"^[A-Z0-9_-]+$")
    vendor_name: Optional[str] = Field(default=None, max_length=255)
    version: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    base_url: Optional[str] = Field(default=None, max_length=500)
    integration_type: str = Field(default="REST_API")
    status: str = Field(default="active")


class SimulatorVendorUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    vendor_name: Optional[str] = Field(default=None, max_length=255)
    version: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    base_url: Optional[str] = Field(default=None, max_length=500)
    integration_type: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class SimulatorVendorResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    code: str
    vendor_name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    base_url: Optional[str] = None
    integration_type: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SimulatorVendorListResponse(BaseSchema):
    id: int
    uuid: str
    name: str
    code: str
    vendor_name: Optional[str] = None
    version: Optional[str] = None
    base_url: Optional[str] = None
    integration_type: str
    status: str
    is_active: bool
    created_at: datetime


# ── Simulator Configuration ────────────────────────────────────────────────

class SimulatorConfigurationCreate(BaseSchema):
    simulator_vendor_id: int
    configuration_name: str = Field(min_length=2, max_length=255)
    base_url: Optional[str] = Field(default=None, max_length=500)
    authentication_type: str = Field(default="NONE")
    api_key: Optional[str] = Field(default=None, max_length=500)
    client_id: Optional[str] = Field(default=None, max_length=255)
    client_secret: Optional[str] = Field(default=None, max_length=500)
    webhook_url: Optional[str] = Field(default=None, max_length=500)
    connection_timeout: int = Field(default=30, ge=1, le=300)
    status: str = Field(default="active")


class SimulatorConfigurationUpdate(BaseSchema):
    configuration_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    base_url: Optional[str] = Field(default=None, max_length=500)
    authentication_type: Optional[str] = None
    api_key: Optional[str] = Field(default=None, max_length=500)
    client_id: Optional[str] = Field(default=None, max_length=255)
    client_secret: Optional[str] = Field(default=None, max_length=500)
    webhook_url: Optional[str] = Field(default=None, max_length=500)
    connection_timeout: Optional[int] = Field(default=None, ge=1, le=300)
    status: Optional[str] = None
    is_active: Optional[bool] = None


class SimulatorConfigurationResponse(BaseSchema):
    id: int
    uuid: str
    simulator_vendor_id: int
    vendor_name: Optional[str] = None
    vendor_code: Optional[str] = None
    configuration_name: str
    base_url: Optional[str] = None
    authentication_type: str
    # Credentials — decrypted at service layer, never stored in plaintext
    api_key: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    webhook_url: Optional[str] = None
    connection_timeout: int
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SimulatorConfigurationListResponse(BaseSchema):
    id: int
    uuid: str
    simulator_vendor_id: int
    vendor_name: Optional[str] = None
    vendor_code: Optional[str] = None
    configuration_name: str
    base_url: Optional[str] = None
    authentication_type: str
    status: str
    is_active: bool
    updated_at: datetime


# ── Simulator Session ──────────────────────────────────────────────────────

class SimulatorSessionResponse(BaseSchema):
    id: int
    uuid: str
    session_reference: str
    simulator_vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_code: Optional[str] = None
    candidate_id: Optional[str] = None
    organization_id: Optional[int] = None
    assessment_id: Optional[str] = None
    exercise_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str
    raw_payload: Optional[Any] = None
    processed_payload: Optional[Any] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SimulatorSessionListResponse(BaseSchema):
    id: int
    uuid: str
    session_reference: str
    vendor_name: Optional[str] = None
    vendor_code: Optional[str] = None
    candidate_id: Optional[str] = None
    assessment_id: Optional[str] = None
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime


# ── Integration Log ────────────────────────────────────────────────────────

class IntegrationLogResponse(BaseSchema):
    id: int
    uuid: str
    simulator_vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_code: Optional[str] = None
    request_type: str
    request_url: Optional[str] = None
    request_payload: Optional[Any] = None
    response_payload: Optional[Any] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime


class IntegrationLogListResponse(BaseSchema):
    id: int
    uuid: str
    vendor_name: Optional[str] = None
    vendor_code: Optional[str] = None
    request_type: str
    request_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
