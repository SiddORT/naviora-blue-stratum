"""Repositories for the Assessment module."""
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assessment import Assessment
from app.models.assessment_exercise import AssessmentExercise
from app.models.assessment_participant import AssessmentParticipant
from app.models.assessment_schedule import AssessmentSchedule
from app.repositories.base import BaseRepository


class AssessmentRepository(BaseRepository[Assessment]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Assessment, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(Assessment).where(
            and_(Assessment.assessment_code == code, Assessment.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(Assessment.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        assessment_type: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[Assessment], int]:
        base_q = select(Assessment).where(Assessment.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            base_q = base_q.where(or_(
                Assessment.assessment_name.ilike(term),
                Assessment.assessment_code.ilike(term),
            ))
        if status:
            base_q = base_q.where(Assessment.status == status)
        if assessment_type:
            base_q = base_q.where(Assessment.assessment_type == assessment_type)

        total_q = select(func.count()).select_from(base_q.subquery())
        total: int = (await self.db.execute(total_q)).scalar_one()

        col = getattr(Assessment, sort_by, Assessment.created_at)
        data_q = (
            base_q
            .options(selectinload(Assessment.assessment_exercises))
            .order_by(col.desc() if sort_order == "desc" else col.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list((await self.db.execute(data_q)).scalars().all())
        return rows, total

    async def get_all_active(self) -> list[Assessment]:
        q = (
            select(Assessment)
            .where(and_(Assessment.deleted_at.is_(None), Assessment.status == "active"))
            .order_by(Assessment.assessment_name)
        )
        return list((await self.db.execute(q)).scalars().all())

    async def get_by_uuid_full(self, uuid: str) -> Optional[Assessment]:
        q = (
            select(Assessment)
            .where(and_(Assessment.uuid == uuid, Assessment.deleted_at.is_(None)))
            .options(
                selectinload(Assessment.assessment_exercises).selectinload(AssessmentExercise.exercise),
            )
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def participant_count(self, assessment_id: int) -> int:
        q = select(func.count()).where(AssessmentParticipant.assessment_id == assessment_id)
        return (await self.db.execute(q)).scalar_one()


class AssessmentExerciseRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_assessment(self, assessment_id: int) -> list[AssessmentExercise]:
        q = (
            select(AssessmentExercise)
            .where(AssessmentExercise.assessment_id == assessment_id)
            .options(selectinload(AssessmentExercise.exercise))
            .order_by(AssessmentExercise.sequence_number)
        )
        return list((await self.db.execute(q)).scalars().all())

    async def replace_all(self, assessment_id: int, items: list[dict]) -> None:
        existing = await self.get_by_assessment(assessment_id)
        for row in existing:
            await self.db.delete(row)
        await self.db.flush()
        for item in items:
            ex = AssessmentExercise(
                assessment_id=assessment_id,
                exercise_id=item["exercise_id"],
                sequence_number=item.get("sequence_number", 1),
                weightage=item.get("weightage", 0.0),
                mandatory=item.get("mandatory", True),
            )
            self.db.add(ex)
        await self.db.flush()


class AssessmentScheduleRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_assessment(self, assessment_id: int) -> Optional[AssessmentSchedule]:
        q = select(AssessmentSchedule).where(AssessmentSchedule.assessment_id == assessment_id)
        return (await self.db.execute(q)).scalar_one_or_none()

    async def upsert(self, assessment_id: int, data: dict, uuid_val: str) -> AssessmentSchedule:
        existing = await self.get_by_assessment(assessment_id)
        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
            self.db.add(existing)
            await self.db.flush()
            return existing
        sched = AssessmentSchedule(uuid=uuid_val, assessment_id=assessment_id, **data)
        self.db.add(sched)
        await self.db.flush()
        return sched


class AssessmentParticipantRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_assessment(self, assessment_id: int) -> list[AssessmentParticipant]:
        q = (
            select(AssessmentParticipant)
            .where(AssessmentParticipant.assessment_id == assessment_id)
            .order_by(AssessmentParticipant.created_at.desc())
        )
        return list((await self.db.execute(q)).scalars().all())

    async def create(self, assessment_id: int, data: dict, uuid_val: str) -> AssessmentParticipant:
        p = AssessmentParticipant(uuid=uuid_val, assessment_id=assessment_id, **data)
        self.db.add(p)
        await self.db.flush()
        return p
