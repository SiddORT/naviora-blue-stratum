"""Role and Permission repositories."""
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Role, db)

    async def get_by_slug(self, slug: str) -> Optional[Role]:
        query = select(Role).where(and_(Role.slug == slug, Role.deleted_at.is_(None)))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_permissions(self, role_id: int) -> Optional[Role]:
        query = (
            select(Role)
            .options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
            .where(and_(Role.id == role_id, Role.deleted_at.is_(None)))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_paginated(
        self, page: int = 1, page_size: int = 20, search: Optional[str] = None
    ) -> tuple[list[Role], int]:
        base_query = select(Role).where(Role.deleted_at.is_(None))
        if search:
            base_query = base_query.where(Role.name.ilike(f"%{search}%"))
        total = (await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )).scalar_one()
        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base_query.order_by(Role.name).offset(offset).limit(page_size)
        )).scalars().all()
        return list(rows), total

    async def set_permissions(self, role_id: int, permission_ids: list[int]) -> None:
        """Replace all permissions for a role atomically."""
        from sqlalchemy import delete
        await self.db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        for pid in permission_ids:
            self.db.add(RolePermission(role_id=role_id, permission_id=pid))
        await self.db.flush()


class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Permission, db)

    async def get_by_name(self, name: str) -> Optional[Permission]:
        query = select(Permission).where(
            and_(Permission.name == name, Permission.deleted_at.is_(None))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_active(self) -> list[Permission]:
        result = await self.db.execute(
            select(Permission)
            .where(and_(Permission.deleted_at.is_(None), Permission.is_active.is_(True)))
            .order_by(Permission.module, Permission.action)
        )
        return list(result.scalars().all())
