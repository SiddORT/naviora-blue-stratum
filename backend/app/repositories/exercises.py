"""Repositories for the Exercise Builder module."""
from typing import List, Optional

from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.exercise import Exercise
from app.models.exercise_category import ExerciseCategory
from app.models.exercise_objective import ExerciseObjective
from app.models.exercise_variant import ExerciseVariant
from app.models.exercise_version import ExerciseVersion
from app.models.objective import Objective
from app.models.scenario import Scenario
from app.repositories.base import BaseRepository


# ── ExerciseCategory ────────────────────────────────────────────────────────

class ExerciseCategoryRepository(BaseRepository[ExerciseCategory]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(ExerciseCategory, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(ExerciseCategory).where(
            and_(ExerciseCategory.category_code == code, ExerciseCategory.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(ExerciseCategory.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "category_name",
        sort_order: str = "asc",
    ) -> tuple[list[ExerciseCategory], int]:
        q = select(ExerciseCategory).where(ExerciseCategory.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(ExerciseCategory.category_name.ilike(term), ExerciseCategory.category_code.ilike(term)))
        if status:
            q = q.where(ExerciseCategory.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(ExerciseCategory, sort_by, ExerciseCategory.category_name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        return list((await self.db.execute(q)).scalars().all()), total

    async def get_all_active(self) -> list[ExerciseCategory]:
        q = select(ExerciseCategory).where(
            and_(ExerciseCategory.deleted_at.is_(None), ExerciseCategory.status == "active")
        ).order_by(ExerciseCategory.category_name)
        return list((await self.db.execute(q)).scalars().all())


# ── Objective ───────────────────────────────────────────────────────────────

class ObjectiveRepository(BaseRepository[Objective]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Objective, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(Objective).where(
            and_(Objective.objective_code == code, Objective.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(Objective.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        competency_area: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "objective_name",
        sort_order: str = "asc",
    ) -> tuple[list[Objective], int]:
        q = select(Objective).where(Objective.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(Objective.objective_name.ilike(term), Objective.objective_code.ilike(term)))
        if competency_area:
            q = q.where(Objective.competency_area.ilike(f"%{competency_area}%"))
        if status:
            q = q.where(Objective.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(Objective, sort_by, Objective.objective_name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        return list((await self.db.execute(q)).scalars().all()), total

    async def get_all_active(self) -> list[Objective]:
        q = select(Objective).where(
            and_(Objective.deleted_at.is_(None), Objective.status == "active")
        ).order_by(Objective.objective_name)
        return list((await self.db.execute(q)).scalars().all())

    async def get_by_ids(self, ids: list[int]) -> list[Objective]:
        if not ids:
            return []
        q = select(Objective).where(and_(Objective.id.in_(ids), Objective.deleted_at.is_(None)))
        return list((await self.db.execute(q)).scalars().all())


# ── Scenario ────────────────────────────────────────────────────────────────

class ScenarioRepository(BaseRepository[Scenario]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Scenario, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(Scenario).where(
            and_(Scenario.scenario_code == code, Scenario.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(Scenario.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        scenario_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "scenario_name",
        sort_order: str = "asc",
    ) -> tuple[list[Scenario], int]:
        q = select(Scenario).where(Scenario.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(Scenario.scenario_name.ilike(term), Scenario.scenario_code.ilike(term)))
        if scenario_type:
            q = q.where(Scenario.scenario_type == scenario_type)
        if difficulty:
            q = q.where(Scenario.difficulty == difficulty)
        if status:
            q = q.where(Scenario.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(Scenario, sort_by, Scenario.scenario_name)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        return list((await self.db.execute(q)).scalars().all()), total

    async def get_all_active(self) -> list[Scenario]:
        q = select(Scenario).where(
            and_(Scenario.deleted_at.is_(None), Scenario.status == "active")
        ).order_by(Scenario.scenario_name)
        return list((await self.db.execute(q)).scalars().all())


# ── Exercise ─────────────────────────────────────────────────────────────────

class ExerciseRepository(BaseRepository[Exercise]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Exercise, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(Exercise).where(
            and_(Exercise.exercise_code == code, Exercise.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(Exercise.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        scenario_id: Optional[int] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "exercise_name",
        sort_order: str = "asc",
    ) -> tuple[list[Exercise], int]:
        q = select(Exercise).where(Exercise.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(Exercise.exercise_name.ilike(term), Exercise.exercise_code.ilike(term)))
        if category_id:
            q = q.where(Exercise.category_id == category_id)
        if scenario_id:
            q = q.where(Exercise.scenario_id == scenario_id)
        if difficulty:
            q = q.where(Exercise.difficulty == difficulty)
        if status:
            q = q.where(Exercise.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(Exercise, sort_by, Exercise.exercise_name)
        q = q.options(
            selectinload(Exercise.category),
            selectinload(Exercise.scenario),
            selectinload(Exercise.exercise_objectives),
            selectinload(Exercise.variants),
        ).order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        return list((await self.db.execute(q)).scalars().all()), total

    async def get_all_active(self) -> List[Exercise]:
        q = select(Exercise).where(
            and_(Exercise.deleted_at.is_(None), Exercise.status == "active")
        ).options(
            selectinload(Exercise.category),
            selectinload(Exercise.scenario),
            selectinload(Exercise.variants),
        ).order_by(Exercise.exercise_name.asc())
        return list((await self.db.execute(q)).scalars().all())

    async def get_by_uuid(self, uuid: str, include_deleted: bool = False) -> Optional[Exercise]:
        q = select(Exercise).where(Exercise.uuid == uuid).options(
            selectinload(Exercise.category),
            selectinload(Exercise.scenario),
            selectinload(Exercise.exercise_objectives),
            selectinload(Exercise.variants),
            selectinload(Exercise.versions),
        )
        if not include_deleted:
            q = q.where(Exercise.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def set_objectives(self, exercise_id: int, objective_ids: list[int]) -> None:
        await self.db.execute(
            delete(ExerciseObjective).where(ExerciseObjective.exercise_id == exercise_id)
        )
        for obj_id in objective_ids:
            self.db.add(ExerciseObjective(exercise_id=exercise_id, objective_id=obj_id))
        await self.db.flush()

    async def get_objective_ids(self, exercise_id: int) -> list[int]:
        q = select(ExerciseObjective.objective_id).where(ExerciseObjective.exercise_id == exercise_id)
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows)

    async def add_version(
        self, exercise_id: int, version_number: int, change_summary: Optional[str], created_by: Optional[str]
    ) -> ExerciseVersion:
        v = ExerciseVersion(
            exercise_id=exercise_id,
            version_number=version_number,
            change_summary=change_summary,
            created_by=created_by,
        )
        self.db.add(v)
        await self.db.flush()
        return v


# ── ExerciseVariant ──────────────────────────────────────────────────────────

class ExerciseVariantRepository(BaseRepository[ExerciseVariant]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(ExerciseVariant, db)

    async def code_exists(self, code: str, exclude_uuid: Optional[str] = None) -> bool:
        q = select(ExerciseVariant).where(
            and_(ExerciseVariant.variant_code == code, ExerciseVariant.deleted_at.is_(None))
        )
        if exclude_uuid:
            q = q.where(ExerciseVariant.uuid != exclude_uuid)
        return (await self.db.execute(q)).scalar_one_or_none() is not None

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        exercise_id: Optional[int] = None,
        status: Optional[str] = None,
        sort_by: str = "variant_name",
        sort_order: str = "asc",
    ) -> tuple[list[ExerciseVariant], int]:
        q = select(ExerciseVariant).where(ExerciseVariant.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            q = q.where(or_(ExerciseVariant.variant_name.ilike(term), ExerciseVariant.variant_code.ilike(term)))
        if exercise_id:
            q = q.where(ExerciseVariant.exercise_id == exercise_id)
        if status:
            q = q.where(ExerciseVariant.status == status)
        total = (await self.db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        col = getattr(ExerciseVariant, sort_by, ExerciseVariant.variant_name)
        q = q.options(
            selectinload(ExerciseVariant.exercise),
            selectinload(ExerciseVariant.port),
            selectinload(ExerciseVariant.environment_profile),
            selectinload(ExerciseVariant.primary_vessel),
        ).order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        return list((await self.db.execute(q)).scalars().all()), total

    async def get_by_uuid(self, uuid: str, include_deleted: bool = False) -> Optional[ExerciseVariant]:
        q = select(ExerciseVariant).where(ExerciseVariant.uuid == uuid).options(
            selectinload(ExerciseVariant.exercise),
            selectinload(ExerciseVariant.port),
            selectinload(ExerciseVariant.environment_profile),
            selectinload(ExerciseVariant.primary_vessel),
            selectinload(ExerciseVariant.secondary_vessel),
            selectinload(ExerciseVariant.tertiary_vessel),
        )
        if not include_deleted:
            q = q.where(ExerciseVariant.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()
