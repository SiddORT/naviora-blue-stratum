"""Services for the Assessment module."""
import logging
import math
import uuid as _uuid
from datetime import timezone as _tz
from datetime import datetime
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.assessments import (
    AssessmentAttemptRepository,
    AssessmentExerciseRepository,
    AssessmentParticipantRepository,
    AssessmentRepository,
    AssessmentScheduleRepository,
)
from app.schemas.assessments import (
    AssessmentAttemptResponse,
    AssessmentCreate,
    AssessmentExerciseResponse,
    AssessmentListResponse,
    AssessmentPage,
    AssessmentParticipantBulkAssign,
    AssessmentParticipantCreate,
    AssessmentParticipantPage,
    AssessmentParticipantResponse,
    AssessmentParticipantUpdate,
    AssessmentProgressSummary,
    AssessmentResponse,
    AssessmentScheduleResponse,
    AssessmentScheduleUpsert,
    AssessmentUpdate,
    BulkAssignResult,
)

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(_tz.utc)


def _participant_response(p) -> AssessmentParticipantResponse:
    return AssessmentParticipantResponse(
        id=p.id,
        uuid=p.uuid,
        assessment_id=p.assessment_id,
        user_id=p.user_id,
        assigned_by=p.assigned_by,
        assignment_status=p.assignment_status,
        assigned_at=p.assigned_at,
        started_at=p.started_at,
        completed_at=p.completed_at,
        attempt_count=p.attempt_count,
        max_attempts_override=p.max_attempts_override,
        result_status=p.result_status,
        remarks=p.remarks,
        user_full_name=p.user.full_name if p.user else None,
        user_email=p.user.email if p.user else None,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


def _schedule_response(s) -> AssessmentScheduleResponse:
    return AssessmentScheduleResponse(
        id=s.id,
        uuid=s.uuid,
        assessment_id=s.assessment_id,
        schedule_type=s.schedule_type,
        start_date=s.start_date,
        end_date=s.end_date,
        timezone=s.timezone,
        duration_override=s.duration_override,
        allow_late_start=s.allow_late_start,
        grace_period_minutes=s.grace_period_minutes,
        schedule_status=s.schedule_status,
        is_open=s.is_open,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


class AssessmentService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = AssessmentRepository(db)
        self.ex_repo = AssessmentExerciseRepository(db)
        self.sched_repo = AssessmentScheduleRepository(db)
        self.part_repo = AssessmentParticipantRepository(db)
        self.attempt_repo = AssessmentAttemptRepository(db)
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
            await self.ex_repo.replace_all(assessment.id, [e.model_dump() for e in data.exercises])
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
        return _schedule_response(sched)

    async def upsert_schedule(self, uuid: str, data: AssessmentScheduleUpsert, by: Optional[str] = None) -> AssessmentScheduleResponse:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        payload = data.model_dump()
        payload["updated_by"] = by
        sched = await self.sched_repo.upsert(row.id, payload, str(_uuid.uuid4()))
        await self.db.commit()
        # Re-fetch to ensure fresh state
        sched = await self.sched_repo.get_by_assessment(row.id)
        return _schedule_response(sched)

    async def update_schedule(self, assessment_uuid: str, schedule_uuid: str, data: AssessmentScheduleUpsert, by: Optional[str] = None) -> AssessmentScheduleResponse:
        row = await self.repo.get_by_uuid(assessment_uuid)
        if not row:
            raise ValueError(f"Assessment {assessment_uuid!r} not found")
        sched = await self.sched_repo.get_by_uuid(schedule_uuid)
        if not sched or sched.assessment_id != row.id:
            raise ValueError(f"Schedule {schedule_uuid!r} not found")
        payload = data.model_dump()
        payload["updated_by"] = by
        await self.sched_repo.update(sched, payload)
        await self.db.commit()
        return _schedule_response(sched)

    # ── Participants (paginated) ───────────────────────────────────────────────

    async def list_participants(
        self,
        uuid: str,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        assignment_status: Optional[str] = None,
        result_status: Optional[str] = None,
        sort_by: str = "assigned_at",
        sort_order: str = "desc",
    ) -> AssessmentParticipantPage:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        rows, total = await self.part_repo.get_paginated(
            assessment_id=row.id,
            page=page, page_size=page_size,
            search=search,
            assignment_status=assignment_status,
            result_status=result_status,
            sort_by=sort_by, sort_order=sort_order,
        )
        items = [_participant_response(p) for p in rows]
        return AssessmentParticipantPage(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=max(1, math.ceil(total / page_size)),
        )

    async def get_participants(self, uuid: str) -> List[AssessmentParticipantResponse]:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        parts = await self.part_repo.get_by_assessment(row.id)
        return [_participant_response(p) for p in parts]

    async def add_participant(
        self,
        uuid: str,
        data: AssessmentParticipantCreate,
        by: Optional[str] = None,
    ) -> AssessmentParticipantResponse:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        if row.status != "active":
            raise ValueError("Assessment must be active to assign participants")
        if await self.part_repo.exists_active(row.id, data.user_id):
            raise ValueError("User is already assigned to this assessment")
        p = await self.part_repo.create(row.id, {
            "user_id": data.user_id,
            "assigned_by": by,
            "assigned_at": _utcnow(),
            "assignment_status": "Assigned",
            "attempt_count": 0,
            "max_attempts_override": data.max_attempts_override,
            "result_status": "Pending",
            "remarks": data.remarks,
            "created_by": by,
            "updated_by": by,
        }, str(_uuid.uuid4()))
        await self.db.commit()
        p = await self.part_repo.get_by_id(p.id)
        return _participant_response(p)

    async def bulk_assign_participants(
        self,
        uuid: str,
        data: AssessmentParticipantBulkAssign,
        by: Optional[str] = None,
    ) -> BulkAssignResult:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        if row.status != "active":
            raise ValueError("Assessment must be active to assign participants")
        assigned = 0
        skipped = 0
        skipped_ids: List[int] = []
        for user_id in data.user_ids:
            if await self.part_repo.exists_active(row.id, user_id):
                skipped += 1
                skipped_ids.append(user_id)
                continue
            await self.part_repo.create(row.id, {
                "user_id": user_id,
                "assigned_by": by,
                "assigned_at": _utcnow(),
                "assignment_status": "Assigned",
                "attempt_count": 0,
                "max_attempts_override": data.max_attempts_override,
                "result_status": "Pending",
                "remarks": data.remarks,
                "created_by": by,
                "updated_by": by,
            }, str(_uuid.uuid4()))
            assigned += 1
        await self.db.commit()
        return BulkAssignResult(assigned=assigned, skipped=skipped, skipped_user_ids=skipped_ids)

    async def update_participant(
        self,
        assessment_uuid: str,
        participant_uuid: str,
        data: AssessmentParticipantUpdate,
        by: Optional[str] = None,
    ) -> AssessmentParticipantResponse:
        row = await self.repo.get_by_uuid(assessment_uuid)
        if not row:
            raise ValueError(f"Assessment {assessment_uuid!r} not found")
        p = await self.part_repo.get_by_uuid(participant_uuid)
        if not p or p.assessment_id != row.id:
            raise ValueError(f"Participant {participant_uuid!r} not found")
        update_dict: dict = {"updated_by": by}
        for field in ("assignment_status", "max_attempts_override", "result_status", "remarks"):
            val = getattr(data, field)
            if val is not None:
                update_dict[field] = val
        await self.part_repo.update(p, update_dict)
        await self.db.commit()
        p = await self.part_repo.get_by_uuid(participant_uuid)
        return _participant_response(p)

    async def remove_participant(
        self,
        assessment_uuid: str,
        participant_uuid: str,
        by: Optional[str] = None,
    ) -> None:
        row = await self.repo.get_by_uuid(assessment_uuid)
        if not row:
            raise ValueError(f"Assessment {assessment_uuid!r} not found")
        p = await self.part_repo.get_by_uuid(participant_uuid)
        if not p or p.assessment_id != row.id:
            raise ValueError(f"Participant {participant_uuid!r} not found")
        p.soft_delete(by or "")
        self.db.add(p)
        await self.db.commit()

    # ── Progress ──────────────────────────────────────────────────────────────

    async def get_progress_summary(self, uuid: str) -> AssessmentProgressSummary:
        row = await self.repo.get_by_uuid(uuid)
        if not row:
            raise ValueError(f"Assessment {uuid!r} not found")
        summary = await self.part_repo.progress_summary(row.id)
        return AssessmentProgressSummary(**summary)

    # ── Attempts ──────────────────────────────────────────────────────────────

    async def list_attempts(self, participant_uuid: str) -> List[AssessmentAttemptResponse]:
        p = await self.part_repo.get_by_uuid(participant_uuid)
        if not p:
            raise ValueError(f"Participant {participant_uuid!r} not found")
        attempts = await self.attempt_repo.get_by_participant(p.id)
        return [
            AssessmentAttemptResponse(
                id=a.id, uuid=a.uuid,
                assessment_participant_id=a.assessment_participant_id,
                attempt_number=a.attempt_number,
                started_at=a.started_at,
                completed_at=a.completed_at,
                simulator_session_id=a.simulator_session_id,
                score=a.score,
                result_status=a.result_status,
                remarks=a.remarks,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in attempts
        ]

    async def get_attempt(self, attempt_uuid: str) -> AssessmentAttemptResponse:
        a = await self.attempt_repo.get_by_uuid(attempt_uuid)
        if not a:
            raise ValueError(f"Attempt {attempt_uuid!r} not found")
        return AssessmentAttemptResponse(
            id=a.id, uuid=a.uuid,
            assessment_participant_id=a.assessment_participant_id,
            attempt_number=a.attempt_number,
            started_at=a.started_at,
            completed_at=a.completed_at,
            simulator_session_id=a.simulator_session_id,
            score=a.score,
            result_status=a.result_status,
            remarks=a.remarks,
            created_at=a.created_at,
            updated_at=a.updated_at,
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
