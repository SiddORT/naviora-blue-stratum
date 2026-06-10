"""Organization repository."""
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.user import User
from app.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Organization, db)

    async def get_by_code(self, code: str) -> Optional[Organization]:
        query = select(Organization).where(
            and_(Organization.code == code, Organization.deleted_at.is_(None))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def code_exists(self, code: str, exclude_id: Optional[int] = None) -> bool:
        query = select(func.count()).where(
            and_(Organization.code == code, Organization.deleted_at.is_(None))
        )
        if exclude_id:
            query = query.where(Organization.id != exclude_id)
        return (await self.db.execute(query)).scalar_one() > 0

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[list[Organization], int]:
        base_query = select(Organization).where(Organization.deleted_at.is_(None))
        if status:
            base_query = base_query.where(Organization.subscription_status == status)
        if search:
            pattern = f"%{search}%"
            base_query = base_query.where(
                Organization.name.ilike(pattern) | Organization.code.ilike(pattern)
            )

        total = (await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )).scalar_one()

        offset = (page - 1) * page_size
        rows = (await self.db.execute(
            base_query.order_by(Organization.created_at.desc()).offset(offset).limit(page_size)
        )).scalars().all()

        return list(rows), total

    async def get_user_count(self, organization_id: int) -> int:
        query = select(func.count()).where(
            and_(User.organization_id == organization_id, User.deleted_at.is_(None))
        )
        return (await self.db.execute(query)).scalar_one()
