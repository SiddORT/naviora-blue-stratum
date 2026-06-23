"""Role and Permission repositories."""
from typing import Optional

from sqlalchemy import and_, delete, func, select
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
        """Replace all permissions for a role atomically (scope defaults to ALL)."""
        await self.db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        for pid in permission_ids:
            self.db.add(RolePermission(role_id=role_id, permission_id=pid, scope="ALL"))
        await self.db.flush()

    async def set_permissions_with_scope(
        self, role_id: int, entries: list[dict]
    ) -> None:
        """Replace permissions with explicit scope per entry.
        entries: list of {"permission_id": int, "scope": str}
        """
        await self.db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        for entry in entries:
            self.db.add(RolePermission(
                role_id=role_id,
                permission_id=entry["permission_id"],
                scope=entry.get("scope", "ALL"),
            ))
        await self.db.flush()

    async def get_user_count(self, role_id: int) -> int:
        from app.models.user_role import UserRole
        result = await self.db.execute(
            select(func.count()).where(UserRole.role_id == role_id)
        )
        return result.scalar_one()


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

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        module: Optional[str] = None,
    ) -> tuple[list[Permission], int]:
        base_query = select(Permission).where(Permission.deleted_at.is_(None))
        if module:
            base_query = base_query.where(Permission.module == module)
        if search:
            base_query = base_query.where(
                Permission.name.ilike(f"%{search}%") | Permission.description.ilike(f"%{search}%")
            )
        total = (await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )).scalar_one()
        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base_query.order_by(Permission.module, Permission.action).offset(offset).limit(page_size)
        )).scalars().all()
        return list(rows), total
