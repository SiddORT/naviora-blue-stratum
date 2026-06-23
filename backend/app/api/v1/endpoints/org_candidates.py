"""Organization Portal — Candidate management endpoints (org-scoped)."""
import math
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.helpers.pagination import PaginatedResponse
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateListResponse, CandidateResponse
from app.services.audit import AuditService
from app.services.candidate import CandidateService, _to_list_response, _to_response
from app.utils.responses import created_response, error_response, not_found_response, success_response

router = APIRouter()


class OrgCandidateCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    rank_or_designation: Optional[str] = None
    seafarer_id: Optional[str] = None
    notes: Optional[str] = None


class OrgCandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    rank_or_designation: Optional[str] = None
    seafarer_id: Optional[str] = None
    notes: Optional[str] = None


@router.get("", summary="List candidates for this organization")
async def list_org_candidates(
    ctx: CurrentOrgUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    org_id = ctx.organization_id
    base = select(Candidate).where(
        and_(Candidate.organization_id == org_id, Candidate.deleted_at.is_(None))
    )
    if search:
        pattern = f"%{search}%"
        base = base.where(
            Candidate.full_name.ilike(pattern) |
            Candidate.email.ilike(pattern) |
            Candidate.seafarer_id.ilike(pattern)
        )
    if status:
        base = base.where(Candidate.status == status)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(
        base.order_by(Candidate.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    items = [_to_list_response(c) for c in rows]
    resp = PaginatedResponse[CandidateListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get("/{uuid}", summary="Get candidate detail")
async def get_org_candidate(uuid: str, ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Candidate).where(
            and_(Candidate.uuid == uuid, Candidate.organization_id == ctx.organization_id, Candidate.deleted_at.is_(None))
        )
    )
    c = result.scalar_one_or_none()
    if not c:
        return not_found_response("Candidate not found")
    return success_response(data=_to_response(c).model_dump())


@router.post("", summary="Create a candidate for this organization")
async def create_org_candidate(
    body: OrgCandidateCreate,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    existing = (await db.execute(
        select(Candidate).where(and_(Candidate.email == body.email, Candidate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if existing:
        return error_response(message="Email already registered", status_code=409)

    import secrets, string
    temp_pw = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    c = Candidate(
        organization_id=ctx.organization_id,
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(temp_pw),
        phone=body.phone,
        date_of_birth=body.date_of_birth,
        nationality=body.nationality,
        rank_or_designation=body.rank_or_designation,
        seafarer_id=body.seafarer_id,
        notes=body.notes,
        status="active",
    )
    db.add(c)
    await db.flush()

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="org.candidate.created",
        user_id=ctx.user.uuid,
        resource_type="candidate",
        resource_id=c.uuid,
        new_values={"email": c.email, "organization_id": ctx.organization_id},
    )
    await db.commit()
    await db.refresh(c)
    return created_response(data=_to_response(c).model_dump(), message="Candidate created")


@router.patch("/{uuid}", summary="Update candidate details")
async def update_org_candidate(
    uuid: str,
    body: OrgCandidateUpdate,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Candidate).where(
            and_(Candidate.uuid == uuid, Candidate.organization_id == ctx.organization_id, Candidate.deleted_at.is_(None))
        )
    )
    c = result.scalar_one_or_none()
    if not c:
        return not_found_response("Candidate not found")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(c, field, val)
    await db.commit()
    await db.refresh(c)

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="org.candidate.updated",
        user_id=ctx.user.uuid,
        resource_type="candidate",
        resource_id=uuid,
        new_values=body.model_dump(exclude_unset=True),
    )
    return success_response(data=_to_response(c).model_dump(), message="Candidate updated")


@router.patch("/{uuid}/status", summary="Activate or deactivate a candidate")
async def update_org_candidate_status(
    uuid: str,
    body: dict,
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Candidate).where(
            and_(Candidate.uuid == uuid, Candidate.organization_id == ctx.organization_id, Candidate.deleted_at.is_(None))
        )
    )
    c = result.scalar_one_or_none()
    if not c:
        return not_found_response("Candidate not found")

    new_status = body.get("status", "active")
    if new_status not in ("active", "inactive", "suspended"):
        return error_response(message="Invalid status", status_code=400)
    c.status = new_status
    c.is_active = new_status == "active"
    await db.commit()

    audit = AuditService(db)
    await audit.log(
        module="org_portal",
        action="org.candidate.status_updated",
        user_id=ctx.user.uuid,
        resource_type="candidate",
        resource_id=uuid,
        new_values={"status": new_status},
    )
    return success_response(message=f"Candidate status updated to {new_status}")
