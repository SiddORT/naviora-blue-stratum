"""Settings service — manages all singleton settings records."""
import json
import uuid
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.platform_settings import PlatformSettings
from app.models.branding_settings import BrandingSettings
from app.models.communication_settings import CommunicationSettings
from app.models.notification_settings import NotificationSettings
from app.models.invoice_settings import InvoiceSettings
from app.models.system_preferences import SystemPreferences
from app.models.portal_settings import PortalSettings
from app.models.email_template import EmailTemplate
from app.schemas.settings import (
    PlatformSettingsUpdate, BrandingSettingsUpdate,
    CommunicationSettingsUpdate, NotificationSettingsUpdate,
    InvoiceSettingsUpdate, SystemPreferencesUpdate, PortalSettingsUpdate,
    EmailTemplateCreate, EmailTemplateUpdate,
    CommunicationSettingsResponse,
)
from app.services.audit import AuditService
from app.services.encryption import encryption_service

logger = logging.getLogger(__name__)

# ── Generic singleton helpers ─────────────────────────────────────────────────

async def _get_or_create_singleton(db: AsyncSession, Model):
    """Return the single active record, creating one if none exists."""
    result = await db.execute(
        select(Model).where(Model.deleted_at.is_(None)).limit(1)
    )
    record = result.scalar_one_or_none()
    if not record:
        record = Model(uuid=str(uuid.uuid4()))
        db.add(record)
        await db.flush()
        await db.refresh(record)
    return record


# ── Platform Settings ─────────────────────────────────────────────────────────

class PlatformSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get(self) -> PlatformSettings:
        return await _get_or_create_singleton(self.db, PlatformSettings)

    async def update(self, body: PlatformSettingsUpdate, updated_by: str) -> PlatformSettings:
        record = await self.get()
        old = {k: getattr(record, k) for k in body.model_fields_set}
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        record.updated_by = updated_by
        await self.db.flush()
        await self.audit.log("settings", "platform_settings_updated", user_id=updated_by,
                             resource_type="platform_settings", resource_id=record.uuid,
                             old_values=old, new_values=body.model_dump(exclude_unset=True))
        return record


# ── Branding Settings ─────────────────────────────────────────────────────────

class BrandingSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get(self) -> BrandingSettings:
        return await _get_or_create_singleton(self.db, BrandingSettings)

    async def update(self, body: BrandingSettingsUpdate, updated_by: str) -> BrandingSettings:
        record = await self.get()
        old = {k: getattr(record, k) for k in body.model_fields_set}
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        record.updated_by = updated_by
        await self.db.flush()
        await self.audit.log("settings", "branding_settings_updated", user_id=updated_by,
                             resource_type="branding_settings", resource_id=record.uuid,
                             old_values=old, new_values=body.model_dump(exclude_unset=True))
        return record


# ── Communication Settings ────────────────────────────────────────────────────

class CommunicationSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get(self) -> CommunicationSettings:
        return await _get_or_create_singleton(self.db, CommunicationSettings)

    def to_response(self, record: CommunicationSettings) -> dict:
        return {
            "id": record.id,
            "uuid": record.uuid,
            "smtp_host": record.smtp_host,
            "smtp_port": record.smtp_port,
            "smtp_username": record.smtp_username,
            "smtp_password_set": bool(record.smtp_password_enc),
            "smtp_encryption": record.smtp_encryption,
            "sender_name": record.sender_name,
            "sender_email": record.sender_email,
            "reply_to_email": record.reply_to_email,
            "test_email_address": record.test_email_address,
            "is_verified": record.is_verified,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None,
        }

    async def update(self, body: CommunicationSettingsUpdate, updated_by: str) -> CommunicationSettings:
        record = await self.get()
        data = body.model_dump(exclude_unset=True)
        # Encrypt password if provided
        if "smtp_password" in data:
            plaintext = data.pop("smtp_password")
            record.smtp_password_enc = encryption_service.encrypt(plaintext) if plaintext else None
        for field, value in data.items():
            setattr(record, field, value)
        record.updated_by = updated_by
        record.is_verified = False  # reset verification on any change
        await self.db.flush()
        await self.audit.log("settings", "communication_settings_updated", user_id=updated_by,
                             resource_type="communication_settings", resource_id=record.uuid)
        return record

    async def verify_connection(self, updated_by: str) -> tuple[bool, str]:
        """Attempt SMTP connection and update is_verified flag."""
        record = await self.get()
        if not record.smtp_host or not record.smtp_port:
            return False, "SMTP host and port are required"
        try:
            import smtplib
            enc = record.smtp_encryption
            if enc == "SSL":
                server = smtplib.SMTP_SSL(record.smtp_host, record.smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(record.smtp_host, record.smtp_port, timeout=10)
                if enc == "TLS":
                    server.starttls()
            if record.smtp_username and record.smtp_password_enc:
                pwd = encryption_service.decrypt(record.smtp_password_enc)
                server.login(record.smtp_username, pwd)
            server.quit()
            record.is_verified = True
            record.updated_by = updated_by
            await self.db.flush()
            await self.audit.log("settings", "smtp_verified", user_id=updated_by,
                                 resource_type="communication_settings", resource_id=record.uuid)
            return True, "SMTP connection verified successfully"
        except Exception as exc:
            record.is_verified = False
            await self.db.flush()
            logger.warning("SMTP verification failed: %s", exc)
            return False, str(exc)

    async def send_test_email(self, recipient: str, updated_by: str) -> tuple[bool, str]:
        """Send a test email using current SMTP settings."""
        record = await self.get()
        if not record.smtp_host or not record.sender_email:
            return False, "SMTP host and sender email are required"
        try:
            import smtplib
            from email.mime.text import MIMEText
            msg = MIMEText(f"This is a test email from Naviora by Blue Stratum.\n\nSMTP settings are working correctly.", "plain")
            msg["Subject"] = "Naviora — SMTP Test Email"
            msg["From"] = f"{record.sender_name or 'Naviora'} <{record.sender_email}>"
            msg["To"] = recipient
            if record.reply_to_email:
                msg["Reply-To"] = record.reply_to_email
            enc = record.smtp_encryption
            if enc == "SSL":
                server = smtplib.SMTP_SSL(record.smtp_host, record.smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(record.smtp_host, record.smtp_port, timeout=10)
                if enc == "TLS":
                    server.starttls()
            if record.smtp_username and record.smtp_password_enc:
                pwd = encryption_service.decrypt(record.smtp_password_enc)
                server.login(record.smtp_username, pwd)
            server.sendmail(record.sender_email, [recipient], msg.as_string())
            server.quit()
            await self.audit.log("settings", "test_email_sent", user_id=updated_by,
                                 resource_type="communication_settings", resource_id=record.uuid,
                                 new_values={"recipient": recipient})
            return True, f"Test email sent to {recipient}"
        except Exception as exc:
            logger.warning("Test email failed: %s", exc)
            return False, str(exc)


# ── Notification Settings ─────────────────────────────────────────────────────

class NotificationSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get(self) -> NotificationSettings:
        return await _get_or_create_singleton(self.db, NotificationSettings)

    async def update(self, body: NotificationSettingsUpdate, updated_by: str) -> NotificationSettings:
        record = await self.get()
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        record.updated_by = updated_by
        await self.db.flush()
        await self.audit.log("settings", "notification_settings_updated", user_id=updated_by,
                             resource_type="notification_settings", resource_id=record.uuid)
        return record


# ── Invoice Settings ──────────────────────────────────────────────────────────

class InvoiceSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get(self) -> InvoiceSettings:
        return await _get_or_create_singleton(self.db, InvoiceSettings)

    async def update(self, body: InvoiceSettingsUpdate, updated_by: str) -> InvoiceSettings:
        record = await self.get()
        old = {k: getattr(record, k) for k in body.model_fields_set}
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        record.updated_by = updated_by
        await self.db.flush()
        await self.audit.log("settings", "invoice_settings_updated", user_id=updated_by,
                             resource_type="invoice_settings", resource_id=record.uuid,
                             old_values=old, new_values=body.model_dump(exclude_unset=True))
        return record


# ── System Preferences ────────────────────────────────────────────────────────

class SystemPreferencesService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get(self) -> SystemPreferences:
        return await _get_or_create_singleton(self.db, SystemPreferences)

    async def update(self, body: SystemPreferencesUpdate, updated_by: str) -> SystemPreferences:
        record = await self.get()
        old = {k: getattr(record, k) for k in body.model_fields_set}
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        record.updated_by = updated_by
        await self.db.flush()
        await self.audit.log("settings", "system_preferences_updated", user_id=updated_by,
                             resource_type="system_preferences", resource_id=record.uuid,
                             old_values=old, new_values=body.model_dump(exclude_unset=True))
        return record


# ── Portal Settings ───────────────────────────────────────────────────────────

class PortalSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def get(self) -> PortalSettings:
        return await _get_or_create_singleton(self.db, PortalSettings)

    async def update(self, body: PortalSettingsUpdate, updated_by: str) -> PortalSettings:
        record = await self.get()
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        record.updated_by = updated_by
        await self.db.flush()
        await self.audit.log("settings", "portal_settings_updated", user_id=updated_by,
                             resource_type="portal_settings", resource_id=record.uuid)
        return record


# ── Email Templates ───────────────────────────────────────────────────────────

class EmailTemplateService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    async def list_templates(self, page: int = 1, page_size: int = 20,
                              search: Optional[str] = None,
                              status: Optional[str] = None) -> tuple[list[EmailTemplate], int]:
        from sqlalchemy import func, or_
        base = select(EmailTemplate).where(EmailTemplate.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            base = base.where(or_(
                EmailTemplate.template_name.ilike(term),
                EmailTemplate.template_code.ilike(term),
                EmailTemplate.subject.ilike(term),
            ))
        if status:
            base = base.where(EmailTemplate.status == status)
        count_q = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_q)).scalar_one()
        items = (await self.db.execute(
            base.order_by(EmailTemplate.template_name).offset((page - 1) * page_size).limit(page_size)
        )).scalars().all()
        return list(items), total

    async def get(self, uuid: str) -> Optional[EmailTemplate]:
        result = await self.db.execute(
            select(EmailTemplate).where(EmailTemplate.uuid == uuid, EmailTemplate.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[EmailTemplate]:
        result = await self.db.execute(
            select(EmailTemplate).where(EmailTemplate.template_code == code, EmailTemplate.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def create(self, body: EmailTemplateCreate, created_by: str) -> EmailTemplate:
        template = EmailTemplate(
            uuid=str(uuid.uuid4()),
            template_name=body.template_name,
            template_code=body.template_code,
            subject=body.subject,
            html_content=body.html_content,
            plain_text_content=body.plain_text_content,
            available_variables=body.available_variables,
            status=body.status or "draft",
            description=body.description,
            created_by=created_by,
        )
        self.db.add(template)
        await self.db.flush()
        await self.audit.log("settings", "email_template_created", user_id=created_by,
                             resource_type="email_template", resource_id=template.uuid)
        return template

    async def update(self, template_uuid: str, body: EmailTemplateUpdate, updated_by: str) -> Optional[EmailTemplate]:
        template = await self.get(template_uuid)
        if not template:
            return None
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(template, field, value)
        template.updated_by = updated_by
        await self.db.flush()
        await self.audit.log("settings", "email_template_updated", user_id=updated_by,
                             resource_type="email_template", resource_id=template.uuid,
                             new_values=body.model_dump(exclude_unset=True))
        return template

    async def delete(self, template_uuid: str, deleted_by: str) -> bool:
        template = await self.get(template_uuid)
        if not template:
            return False
        template.soft_delete(deleted_by)
        await self.db.flush()
        await self.audit.log("settings", "email_template_deleted", user_id=deleted_by,
                             resource_type="email_template", resource_id=template.uuid)
        return True

    def render_preview(self, template: EmailTemplate, variables: dict) -> dict:
        """Apply variable substitution to template subject and content."""
        import re
        def replace_vars(text: str, vars_dict: dict) -> str:
            if not text:
                return text
            for k, v in vars_dict.items():
                text = text.replace(f"{{{{{k}}}}}", str(v))
            # Remove any unreplaced variables
            text = re.sub(r"\{\{[^}]+\}\}", "[N/A]", text)
            return text
        return {
            "subject": replace_vars(template.subject, variables),
            "html_content": replace_vars(template.html_content or "", variables),
            "plain_text_content": replace_vars(template.plain_text_content or "", variables),
        }
