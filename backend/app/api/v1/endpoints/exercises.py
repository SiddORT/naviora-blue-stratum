"""Exercise Builder module — API endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.schemas.exercises import (
    ExerciseCategoryCreate,
    ExerciseCategoryUpdate,
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseVariantCreate,
    ExerciseVariantUpdate,
    ObjectiveCreate,
    ObjectiveUpdate,
    ScenarioCreate,
    ScenarioUpdate,
)
from app.services.exercises import (
    ExerciseCategoryService,
    ExerciseService,
    ExerciseVariantService,
    ObjectiveService,
    ScenarioService,
)
from app.utils.responses import (
    created_response,
    error_response,
    not_found_response,
    success_response,
)

router = APIRouter()


def _paginate(items, total, page, page_size):
    return {
        "items": [i.model_dump() for i in items],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": max(1, math.ceil(total / page_size)),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Exercise Categories
# ─────────────────────────────────────────────────────────────────────────────

categories = APIRouter(prefix="/categories", tags=["Exercises — Categories"])


@categories.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_categories(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("category_name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await ExerciseCategoryService(db).list(page, page_size, search, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@categories.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_categories_all_active(db: AsyncSession = Depends(get_db)):
    items = await ExerciseCategoryService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@categories.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_category(body: ExerciseCategoryCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ExerciseCategoryService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Category created")


@categories.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_category(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await ExerciseCategoryService(db).get(uuid)
    if not result:
        return not_found_response("Category")
    return success_response(data=result.model_dump())


@categories.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_category(uuid: str, body: ExerciseCategoryUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ExerciseCategoryService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Category")
    return success_response(data=result.model_dump(), message="Category updated")


@categories.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_category(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await ExerciseCategoryService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Category")
    return success_response(message="Category deleted")


@categories.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_category(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ExerciseCategoryService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Category")
    return success_response(data=result.model_dump(), message="Activated")


@categories.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_category(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ExerciseCategoryService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Category")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(categories)


# ─────────────────────────────────────────────────────────────────────────────
# Objectives
# ─────────────────────────────────────────────────────────────────────────────

objectives = APIRouter(prefix="/objectives", tags=["Exercises — Objectives"])


@objectives.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_objectives(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), competency_area: Optional[str] = Query(None),
    status: Optional[str] = Query(None), sort_by: str = Query("objective_name"),
    sort_order: str = Query("asc"), db: AsyncSession = Depends(get_db),
):
    items, total = await ObjectiveService(db).list(page, page_size, search, competency_area, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@objectives.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_objectives_all_active(db: AsyncSession = Depends(get_db)):
    items = await ObjectiveService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@objectives.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_objective(body: ObjectiveCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ObjectiveService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Objective created")


@objectives.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_objective(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await ObjectiveService(db).get(uuid)
    if not result:
        return not_found_response("Objective")
    return success_response(data=result.model_dump())


@objectives.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_objective(uuid: str, body: ObjectiveUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ObjectiveService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Objective")
    return success_response(data=result.model_dump(), message="Objective updated")


@objectives.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_objective(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await ObjectiveService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Objective")
    return success_response(message="Objective deleted")


@objectives.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_objective(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ObjectiveService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Objective")
    return success_response(data=result.model_dump(), message="Activated")


@objectives.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_objective(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ObjectiveService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Objective")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(objectives)


# ─────────────────────────────────────────────────────────────────────────────
# Scenarios
# ─────────────────────────────────────────────────────────────────────────────

scenarios = APIRouter(prefix="/scenarios", tags=["Exercises — Scenarios"])


@scenarios.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_scenarios(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), scenario_type: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("scenario_name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await ScenarioService(db).list(page, page_size, search, scenario_type, difficulty, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@scenarios.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_scenarios_all_active(db: AsyncSession = Depends(get_db)):
    items = await ScenarioService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@scenarios.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_scenario(body: ScenarioCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ScenarioService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Scenario created")


@scenarios.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_scenario(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await ScenarioService(db).get(uuid)
    if not result:
        return not_found_response("Scenario")
    return success_response(data=result.model_dump())


@scenarios.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_scenario(uuid: str, body: ScenarioUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ScenarioService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Scenario")
    return success_response(data=result.model_dump(), message="Scenario updated")


@scenarios.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_scenario(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await ScenarioService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Scenario")
    return success_response(message="Scenario deleted")


@scenarios.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_scenario(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ScenarioService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Scenario")
    return success_response(data=result.model_dump(), message="Activated")


@scenarios.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_scenario(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ScenarioService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Scenario")
    return success_response(data=result.model_dump(), message="Deactivated")


router.include_router(scenarios)


# ─────────────────────────────────────────────────────────────────────────────
# Exercise Library
# ─────────────────────────────────────────────────────────────────────────────

library = APIRouter(prefix="/library", tags=["Exercises — Library"])


@library.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_exercises(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), category_id: Optional[int] = Query(None),
    scenario_id: Optional[int] = Query(None), difficulty: Optional[str] = Query(None),
    status: Optional[str] = Query(None), sort_by: str = Query("exercise_name"),
    sort_order: str = Query("asc"), db: AsyncSession = Depends(get_db),
):
    items, total = await ExerciseService(db).list(
        page, page_size, search, category_id, scenario_id, difficulty, status, sort_by, sort_order
    )
    return success_response(data=_paginate(items, total, page, page_size))


@library.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_exercise(body: ExerciseCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ExerciseService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Exercise created")


@library.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_exercise(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await ExerciseService(db).get(uuid)
    if not result:
        return not_found_response("Exercise")
    return success_response(data=result.model_dump())


@library.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_exercise(uuid: str, body: ExerciseUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ExerciseService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Exercise")
    return success_response(data=result.model_dump(), message="Exercise updated")


@library.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_exercise(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await ExerciseService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Exercise")
    return success_response(message="Exercise deleted")


@library.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_exercise(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ExerciseService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Exercise")
    return success_response(data=result.model_dump(), message="Exercise activated")


@library.patch("/{uuid}/archive", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def archive_exercise(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ExerciseService(db).archive(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Exercise")
    return success_response(data=result.model_dump(), message="Exercise archived")


@library.post("/{uuid}/clone", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def clone_exercise(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    new_name: str = Body(..., embed=True),
):
    try:
        result = await ExerciseService(db).clone(uuid, new_name, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Exercise cloned")


router.include_router(library)


# ─────────────────────────────────────────────────────────────────────────────
# Exercise Variants
# ─────────────────────────────────────────────────────────────────────────────

variants = APIRouter(prefix="/variants", tags=["Exercises — Variants"])


@variants.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_variants(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), exercise_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None), sort_by: str = Query("variant_name"),
    sort_order: str = Query("asc"), db: AsyncSession = Depends(get_db),
):
    items, total = await ExerciseVariantService(db).list(page, page_size, search, exercise_id, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@variants.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_variant(body: ExerciseVariantCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ExerciseVariantService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Variant created")


@variants.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_variant(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await ExerciseVariantService(db).get(uuid)
    if not result:
        return not_found_response("Variant")
    return success_response(data=result.model_dump())


@variants.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_variant(uuid: str, body: ExerciseVariantUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ExerciseVariantService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Variant")
    return success_response(data=result.model_dump(), message="Variant updated")


@variants.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_variant(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await ExerciseVariantService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Variant")
    return success_response(message="Variant deleted")


@variants.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_variant(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ExerciseVariantService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Variant")
    return success_response(data=result.model_dump(), message="Activated")


@variants.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_variant(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await ExerciseVariantService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Variant")
    return success_response(data=result.model_dump(), message="Archived")


@variants.post("/{uuid}/duplicate", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def duplicate_variant(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await ExerciseVariantService(db).duplicate(uuid, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Variant duplicated")


router.include_router(variants)
