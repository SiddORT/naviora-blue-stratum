"""Services for the Assessment Engine module."""
import logging
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment_category import AssessmentCategory
from app.models.assessment_exercise import AssessmentExercise
from app.models.assessment_rule import AssessmentRule
from app.models.assessment_template import AssessmentTemplate
from app.models.assessment_version import AssessmentVersion
from app.repositories.assessments import (
    AssessmentCategoryRepository,
    AssessmentExerciseRepository,
    AssessmentRuleRepository,
    AssessmentTemplateRepository,
    AssessmentVersionRepository,
)
from app.schemas.assessments import (
    AssessmentCategoryCreate,
    AssessmentCategoryListResponse,
    AssessmentCategoryResponse,
    AssessmentCategoryUpdate,
    AssessmentCloneRequest,
    AssessmentExerciseResponse,
    AssessmentRuleCreate,
    AssessmentRuleListResponse,
    AssessmentRuleResponse,
    AssessmentRuleUpdate,
    AssessmentTemplateCreate,
    AssessmentTemplateListResponse,
    AssessmentTemplateResponse,
    AssessmentTemplateUpdate,
    AssessmentVersionResponse,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)
_MODULE = "assessments"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _f(v) -> Optional[float]:
    return float(v) if v is not None else None


def _cat_response(c: AssessmentCategory) -> AssessmentCategoryResponse:
    return AssessmentCategoryResponse(
        id=c.id, uuid=c.uuid, category_name=c.category_name, category_code=c.category_code,
        description=c.description, status=c.status, is_active=c.is_active,
        created_at=c.created_at, updated_at=c.updated_at,
    )


def _cat_list(c: AssessmentCategory) -> AssessmentCategoryListResponse:
    return AssessmentCategoryListResponse(
        id=c.id, uuid=c.uuid, category_name=c.category_name, category_code=c.category_code,
        description=c.description, status=c.status, is_active=c.is_active, updated_at=c.updated_at,
    )


def _ae_response(ae: AssessmentExercise) -> AssessmentExerciseResponse:
    ex = ae.exercise if hasattr(ae, "exercise") and ae.exercise is not None else None
    return AssessmentExerciseResponse(
        id=ae.id,
        exercise_id=ae.exercise_id,
        exercise_uuid=ex.uuid if ex else None,
        exercise_name=ex.exercise_name if ex else None,
        exercise_code=ex.exercise_code if ex else None,
        sequence_number=ae.sequence_number,
        weightage=float(ae.weightage) if ae.weightage is not None else 0.0,
        mandatory=ae.mandatory,
    )


def _tmpl_response(t: AssessmentTemplate) -> AssessmentTemplateResponse:
    cat = t.category if hasattr(t, "category") and t.category is not None else None
    aes = t.assessment_exercises if hasattr(t, "assessment_exercises") else []
    return AssessmentTemplateResponse(
        id=t.id, uuid=t.uuid,
        assessment_name=t.assessment_name, assessment_code=t.assessment_code,
        category_id=t.category_id,
        category_name=cat.category_name if cat else None,
        description=t.description, instructions=t.instructions,
        duration_minutes=t.duration_minutes,
        passing_score=_f(t.passing_score),
        max_attempts=t.max_attempts,
        variant_selection_mode=t.variant_selection_mode,
        randomize_exercise_order=t.randomize_exercise_order,
        randomize_variant_selection=t.randomize_variant_selection,
        status=t.status, version_number=t.version_number,
        exercises_count=len(aes),
        exercises=[_ae_response(ae) for ae in sorted(aes, key=lambda x: x.sequence_number)],
        is_active=t.is_active, created_at=t.created_at, updated_at=t.updated_at,
    )


def _tmpl_list(t: AssessmentTemplate) -> AssessmentTemplateListResponse:
    cat = t.category if hasattr(t, "category") and t.category is not None else None
    aes = t.assessment_exercises if hasattr(t, "assessment_exercises") else []
    return AssessmentTemplateListResponse(
        id=t.id, uuid=t.uuid,
        assessment_name=t.assessment_name, assessment_code=t.assessment_code,
        category_id=t.category_id,
        category_name=cat.category_name if cat else None,
        passing_score=_f(t.passing_score),
        duration_minutes=t.duration_minutes,
        status=t.status, version_number=t.version_number,
        exercises_count=len(aes),
        is_active=t.is_active, updated_at=t.updated_at,
    )


def _rule_response(r: AssessmentRule) -> AssessmentRuleResponse:
    tmpl = r.assessment if hasattr(r, "assessment") and r.assessment is not None else None
    return AssessmentRuleResponse(
        id=r.id, uuid=r.uuid, assessment_id=r.assessment_id,
        assessment_name=tmpl.assessment_name if tmpl else None,
        assessment_code=tmpl.assessment_code if tmpl else None,
        minimum_pass_score=_f(r.minimum_pass_score),
        max_attempts=r.max_attempts,
        assessment_duration=r.assessment_duration,
        allow_reassessment=r.allow_reassessment,
        reassessment_wait_days=r.reassessment_wait_days,
        variant_selection_mode=r.variant_selection_mode,
        randomize_exercises=r.randomize_exercises,
        randomize_variants=r.randomize_variants,
        auto_fail_on_collision=r.auto_fail_on_collision,
        auto_fail_on_major_violation=r.auto_fail_on_major_violation,
        is_active=r.is_active, created_at=r.created_at, updated_at=r.updated_at,
    )


def _rule_list(r: AssessmentRule) -> AssessmentRuleListResponse:
    tmpl = r.assessment if hasattr(r, "assessment") and r.assessment is not None else None
    return AssessmentRuleListResponse(
        id=r.id, uuid=r.uuid, assessment_id=r.assessment_id,
        assessment_name=tmpl.assessment_name if tmpl else None,
        assessment_code=tmpl.assessment_code if tmpl else None,
        minimum_pass_score=_f(r.minimum_pass_score),
        max_attempts=r.max_attempts,
        assessment_duration=r.assessment_duration,
        variant_selection_mode=r.variant_selection_mode,
        allow_reassessment=r.allow_reassessment,
        is_active=r.is_active, updated_at=r.updated_at,
    )


def _ver_response(v: AssessmentVersion) -> AssessmentVersionResponse:
    return AssessmentVersionResponse(
        id=v.id, assessment_id=v.assessment_id, version_number=v.version_number,
        change_summary=v.change_summary, created_at=v.created_at, created_by=v.created_by,
    )


# ── Assessment Category Service ──────────────────────────────────────────────

class AssessmentCategoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AssessmentCategoryRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, sort_by, sort_order)
        return [_cat_list(c) for c in items], total

    async def list_all_active(self):
        items = await self.repo.get_all_active()
        return [_cat_response(c) for c in items]

    async def get(self, uuid: str):
        c = await self.repo.get_by_uuid(uuid)
        return _cat_response(c) if c else None

    async def create(self, data: AssessmentCategoryCreate, by: Optional[str] = None):
        if await self.repo.code_exists(data.category_code):
            raise ValueError(f"Category code '{data.category_code}' already exists")
        c = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="assessment_category", resource_id=c.uuid,
                             new_values={"category_name": c.category_name, "category_code": c.category_code})
        return _cat_response(c)

    async def update(self, uuid: str, data: AssessmentCategoryUpdate, by: Optional[str] = None):
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "category_code" in upd and await self.repo.code_exists(upd["category_code"], exclude_uuid=uuid):
            raise ValueError(f"Category code '{upd['category_code']}' already exists")
        upd["updated_by"] = by
        c = await self.repo.update(c, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="assessment_category", resource_id=uuid, new_values=upd)
        return _cat_response(c)

    async def delete(self, uuid: str, by: str) -> bool:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return False
        await self.repo.soft_delete(c, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="assessment_category", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str):
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        c = await self.repo.activate(c, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="assessment_category", resource_id=uuid)
        return _cat_response(c)

    async def deactivate(self, uuid: str, by: str):
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        c = await self.repo.deactivate(c, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="assessment_category", resource_id=uuid)
        return _cat_response(c)


# ── Assessment Template Service ──────────────────────────────────────────────

class AssessmentTemplateService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AssessmentTemplateRepository(db)
        self.ae_repo = AssessmentExerciseRepository(db)
        self.ver_repo = AssessmentVersionRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, category_id, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, category_id, sort_by, sort_order)
        return [_tmpl_list(t) for t in items], total

    async def get(self, uuid: str):
        t = await self.repo.get_by_uuid_full(uuid)
        return _tmpl_response(t) if t else None

    async def create(self, data: AssessmentTemplateCreate, by: Optional[str] = None):
        if await self.repo.code_exists(data.assessment_code):
            raise ValueError(f"Assessment code '{data.assessment_code}' already exists")
        exercises = data.exercises
        payload = data.model_dump(exclude={"exercises"})
        payload["version_number"] = 1
        payload["created_by"] = by
        payload["updated_by"] = by
        t = await self.repo.create(payload)
        if exercises:
            await self.ae_repo.create_bulk(t.id, [e.model_dump() for e in exercises])
        await self.ver_repo.create(t.id, 1, "Initial version", by)
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="assessment_template", resource_id=t.uuid,
                             new_values={"assessment_name": t.assessment_name, "assessment_code": t.assessment_code})
        t = await self.repo.get_by_id_full(t.id)
        return _tmpl_response(t)

    async def update(self, uuid: str, data: AssessmentTemplateUpdate, by: Optional[str] = None):
        t = await self.repo.get_by_uuid_full(uuid)
        if not t:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "assessment_code" in upd and await self.repo.code_exists(upd["assessment_code"], exclude_uuid=uuid):
            raise ValueError(f"Assessment code '{upd['assessment_code']}' already exists")
        exercises = upd.pop("exercises", None)
        upd["updated_by"] = by
        upd["version_number"] = t.version_number + 1
        t = await self.repo.update(t, upd)
        if exercises is not None:
            await self.ae_repo.delete_by_assessment(t.id)
            if exercises:
                await self.ae_repo.create_bulk(t.id, [e if isinstance(e, dict) else e.model_dump() for e in exercises])
        await self.ver_repo.create(t.id, t.version_number, "Updated", by)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="assessment_template", resource_id=uuid, new_values=upd)
        t = await self.repo.get_by_id_full(t.id)
        return _tmpl_response(t)

    async def delete(self, uuid: str, by: str) -> bool:
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return False
        await self.repo.soft_delete(t, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="assessment_template", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str):
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return None
        t = await self.repo.activate(t, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="assessment_template", resource_id=uuid)
        t = await self.repo.get_by_id_full(t.id)
        return _tmpl_response(t)

    async def deactivate(self, uuid: str, by: str):
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return None
        t = await self.repo.deactivate(t, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="assessment_template", resource_id=uuid)
        t = await self.repo.get_by_id_full(t.id)
        return _tmpl_response(t)

    async def archive(self, uuid: str, by: str):
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return None
        t = await self.repo.update(t, {"status": "archived", "updated_by": by})
        await self.audit.log(_MODULE, "archive", user_id=by, resource_type="assessment_template", resource_id=uuid)
        t = await self.repo.get_by_id_full(t.id)
        return _tmpl_response(t)

    async def clone(self, uuid: str, data: AssessmentCloneRequest, by: Optional[str] = None):
        src = await self.repo.get_by_uuid_full(uuid)
        if not src:
            return None
        new_code = data.new_code or (data.new_name.strip().upper().replace(" ", "_")[:50])
        if await self.repo.code_exists(new_code):
            raise ValueError(f"Assessment code '{new_code}' already exists")
        payload = {
            "assessment_name": data.new_name,
            "assessment_code": new_code,
            "category_id": src.category_id,
            "description": src.description,
            "instructions": src.instructions,
            "duration_minutes": src.duration_minutes,
            "passing_score": src.passing_score,
            "max_attempts": src.max_attempts,
            "variant_selection_mode": src.variant_selection_mode,
            "randomize_exercise_order": src.randomize_exercise_order,
            "randomize_variant_selection": src.randomize_variant_selection,
            "status": "draft",
            "version_number": 1,
            "created_by": by,
            "updated_by": by,
        }
        new_t = await self.repo.create(payload)
        if src.assessment_exercises:
            await self.ae_repo.create_bulk(new_t.id, [
                {"exercise_id": ae.exercise_id, "sequence_number": ae.sequence_number,
                 "weightage": float(ae.weightage), "mandatory": ae.mandatory}
                for ae in src.assessment_exercises
            ])
        await self.ver_repo.create(new_t.id, 1, f"Cloned from {src.assessment_code}", by)
        await self.audit.log(_MODULE, "clone", user_id=by, resource_type="assessment_template", resource_id=new_t.uuid,
                             new_values={"source_uuid": uuid, "new_name": data.new_name})
        new_t = await self.repo.get_by_id_full(new_t.id)
        return _tmpl_response(new_t)

    async def get_versions(self, uuid: str):
        t = await self.repo.get_by_uuid(uuid)
        if not t:
            return None
        versions = await self.ver_repo.get_by_assessment(t.id)
        return [_ver_response(v) for v in versions]


# ── Assessment Rule Service ──────────────────────────────────────────────────

class AssessmentRuleService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AssessmentRuleRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, sort_by, sort_order)
        return [_rule_list(r) for r in items], total

    async def get(self, uuid: str):
        r = await self.repo.get_by_uuid(uuid)
        if not r:
            return None
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        from app.models.assessment_rule import AssessmentRule as AR
        q = select(AR).where(AR.uuid == uuid).options(selectinload(AR.assessment))
        result = (await self.db.execute(q)).scalar_one_or_none()
        return _rule_response(result) if result else None

    async def get_by_assessment(self, assessment_uuid: str):
        from sqlalchemy import select
        from app.models.assessment_template import AssessmentTemplate as AT
        t = (await self.db.execute(
            select(AT).where(AT.uuid == assessment_uuid, AT.deleted_at.is_(None))
        )).scalar_one_or_none()
        if not t:
            return None
        r = await self.repo.get_by_assessment_id(t.id)
        return _rule_response(r) if r else None

    async def create(self, data: AssessmentRuleCreate, by: Optional[str] = None):
        existing = await self.repo.get_by_assessment_id(data.assessment_id)
        if existing:
            raise ValueError("Rules already exist for this assessment. Use update instead.")
        payload = data.model_dump()
        payload["created_by"] = by
        payload["updated_by"] = by
        r = await self.repo.create(payload)
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="assessment_rule", resource_id=r.uuid)
        return await self.get(r.uuid)

    async def update(self, uuid: str, data: AssessmentRuleUpdate, by: Optional[str] = None):
        r = await self.repo.get_by_uuid(uuid)
        if not r:
            return None
        upd = data.model_dump(exclude_unset=True)
        upd["updated_by"] = by
        r = await self.repo.update(r, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="assessment_rule", resource_id=uuid, new_values=upd)
        return await self.get(r.uuid)

    async def delete(self, uuid: str, by: str) -> bool:
        r = await self.repo.get_by_uuid(uuid)
        if not r:
            return False
        await self.repo.soft_delete(r, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="assessment_rule", resource_id=uuid)
        return True
