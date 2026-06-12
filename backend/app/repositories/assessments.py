"""Repositories for the Assessment Engine module."""
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assessment_category import AssessmentCategory
from app.models.assessment_exercise import AssessmentExercise
from app.models.assessment_rule import AssessmentRule
from app.models.assessment_template import AssessmentTemplate
from app.models.assessment_version import AssessmentVersion
from app.repositories.base import BaseRepository


# ── Assessment Category ──────────────────────────────────────────────────────

class AssessmentCategoryRepository(BaseRepository[AssessmentCategory]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AssessmentCategory, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(AssessmentCategory).where(
            and_(AssessmentCategory.category_code == code, AssessmentCategory.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(AssessmentCategory.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "category_name",
        sort_order: str = "asc",
    ):
        q = select(AssessmentCategory).where(AssessmentCategory.deleted_at.is_(None))
        if search:
            q = q.where(
                or_(
                    AssessmentCategory.category_name.ilike(f"%{search}%"),
                    AssessmentCategory.category_code.ilike(f"%{search}%"),
                )
            )
        if status:
            q = q.where(AssessmentCategory.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(AssessmentCategory, sort_by, AssessmentCategory.category_name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_all_active(self):
        q = select(AssessmentCategory).where(
            and_(AssessmentCategory.deleted_at.is_(None), AssessmentCategory.status == "active")
        ).order_by(AssessmentCategory.category_name)
        return list((await self.db.execute(q)).scalars().all())


# ── Assessment Template ──────────────────────────────────────────────────────

class AssessmentTemplateRepository(BaseRepository[AssessmentTemplate]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AssessmentTemplate, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(AssessmentTemplate).where(
            and_(AssessmentTemplate.assessment_code == code, AssessmentTemplate.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(AssessmentTemplate.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        category_id: Optional[int] = None,
        sort_by: str = "assessment_name",
        sort_order: str = "asc",
    ):
        q = (
            select(AssessmentTemplate)
            .where(AssessmentTemplate.deleted_at.is_(None))
            .options(
                selectinload(AssessmentTemplate.category),
                selectinload(AssessmentTemplate.assessment_exercises),
            )
        )
        if search:
            q = q.where(
                or_(
                    AssessmentTemplate.assessment_name.ilike(f"%{search}%"),
                    AssessmentTemplate.assessment_code.ilike(f"%{search}%"),
                )
            )
        if status:
            q = q.where(AssessmentTemplate.status == status)
        if category_id:
            q = q.where(AssessmentTemplate.category_id == category_id)
        total = (await self.db.execute(select(func.count()).select_from(
            select(AssessmentTemplate).where(AssessmentTemplate.deleted_at.is_(None)).subquery()
        ))).scalar_one()
        col = getattr(AssessmentTemplate, sort_by, AssessmentTemplate.assessment_name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def get_by_uuid_full(self, uuid: str):
        q = (
            select(AssessmentTemplate)
            .where(and_(AssessmentTemplate.uuid == uuid, AssessmentTemplate.deleted_at.is_(None)))
            .options(
                selectinload(AssessmentTemplate.category),
                selectinload(AssessmentTemplate.assessment_exercises).selectinload(AssessmentExercise.exercise),
                selectinload(AssessmentTemplate.rule),
                selectinload(AssessmentTemplate.versions),
            )
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_by_id_full(self, record_id: int):
        q = (
            select(AssessmentTemplate)
            .where(and_(AssessmentTemplate.id == record_id, AssessmentTemplate.deleted_at.is_(None)))
            .options(
                selectinload(AssessmentTemplate.category),
                selectinload(AssessmentTemplate.assessment_exercises).selectinload(AssessmentExercise.exercise),
                selectinload(AssessmentTemplate.rule),
                selectinload(AssessmentTemplate.versions),
            )
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_all_active(self):
        q = (
            select(AssessmentTemplate)
            .where(and_(AssessmentTemplate.deleted_at.is_(None), AssessmentTemplate.status == "active"))
            .options(selectinload(AssessmentTemplate.category))
            .order_by(AssessmentTemplate.assessment_name)
        )
        return list((await self.db.execute(q)).scalars().all())


# ── Assessment Exercise ──────────────────────────────────────────────────────

class AssessmentExerciseRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_assessment(self, assessment_id: int):
        q = (
            select(AssessmentExercise)
            .where(AssessmentExercise.assessment_id == assessment_id)
            .options(selectinload(AssessmentExercise.exercise))
            .order_by(AssessmentExercise.sequence_number)
        )
        return list((await self.db.execute(q)).scalars().all())

    async def delete_by_assessment(self, assessment_id: int) -> None:
        rows = await self.get_by_assessment(assessment_id)
        for row in rows:
            await self.db.delete(row)
        await self.db.flush()

    async def create_bulk(self, assessment_id: int, items: list) -> list:
        created = []
        for item in items:
            ae = AssessmentExercise(
                assessment_id=assessment_id,
                exercise_id=item["exercise_id"],
                sequence_number=item.get("sequence_number", 1),
                weightage=item.get("weightage", 0.0),
                mandatory=item.get("mandatory", True),
            )
            self.db.add(ae)
            created.append(ae)
        await self.db.flush()
        for ae in created:
            await self.db.refresh(ae)
        return created


# ── Assessment Rule ──────────────────────────────────────────────────────────

class AssessmentRuleRepository(BaseRepository[AssessmentRule]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AssessmentRule, db)

    async def get_by_assessment_id(self, assessment_id: int):
        q = (
            select(AssessmentRule)
            .where(and_(AssessmentRule.assessment_id == assessment_id, AssessmentRule.deleted_at.is_(None)))
            .options(selectinload(AssessmentRule.assessment))
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        sort_by: str = "id",
        sort_order: str = "asc",
    ):
        q = (
            select(AssessmentRule)
            .where(AssessmentRule.deleted_at.is_(None))
            .options(selectinload(AssessmentRule.assessment))
        )
        total = (await self.db.execute(select(func.count()).select_from(
            select(AssessmentRule).where(AssessmentRule.deleted_at.is_(None)).subquery()
        ))).scalar_one()
        col = getattr(AssessmentRule, sort_by, AssessmentRule.id)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total


# ── Assessment Version ───────────────────────────────────────────────────────

class AssessmentVersionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, assessment_id: int, version_number: int, change_summary: Optional[str], created_by: Optional[str]):
        v = AssessmentVersion(
            assessment_id=assessment_id,
            version_number=version_number,
            change_summary=change_summary,
            created_by=created_by,
        )
        self.db.add(v)
        await self.db.flush()
        await self.db.refresh(v)
        return v

    async def get_by_assessment(self, assessment_id: int):
        q = (
            select(AssessmentVersion)
            .where(AssessmentVersion.assessment_id == assessment_id)
            .order_by(AssessmentVersion.version_number.desc())
        )
        return list((await self.db.execute(q)).scalars().all())
