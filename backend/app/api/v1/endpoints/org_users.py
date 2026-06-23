"""Organization Portal — User management endpoints (org-scoped)."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.helpers.pagination import PaginatedResponse
from app.models.user import User
from app.schemas.org_portal import OrgUserInvite, OrgUserListItem
from app.services.audit import AuditService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()

ALLOWED_ORG_TYPES = {"INSTRUCTOR", "ASSESSOR"}


@router.get("", summary="List organization users")
async def list_org_users(
    ctx: CurrentOrgUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    user_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    org_id = ctx.organization_id
    base = select(User).where(
        and_(User.organization_id == org_id, User.deleted_at.is_(None), User.user_type != "ADMIN")
    )
    if search:
        pattern = f"%{search}%"
        base = base.where(User.full_name.ilike(pattern) | User.email.ilike(pattern))
    if user_type:
        base = base.where(User.user_type == user_type)
    if status:
        base = base.where(User.status == status)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(base.order_by(User.created_at.desc()).offset(offset).limit(page_size))).scalars().all()

    items = [
        OrgUserListItem(
            uuid=u.uuid,
            email=u.email,
            full_name=u.full_name,
            user_type=u.user_type,
            status=u.status,
            avatar_url=u.avatar_url,
            last_login=u.last_login,
            created_at=u.created_at,
        )
        for u in rows
    ]
    resp = PaginatedResponse[OrgUserListItem](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.post("", summary="Invite / create a new org user")
async def create_org_user(
    body: OrgUserInvite,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    require_org_admin(ctx)
    if body.user_type not in ALLOWED_ORG_TYPES:
        return error_response(message=f"user_type must be one of {ALLOWED_ORG_TYPES}", status_code=400)

    existing = (await db.execute(
        select(User).where(and_(User.email == body.email, User.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if existing:
        return error_response(message="Email already registered", status_code=409)

    import secrets, string
    temp_pw = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    user = User(
        organization_id=ctx.organization_id,
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(temp_pw),
        phone=body.phone,
        user_type=body.user_type,
        status="active",
    )
    db.add(user)
    await db.flush()

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="org.user.created",
        user_id=ctx.user.uuid,
        resource_type="user",
        resource_id=user.uuid,
        new_values={"email": user.email, "user_type": user.user_type},
    )
    await db.commit()

    return created_response(
        data=OrgUserListItem(
            uuid=user.uuid,
            email=user.email,
            full_name=user.full_name,
            user_type=user.user_type,
            status=user.status,
            created_at=user.created_at,
        ).model_dump(),
        message="User created",
    )


@router.patch("/{uuid}/status", summary="Activate or deactivate an org user")
async def update_org_user_status(
    uuid: str,
    body: dict,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    require_org_admin(ctx)
    result = await db.execute(
        select(User).where(and_(User.uuid == uuid, User.organization_id == ctx.organization_id, User.deleted_at.is_(None)))
    )
    user = result.scalar_one_or_none()
    if not user:
        return not_found_response("User not found")

    new_status = body.get("status", "active")
    if new_status not in ("active", "inactive", "suspended"):
        return error_response(message="Invalid status value", status_code=400)
    user.status = new_status
    user.is_active = new_status == "active"
    await db.commit()

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="org.user.status_updated",
        user_id=ctx.user.uuid,
        resource_type="user",
        resource_id=uuid,
        new_values={"status": new_status},
    )
    return success_response(message=f"User status updated to {new_status}")
