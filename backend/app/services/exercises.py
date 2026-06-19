"""Services for the Exercise Builder module."""
import logging
import uuid as _uuid
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.exercise_category import ExerciseCategory
from app.models.exercise_variant import ExerciseVariant
from app.models.objective import Objective
from app.models.scenario import Scenario
from app.repositories.exercises import (
    ExerciseCategoryRepository,
    ExerciseRepository,
    ExerciseVariantRepository,
    ObjectiveRepository,
    ScenarioRepository,
)
from app.schemas.exercises import (
    ExerciseCategoryCreate,
    ExerciseCategoryListResponse,
    ExerciseCategoryResponse,
    ExerciseCategoryUpdate,
    ExerciseCreate,
    ExerciseListResponse,
    ExerciseResponse,
    ExerciseUpdate,
    ExerciseVariantCreate,
    ExerciseVariantListResponse,
    ExerciseVariantResponse,
    ExerciseVariantUpdate,
    ObjectiveCreate,
    ObjectiveListResponse,
    ObjectiveResponse,
    ObjectiveUpdate,
    ScenarioCreate,
    ScenarioListResponse,
    ScenarioResponse,
    ScenarioUpdate,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)
_MODULE = "exercises"


def _f(v) -> Optional[float]:
    return float(v) if v is not None else None


# ── ExerciseCategory ────────────────────────────────────────────────────────

def _cat_response(c: ExerciseCategory) -> ExerciseCategoryResponse:
    return ExerciseCategoryResponse(
        id=c.id, uuid=c.uuid, category_name=c.category_name, category_code=c.category_code,
        description=c.description, status=c.status, is_active=c.is_active,
        created_at=c.created_at, updated_at=c.updated_at,
    )


def _cat_list(c: ExerciseCategory) -> ExerciseCategoryListResponse:
    return ExerciseCategoryListResponse(
        id=c.id, uuid=c.uuid, category_name=c.category_name, category_code=c.category_code,
        description=c.description, status=c.status, is_active=c.is_active, updated_at=c.updated_at,
    )


class ExerciseCategoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ExerciseCategoryRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, status, sort_by, sort_order)
        return [_cat_list(c) for c in items], total

    async def list_all_active(self):
        return [_cat_list(c) for c in await self.repo.get_all_active()]

    async def get(self, uuid: str) -> Optional[ExerciseCategoryResponse]:
        c = await self.repo.get_by_uuid(uuid)
        return _cat_response(c) if c else None

    async def create(self, data: ExerciseCategoryCreate, by: Optional[str] = None) -> ExerciseCategoryResponse:
        if await self.repo.code_exists(data.category_code):
            raise ValueError(f"Category code '{data.category_code}' already exists")
        c = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="exercise_category", resource_id=c.uuid,
                             new_values={"category_name": c.category_name})
        return _cat_response(c)

    async def update(self, uuid: str, data: ExerciseCategoryUpdate, by: Optional[str] = None) -> Optional[ExerciseCategoryResponse]:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "category_code" in upd and await self.repo.code_exists(upd["category_code"], exclude_uuid=uuid):
            raise ValueError(f"Category code '{upd['category_code']}' already exists")
        upd["updated_by"] = by
        c = await self.repo.update(c, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="exercise_category", resource_id=uuid, new_values=upd)
        return _cat_response(c)

    async def delete(self, uuid: str, by: str) -> bool:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return False
        await self.repo.soft_delete(c, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="exercise_category", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[ExerciseCategoryResponse]:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        c = await self.repo.activate(c, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="exercise_category", resource_id=uuid)
        return _cat_response(c)

    async def deactivate(self, uuid: str, by: str) -> Optional[ExerciseCategoryResponse]:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        c = await self.repo.deactivate(c, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="exercise_category", resource_id=uuid)
        return _cat_response(c)


# ── Objective ────────────────────────────────────────────────────────────────

def _obj_response(o: Objective) -> ObjectiveResponse:
    return ObjectiveResponse(
        id=o.id, uuid=o.uuid, objective_name=o.objective_name, objective_code=o.objective_code,
        competency_area=o.competency_area, description=o.description,
        status=o.status, is_active=o.is_active, created_at=o.created_at, updated_at=o.updated_at,
    )


def _obj_list(o: Objective) -> ObjectiveListResponse:
    return ObjectiveListResponse(
        id=o.id, uuid=o.uuid, objective_name=o.objective_name, objective_code=o.objective_code,
        competency_area=o.competency_area, status=o.status, is_active=o.is_active, updated_at=o.updated_at,
    )


class ObjectiveService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ObjectiveRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, competency_area, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, competency_area, status, sort_by, sort_order)
        return [_obj_list(o) for o in items], total

    async def list_all_active(self):
        return [_obj_list(o) for o in await self.repo.get_all_active()]

    async def get(self, uuid: str) -> Optional[ObjectiveResponse]:
        o = await self.repo.get_by_uuid(uuid)
        return _obj_response(o) if o else None

    async def create(self, data: ObjectiveCreate, by: Optional[str] = None) -> ObjectiveResponse:
        if await self.repo.code_exists(data.objective_code):
            raise ValueError(f"Objective code '{data.objective_code}' already exists")
        o = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="objective", resource_id=o.uuid,
                             new_values={"objective_name": o.objective_name})
        return _obj_response(o)

    async def update(self, uuid: str, data: ObjectiveUpdate, by: Optional[str] = None) -> Optional[ObjectiveResponse]:
        o = await self.repo.get_by_uuid(uuid)
        if not o:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "objective_code" in upd and await self.repo.code_exists(upd["objective_code"], exclude_uuid=uuid):
            raise ValueError(f"Objective code '{upd['objective_code']}' already exists")
        upd["updated_by"] = by
        o = await self.repo.update(o, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="objective", resource_id=uuid, new_values=upd)
        return _obj_response(o)

    async def delete(self, uuid: str, by: str) -> bool:
        o = await self.repo.get_by_uuid(uuid)
        if not o:
            return False
        await self.repo.soft_delete(o, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="objective", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[ObjectiveResponse]:
        o = await self.repo.get_by_uuid(uuid)
        if not o:
            return None
        o = await self.repo.activate(o, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="objective", resource_id=uuid)
        return _obj_response(o)

    async def deactivate(self, uuid: str, by: str) -> Optional[ObjectiveResponse]:
        o = await self.repo.get_by_uuid(uuid)
        if not o:
            return None
        o = await self.repo.deactivate(o, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="objective", resource_id=uuid)
        return _obj_response(o)


# ── Scenario ─────────────────────────────────────────────────────────────────

def _scen_response(s: Scenario) -> ScenarioResponse:
    return ScenarioResponse(
        id=s.id, uuid=s.uuid, scenario_name=s.scenario_name, scenario_code=s.scenario_code,
        scenario_type=s.scenario_type, difficulty=s.difficulty, description=s.description,
        status=s.status, is_active=s.is_active, created_at=s.created_at, updated_at=s.updated_at,
    )


def _scen_list(s: Scenario) -> ScenarioListResponse:
    return ScenarioListResponse(
        id=s.id, uuid=s.uuid, scenario_name=s.scenario_name, scenario_code=s.scenario_code,
        scenario_type=s.scenario_type, difficulty=s.difficulty,
        status=s.status, is_active=s.is_active, updated_at=s.updated_at,
    )


class ScenarioService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ScenarioRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, scenario_type, difficulty, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, scenario_type, difficulty, status, sort_by, sort_order)
        return [_scen_list(s) for s in items], total

    async def list_all_active(self):
        return [_scen_list(s) for s in await self.repo.get_all_active()]

    async def get(self, uuid: str) -> Optional[ScenarioResponse]:
        s = await self.repo.get_by_uuid(uuid)
        return _scen_response(s) if s else None

    async def create(self, data: ScenarioCreate, by: Optional[str] = None) -> ScenarioResponse:
        if await self.repo.code_exists(data.scenario_code):
            raise ValueError(f"Scenario code '{data.scenario_code}' already exists")
        s = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="scenario", resource_id=s.uuid,
                             new_values={"scenario_name": s.scenario_name})
        return _scen_response(s)

    async def update(self, uuid: str, data: ScenarioUpdate, by: Optional[str] = None) -> Optional[ScenarioResponse]:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "scenario_code" in upd and await self.repo.code_exists(upd["scenario_code"], exclude_uuid=uuid):
            raise ValueError(f"Scenario code '{upd['scenario_code']}' already exists")
        upd["updated_by"] = by
        s = await self.repo.update(s, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="scenario", resource_id=uuid, new_values=upd)
        return _scen_response(s)

    async def delete(self, uuid: str, by: str) -> bool:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return False
        await self.repo.soft_delete(s, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="scenario", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[ScenarioResponse]:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return None
        s = await self.repo.activate(s, by)
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="scenario", resource_id=uuid)
        return _scen_response(s)

    async def deactivate(self, uuid: str, by: str) -> Optional[ScenarioResponse]:
        s = await self.repo.get_by_uuid(uuid)
        if not s:
            return None
        s = await self.repo.deactivate(s, by)
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="scenario", resource_id=uuid)
        return _scen_response(s)


# ── Exercise ─────────────────────────────────────────────────────────────────

def _ex_response(e: Exercise, objective_ids: Optional[list[int]] = None) -> ExerciseResponse:
    return ExerciseResponse(
        id=e.id, uuid=e.uuid, exercise_name=e.exercise_name, exercise_code=e.exercise_code,
        category_id=e.category_id, scenario_id=e.scenario_id,
        category_name=e.category.category_name if e.category else None,
        scenario_name=e.scenario.scenario_name if e.scenario else None,
        description=e.description, difficulty=e.difficulty,
        passing_score=_f(e.passing_score), max_attempts=e.max_attempts,
        estimated_duration=e.estimated_duration, generation_mode=e.generation_mode,
        status=e.status, is_active=e.is_active, version_number=e.version_number,
        variant_count=len(e.variants) if e.variants else 0,
        objective_ids=objective_ids if objective_ids is not None else [eo.objective_id for eo in (e.exercise_objectives or [])],
        created_at=e.created_at, updated_at=e.updated_at,
    )


def _ex_list(e: Exercise) -> ExerciseListResponse:
    return ExerciseListResponse(
        id=e.id, uuid=e.uuid, exercise_name=e.exercise_name, exercise_code=e.exercise_code,
        category_name=e.category.category_name if e.category else None,
        scenario_name=e.scenario.scenario_name if e.scenario else None,
        difficulty=e.difficulty, status=e.status, is_active=e.is_active,
        version_number=e.version_number,
        variant_count=len(e.variants) if e.variants else 0,
        updated_at=e.updated_at,
    )


class ExerciseService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ExerciseRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, category_id, scenario_id, difficulty, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(
            page, page_size, search, category_id, scenario_id, difficulty, status, sort_by, sort_order
        )
        return [_ex_list(e) for e in items], total

    async def list_all_active(self) -> List[ExerciseListResponse]:
        items = await self.repo.get_all_active()
        return [_ex_list(e) for e in items]

    async def get(self, uuid: str) -> Optional[ExerciseResponse]:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return None
        obj_ids = await self.repo.get_objective_ids(e.id)
        return _ex_response(e, obj_ids)

    async def create(self, data: ExerciseCreate, by: Optional[str] = None) -> ExerciseResponse:
        if await self.repo.code_exists(data.exercise_code):
            raise ValueError(f"Exercise code '{data.exercise_code}' already exists")
        payload = data.model_dump(exclude={"objective_ids"})
        payload.update({"created_by": by, "updated_by": by, "version_number": 1})
        e = await self.repo.create(payload)
        await self.repo.set_objectives(e.id, data.objective_ids)
        await self.repo.add_version(e.id, 1, "Initial version", by)
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="exercise", resource_id=e.uuid,
                             new_values={"exercise_name": e.exercise_name, "exercise_code": e.exercise_code})
        e = await self.repo.get_by_uuid(e.uuid)
        return _ex_response(e, data.objective_ids)  # type: ignore[arg-type]

    async def update(self, uuid: str, data: ExerciseUpdate, by: Optional[str] = None) -> Optional[ExerciseResponse]:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return None
        if e.status == "active":
            e.version_number += 1
            await self.repo.add_version(
                e.id, e.version_number,
                data.change_summary or "Updated",
                by,
            )
        upd = data.model_dump(exclude_unset=True, exclude={"objective_ids", "change_summary"})
        upd["updated_by"] = by
        e = await self.repo.update(e, upd)
        if data.objective_ids is not None:
            await self.repo.set_objectives(e.id, data.objective_ids)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="exercise", resource_id=uuid, new_values=upd)
        e = await self.repo.get_by_uuid(uuid)
        obj_ids = await self.repo.get_objective_ids(e.id)  # type: ignore[union-attr]
        return _ex_response(e, obj_ids)  # type: ignore[arg-type]

    async def delete(self, uuid: str, by: str) -> bool:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return False
        await self.repo.soft_delete(e, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="exercise", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[ExerciseResponse]:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return None
        e = await self.repo.activate(e, by)
        e.status = "active"
        await self.repo.update(e, {"status": "active"})
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="exercise", resource_id=uuid)
        e = await self.repo.get_by_uuid(uuid)
        return _ex_response(e)  # type: ignore[arg-type]

    async def archive(self, uuid: str, by: str) -> Optional[ExerciseResponse]:
        e = await self.repo.get_by_uuid(uuid)
        if not e:
            return None
        e = await self.repo.update(e, {"status": "archived", "is_active": False, "updated_by": by})
        await self.audit.log(_MODULE, "archive", user_id=by, resource_type="exercise", resource_id=uuid)
        e = await self.repo.get_by_uuid(uuid)
        return _ex_response(e)  # type: ignore[arg-type]

    async def clone(self, uuid: str, new_name: str, by: Optional[str] = None) -> ExerciseResponse:
        src = await self.repo.get_by_uuid(uuid)
        if not src:
            raise ValueError("Exercise not found")
        new_code = f"{src.exercise_code}_CLONE_{str(_uuid.uuid4())[:6].upper()}"
        obj_ids = await self.repo.get_objective_ids(src.id)
        payload = {
            "exercise_name": new_name,
            "exercise_code": new_code,
            "category_id": src.category_id,
            "scenario_id": src.scenario_id,
            "description": src.description,
            "difficulty": src.difficulty,
            "passing_score": src.passing_score,
            "max_attempts": src.max_attempts,
            "estimated_duration": src.estimated_duration,
            "generation_mode": src.generation_mode,
            "status": "draft",
            "version_number": 1,
            "created_by": by,
            "updated_by": by,
        }
        new_ex = await self.repo.create(payload)
        await self.repo.set_objectives(new_ex.id, obj_ids)
        await self.repo.add_version(new_ex.id, 1, f"Cloned from {src.exercise_code}", by)
        await self.audit.log(_MODULE, "clone", user_id=by, resource_type="exercise", resource_id=new_ex.uuid,
                             new_values={"cloned_from": uuid, "new_name": new_name})
        new_ex = await self.repo.get_by_uuid(new_ex.uuid)
        return _ex_response(new_ex, obj_ids)  # type: ignore[arg-type]


# ── ExerciseVariant ──────────────────────────────────────────────────────────

def _var_response(v: ExerciseVariant) -> ExerciseVariantResponse:
    return ExerciseVariantResponse(
        id=v.id, uuid=v.uuid, variant_name=v.variant_name, variant_code=v.variant_code,
        exercise_id=v.exercise_id,
        exercise_name=v.exercise.exercise_name if v.exercise else None,
        port_id=v.port_id, environment_profile_id=v.environment_profile_id,
        primary_vessel_id=v.primary_vessel_id, secondary_vessel_id=v.secondary_vessel_id,
        tertiary_vessel_id=v.tertiary_vessel_id,
        port_name=v.port.port_name if v.port else None,
        environment_profile_name=v.environment_profile.profile_name if v.environment_profile else None,
        primary_vessel_name=v.primary_vessel.vessel_name if v.primary_vessel else None,
        secondary_vessel_name=v.secondary_vessel.vessel_name if v.secondary_vessel else None,
        tertiary_vessel_name=v.tertiary_vessel.vessel_name if v.tertiary_vessel else None,
        duration_minutes=v.duration_minutes, passing_score=_f(v.passing_score),
        description=v.description, status=v.status, is_active=v.is_active,
        created_at=v.created_at, updated_at=v.updated_at,
    )


def _var_list(v: ExerciseVariant) -> ExerciseVariantListResponse:
    return ExerciseVariantListResponse(
        id=v.id, uuid=v.uuid, variant_name=v.variant_name, variant_code=v.variant_code,
        exercise_id=v.exercise_id,
        exercise_name=v.exercise.exercise_name if v.exercise else None,
        port_name=v.port.port_name if v.port else None,
        environment_profile_name=v.environment_profile.profile_name if v.environment_profile else None,
        primary_vessel_name=v.primary_vessel.vessel_name if v.primary_vessel else None,
        duration_minutes=v.duration_minutes, status=v.status, is_active=v.is_active,
        updated_at=v.updated_at,
    )


class ExerciseVariantService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ExerciseVariantRepository(db)
        self.audit = AuditService(db)

    async def list(self, page, page_size, search, exercise_id, status, sort_by, sort_order):
        items, total = await self.repo.get_paginated(page, page_size, search, exercise_id, status, sort_by, sort_order)
        return [_var_list(v) for v in items], total

    async def get(self, uuid: str) -> Optional[ExerciseVariantResponse]:
        v = await self.repo.get_by_uuid(uuid)
        return _var_response(v) if v else None

    async def create(self, data: ExerciseVariantCreate, by: Optional[str] = None) -> ExerciseVariantResponse:
        if await self.repo.code_exists(data.variant_code):
            raise ValueError(f"Variant code '{data.variant_code}' already exists")
        v = await self.repo.create({**data.model_dump(), "created_by": by, "updated_by": by})
        await self.audit.log(_MODULE, "create", user_id=by, resource_type="exercise_variant", resource_id=v.uuid,
                             new_values={"variant_name": v.variant_name})
        v = await self.repo.get_by_uuid(v.uuid)
        return _var_response(v)  # type: ignore[arg-type]

    async def update(self, uuid: str, data: ExerciseVariantUpdate, by: Optional[str] = None) -> Optional[ExerciseVariantResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        upd = data.model_dump(exclude_unset=True)
        if "variant_code" in upd and await self.repo.code_exists(upd["variant_code"], exclude_uuid=uuid):
            raise ValueError(f"Variant code '{upd['variant_code']}' already exists")
        upd["updated_by"] = by
        v = await self.repo.update(v, upd)
        await self.audit.log(_MODULE, "update", user_id=by, resource_type="exercise_variant", resource_id=uuid, new_values=upd)
        v = await self.repo.get_by_uuid(uuid)
        return _var_response(v)  # type: ignore[arg-type]

    async def delete(self, uuid: str, by: str) -> bool:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return False
        await self.repo.soft_delete(v, by)
        await self.audit.log(_MODULE, "delete", user_id=by, resource_type="exercise_variant", resource_id=uuid)
        return True

    async def activate(self, uuid: str, by: str) -> Optional[ExerciseVariantResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        v = await self.repo.activate(v, by)
        v = await self.repo.update(v, {"status": "active"})
        await self.audit.log(_MODULE, "activate", user_id=by, resource_type="exercise_variant", resource_id=uuid)
        v = await self.repo.get_by_uuid(uuid)
        return _var_response(v)  # type: ignore[arg-type]

    async def deactivate(self, uuid: str, by: str) -> Optional[ExerciseVariantResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None
        v = await self.repo.deactivate(v, by)
        v = await self.repo.update(v, {"status": "archived"})
        await self.audit.log(_MODULE, "deactivate", user_id=by, resource_type="exercise_variant", resource_id=uuid)
        v = await self.repo.get_by_uuid(uuid)
        return _var_response(v)  # type: ignore[arg-type]

    async def duplicate(self, uuid: str, by: Optional[str] = None) -> ExerciseVariantResponse:
        src = await self.repo.get_by_uuid(uuid)
        if not src:
            raise ValueError("Variant not found")
        new_code = f"{src.variant_code}_COPY_{str(_uuid.uuid4())[:6].upper()}"
        payload = {
            "variant_name": f"{src.variant_name} (Copy)",
            "variant_code": new_code,
            "exercise_id": src.exercise_id,
            "port_id": src.port_id,
            "environment_profile_id": src.environment_profile_id,
            "primary_vessel_id": src.primary_vessel_id,
            "secondary_vessel_id": src.secondary_vessel_id,
            "tertiary_vessel_id": src.tertiary_vessel_id,
            "duration_minutes": src.duration_minutes,
            "passing_score": src.passing_score,
            "description": src.description,
            "status": "draft",
            "created_by": by,
            "updated_by": by,
        }
        new_v = await self.repo.create(payload)
        await self.audit.log(_MODULE, "duplicate", user_id=by, resource_type="exercise_variant", resource_id=new_v.uuid,
                             new_values={"duplicated_from": uuid})
        new_v = await self.repo.get_by_uuid(new_v.uuid)
        return _var_response(new_v)  # type: ignore[arg-type]
