"""Organization Portal — Authentication endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, verify_password, verify_token
from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, ORG_USER_TYPES
from app.helpers.rate_limit import auth_limiter
from app.models.organization import Organization
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import LogoutRequest, RefreshRequest, TokenResponse
from app.schemas.org_portal import OrgLoginRequest, OrgUserResponse
from app.services.audit import AuditService
from app.utils.responses import error_response, success_response

router = APIRouter()


def _get_ip(request: Request) -> Optional[str]:
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("/login", summary="Organization portal login")
async def org_login(
    body: OrgLoginRequest,
    request: Request,
    _rl: None = Depends(auth_limiter),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(body.email)

    if not user or not verify_password(body.password, user.hashed_password):
        return error_response(message="Invalid email or password", status_code=status.HTTP_401_UNAUTHORIZED)

    if user.user_type not in ORG_USER_TYPES:
        return error_response(message="Access restricted to organization portal users", status_code=status.HTTP_403_FORBIDDEN)

    if not user.organization_id:
        return error_response(message="User is not assigned to any organization", status_code=status.HTTP_403_FORBIDDEN)

    if not user.is_active or user.status != "active":
        return error_response(message="Account is suspended or inactive", status_code=status.HTTP_403_FORBIDDEN)

    org = await db.get(Organization, user.organization_id)
    if not org or not org.is_active:
        return error_response(message="Organization is not active", status_code=status.HTTP_403_FORBIDDEN)

    token_data = {"sub": user.uuid, "email": user.email, "org_id": user.organization_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    import hashlib
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    from datetime import datetime, timedelta, timezone
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        ip_address=_get_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    db.add(db_token)

    from datetime import timezone as tz
    user.last_login = datetime.now(tz.utc)
    await db.commit()

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="org_user.login",
        user_id=str(user.uuid),
        resource_type="user",
        resource_id=str(user.uuid),
        ip_address=_get_ip(request),
    )

    from app.core.config import settings
    token_response = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return success_response(data=token_response.model_dump(), message="Login successful")


@router.post("/refresh", summary="Refresh organization portal token")
async def org_refresh(
    body: RefreshRequest,
    _rl: None = Depends(auth_limiter),
    db: AsyncSession = Depends(get_db),
):
    payload = verify_token(body.refresh_token, token_type="refresh")
    if not payload:
        return error_response(message="Invalid or expired refresh token", status_code=401)

    import hashlib
    token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    from sqlalchemy import and_
    from datetime import datetime, timezone
    result = await db.execute(
        select(RefreshToken).where(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        return error_response(message="Invalid or expired refresh token", status_code=401)

    user_repo = UserRepository(db)
    user = await user_repo.get_by_uuid(payload["sub"])
    if not user or not user.is_active:
        return error_response(message="User not found or inactive", status_code=401)

    stored.revoked_at = datetime.now(timezone.utc)

    token_data = {"sub": user.uuid, "email": user.email, "org_id": user.organization_id}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    new_hash = hashlib.sha256(new_refresh.encode()).hexdigest()
    from datetime import timedelta
    new_token = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(new_token)
    await db.commit()

    from app.core.config import settings
    resp = TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return success_response(data=resp.model_dump(), message="Token refreshed")


@router.post("/logout", summary="Logout from organization portal")
async def org_logout(
    body: LogoutRequest,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    import hashlib
    from datetime import datetime, timezone
    from sqlalchemy import and_
    token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(
            and_(RefreshToken.token_hash == token_hash, RefreshToken.revoked_at.is_(None))
        )
    )
    stored = result.scalar_one_or_none()
    if stored:
        stored.revoked_at = datetime.now(timezone.utc)
        await db.commit()
    return success_response(message="Logged out successfully")


@router.get("/me", summary="Get current org portal user profile")
async def org_me(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    user = ctx.user
    org = await db.get(Organization, ctx.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    resp = OrgUserResponse(
        uuid=user.uuid,
        email=user.email,
        full_name=user.full_name,
        user_type=user.user_type,
        organization_id=ctx.organization_id,
        organization_name=org.name,
        organization_code=org.code,
        avatar_url=user.avatar_url,
        status=user.status,
    )
    return success_response(data=resp.model_dump())
