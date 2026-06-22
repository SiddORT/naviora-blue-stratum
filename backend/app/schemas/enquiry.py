"""Pydantic v2 schemas for the CRM Enquiries & Onboarding module."""
from __future__ import annotations

import math
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import BaseSchema


# ── Enums (as string literals — no Python enum needed) ───────────────────────
ENQUIRY_TYPES   = ["CONTACT", "CUSTOM_PLAN", "ORGANIZATION_REGISTRATION", "CANDIDATE_REGISTRATION"]
ENQUIRY_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "APPROVED", "REJECTED", "CONVERTED"]
ONBOARDING_TYPES = ["ORGANIZATION", "CANDIDATE"]
ONBOARDING_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CONVERTED"]


# ── Public Submission Schemas ─────────────────────────────────────────────────

class ConsentPayload(BaseModel):
    """GDPR consent fields captured at submission time."""
    privacy_accepted:         bool = False
    terms_accepted:           bool = False
    data_processing_accepted: bool = False
    marketing_accepted:       bool = False
    consent_version:          Optional[str] = "1.0"


class ContactEnquiryCreate(BaseModel):
    """Submitted from the landing page contact / demo-request form."""
    first_name:       str       = Field(min_length=1, max_length=100)
    last_name:        str       = Field(min_length=1, max_length=100)
    email:            EmailStr
    phone:            Optional[str] = Field(default=None, max_length=50)
    organization:     Optional[str] = Field(default=None, max_length=255)
    country:          Optional[str] = Field(default=None, max_length=100)
    role:             Optional[str] = Field(default=None, max_length=100)
    message:          Optional[str] = None
    source_page:      Optional[str] = Field(default="/contact", max_length=255)
    consent:          ConsentPayload = ConsentPayload()


class PlanEnquiryCreate(BaseModel):
    """Submitted from /plans page — interest in a specific plan."""
    first_name:       str       = Field(min_length=1, max_length=100)
    last_name:        str       = Field(min_length=1, max_length=100)
    email:            EmailStr
    phone:            Optional[str] = Field(default=None, max_length=50)
    organization:     Optional[str] = Field(default=None, max_length=255)
    country:          Optional[str] = Field(default=None, max_length=100)
    selected_plan_id: Optional[int] = None
    message:          Optional[str] = None
    source_page:      Optional[str] = Field(default="/plans", max_length=255)
    consent:          ConsentPayload = ConsentPayload()


class OrgRegistrationCreate(BaseModel):
    """Submitted from /register — organization wants to onboard."""
    first_name:       str       = Field(min_length=1, max_length=100)
    last_name:        str       = Field(min_length=1, max_length=100)
    email:            EmailStr
    phone:            Optional[str] = Field(default=None, max_length=50)
    company_name:     str       = Field(min_length=2, max_length=255)
    country:          Optional[str] = Field(default=None, max_length=100)
    selected_plan_id: Optional[int] = None
    message:          Optional[str] = None
    source_page:      Optional[str] = Field(default="/register", max_length=255)
    consent:          ConsentPayload = ConsentPayload()


class CandidateRegistrationCreate(BaseModel):
    """Submitted from /register?type=candidate."""
    first_name:   str       = Field(min_length=1, max_length=100)
    last_name:    str       = Field(min_length=1, max_length=100)
    email:        EmailStr
    phone:        Optional[str] = Field(default=None, max_length=50)
    company_name: Optional[str] = Field(default=None, max_length=255, description="Organization name / employer")
    country:      Optional[str] = Field(default=None, max_length=100)
    message:      Optional[str] = None
    source_page:  Optional[str] = Field(default="/register", max_length=255)
    consent:      ConsentPayload = ConsentPayload()


# ── Admin Action Schemas ──────────────────────────────────────────────────────

class EnquiryStatusUpdate(BaseModel):
    status: str = Field(description="One of: " + ", ".join(ENQUIRY_STATUSES))


class EnquiryAssign(BaseModel):
    assigned_to: Optional[str] = Field(description="User UUID to assign, or null to unassign")


class EnquiryNoteCreate(BaseModel):
    note: str = Field(min_length=1)


class EnquiryReject(BaseModel):
    reason: Optional[str] = Field(default=None, description="Rejection reason shown in notes")


class OnboardingApprove(BaseModel):
    """Body sent when admin approves and initiates conversion."""
    selected_plan_id:  Optional[int] = None
    organization_id:   Optional[int] = Field(
        default=None,
        description="For CANDIDATE onboarding — which org to attach them to",
    )
    notes: Optional[str] = None


# ── Response Schemas ──────────────────────────────────────────────────────────

class ConsentResponse(BaseSchema):
    id: int
    enquiry_id: int
    privacy_accepted: bool
    terms_accepted: bool
    data_processing_accepted: bool
    marketing_accepted: bool
    consent_version: Optional[str]
    ip_address: Optional[str]
    accepted_at: datetime


class EnquiryNoteResponse(BaseSchema):
    id: int
    uuid: str
    enquiry_id: int
    note: str
    note_by: Optional[str]
    note_by_uuid: Optional[str]
    created_at: datetime


class EnquiryResponse(BaseSchema):
    id: int
    uuid: str
    enquiry_type: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    company_name: Optional[str]
    country: Optional[str]
    selected_plan_id: Optional[int]
    selected_plan_name: Optional[str] = None
    message: Optional[str]
    source_page: Optional[str]
    status: str
    assigned_to: Optional[str]
    duplicate_flag: bool
    ip_address: Optional[str]
    created_at: datetime
    updated_at: datetime
    notes: list[EnquiryNoteResponse] = []
    consent: Optional[ConsentResponse] = None


class EnquiryListItem(BaseSchema):
    """Lightweight row for the admin grid."""
    id: int
    uuid: str
    enquiry_type: str
    first_name: str
    last_name: str
    email: str
    company_name: Optional[str]
    country: Optional[str]
    selected_plan_id: Optional[int]
    selected_plan_name: Optional[str] = None
    status: str
    duplicate_flag: bool
    assigned_to: Optional[str]
    created_at: datetime


class EnquiryPage(BaseModel):
    items: list[EnquiryListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class OnboardingResponse(BaseSchema):
    id: int
    uuid: str
    enquiry_id: int
    enquiry_uuid: Optional[str] = None
    enquiry_email: Optional[str] = None
    enquiry_name: Optional[str] = None
    onboarding_type: str
    onboarding_status: str
    organization_id: Optional[int]
    user_id: Optional[int]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    rejected_by: Optional[str]
    rejected_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime


class OnboardingPage(BaseModel):
    items: list[OnboardingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ConsentRecordListItem(BaseModel):
    id: int
    enquiry_id: int
    enquiry_email: Optional[str] = None
    enquiry_name: Optional[str] = None
    enquiry_type: Optional[str] = None
    privacy_accepted: bool
    terms_accepted: bool
    data_processing_accepted: bool
    marketing_accepted: bool
    consent_version: Optional[str]
    ip_address: Optional[str]
    accepted_at: datetime


class ConsentRecordPage(BaseModel):
    items: list[ConsentRecordListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class DuplicateCheck(BaseModel):
    has_duplicates: bool
    matches: list[EnquiryListItem]
