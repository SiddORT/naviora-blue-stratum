"""Platform Settings, Branding, Communication, Notifications, Invoice, System, Portal, Email Templates."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.settings import (
    PlatformSettingsUpdate, PlatformSettingsResponse,
    BrandingSettingsUpdate, BrandingSettingsResponse,
    CommunicationSettingsUpdate, CommunicationSettingsResponse, TestEmailRequest,
    NotificationSettingsUpdate, NotificationSettingsResponse,
    InvoiceSettingsUpdate, InvoiceSettingsResponse,
    SystemPreferencesUpdate, SystemPreferencesResponse,
    PortalSettingsUpdate, PortalSettingsResponse,
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateResponse,
    PreviewTemplateRequest, SendTestEmailRequest,
)
from app.services.settings import (
    PlatformSettingsService, BrandingSettingsService, CommunicationSettingsService,
    NotificationSettingsService, InvoiceSettingsService, SystemPreferencesService,
    PortalSettingsService, EmailTemplateService,
)
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


# ── Platform Settings ─────────────────────────────────────────────────────────

@router.get("/platform", summary="Get platform settings",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_platform_settings(db: AsyncSession = Depends(get_db)):
    svc = PlatformSettingsService(db)
    record = await svc.get()
    return success_response(data=PlatformSettingsResponse.model_validate(record).model_dump())


@router.put("/platform", summary="Update platform settings",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_platform_settings(
    body: PlatformSettingsUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = PlatformSettingsService(db)
    record = await svc.update(body, current_user.uuid)
    await db.commit()
    return success_response(data=PlatformSettingsResponse.model_validate(record).model_dump(),
                            message="Platform settings updated")


# ── Branding Settings ─────────────────────────────────────────────────────────

@router.get("/branding", summary="Get branding settings",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_branding_settings(db: AsyncSession = Depends(get_db)):
    svc = BrandingSettingsService(db)
    record = await svc.get()
    return success_response(data=BrandingSettingsResponse.model_validate(record).model_dump())


@router.put("/branding", summary="Update branding settings",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_branding_settings(
    body: BrandingSettingsUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = BrandingSettingsService(db)
    record = await svc.update(body, current_user.uuid)
    await db.commit()
    return success_response(data=BrandingSettingsResponse.model_validate(record).model_dump(),
                            message="Branding settings updated")


# ── Communication Settings ────────────────────────────────────────────────────

@router.get("/communication", summary="Get communication settings",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_communication_settings(db: AsyncSession = Depends(get_db)):
    svc = CommunicationSettingsService(db)
    record = await svc.get()
    return success_response(data=svc.to_response(record))


@router.put("/communication", summary="Update communication settings",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_communication_settings(
    body: CommunicationSettingsUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = CommunicationSettingsService(db)
    record = await svc.update(body, current_user.uuid)
    await db.commit()
    return success_response(data=svc.to_response(record), message="Communication settings updated")


@router.post("/communication/verify", summary="Verify SMTP connection",
             dependencies=[Depends(check_permissions(["settings.manage"]))])
async def verify_smtp(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    svc = CommunicationSettingsService(db)
    ok, msg = await svc.verify_connection(current_user.uuid)
    await db.commit()
    if ok:
        return success_response(message=msg)
    return error_response(message=msg, status_code=400)


@router.post("/communication/test-email", summary="Send test email",
             dependencies=[Depends(check_permissions(["settings.manage"]))])
async def send_test_email(
    body: TestEmailRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = CommunicationSettingsService(db)
    ok, msg = await svc.send_test_email(body.recipient, current_user.uuid)
    await db.commit()
    if ok:
        return success_response(message=msg)
    return error_response(message=msg, status_code=400)


# ── Notification Settings ─────────────────────────────────────────────────────

@router.get("/notifications", summary="Get notification settings",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_notification_settings(db: AsyncSession = Depends(get_db)):
    svc = NotificationSettingsService(db)
    record = await svc.get()
    return success_response(data=NotificationSettingsResponse.model_validate(record).model_dump())


@router.put("/notifications", summary="Update notification settings",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_notification_settings(
    body: NotificationSettingsUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = NotificationSettingsService(db)
    record = await svc.update(body, current_user.uuid)
    await db.commit()
    return success_response(data=NotificationSettingsResponse.model_validate(record).model_dump(),
                            message="Notification settings updated")


# ── Invoice Settings ──────────────────────────────────────────────────────────

@router.get("/invoice", summary="Get invoice settings",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_invoice_settings(db: AsyncSession = Depends(get_db)):
    svc = InvoiceSettingsService(db)
    record = await svc.get()
    return success_response(data=InvoiceSettingsResponse.model_validate(record).model_dump())


@router.put("/invoice", summary="Update invoice settings",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_invoice_settings(
    body: InvoiceSettingsUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = InvoiceSettingsService(db)
    record = await svc.update(body, current_user.uuid)
    await db.commit()
    return success_response(data=InvoiceSettingsResponse.model_validate(record).model_dump(),
                            message="Invoice settings updated")


# ── System Preferences ────────────────────────────────────────────────────────

@router.get("/system", summary="Get system preferences",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_system_preferences(db: AsyncSession = Depends(get_db)):
    svc = SystemPreferencesService(db)
    record = await svc.get()
    return success_response(data=SystemPreferencesResponse.model_validate(record).model_dump())


@router.put("/system", summary="Update system preferences",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_system_preferences(
    body: SystemPreferencesUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = SystemPreferencesService(db)
    record = await svc.update(body, current_user.uuid)
    await db.commit()
    return success_response(data=SystemPreferencesResponse.model_validate(record).model_dump(),
                            message="System preferences updated")


# ── Portal Settings ───────────────────────────────────────────────────────────

@router.get("/portal", summary="Get portal settings",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_portal_settings(db: AsyncSession = Depends(get_db)):
    svc = PortalSettingsService(db)
    record = await svc.get()
    return success_response(data=PortalSettingsResponse.model_validate(record).model_dump())


@router.put("/portal", summary="Update portal settings",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_portal_settings(
    body: PortalSettingsUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = PortalSettingsService(db)
    record = await svc.update(body, current_user.uuid)
    await db.commit()
    return success_response(data=PortalSettingsResponse.model_validate(record).model_dump(),
                            message="Portal settings updated")


# ── Email Templates ───────────────────────────────────────────────────────────

@router.get("/email-templates", summary="List email templates",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def list_email_templates(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    svc = EmailTemplateService(db)
    items, total = await svc.list_templates(page=page, page_size=page_size, search=search, status=status)
    resp = PaginatedResponse[EmailTemplateResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get("/email-templates/{uuid}", summary="Get email template",
            dependencies=[Depends(check_permissions(["settings.view"]))])
async def get_email_template(uuid: str, db: AsyncSession = Depends(get_db)):
    svc = EmailTemplateService(db)
    template = await svc.get(uuid)
    if not template:
        return not_found_response("Email template")
    return success_response(data=EmailTemplateResponse.model_validate(template).model_dump())


@router.post("/email-templates", summary="Create email template",
             dependencies=[Depends(check_permissions(["settings.manage"]))])
async def create_email_template(
    body: EmailTemplateCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EmailTemplateService(db)
    existing = await svc.get_by_code(body.template_code)
    if existing:
        return error_response(f"Template code '{body.template_code}' already exists", status_code=409)
    template = await svc.create(body, current_user.uuid)
    await db.commit()
    await db.refresh(template)
    return created_response(data=EmailTemplateResponse.model_validate(template).model_dump(),
                            message="Email template created")


@router.put("/email-templates/{uuid}", summary="Update email template",
            dependencies=[Depends(check_permissions(["settings.manage"]))])
async def update_email_template(
    uuid: str,
    body: EmailTemplateUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EmailTemplateService(db)
    template = await svc.update(uuid, body, current_user.uuid)
    if not template:
        return not_found_response("Email template")
    await db.commit()
    return success_response(data=EmailTemplateResponse.model_validate(template).model_dump(),
                            message="Email template updated")


@router.delete("/email-templates/{uuid}", summary="Delete email template",
               dependencies=[Depends(check_permissions(["settings.manage"]))])
async def delete_email_template(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EmailTemplateService(db)
    ok = await svc.delete(uuid, current_user.uuid)
    if not ok:
        return not_found_response("Email template")
    await db.commit()
    return success_response(message="Email template deleted")


@router.post("/email-templates/{uuid}/preview", summary="Preview rendered template",
             dependencies=[Depends(check_permissions(["settings.view"]))])
async def preview_email_template(
    uuid: str,
    body: PreviewTemplateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = EmailTemplateService(db)
    template = await svc.get(uuid)
    if not template:
        return not_found_response("Email template")
    rendered = svc.render_preview(template, body.variables)
    return success_response(data=rendered)


@router.post("/email-templates/{uuid}/send-test", summary="Send test email from template",
             dependencies=[Depends(check_permissions(["settings.manage"]))])
async def send_template_test_email(
    uuid: str,
    body: SendTestEmailRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc_template = EmailTemplateService(db)
    template = await svc_template.get(uuid)
    if not template:
        return not_found_response("Email template")
    rendered = svc_template.render_preview(template, body.variables)
    svc_comm = CommunicationSettingsService(db)
    ok, msg = await svc_comm.send_test_email(body.recipient, current_user.uuid)
    await db.commit()
    if ok:
        return success_response(message=msg, data={"rendered": rendered})
    return error_response(message=msg, status_code=400)
