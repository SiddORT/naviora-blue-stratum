"""User repository."""
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.user_role import UserRole
from app.models.role import Role
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(
            and_(User.email == email, User.deleted_at.is_(None))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_uuid_with_roles(self, uuid: str) -> Optional[User]:
        query = (
            select(User)
            .options(
                selectinload(User.user_roles).selectinload(UserRole.role)
            )
            .where(and_(User.uuid == uuid, User.deleted_at.is_(None)))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        organization_id: Optional[int] = None,
        status: Optional[str] = None,
        user_type: Optional[str] = None,
    ) -> tuple[list[User], int]:
        base_query = (
            select(User)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .where(User.deleted_at.is_(None))
        )
        if organization_id is not None:
            base_query = base_query.where(User.organization_id == organization_id)
        if status:
            base_query = base_query.where(User.status == status)
        if user_type:
            base_query = base_query.where(User.user_type == user_type)
        if search:
            pattern = f"%{search}%"
            base_query = base_query.where(
                User.full_name.ilike(pattern) | User.email.ilike(pattern)
            )

        count_query = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        offset = (page - 1) * page_size
        rows = (
            await self.db.execute(
                base_query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
            )
        ).scalars().all()

        return list(rows), total

    async def email_exists(self, email: str, exclude_id: Optional[int] = None) -> bool:
        query = select(func.count()).where(
            and_(User.email == email, User.deleted_at.is_(None))
        )
        if exclude_id:
            query = query.where(User.id != exclude_id)
        count = (await self.db.execute(query)).scalar_one()
        return count > 0

    async def get_permissions(self, user_id: int) -> list[str]:
        """Return flat list of permission names for the given user."""
        from app.models.permission import Permission
        from app.models.role_permission import RolePermission

        query = (
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                and_(
                    UserRole.user_id == user_id,
                    Permission.is_active.is_(True),
                    Role.is_active.is_(True),
                    Permission.deleted_at.is_(None),
                    Role.deleted_at.is_(None),
                )
            )
            .distinct()
        )
        result = await self.db.execute(query)
        return [row[0] for row in result.all()]
