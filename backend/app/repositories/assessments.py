"""Repositories for the Assessment module."""
import math
from typing import List, Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.assessment_exercise import AssessmentExercise
from app.models.assessment_participant import AssessmentParticipant
from app.models.assessment_schedule import AssessmentSchedule
from app.models.user import User
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
    ) -> tuple:
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

    async def get_all_active(self) -> List[Assessment]:
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
        q = select(func.count()).where(
            and_(
                AssessmentParticipant.assessment_id == assessment_id,
                AssessmentParticipant.deleted_at.is_(None),
            )
        )
        return (await self.db.execute(q)).scalar_one()


class AssessmentExerciseRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_assessment(self, assessment_id: int) -> List[AssessmentExercise]:
        q = (
            select(AssessmentExercise)
            .where(AssessmentExercise.assessment_id == assessment_id)
            .options(selectinload(AssessmentExercise.exercise))
            .order_by(AssessmentExercise.sequence_number)
        )
        return list((await self.db.execute(q)).scalars().all())

    async def replace_all(self, assessment_id: int, items: List[dict]) -> None:
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
        q = select(AssessmentSchedule).where(
            and_(
                AssessmentSchedule.assessment_id == assessment_id,
                AssessmentSchedule.deleted_at.is_(None),
            )
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_by_uuid(self, uuid: str) -> Optional[AssessmentSchedule]:
        q = select(AssessmentSchedule).where(
            and_(AssessmentSchedule.uuid == uuid, AssessmentSchedule.deleted_at.is_(None))
        )
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

    async def create(self, assessment_id: int, data: dict, uuid_val: str) -> AssessmentSchedule:
        sched = AssessmentSchedule(uuid=uuid_val, assessment_id=assessment_id, **data)
        self.db.add(sched)
        await self.db.flush()
        return sched

    async def update(self, sched: AssessmentSchedule, data: dict) -> AssessmentSchedule:
        for k, v in data.items():
            setattr(sched, k, v)
        self.db.add(sched)
        await self.db.flush()
        return sched


class AssessmentParticipantRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_paginated(
        self,
        assessment_id: int,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        assignment_status: Optional[str] = None,
        result_status: Optional[str] = None,
        sort_by: str = "assigned_at",
        sort_order: str = "desc",
    ) -> tuple:
        base_q = (
            select(AssessmentParticipant)
            .where(
                and_(
                    AssessmentParticipant.assessment_id == assessment_id,
                    AssessmentParticipant.deleted_at.is_(None),
                )
            )
            .join(User, AssessmentParticipant.user_id == User.id, isouter=True)
        )
        if search:
            term = f"%{search}%"
            base_q = base_q.where(or_(
                User.full_name.ilike(term),
                User.email.ilike(term),
            ))
        if assignment_status:
            base_q = base_q.where(AssessmentParticipant.assignment_status == assignment_status)
        if result_status:
            base_q = base_q.where(AssessmentParticipant.result_status == result_status)

        total: int = (await self.db.execute(
            select(func.count()).select_from(base_q.subquery())
        )).scalar_one()

        col = getattr(AssessmentParticipant, sort_by, AssessmentParticipant.created_at)
        data_q = (
            base_q
            .options(selectinload(AssessmentParticipant.user))
            .order_by(col.desc() if sort_order == "desc" else col.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = list((await self.db.execute(data_q)).scalars().all())
        return rows, total

    async def get_by_assessment(self, assessment_id: int) -> List[AssessmentParticipant]:
        q = (
            select(AssessmentParticipant)
            .where(
                and_(
                    AssessmentParticipant.assessment_id == assessment_id,
                    AssessmentParticipant.deleted_at.is_(None),
                )
            )
            .options(selectinload(AssessmentParticipant.user))
            .order_by(AssessmentParticipant.created_at.desc())
        )
        return list((await self.db.execute(q)).scalars().all())

    async def get_by_uuid(self, uuid: str) -> Optional[AssessmentParticipant]:
        q = select(AssessmentParticipant).where(
            and_(AssessmentParticipant.uuid == uuid, AssessmentParticipant.deleted_at.is_(None))
        ).options(selectinload(AssessmentParticipant.user))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_by_id(self, participant_id: int) -> Optional[AssessmentParticipant]:
        q = select(AssessmentParticipant).where(
            and_(AssessmentParticipant.id == participant_id, AssessmentParticipant.deleted_at.is_(None))
        ).options(selectinload(AssessmentParticipant.user))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def exists_active(self, assessment_id: int, user_id: int) -> bool:
        q = select(AssessmentParticipant).where(
            and_(
                AssessmentParticipant.assessment_id == assessment_id,
                AssessmentParticipant.user_id == user_id,
                AssessmentParticipant.deleted_at.is_(None),
                AssessmentParticipant.assignment_status != "Cancelled",
            )
        )
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def create(self, assessment_id: int, data: dict, uuid_val: str) -> AssessmentParticipant:
        p = AssessmentParticipant(uuid=uuid_val, assessment_id=assessment_id, **data)
        self.db.add(p)
        await self.db.flush()
        return p

    async def update(self, participant: AssessmentParticipant, data: dict) -> AssessmentParticipant:
        for k, v in data.items():
            setattr(participant, k, v)
        self.db.add(participant)
        await self.db.flush()
        return participant

    async def progress_summary(self, assessment_id: int) -> dict:
        rows = await self.get_by_assessment(assessment_id)
        summary = {
            "total_participants": len(rows),
            "not_started": 0,
            "in_progress": 0,
            "completed": 0,
            "passed": 0,
            "failed": 0,
            "expired": 0,
            "cancelled": 0,
        }
        for r in rows:
            status = r.assignment_status
            if status == "Assigned":
                summary["not_started"] += 1
            elif status == "In Progress":
                summary["in_progress"] += 1
            elif status == "Completed":
                summary["completed"] += 1
            elif status == "Passed":
                summary["passed"] += 1
            elif status == "Failed":
                summary["failed"] += 1
            elif status == "Expired":
                summary["expired"] += 1
            elif status == "Cancelled":
                summary["cancelled"] += 1
        return summary


class AssessmentAttemptRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_participant(self, participant_id: int) -> List[AssessmentAttempt]:
        q = (
            select(AssessmentAttempt)
            .where(
                and_(
                    AssessmentAttempt.assessment_participant_id == participant_id,
                    AssessmentAttempt.deleted_at.is_(None),
                )
            )
            .order_by(AssessmentAttempt.attempt_number)
        )
        return list((await self.db.execute(q)).scalars().all())

    async def get_by_uuid(self, uuid: str) -> Optional[AssessmentAttempt]:
        q = select(AssessmentAttempt).where(
            and_(AssessmentAttempt.uuid == uuid, AssessmentAttempt.deleted_at.is_(None))
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def next_attempt_number(self, participant_id: int) -> int:
        q = select(func.max(AssessmentAttempt.attempt_number)).where(
            AssessmentAttempt.assessment_participant_id == participant_id
        )
        result = (await self.db.execute(q)).scalar_one_or_none()
        return (result or 0) + 1

    async def create(self, participant_id: int, data: dict, uuid_val: str) -> AssessmentAttempt:
        attempt = AssessmentAttempt(
            uuid=uuid_val,
            assessment_participant_id=participant_id,
            **data,
        )
        self.db.add(attempt)
        await self.db.flush()
        return attempt
