"""Assessment Engine module — API endpoints."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.schemas.assessments import (
    AssessmentCategoryCreate,
    AssessmentCategoryUpdate,
    AssessmentCloneRequest,
    AssessmentRuleCreate,
    AssessmentRuleUpdate,
    AssessmentTemplateCreate,
    AssessmentTemplateUpdate,
)
from app.services.assessments import (
    AssessmentCategoryService,
    AssessmentRuleService,
    AssessmentTemplateService,
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
# Assessment Categories
# ─────────────────────────────────────────────────────────────────────────────

categories = APIRouter(prefix="/categories", tags=["Assessments — Categories"])


@categories.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_categories(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    sort_by: str = Query("category_name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await AssessmentCategoryService(db).list(page, page_size, search, status, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@categories.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_categories_all_active(db: AsyncSession = Depends(get_db)):
    items = await AssessmentCategoryService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@categories.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_category(body: AssessmentCategoryCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await AssessmentCategoryService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Assessment category created")


@categories.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_category(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await AssessmentCategoryService(db).get(uuid)
    if not result:
        return not_found_response("Assessment category")
    return success_response(data=result.model_dump())


@categories.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_category(uuid: str, body: AssessmentCategoryUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await AssessmentCategoryService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Assessment category")
    return success_response(data=result.model_dump(), message="Assessment category updated")


@categories.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_category(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await AssessmentCategoryService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Assessment category")
    return success_response(message="Assessment category deleted")


@categories.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_category(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await AssessmentCategoryService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Assessment category")
    return success_response(data=result.model_dump(), message="Assessment category activated")


@categories.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_category(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await AssessmentCategoryService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Assessment category")
    return success_response(data=result.model_dump(), message="Assessment category deactivated")


router.include_router(categories)


# ─────────────────────────────────────────────────────────────────────────────
# Assessment Templates
# ─────────────────────────────────────────────────────────────────────────────

templates = APIRouter(prefix="/templates", tags=["Assessments — Templates"])


@templates.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_templates(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    sort_by: str = Query("assessment_name"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await AssessmentTemplateService(db).list(page, page_size, search, status, category_id, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@templates.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_template(body: AssessmentTemplateCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await AssessmentTemplateService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Assessment template created")


@templates.get("/all-active", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_templates_all_active(db: AsyncSession = Depends(get_db)):
    items = await AssessmentTemplateService(db).list_all_active()
    return success_response(data=[i.model_dump() for i in items])


@templates.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_template(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await AssessmentTemplateService(db).get(uuid)
    if not result:
        return not_found_response("Assessment template")
    return success_response(data=result.model_dump())


@templates.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_template(uuid: str, body: AssessmentTemplateUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await AssessmentTemplateService(db).update(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Assessment template")
    return success_response(data=result.model_dump(), message="Assessment template updated")


@templates.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_template(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await AssessmentTemplateService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Assessment template")
    return success_response(message="Assessment template deleted")


@templates.patch("/{uuid}/activate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def activate_template(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await AssessmentTemplateService(db).activate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Assessment template")
    return success_response(data=result.model_dump(), message="Assessment template activated")


@templates.patch("/{uuid}/deactivate", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def deactivate_template(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await AssessmentTemplateService(db).deactivate(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Assessment template")
    return success_response(data=result.model_dump(), message="Assessment template deactivated")


@templates.patch("/{uuid}/archive", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def archive_template(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await AssessmentTemplateService(db).archive(uuid, by=current_user.uuid)
    if not result:
        return not_found_response("Assessment template")
    return success_response(data=result.model_dump(), message="Assessment template archived")


@templates.post("/{uuid}/clone", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def clone_template(uuid: str, body: AssessmentCloneRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await AssessmentTemplateService(db).clone(uuid, body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    if not result:
        return not_found_response("Assessment template")
    return created_response(data=result.model_dump(), message="Assessment template cloned")


@templates.get("/{uuid}/versions", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_template_versions(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await AssessmentTemplateService(db).get_versions(uuid)
    if result is None:
        return not_found_response("Assessment template")
    return success_response(data=[v.model_dump() for v in result])


router.include_router(templates)


# ─────────────────────────────────────────────────────────────────────────────
# Assessment Rules
# ─────────────────────────────────────────────────────────────────────────────

rules = APIRouter(prefix="/rules", tags=["Assessments — Rules"])


@rules.get("", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def list_rules(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("id"), sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await AssessmentRuleService(db).list(page, page_size, search, sort_by, sort_order)
    return success_response(data=_paginate(items, total, page, page_size))


@rules.post("", dependencies=[Depends(check_permissions(["master_data.create"]))])
async def create_rule(body: AssessmentRuleCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        result = await AssessmentRuleService(db).create(body, by=current_user.uuid)
    except ValueError as e:
        return error_response(str(e))
    return created_response(data=result.model_dump(), message="Assessment rule created")


@rules.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def get_rule(uuid: str, db: AsyncSession = Depends(get_db)):
    result = await AssessmentRuleService(db).get(uuid)
    if not result:
        return not_found_response("Assessment rule")
    return success_response(data=result.model_dump())


@rules.put("/{uuid}", dependencies=[Depends(check_permissions(["master_data.edit"]))])
async def update_rule(uuid: str, body: AssessmentRuleUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await AssessmentRuleService(db).update(uuid, body, by=current_user.uuid)
    if not result:
        return not_found_response("Assessment rule")
    return success_response(data=result.model_dump(), message="Assessment rule updated")


@rules.delete("/{uuid}", dependencies=[Depends(check_permissions(["master_data.delete"]))])
async def delete_rule(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ok = await AssessmentRuleService(db).delete(uuid, by=current_user.uuid)
    if not ok:
        return not_found_response("Assessment rule")
    return success_response(message="Assessment rule deleted")


router.include_router(rules)


# ─────────────────────────────────────────────────────────────────────────────
# Assessment Preview
# ─────────────────────────────────────────────────────────────────────────────

preview = APIRouter(prefix="/preview", tags=["Assessments — Preview"])


@preview.get("/{uuid}", dependencies=[Depends(check_permissions(["master_data.view"]))])
async def preview_assessment(uuid: str, db: AsyncSession = Depends(get_db)):
    svc = AssessmentTemplateService(db)
    result = await svc.get(uuid)
    if not result:
        return not_found_response("Assessment template")
    versions = await svc.get_versions(uuid)
    preview_data = {
        **result.model_dump(),
        "versions": [v.model_dump() for v in (versions or [])],
    }
    return success_response(data=preview_data)


router.include_router(preview)
