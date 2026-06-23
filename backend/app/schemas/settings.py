"""Pydantic schemas for all Settings modules."""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Platform Settings ─────────────────────────────────────────────────────────

class PlatformSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    legal_name: Optional[str] = None
    company_email: Optional[str] = None
    support_email: Optional[str] = None
    billing_email: Optional[str] = None
    company_phone: Optional[str] = None
    website_url: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    company_logo_path: Optional[str] = None
    favicon_path: Optional[str] = None
    default_timezone: Optional[str] = None
    default_currency: Optional[str] = None
    default_language: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None


class PlatformSettingsResponse(BaseModel):
    id: int
    uuid: str
    company_name: Optional[str] = None
    legal_name: Optional[str] = None
    company_email: Optional[str] = None
    support_email: Optional[str] = None
    billing_email: Optional[str] = None
    company_phone: Optional[str] = None
    website_url: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    company_logo_path: Optional[str] = None
    favicon_path: Optional[str] = None
    default_timezone: str = "UTC"
    default_currency: str = "USD"
    default_language: str = "en"
    date_format: str = "YYYY-MM-DD"
    time_format: str = "24h"
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Branding Settings ─────────────────────────────────────────────────────────

class BrandingSettingsUpdate(BaseModel):
    platform_name: Optional[str] = None
    platform_tagline: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    login_background_path: Optional[str] = None
    email_header_logo_path: Optional[str] = None
    report_logo_path: Optional[str] = None


class BrandingSettingsResponse(BaseModel):
    id: int
    uuid: str
    platform_name: str = "Naviora"
    platform_tagline: Optional[str] = None
    primary_color: str = "#D4A63A"
    secondary_color: str = "#2EA8FF"
    accent_color: str = "#B8860B"
    login_background_path: Optional[str] = None
    email_header_logo_path: Optional[str] = None
    report_logo_path: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Communication Settings ────────────────────────────────────────────────────

class CommunicationSettingsUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None  # plaintext — encrypted before storage
    smtp_encryption: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    reply_to_email: Optional[str] = None
    test_email_address: Optional[str] = None


class CommunicationSettingsResponse(BaseModel):
    id: int
    uuid: str
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password_set: bool = False  # never expose password
    smtp_encryption: str = "TLS"
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    reply_to_email: Optional[str] = None
    test_email_address: Optional[str] = None
    is_verified: bool = False
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


class TestEmailRequest(BaseModel):
    recipient: str


# ── Notification Settings ─────────────────────────────────────────────────────

class NotificationSettingsUpdate(BaseModel):
    enable_email_notifications: Optional[bool] = None
    enable_system_notifications: Optional[bool] = None
    enable_sms_notifications: Optional[bool] = None
    enable_whatsapp_notifications: Optional[bool] = None
    enable_teams_notifications: Optional[bool] = None
    enable_slack_notifications: Optional[bool] = None
    teams_webhook_url: Optional[str] = None
    slack_webhook_url: Optional[str] = None


class NotificationSettingsResponse(BaseModel):
    id: int
    uuid: str
    enable_email_notifications: bool = True
    enable_system_notifications: bool = True
    enable_sms_notifications: bool = False
    enable_whatsapp_notifications: bool = False
    enable_teams_notifications: bool = False
    enable_slack_notifications: bool = False
    teams_webhook_url: Optional[str] = None
    slack_webhook_url: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Invoice Settings ──────────────────────────────────────────────────────────

class InvoiceSettingsUpdate(BaseModel):
    invoice_prefix: Optional[str] = None
    invoice_start_number: Optional[int] = None
    quotation_prefix: Optional[str] = None
    quotation_start_number: Optional[int] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    tax_name: Optional[str] = None
    tax_percentage: Optional[float] = None
    invoice_footer: Optional[str] = None


class InvoiceSettingsResponse(BaseModel):
    id: int
    uuid: str
    invoice_prefix: str = "INV"
    invoice_start_number: int = 1
    quotation_prefix: str = "QTN"
    quotation_start_number: int = 1
    currency_code: str = "USD"
    currency_symbol: str = "$"
    tax_name: str = "Tax"
    tax_percentage: float = 0.0
    invoice_footer: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── System Preferences ────────────────────────────────────────────────────────

class SystemPreferencesUpdate(BaseModel):
    default_timezone: Optional[str] = None
    default_currency: Optional[str] = None
    default_language: Optional[str] = None
    session_timeout_minutes: Optional[int] = None
    password_expiry_days: Optional[int] = None
    max_login_attempts: Optional[int] = None
    lockout_duration_minutes: Optional[int] = None


class SystemPreferencesResponse(BaseModel):
    id: int
    uuid: str
    default_timezone: str = "UTC"
    default_currency: str = "USD"
    default_language: str = "en"
    session_timeout_minutes: int = 60
    password_expiry_days: int = 90
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 15
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Portal Settings ───────────────────────────────────────────────────────────

class PortalSettingsUpdate(BaseModel):
    public_url: Optional[str] = None
    admin_url: Optional[str] = None
    organization_url: Optional[str] = None
    candidate_url: Optional[str] = None
    custom_domain: Optional[str] = None
    ssl_enabled: Optional[bool] = None


class PortalSettingsResponse(BaseModel):
    id: int
    uuid: str
    public_url: str = "/"
    admin_url: str = "/admin/login"
    organization_url: str = "/org/login"
    candidate_url: str = "/candidate/login"
    custom_domain: Optional[str] = None
    ssl_enabled: Optional[bool] = False
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Email Templates ───────────────────────────────────────────────────────────

class EmailTemplateCreate(BaseModel):
    template_name: str
    template_code: str
    subject: str
    html_content: Optional[str] = None
    plain_text_content: Optional[str] = None
    available_variables: Optional[str] = None
    status: Optional[str] = "draft"
    description: Optional[str] = None


class EmailTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    plain_text_content: Optional[str] = None
    available_variables: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


class EmailTemplateResponse(BaseModel):
    id: int
    uuid: str
    template_name: str
    template_code: str
    subject: str
    html_content: Optional[str] = None
    plain_text_content: Optional[str] = None
    available_variables: Optional[str] = None
    status: str
    description: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


class PreviewTemplateRequest(BaseModel):
    variables: dict = {}


class SendTestEmailRequest(BaseModel):
    recipient: str
    variables: dict = {}
