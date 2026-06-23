"""Certificate module Pydantic schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


# ── Certificate Templates ─────────────────────────────────────────────────────

class CertificateTemplateCreate(BaseModel):
    template_name: str = Field(..., min_length=1, max_length=255)
    template_code: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    certificate_type: str = "Standard"
    is_default: bool = False
    template_html: str | None = None
    template_config: str | None = None
    status: str = "Draft"


class CertificateTemplateUpdate(BaseModel):
    template_name: str | None = None
    description: str | None = None
    certificate_type: str | None = None
    is_default: bool | None = None
    template_html: str | None = None
    template_config: str | None = None
    status: str | None = None


class CertificateTemplateResponse(BaseModel):
    id: int
    uuid: str
    template_name: str
    template_code: str
    description: str | None
    certificate_type: str
    background_image_path: str | None
    logo_path: str | None
    signature_image_path: str | None
    is_default: bool
    status: str
    template_html: str | None
    template_config: str | None
    created_at: datetime
    updated_at: datetime


# ── Certificate Rules ─────────────────────────────────────────────────────────

class CertificateRuleCreate(BaseModel):
    assessment_id: int
    template_id: int
    minimum_score: Decimal | None = None
    require_review_approval: bool = True
    auto_issue: bool = True
    validity_period_months: int | None = None
    status: str = "Active"


class CertificateRuleUpdate(BaseModel):
    template_id: int | None = None
    minimum_score: Decimal | None = None
    require_review_approval: bool | None = None
    auto_issue: bool | None = None
    validity_period_months: int | None = None
    status: str | None = None


class CertificateRuleResponse(BaseModel):
    id: int
    uuid: str
    assessment_id: int
    assessment_name: str | None
    template_id: int
    template_name: str | None
    minimum_score: Decimal | None
    require_review_approval: bool
    auto_issue: bool
    validity_period_months: int | None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Certificates ──────────────────────────────────────────────────────────────

class CertificateGenerateRequest(BaseModel):
    candidate_id: int
    assessment_id: int
    result_id: int | None = None
    template_id: int | None = None
    remarks: str | None = None


class CertificateIssueRequest(BaseModel):
    remarks: str | None = None


class CertificateRevokeRequest(BaseModel):
    remarks: str = Field(..., min_length=1)


class CertificateSuspendRequest(BaseModel):
    remarks: str = Field(..., min_length=1)


class CertificateRenewRequest(BaseModel):
    remarks: str | None = None


class CertificateHistoryResponse(BaseModel):
    id: int
    action_type: str
    previous_status: str | None
    new_status: str
    remarks: str | None
    action_by: str | None
    created_at: datetime


class CertificateResponse(BaseModel):
    id: int
    uuid: str
    certificate_number: str
    certificate_type: str
    organization_id: int | None
    organization_name: str | None
    candidate_id: int
    candidate_name: str | None
    candidate_email: str | None
    assessment_id: int | None
    assessment_name: str | None
    template_id: int | None
    template_name: str | None
    issue_date: date | None
    expiry_date: date | None
    score: Decimal | None
    status: str
    pdf_path: str | None
    verification_hash: str
    verification_url: str | None
    remarks: str | None
    issued_by: str | None
    history: list[CertificateHistoryResponse] = []
    created_at: datetime
    updated_at: datetime


class CertificateListItem(BaseModel):
    id: int
    uuid: str
    certificate_number: str
    certificate_type: str
    candidate_name: str | None
    candidate_email: str | None
    organization_name: str | None
    assessment_name: str | None
    issue_date: date | None
    expiry_date: date | None
    score: Decimal | None
    status: str
    verification_url: str | None
    created_at: datetime


# ── Certificate Settings ──────────────────────────────────────────────────────

class CertificateSettingsUpdate(BaseModel):
    certificate_prefix: str | None = None
    reset_frequency: str | None = None
    include_year_in_number: bool | None = None


class CertificateSettingsResponse(BaseModel):
    id: int
    uuid: str
    certificate_prefix: str
    next_certificate_number: int
    reset_frequency: str
    last_reset_year: int | None
    last_reset_month: int | None
    include_year_in_number: bool
    updated_at: datetime


# ── Analytics ────────────────────────────────────────────────────────────────

class CertificateAnalyticsResponse(BaseModel):
    total_issued: int
    total_active: int
    total_expiring_soon: int
    total_expired: int
    total_revoked: int
    total_suspended: int
    by_organization: list[dict[str, Any]] = []
    by_assessment: list[dict[str, Any]] = []
    recent_issuances: list[dict[str, Any]] = []


# ── Public Verification ───────────────────────────────────────────────────────

class CertificateVerifyResponse(BaseModel):
    found: bool
    certificate_number: str | None = None
    candidate_name: str | None = None
    assessment_name: str | None = None
    organization_name: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    status: str | None = None
    verification_status: str | None = None
    score: Decimal | None = None
    certificate_type: str | None = None
