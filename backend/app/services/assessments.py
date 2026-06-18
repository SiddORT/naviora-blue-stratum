"""Services for the Assessment module."""
from __future__ import annotations

import logging
import math
import uuid as _uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.assessments import (
    AssessmentExerciseRepository,
    AssessmentParticipantRepository,
    AssessmentRepository,
    AssessmentScheduleRepository,
)
from app.schemas.assessments import (
    AssessmentCreate,
    AssessmentExerciseResponse,
    AssessmentListResponse,
    AssessmentPage,
    AssessmentParticipantCreate,
    AssessmentParticipantResponse,
    AssessmentResponse,
    AssessmentScheduleResponse,
    AssessmentScheduleUpsert,
    AssessmentUpdate,
)

logger = logging.getLogger(__name__)


class AssessmentService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = AssessmentRepository(db)
        self.ex_repo = AssessmentExerciseRepository(db)
        self.sched_repo = AssessmentScheduleRepository(db)
        self.part_repo = AssessmentParticipantRepository(db)
        self.db = db

    # ── List ──────────────────────────────────────────────────────────────────

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        assessment_type: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> AssessmentPage:
        rows, total = await self.repo.get_paginated(
            page=page, page_size=page_size, search=search,
            status=status, assessment_type=assessment_type,
            sort_by=sort_by, sort_order=sort_order,
        )
        items = []
        for r in rows:
            pcount = await self.repo.participant_count(r.id)
            items.append(AssessmentListResponse(
                id=r.id, uuid=r.uuid,
                assessment_name=r.assessment_name,
                assessment_code=r.assessment_code,
                assessment_type=r.assessment_type,
                duration_minutes=r.duration_minutes,
                passing_score=r.passing_score,
                max_attempts=r.max_attempts,
                certificate_eligible=r.certificate_eligible,
                status=r.status,
                is_active=r.is_active,
                exercise_count=len(r.assessment_exercises),
                participant_count=pcount,
                created_at=r.created_at,
                updated_at=r.updated_at,
            ))
        return AssessmentPage(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=max(1, math.ceil(total / page_size)),
        )

    async def list_all_active(self) -> List[AssessmentListResponse]:
        rows = await self.repo.get_all_active()
        return [
            AssessmentListResponse(
                id=r.id, uuid=r.uuid,
                assessment_name=r.assessment_name,
                assessment_code=r.assessment_code,
                assessment_type=r.assessment_type,
                duration_minutes=r.duration_minutes,
                passing_score=r.passing_score,
                max_attempts=r.max_attempts,
                certificate_eligible=r.certificate_eligible,
                status=r.status,
                is_active=r.is_active,
                exercise_count=0,
                participant_count=0,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in rows
        ]

    # ── Get single ────────────────────────────────────────────────────────────

    async def get(self, uuid: str) -> AssessmentResponse:
        row = await self.repo.get_by_uuid_full(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        pcount = await self.repo.participant_count(row.id)
        return self._to_response(row, pcount)

    # ── Create ────────────────────────────────────────────────────────────────

    async def create(self, data: AssessmentCreate, by: Optional[str] = None) -> AssessmentResponse:
        if await self.repo.code_exists(data.assessment_code):
            raise ValueError(f"Assessment code {data.assessment_code!r} already exists")
        assessment = await self.repo.create({
            "uuid": str(_uuid.uuid4()),
            "assessment_name": data.assessment_name,
            "assessment_code": data.assessment_code,
            "description": data.description,
            "instructions": data.instructions,
            "assessment_type": data.assessment_type,
            "duration_minutes": data.duration_minutes,
            "passing_score": data.passing_score,
            "max_attempts": data.max_attempts,
            "randomize_exercise_order": data.randomize_exercise_order,
            "randomize_variant_selection": data.randomize_variant_selection,
            "certificate_eligible": data.certificate_eligible,
            "certificate_validity_months": data.certificate_validity_months,
            "status": "draft",
            "is_active": True,
            "created_by": by,
            "updated_by": by,
        })
        if data.exercises:
            await self.ex_repo.replace_all(
                assessment.id,
                [e.model_dump() for e in data.exercises],
            )
        await self.db.commit()
        full = await self.repo.get_by_uuid_full(assessment.uuid)
        return self._to_response(full, 0)

    # ── Update ────────────────────────────────────────────────────────────────

    async def update(self, uuid: str, data: AssessmentUpdate, by: Optional[str] = None) -> AssessmentResponse:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        if data.assessment_code and data.assessment_code != row.assessment_code:
            if await self.repo.code_exists(data.assessment_code, exclude_uuid=uuid):
                raise ValueError(f"Assessment code {data.assessment_code!r} already exists")
        update_dict: dict = {"updated_by": by}
        for field in (
            "assessment_name", "assessment_code", "description", "instructions",
            "assessment_type", "duration_minutes", "passing_score", "max_attempts",
            "randomize_exercise_order", "randomize_variant_selection",
            "certificate_eligible", "certificate_validity_months",
        ):
            val = getattr(data, field)
            if val is not None:
                update_dict[field] = val
        await self.repo.update(row, update_dict)
        if data.exercises is not None:
            await self.ex_repo.replace_all(row.id, [e.model_dump() for e in data.exercises])
        await self.db.commit()
        full = await self.repo.get_by_uuid_full(uuid)
        pcount = await self.repo.participant_count(full.id)
        return self._to_response(full, pcount)

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete(self, uuid: str, by: Optional[str] = None) -> None:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        await self.repo.soft_delete(row, by or "")
        await self.db.commit()

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def activate(self, uuid: str, by: Optional[str] = None) -> AssessmentResponse:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        await self.repo.update(row, {"status": "active", "is_active": True, "updated_by": by})
        await self.db.commit()
        return await self.get(uuid)

    async def archive(self, uuid: str, by: Optional[str] = None) -> AssessmentResponse:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        await self.repo.update(row, {"status": "archived", "is_active": False, "updated_by": by})
        await self.db.commit()
        return await self.get(uuid)

    # ── Schedule ──────────────────────────────────────────────────────────────

    async def get_schedule(self, uuid: str) -> Optional[AssessmentScheduleResponse]:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        sched = await self.sched_repo.get_by_assessment(row.id)
        if not sched:
            return None
        return AssessmentScheduleResponse(
            id=sched.id, uuid=sched.uuid, assessment_id=sched.assessment_id,
            start_date=sched.start_date, end_date=sched.end_date,
            timezone=sched.timezone, duration_override=sched.duration_override,
            is_open=sched.is_open, created_at=sched.created_at, updated_at=sched.updated_at,
        )

    async def upsert_schedule(self, uuid: str, data: AssessmentScheduleUpsert, by: Optional[str] = None) -> AssessmentScheduleResponse:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        sched = await self.sched_repo.upsert(row.id, data.model_dump(), str(_uuid.uuid4()))
        await self.db.commit()
        return AssessmentScheduleResponse(
            id=sched.id, uuid=sched.uuid, assessment_id=sched.assessment_id,
            start_date=sched.start_date, end_date=sched.end_date,
            timezone=sched.timezone, duration_override=sched.duration_override,
            is_open=sched.is_open, created_at=sched.created_at, updated_at=sched.updated_at,
        )

    # ── Participants ──────────────────────────────────────────────────────────

    async def get_participants(self, uuid: str) -> List[AssessmentParticipantResponse]:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        parts = await self.part_repo.get_by_assessment(row.id)
        return [
            AssessmentParticipantResponse(
                id=p.id, uuid=p.uuid, assessment_id=p.assessment_id,
                user_id=p.user_id, assignment_status=p.assignment_status,
                assigned_at=p.assigned_at, started_at=p.started_at,
                completed_at=p.completed_at, attempt_count=p.attempt_count,
                created_at=p.created_at, updated_at=p.updated_at,
            )
            for p in parts
        ]

    async def add_participant(self, uuid: str, data: AssessmentParticipantCreate, by: Optional[str] = None) -> AssessmentParticipantResponse:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        p = await self.part_repo.create(row.id, data.model_dump(), str(_uuid.uuid4()))
        await self.db.commit()
        return AssessmentParticipantResponse(
            id=p.id, uuid=p.uuid, assessment_id=p.assessment_id,
            user_id=p.user_id, assignment_status=p.assignment_status,
            assigned_at=p.assigned_at, started_at=p.started_at,
            completed_at=p.completed_at, attempt_count=p.attempt_count,
            created_at=p.created_at, updated_at=p.updated_at,
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _to_response(self, row, pcount: int) -> AssessmentResponse:
        exercises = []
        for ae in (row.assessment_exercises or []):
            ex = ae.exercise
            exercises.append(AssessmentExerciseResponse(
                id=ae.id,
                exercise_id=ae.exercise_id,
                exercise_uuid=ex.uuid if ex else None,
                exercise_name=ex.exercise_name if ex else None,
                exercise_code=ex.exercise_code if ex else None,
                sequence_number=ae.sequence_number,
                weightage=float(ae.weightage),
                mandatory=ae.mandatory,
            ))
        return AssessmentResponse(
            id=row.id, uuid=row.uuid,
            assessment_name=row.assessment_name,
            assessment_code=row.assessment_code,
            description=row.description,
            instructions=row.instructions,
            assessment_type=row.assessment_type,
            duration_minutes=row.duration_minutes,
            passing_score=row.passing_score,
            max_attempts=row.max_attempts,
            randomize_exercise_order=row.randomize_exercise_order,
            randomize_variant_selection=row.randomize_variant_selection,
            certificate_eligible=row.certificate_eligible,
            certificate_validity_months=row.certificate_validity_months,
            status=row.status,
            is_active=row.is_active,
            exercises=exercises,
            exercise_count=len(exercises),
            participant_count=pcount,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
