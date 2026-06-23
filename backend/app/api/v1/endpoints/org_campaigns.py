"""Organization Portal — Assessment Campaign CRUD endpoints."""
import math
import secrets
import string
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.helpers.pagination import PaginatedResponse
from app.models.assessment import Assessment
from app.models.assessment_campaign import AssessmentCampaign
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_exercise import AssessmentExercise
from app.schemas.org_campaigns import (
    AssessmentSnippet, CampaignCreate, CampaignListItem, CampaignResponse, CampaignUpdate,
)
from app.services.audit import AuditService
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


def _generate_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return "CMP-" + "".join(secrets.choice(chars) for _ in range(length))


async def _get_campaign(uuid: str, org_id: int, db: AsyncSession) -> AssessmentCampaign | None:
    result = await db.execute(
        select(AssessmentCampaign).where(
            and_(
                AssessmentCampaign.uuid == uuid,
                AssessmentCampaign.organization_id == org_id,
                AssessmentCampaign.deleted_at.is_(None),
            )
        )
    )
    return result.scalar_one_or_none()


async def _assignment_count(campaign_id: int, db: AsyncSession) -> int:
    r = await db.execute(
        select(func.count()).where(
            and_(
                AssessmentAssignment.campaign_id == campaign_id,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )
    return r.scalar_one()


async def _build_assessment_snippet(assessment_id: int | None, db: AsyncSession) -> AssessmentSnippet | None:
    if not assessment_id:
        return None
    a = (await db.execute(select(Assessment).where(Assessment.id == assessment_id))).scalar_one_or_none()
    if not a:
        return None
    ex_count = (await db.execute(
        select(func.count()).where(AssessmentExercise.assessment_id == assessment_id)
    )).scalar_one()
    return AssessmentSnippet(
        uuid=a.uuid,
        assessment_name=a.assessment_name,
        assessment_code=a.assessment_code,
        duration_minutes=a.duration_minutes,
        passing_score=a.passing_score,
        max_attempts=a.max_attempts,
        exercise_count=ex_count,
    )


async def _to_response(c: AssessmentCampaign, db: AsyncSession) -> CampaignResponse:
    snippet = await _build_assessment_snippet(c.assessment_id, db)
    count = await _assignment_count(c.id, db)
    return CampaignResponse(
        uuid=c.uuid,
        campaign_name=c.campaign_name,
        campaign_code=c.campaign_code,
        description=c.description,
        status=c.status,
        start_date=c.start_date,
        end_date=c.end_date,
        timezone=c.timezone,
        duration_override_minutes=c.duration_override_minutes,
        passing_score_override=c.passing_score_override,
        max_attempts_override=c.max_attempts_override,
        randomize_exercises=c.randomize_exercises,
        randomize_variants=c.randomize_variants,
        published_at=c.published_at,
        created_at=c.created_at,
        updated_at=c.updated_at,
        assessment=snippet,
        assignment_count=count,
    )


@router.get("", summary="List assessment campaigns for this organization")
async def list_campaigns(
    ctx: CurrentOrgUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    base = select(AssessmentCampaign).where(
        and_(
            AssessmentCampaign.organization_id == ctx.organization_id,
            AssessmentCampaign.deleted_at.is_(None),
        )
    )
    if search:
        pat = f"%{search}%"
        base = base.where(
            AssessmentCampaign.campaign_name.ilike(pat) |
            AssessmentCampaign.campaign_code.ilike(pat)
        )
    if status:
        base = base.where(AssessmentCampaign.status == status)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(
        base.order_by(AssessmentCampaign.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    # Build list items with counts
    items = []
    for c in rows:
        count = await _assignment_count(c.id, db)
        a_name = None
        if c.assessment_id:
            a = (await db.execute(select(Assessment).where(Assessment.id == c.assessment_id))).scalar_one_or_none()
            a_name = a.assessment_name if a else None
        items.append(CampaignListItem(
            uuid=c.uuid,
            campaign_name=c.campaign_name,
            campaign_code=c.campaign_code,
            status=c.status,
            start_date=c.start_date,
            end_date=c.end_date,
            assignment_count=count,
            assessment_name=a_name,
            created_at=c.created_at,
        ))

    resp = PaginatedResponse[CampaignListItem](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get("/stats", summary="Campaign statistics for this organization")
async def campaign_stats(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    org_id = ctx.organization_id

    async def count_by_status(status: str) -> int:
        r = await db.execute(
            select(func.count()).where(
                and_(
                    AssessmentCampaign.organization_id == org_id,
                    AssessmentCampaign.status == status,
                    AssessmentCampaign.deleted_at.is_(None),
                )
            )
        )
        return r.scalar_one()

    total = (await db.execute(
        select(func.count()).where(
            and_(AssessmentCampaign.organization_id == org_id, AssessmentCampaign.deleted_at.is_(None))
        )
    )).scalar_one()

    return success_response(data={
        "total": total,
        "draft": await count_by_status("Draft"),
        "published": await count_by_status("Published"),
        "active": await count_by_status("Active"),
        "completed": await count_by_status("Completed"),
        "archived": await count_by_status("Archived"),
    })


@router.get("/active-assessments", summary="List active assessments available to select for a campaign")
async def list_active_assessments(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(Assessment).where(Assessment.status == "active").order_by(Assessment.assessment_name)
    )).scalars().all()

    items = []
    for a in rows:
        ex_count = (await db.execute(
            select(func.count()).where(AssessmentExercise.assessment_id == a.id)
        )).scalar_one()
        items.append({
            "id": a.id,
            "uuid": a.uuid,
            "assessment_name": a.assessment_name,
            "assessment_code": a.assessment_code,
            "assessment_type": a.assessment_type,
            "duration_minutes": a.duration_minutes,
            "passing_score": float(a.passing_score) if a.passing_score else None,
            "max_attempts": a.max_attempts,
            "exercise_count": ex_count,
        })
    return success_response(data=items)


@router.get("/{uuid}", summary="Get campaign detail")
async def get_campaign(uuid: str, ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    c = await _get_campaign(uuid, ctx.organization_id, db)
    if not c:
        return not_found_response("Campaign not found")
    return success_response(data=(await _to_response(c, db)).model_dump())


@router.post("", summary="Create a new assessment campaign")
async def create_campaign(
    body: CampaignCreate,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    # Generate unique code
    code = _generate_code()
    for _ in range(10):
        existing = (await db.execute(
            select(AssessmentCampaign).where(AssessmentCampaign.campaign_code == code)
        )).scalar_one_or_none()
        if not existing:
            break
        code = _generate_code()

    c = AssessmentCampaign(
        organization_id=ctx.organization_id,
        campaign_name=body.campaign_name,
        campaign_code=code,
        description=body.description,
        assessment_id=body.assessment_id,
        start_date=body.start_date,
        end_date=body.end_date,
        timezone=body.timezone,
        duration_override_minutes=body.duration_override_minutes,
        passing_score_override=body.passing_score_override,
        max_attempts_override=body.max_attempts_override,
        randomize_exercises=body.randomize_exercises,
        randomize_variants=body.randomize_variants,
        status="Draft",
        created_by=ctx.user.uuid,
    )
    db.add(c)
    await db.flush()

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="campaign.created",
        user_id=ctx.user.uuid,
        resource_type="assessment_campaign",
        resource_id=c.uuid,
        new_values={"campaign_name": c.campaign_name, "campaign_code": c.campaign_code},
    )
    await db.commit()
    await db.refresh(c)
    return created_response(data=(await _to_response(c, db)).model_dump(), message="Campaign created")


@router.patch("/{uuid}", summary="Update campaign details")
async def update_campaign(
    uuid: str,
    body: CampaignUpdate,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = await _get_campaign(uuid, ctx.organization_id, db)
    if not c:
        return not_found_response("Campaign not found")
    if c.status in ("Archived",):
        return error_response(message="Archived campaigns cannot be modified", status_code=400)

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(c, field, val)
    c.updated_by = ctx.user.uuid
    await db.commit()
    await db.refresh(c)

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="campaign.updated", user_id=ctx.user.uuid,
        resource_type="assessment_campaign", resource_id=uuid,
        new_values=body.model_dump(exclude_unset=True),
    )
    return success_response(data=(await _to_response(c, db)).model_dump(), message="Campaign updated")


@router.post("/{uuid}/publish", summary="Publish a draft campaign")
async def publish_campaign(
    uuid: str,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = await _get_campaign(uuid, ctx.organization_id, db)
    if not c:
        return not_found_response("Campaign not found")
    if c.status not in ("Draft",):
        return error_response(message=f"Cannot publish a campaign with status '{c.status}'", status_code=400)
    if not c.assessment_id:
        return error_response(message="Campaign must have an assessment before publishing", status_code=400)

    c.status = "Published"
    c.published_at = datetime.now(timezone.utc)
    c.updated_by = ctx.user.uuid
    await db.commit()

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="campaign.published", user_id=ctx.user.uuid,
        resource_type="assessment_campaign", resource_id=uuid,
        new_values={"status": "Published"},
    )
    return success_response(message="Campaign published successfully")


@router.post("/{uuid}/activate", summary="Activate a published campaign")
async def activate_campaign(
    uuid: str,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = await _get_campaign(uuid, ctx.organization_id, db)
    if not c:
        return not_found_response("Campaign not found")
    if c.status not in ("Published",):
        return error_response(message=f"Cannot activate a campaign with status '{c.status}'", status_code=400)

    c.status = "Active"
    c.updated_by = ctx.user.uuid
    await db.commit()

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="campaign.activated", user_id=ctx.user.uuid,
        resource_type="assessment_campaign", resource_id=uuid,
        new_values={"status": "Active"},
    )
    return success_response(message="Campaign activated")


@router.post("/{uuid}/complete", summary="Mark campaign as completed")
async def complete_campaign(
    uuid: str,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = await _get_campaign(uuid, ctx.organization_id, db)
    if not c:
        return not_found_response("Campaign not found")
    if c.status not in ("Active",):
        return error_response(message=f"Cannot complete a campaign with status '{c.status}'", status_code=400)

    c.status = "Completed"
    c.updated_by = ctx.user.uuid
    await db.commit()
    return success_response(message="Campaign marked as completed")


@router.post("/{uuid}/archive", summary="Archive a campaign")
async def archive_campaign(
    uuid: str,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = await _get_campaign(uuid, ctx.organization_id, db)
    if not c:
        return not_found_response("Campaign not found")
    if c.status == "Archived":
        return error_response(message="Campaign is already archived", status_code=400)

    c.status = "Archived"
    c.updated_by = ctx.user.uuid
    await db.commit()

    audit = AuditService(db)
    await audit.log(
        module="org_portal", action="campaign.archived", user_id=ctx.user.uuid,
        resource_type="assessment_campaign", resource_id=uuid,
        new_values={"status": "Archived"},
    )
    return success_response(message="Campaign archived")


@router.delete("/{uuid}", summary="Soft-delete a draft campaign")
async def delete_campaign(
    uuid: str,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = await _get_campaign(uuid, ctx.organization_id, db)
    if not c:
        return not_found_response("Campaign not found")
    if c.status not in ("Draft", "Archived"):
        return error_response(message="Only Draft or Archived campaigns can be deleted", status_code=400)

    c.soft_delete(ctx.user.uuid)
    await db.commit()
    return success_response(message="Campaign deleted")
