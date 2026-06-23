"""Seed Sprint 2.6A — Platform Settings defaults + 7 Email Templates.

Usage: cd backend && python seed_settings.py
"""
import asyncio
import logging
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from app.core.config import settings
from app.models.platform_settings import PlatformSettings
from app.models.branding_settings import BrandingSettings
from app.models.communication_settings import CommunicationSettings
from app.models.notification_settings import NotificationSettings
from app.models.invoice_settings import InvoiceSettings
from app.models.system_preferences import SystemPreferences
from app.models.portal_settings import PortalSettings
from app.models.email_template import EmailTemplate

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed_settings")

engine = create_async_engine(settings.async_database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def seed_singleton(session: AsyncSession, Model, defaults: dict, name: str) -> None:
    existing = (await session.execute(select(Model).limit(1))).scalar_one_or_none()
    if existing:
        log.info("%s already exists — skipping", name)
        return
    record = Model(uuid=str(uuid.uuid4()), **defaults)
    session.add(record)
    await session.flush()
    log.info("Seeded %s", name)


TEMPLATES = [
    {
        "template_name": "Admin User Invitation",
        "template_code": "ADMIN_USER_INVITATION",
        "subject": "You have been invited to Naviora — {{platform_name}}",
        "description": "Sent to admin users when invited to the platform",
        "status": "active",
        "available_variables": '["user_name", "platform_name", "activation_link", "temporary_password", "support_email", "admin_email"]',
        "html_content": """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Admin Invitation</title></head>
<body style="margin:0;padding:0;background-color:#0B0B0F;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#141821;border-radius:8px;overflow:hidden;">
      <tr><td style="background-color:#141821;padding:32px 40px;border-bottom:2px solid #D4A63A;">
        <h1 style="color:#D4A63A;margin:0;font-size:24px;font-weight:700;">{{platform_name}}</h1>
        <p style="color:#6B7280;margin:4px 0 0;font-size:13px;">Maritime Assessment Platform</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#FFFFFF;margin:0 0 16px;font-size:20px;">Welcome, {{user_name}}</h2>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">You have been invited to join <strong style="color:#D4A63A;">{{platform_name}}</strong> as an administrator. Your account has been created and is ready for you to access.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="background-color:#1E2430;border-radius:6px;padding:20px;margin:0 0 24px;width:100%;">
          <tr><td><p style="color:#6B7280;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Temporary Password</p>
          <p style="color:#D4A63A;margin:0;font-size:18px;font-weight:700;font-family:monospace;">{{temporary_password}}</p></td></tr>
        </table>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">Please change your password upon first login.</p>
        <table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#D4A63A;border-radius:6px;">
          <a href="{{activation_link}}" style="display:block;padding:14px 32px;color:#0B0B0F;font-weight:700;text-decoration:none;font-size:15px;">Access Platform</a>
        </td></tr></table>
        <p style="color:#6B7280;margin:32px 0 0;font-size:13px;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color:#2EA8FF;">{{support_email}}</a></p>
      </td></tr>
      <tr><td style="background-color:#0B0B0F;padding:20px 40px;text-align:center;">
        <p style="color:#4B5563;margin:0;font-size:12px;">{{platform_name}} by Blue Stratum — Enterprise Maritime SaaS</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>""",
        "plain_text_content": "Welcome {{user_name}},\n\nYou have been invited to {{platform_name}}.\n\nTemporary Password: {{temporary_password}}\n\nAccess the platform: {{activation_link}}\n\nNeed help? {{support_email}}",
    },
    {
        "template_name": "Organization Admin Invitation",
        "template_code": "ORGANIZATION_ADMIN_INVITATION",
        "subject": "{{organization_name}} — Your Admin Account is Ready",
        "description": "Sent to organization administrators during onboarding",
        "status": "active",
        "available_variables": '["user_name", "organization_name", "platform_name", "activation_link", "temporary_password", "support_email", "organization_url"]',
        "html_content": """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0B0F;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#141821;border-radius:8px;overflow:hidden;">
      <tr><td style="background-color:#141821;padding:32px 40px;border-bottom:2px solid #2EA8FF;">
        <h1 style="color:#D4A63A;margin:0;font-size:24px;">{{platform_name}}</h1>
        <p style="color:#6B7280;margin:4px 0 0;font-size:13px;">{{organization_name}}</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#FFFFFF;margin:0 0 16px;">Hello, {{user_name}}</h2>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">You have been set up as the administrator for <strong style="color:#2EA8FF;">{{organization_name}}</strong> on {{platform_name}}. You can now manage your organization's users, assessments, and reporting.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="background-color:#1E2430;border-radius:6px;padding:20px;margin:0 0 24px;width:100%;">
          <tr><td><p style="color:#6B7280;margin:0 0 4px;font-size:12px;text-transform:uppercase;">Temporary Password</p>
          <p style="color:#D4A63A;margin:0;font-size:18px;font-weight:700;font-family:monospace;">{{temporary_password}}</p></td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#2EA8FF;border-radius:6px;">
          <a href="{{activation_link}}" style="display:block;padding:14px 32px;color:#FFFFFF;font-weight:700;text-decoration:none;font-size:15px;">Access Organization Portal</a>
        </td></tr></table>
        <p style="color:#6B7280;margin:32px 0 0;font-size:13px;">Support: <a href="mailto:{{support_email}}" style="color:#2EA8FF;">{{support_email}}</a></p>
      </td></tr>
      <tr><td style="background-color:#0B0B0F;padding:20px 40px;text-align:center;">
        <p style="color:#4B5563;margin:0;font-size:12px;">{{platform_name}} — Enterprise Maritime SaaS</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>""",
        "plain_text_content": "Hello {{user_name}},\n\nYou are now the administrator for {{organization_name}} on {{platform_name}}.\n\nTemporary Password: {{temporary_password}}\n\nLogin: {{activation_link}}\n\nSupport: {{support_email}}",
    },
    {
        "template_name": "Candidate Invitation",
        "template_code": "CANDIDATE_INVITATION",
        "subject": "Your Assessment Invitation — {{platform_name}}",
        "description": "Sent to candidates when invited to complete assessments",
        "status": "active",
        "available_variables": '["candidate_name", "organization_name", "platform_name", "activation_link", "temporary_password", "support_email", "assessment_name"]',
        "html_content": """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0B0F;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#141821;border-radius:8px;overflow:hidden;">
      <tr><td style="background-color:#141821;padding:32px 40px;border-bottom:2px solid #D4A63A;">
        <h1 style="color:#D4A63A;margin:0;font-size:24px;">{{platform_name}}</h1>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#FFFFFF;margin:0 0 16px;">Hello, {{candidate_name}}</h2>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;"><strong style="color:#FFFFFF;">{{organization_name}}</strong> has invited you to complete a maritime competency assessment on {{platform_name}}.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="background-color:#1E2430;border-radius:6px;padding:20px;margin:0 0 24px;width:100%;">
          <tr><td><p style="color:#6B7280;margin:0 0 4px;font-size:12px;text-transform:uppercase;">Temporary Password</p>
          <p style="color:#D4A63A;margin:0;font-size:16px;font-weight:700;font-family:monospace;">{{temporary_password}}</p></td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#D4A63A;border-radius:6px;">
          <a href="{{activation_link}}" style="display:block;padding:14px 32px;color:#0B0B0F;font-weight:700;text-decoration:none;font-size:15px;">Begin Assessment</a>
        </td></tr></table>
        <p style="color:#6B7280;margin:32px 0 0;font-size:13px;">Need help? <a href="mailto:{{support_email}}" style="color:#2EA8FF;">{{support_email}}</a></p>
      </td></tr>
      <tr><td style="background-color:#0B0B0F;padding:20px 40px;text-align:center;">
        <p style="color:#4B5563;margin:0;font-size:12px;">{{platform_name}} — Enterprise Maritime SaaS</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>""",
        "plain_text_content": "Hello {{candidate_name}},\n\n{{organization_name}} has invited you to complete an assessment on {{platform_name}}.\n\nTemporary Password: {{temporary_password}}\n\nLogin: {{activation_link}}\n\nSupport: {{support_email}}",
    },
    {
        "template_name": "Password Reset",
        "template_code": "PASSWORD_RESET",
        "subject": "Reset Your {{platform_name}} Password",
        "description": "Sent when a user requests a password reset",
        "status": "active",
        "available_variables": '["user_name", "platform_name", "reset_link", "support_email", "expiry_minutes"]',
        "html_content": """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0B0F;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#141821;border-radius:8px;overflow:hidden;">
      <tr><td style="background-color:#141821;padding:32px 40px;border-bottom:2px solid #D4A63A;">
        <h1 style="color:#D4A63A;margin:0;font-size:24px;">{{platform_name}}</h1>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#FFFFFF;margin:0 0 16px;">Password Reset Request</h2>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">Hello {{user_name}}, we received a request to reset your password. This link expires in <strong style="color:#D4A63A;">{{expiry_minutes}} minutes</strong>.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="background-color:#D4A63A;border-radius:6px;">
          <a href="{{reset_link}}" style="display:block;padding:14px 32px;color:#0B0B0F;font-weight:700;text-decoration:none;font-size:15px;">Reset Password</a>
        </td></tr></table>
        <p style="color:#6B7280;font-size:13px;margin:0 0 8px;">If you did not request this, please ignore this email. Your password will not change.</p>
        <p style="color:#6B7280;font-size:13px;margin:0;">Support: <a href="mailto:{{support_email}}" style="color:#2EA8FF;">{{support_email}}</a></p>
      </td></tr>
      <tr><td style="background-color:#0B0B0F;padding:20px 40px;text-align:center;">
        <p style="color:#4B5563;margin:0;font-size:12px;">{{platform_name}} — Enterprise Maritime SaaS</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>""",
        "plain_text_content": "Hello {{user_name}},\n\nReset your password: {{reset_link}}\n\nThis link expires in {{expiry_minutes}} minutes.\n\nIf you did not request this, ignore this email.\n\nSupport: {{support_email}}",
    },
    {
        "template_name": "Organization Approved",
        "template_code": "ORGANIZATION_APPROVED",
        "subject": "{{organization_name}} — Your Account Has Been Approved",
        "description": "Sent when an organization is approved by the platform admin",
        "status": "active",
        "available_variables": '["user_name", "organization_name", "platform_name", "login_url", "support_email"]',
        "html_content": """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0B0F;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#141821;border-radius:8px;overflow:hidden;">
      <tr><td style="background-color:#141821;padding:32px 40px;border-bottom:2px solid #22C55E;">
        <h1 style="color:#D4A63A;margin:0;font-size:24px;">{{platform_name}}</h1>
      </td></tr>
      <tr><td style="padding:40px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:64px;height:64px;background-color:#16a34a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <span style="color:#FFFFFF;font-size:32px;">&#10003;</span>
          </div>
          <h2 style="color:#22C55E;margin:0 0 8px;">Account Approved</h2>
        </div>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">Hello {{user_name}}, great news — <strong style="color:#FFFFFF;">{{organization_name}}</strong> has been approved on {{platform_name}}. You can now access all platform features.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;"><tr><td style="background-color:#D4A63A;border-radius:6px;">
          <a href="{{login_url}}" style="display:block;padding:14px 32px;color:#0B0B0F;font-weight:700;text-decoration:none;font-size:15px;">Access Platform</a>
        </td></tr></table>
        <p style="color:#6B7280;font-size:13px;text-align:center;">Support: <a href="mailto:{{support_email}}" style="color:#2EA8FF;">{{support_email}}</a></p>
      </td></tr>
      <tr><td style="background-color:#0B0B0F;padding:20px 40px;text-align:center;">
        <p style="color:#4B5563;margin:0;font-size:12px;">{{platform_name}} — Enterprise Maritime SaaS</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>""",
        "plain_text_content": "Hello {{user_name}},\n\n{{organization_name}} has been approved on {{platform_name}}.\n\nLogin: {{login_url}}\n\nSupport: {{support_email}}",
    },
    {
        "template_name": "Registration Received",
        "template_code": "REGISTRATION_RECEIVED",
        "subject": "Registration Received — {{platform_name}}",
        "description": "Acknowledgement sent after public registration submission",
        "status": "active",
        "available_variables": '["user_name", "organization_name", "platform_name", "support_email"]',
        "html_content": """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0B0F;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#141821;border-radius:8px;overflow:hidden;">
      <tr><td style="background-color:#141821;padding:32px 40px;border-bottom:2px solid #D4A63A;">
        <h1 style="color:#D4A63A;margin:0;font-size:24px;">{{platform_name}}</h1>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#FFFFFF;margin:0 0 16px;">Registration Received</h2>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">Hello {{user_name}}, thank you for registering <strong style="color:#FFFFFF;">{{organization_name}}</strong> with {{platform_name}}.</p>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">Our team will review your application and contact you within 1-2 business days. You will receive a confirmation email once your account is approved.</p>
        <p style="color:#6B7280;font-size:13px;margin:0;">Questions? <a href="mailto:{{support_email}}" style="color:#2EA8FF;">{{support_email}}</a></p>
      </td></tr>
      <tr><td style="background-color:#0B0B0F;padding:20px 40px;text-align:center;">
        <p style="color:#4B5563;margin:0;font-size:12px;">{{platform_name}} — Enterprise Maritime SaaS</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>""",
        "plain_text_content": "Hello {{user_name}},\n\nThank you for registering {{organization_name}} with {{platform_name}}.\n\nOur team will review your application within 1-2 business days.\n\nQuestions? {{support_email}}",
    },
    {
        "template_name": "Assessment Assigned",
        "template_code": "ASSESSMENT_ASSIGNED",
        "subject": "New Assessment Assigned — {{assessment_name}}",
        "description": "Sent to candidates when an assessment is assigned to them",
        "status": "active",
        "available_variables": '["candidate_name", "assessment_name", "organization_name", "platform_name", "due_date", "assessment_link", "support_email"]',
        "html_content": """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0B0F;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#141821;border-radius:8px;overflow:hidden;">
      <tr><td style="background-color:#141821;padding:32px 40px;border-bottom:2px solid #D4A63A;">
        <h1 style="color:#D4A63A;margin:0;font-size:24px;">{{platform_name}}</h1>
      </td></tr>
      <tr><td style="padding:40px;">
        <h2 style="color:#FFFFFF;margin:0 0 16px;">Assessment Assigned</h2>
        <p style="color:#9CA3AF;line-height:1.6;margin:0 0 24px;">Hello {{candidate_name}}, a new assessment has been assigned to you by <strong style="color:#FFFFFF;">{{organization_name}}</strong>.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="background-color:#1E2430;border-radius:6px;padding:20px;margin:0 0 24px;width:100%;">
          <tr><td><p style="color:#6B7280;margin:0 0 8px;font-size:12px;text-transform:uppercase;">Assessment</p>
          <p style="color:#D4A63A;margin:0 0 12px;font-size:18px;font-weight:700;">{{assessment_name}}</p>
          <p style="color:#6B7280;margin:0 0 4px;font-size:12px;text-transform:uppercase;">Due Date</p>
          <p style="color:#FFFFFF;margin:0;font-size:14px;font-weight:600;">{{due_date}}</p></td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#D4A63A;border-radius:6px;">
          <a href="{{assessment_link}}" style="display:block;padding:14px 32px;color:#0B0B0F;font-weight:700;text-decoration:none;font-size:15px;">Start Assessment</a>
        </td></tr></table>
        <p style="color:#6B7280;margin:32px 0 0;font-size:13px;">Support: <a href="mailto:{{support_email}}" style="color:#2EA8FF;">{{support_email}}</a></p>
      </td></tr>
      <tr><td style="background-color:#0B0B0F;padding:20px 40px;text-align:center;">
        <p style="color:#4B5563;margin:0;font-size:12px;">{{platform_name}} — Enterprise Maritime SaaS</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>""",
        "plain_text_content": "Hello {{candidate_name}},\n\n{{organization_name}} has assigned you an assessment:\n\nAssessment: {{assessment_name}}\nDue: {{due_date}}\n\nStart: {{assessment_link}}\n\nSupport: {{support_email}}",
    },
]


async def seed_email_templates(session: AsyncSession) -> None:
    for tpl in TEMPLATES:
        existing = (await session.execute(
            select(EmailTemplate).where(EmailTemplate.template_code == tpl["template_code"])
        )).scalar_one_or_none()
        if existing:
            log.info("Template %s already exists — skipping", tpl["template_code"])
            continue
        template = EmailTemplate(uuid=str(uuid.uuid4()), **tpl)
        session.add(template)
        log.info("Seeded template: %s", tpl["template_code"])
    await session.flush()


async def seed_defaults(session: AsyncSession) -> None:
    await seed_singleton(session, PlatformSettings, {
        "company_name": "Blue Stratum",
        "legal_name": "Blue Stratum Pte. Ltd.",
        "company_email": "hello@bluestratum.com",
        "support_email": "support@bluestratum.com",
        "billing_email": "billing@bluestratum.com",
        "website_url": "https://bluestratum.com",
        "default_timezone": "UTC",
        "default_currency": "USD",
        "default_language": "en",
        "date_format": "DD/MM/YYYY",
        "time_format": "24h",
    }, "PlatformSettings")

    await seed_singleton(session, BrandingSettings, {
        "platform_name": "Naviora",
        "platform_tagline": "Enterprise Maritime Assessment Platform",
        "primary_color": "#D4A63A",
        "secondary_color": "#2EA8FF",
        "accent_color": "#B8860B",
    }, "BrandingSettings")

    await seed_singleton(session, CommunicationSettings, {
        "smtp_port": 587,
        "smtp_encryption": "TLS",
        "sender_name": "Naviora",
        "is_verified": False,
    }, "CommunicationSettings")

    await seed_singleton(session, NotificationSettings, {
        "enable_email_notifications": True,
        "enable_system_notifications": True,
    }, "NotificationSettings")

    await seed_singleton(session, InvoiceSettings, {
        "invoice_prefix": "INV",
        "invoice_start_number": 1,
        "quotation_prefix": "QTN",
        "quotation_start_number": 1,
        "currency_code": "USD",
        "currency_symbol": "$",
        "tax_name": "Tax",
        "tax_percentage": 0.0,
        "invoice_footer": "Thank you for your business. Payment is due within 30 days.",
    }, "InvoiceSettings")

    await seed_singleton(session, SystemPreferences, {
        "default_timezone": "UTC",
        "default_currency": "USD",
        "default_language": "en",
        "session_timeout_minutes": 60,
        "password_expiry_days": 90,
        "max_login_attempts": 5,
        "lockout_duration_minutes": 15,
    }, "SystemPreferences")

    await seed_singleton(session, PortalSettings, {
        "public_url": "/",
        "admin_url": "/admin/login",
        "organization_url": "/org/login",
        "candidate_url": "/candidate/login",
        "ssl_enabled": False,
    }, "PortalSettings")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await seed_defaults(session)
            await seed_email_templates(session)
    log.info("Settings seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
