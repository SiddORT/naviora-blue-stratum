"""UserInvitation repository."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user_invitation import UserInvitation
from app.models.role import Role
from app.models.organization import Organization  # type: ignore[attr-defined]
from app.models.user import User
from app.repositories.base import BaseRepository


class InvitationRepository(BaseRepository[UserInvitation]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(UserInvitation, db)

    async def get_by_token(self, token: str) -> Optional[UserInvitation]:
        result = await self.db.execute(
            select(UserInvitation).where(UserInvitation.token == token)
        )
        return result.scalar_one_or_none()

    async def get_by_email_pending(self, email: str) -> Optional[UserInvitation]:
        result = await self.db.execute(
            select(UserInvitation).where(
                and_(
                    UserInvitation.email == email,
                    UserInvitation.status == "pending",
                    UserInvitation.deleted_at.is_(None),
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[list[UserInvitation], int]:
        base_query = (
            select(UserInvitation)
            .options(
                selectinload(UserInvitation.organization),
                selectinload(UserInvitation.role),
                selectinload(UserInvitation.invited_by),
            )
            .where(UserInvitation.deleted_at.is_(None))
        )
        if status:
            base_query = base_query.where(UserInvitation.status == status)
        if search:
            pattern = f"%{search}%"
            base_query = base_query.where(
                UserInvitation.email.ilike(pattern) | UserInvitation.full_name.ilike(pattern)
            )

        total = (
            await self.db.execute(select(func.count()).select_from(base_query.subquery()))
        ).scalar_one()

        offset = (page - 1) * page_size
        rows = (
            await self.db.execute(
                base_query.order_by(UserInvitation.created_at.desc()).offset(offset).limit(page_size)
            )
        ).scalars().all()

        return list(rows), total

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def default_expires_at() -> datetime:
        return datetime.now(timezone.utc) + timedelta(days=7)
