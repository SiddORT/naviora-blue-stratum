"""Authentication service — login, logout, token refresh, password management."""
import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import TokenResponse, UserMeResponse
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.user_repo = UserRepository(db)
        self.audit = AuditService(db)

    async def login(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[TokenResponse]:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        if not user.is_active or user.status != "active":
            return None

        token_data = {"sub": user.uuid, "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token_str = create_refresh_token(token_data)

        rt = RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(refresh_token_str),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(rt)

        user.last_login = datetime.now(timezone.utc)
        self.db.add(user)

        await self.audit.log(
            module="auth",
            action="login",
            user_id=user.uuid,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh(self, refresh_token_str: str) -> Optional[TokenResponse]:
        payload = verify_token(refresh_token_str, token_type="refresh")
        if not payload:
            return None

        token_hash = _hash_token(refresh_token_str)
        stmt = select(RefreshToken).where(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked.is_(False),
            )
        )
        result = await self.db.execute(stmt)
        stored_rt = result.scalar_one_or_none()
        if not stored_rt or stored_rt.is_expired:
            return None

        user = await self.user_repo.get_by_uuid(payload["sub"])
        if not user or not user.is_active:
            return None

        stored_rt.is_revoked = True
        self.db.add(stored_rt)

        token_data = {"sub": user.uuid, "email": user.email}
        new_access = create_access_token(token_data)
        new_refresh = create_refresh_token(token_data)

        new_rt = RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(new_refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=stored_rt.ip_address,
            user_agent=stored_rt.user_agent,
        )
        self.db.add(new_rt)

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, refresh_token_str: str, user_uuid: Optional[str] = None) -> bool:
        token_hash = _hash_token(refresh_token_str)
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(stmt)
        stored_rt = result.scalar_one_or_none()
        if stored_rt:
            stored_rt.is_revoked = True
            self.db.add(stored_rt)
        if user_uuid:
            await self.audit.log(module="auth", action="logout", user_id=user_uuid)
        return True

    async def get_me(self, user_uuid: str) -> Optional[UserMeResponse]:
        user = await self.user_repo.get_by_uuid_with_roles(user_uuid)
        if not user:
            return None
        permissions = await self.user_repo.get_permissions(user.id)
        roles = [ur.role.slug for ur in user.user_roles if ur.role and ur.role.is_active]
        return UserMeResponse(
            uuid=user.uuid,
            email=user.email,
            full_name=user.full_name,
            username=user.username,
            avatar_url=user.avatar_url,
            status=user.status,
            organization_id=user.organization_id,
            permissions=permissions,
            roles=roles,
        )

    async def change_password(
        self,
        user_uuid: str,
        current_password: str,
        new_password: str,
        ip_address: Optional[str] = None,
    ) -> bool:
        user = await self.user_repo.get_by_uuid(user_uuid)
        if not user or not verify_password(current_password, user.hashed_password):
            return False
        user.hashed_password = hash_password(new_password)
        self.db.add(user)
        await self.audit.log(
            module="auth",
            action="password_change",
            user_id=user_uuid,
            ip_address=ip_address,
        )
        return True

    async def request_password_reset(self, email: str) -> Optional[str]:
        user = await self.user_repo.get_by_email(email)
        if not user:
            return None
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=2)
        self.db.add(user)
        return token

    async def reset_password(self, token: str, new_password: str) -> bool:
        stmt = select(User).where(
            and_(
                User.password_reset_token == token,
                User.password_reset_expires > datetime.now(timezone.utc),
            )
        )
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return False
        user.hashed_password = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        self.db.add(user)
        return True
