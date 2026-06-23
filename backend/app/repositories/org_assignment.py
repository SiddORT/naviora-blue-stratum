"""OrganizationAssignment repository."""
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.organization_assignment import OrganizationAssignment
from app.models.user import User
from app.models.organization import Organization  # type: ignore[attr-defined]


class OrgAssignmentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, record_id: int) -> Optional[OrganizationAssignment]:
        result = await self.db.execute(
            select(OrganizationAssignment)
            .options(
                selectinload(OrganizationAssignment.user),
                selectinload(OrganizationAssignment.organization),
            )
            .where(OrganizationAssignment.id == record_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_org(self, user_id: int, org_id: int) -> Optional[OrganizationAssignment]:
        result = await self.db.execute(
            select(OrganizationAssignment).where(
                and_(
                    OrganizationAssignment.user_id == user_id,
                    OrganizationAssignment.organization_id == org_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_all_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> tuple[list[OrganizationAssignment], int]:
        base_query = (
            select(OrganizationAssignment)
            .options(
                selectinload(OrganizationAssignment.user),
                selectinload(OrganizationAssignment.organization),
            )
        )
        if user_id is not None:
            base_query = base_query.where(OrganizationAssignment.user_id == user_id)
        if organization_id is not None:
            base_query = base_query.where(OrganizationAssignment.organization_id == organization_id)
        if search:
            base_query = base_query.join(User, User.id == OrganizationAssignment.user_id).where(
                User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
            )

        total = (
            await self.db.execute(select(func.count()).select_from(base_query.subquery()))
        ).scalar_one()

        offset = (page - 1) * page_size
        rows = (
            await self.db.execute(
                base_query.order_by(OrganizationAssignment.created_at.desc()).offset(offset).limit(page_size)
            )
        ).scalars().all()

        return list(rows), total

    async def create(self, obj_in: dict) -> OrganizationAssignment:
        db_obj = OrganizationAssignment(**obj_in)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: OrganizationAssignment, obj_in: dict) -> OrganizationAssignment:
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: OrganizationAssignment) -> None:
        await self.db.delete(db_obj)
        await self.db.flush()
