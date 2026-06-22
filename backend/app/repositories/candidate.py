"""Candidate repository."""
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate
from app.repositories.base import BaseRepository


class CandidateRepository(BaseRepository[Candidate]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Candidate, db)

    async def get_by_email(self, email: str) -> Optional[Candidate]:
        query = select(Candidate).where(
            and_(Candidate.email == email, Candidate.deleted_at.is_(None))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def email_exists(self, email: str, exclude_id: Optional[int] = None) -> bool:
        query = select(func.count()).where(
            and_(Candidate.email == email, Candidate.deleted_at.is_(None))
        )
        if exclude_id:
            query = query.where(Candidate.id != exclude_id)
        count = (await self.db.execute(query)).scalar_one()
        return count > 0

    async def seafarer_id_exists(self, seafarer_id: str, exclude_id: Optional[int] = None) -> bool:
        query = select(func.count()).where(
            and_(Candidate.seafarer_id == seafarer_id, Candidate.deleted_at.is_(None))
        )
        if exclude_id:
            query = query.where(Candidate.id != exclude_id)
        count = (await self.db.execute(query)).scalar_one()
        return count > 0

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        organization_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> tuple[list[Candidate], int]:
        base_query = select(Candidate).where(Candidate.deleted_at.is_(None))

        if organization_id is not None:
            base_query = base_query.where(Candidate.organization_id == organization_id)
        if status:
            base_query = base_query.where(Candidate.status == status)
        if search:
            pattern = f"%{search}%"
            base_query = base_query.where(
                Candidate.full_name.ilike(pattern)
                | Candidate.email.ilike(pattern)
                | Candidate.seafarer_id.ilike(pattern)
            )

        count_query = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        offset = (page - 1) * page_size
        rows = (
            await self.db.execute(
                base_query.order_by(Candidate.created_at.desc()).offset(offset).limit(page_size)
            )
        ).scalars().all()

        return list(rows), total
