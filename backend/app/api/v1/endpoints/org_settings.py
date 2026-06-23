"""Organization Portal — Settings management."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.models.organization import Organization
from app.schemas.org_portal import OrgProfileResponse, OrgSettingsUpdate
from app.services.audit import AuditService
from app.utils.responses import not_found_response, success_response

router = APIRouter()


@router.get("", summary="Get organization settings")
async def get_org_settings(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    org = await db.get(Organization, ctx.organization_id)
    if not org:
        return not_found_response("Organization not found")
    return success_response(data=OrgProfileResponse.model_validate(org).model_dump())


@router.put("", summary="Update organization settings")
async def update_org_settings(
    body: OrgSettingsUpdate,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    require_org_admin(ctx)
    org = await db.get(Organization, ctx.organization_id)
    if not org:
        return not_found_response("Organization not found")

    for field, val in body.model_dump(exclude_unset=True).items():
        if hasattr(org, field):
            setattr(org, field, val)
    await db.commit()
    await db.refresh(org)

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="org.settings.updated",
        user_id=ctx.user.uuid,
        resource_type="organization",
        resource_id=org.uuid,
        new_values=body.model_dump(exclude_unset=True),
    )
    return success_response(data=OrgProfileResponse.model_validate(org).model_dump(), message="Settings updated")
