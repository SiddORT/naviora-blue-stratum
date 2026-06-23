"""Organization Portal — Certificate endpoints."""
from __future__ import annotations

import math
import os
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser, require_org_admin
from app.models.assessment import Assessment
from app.models.candidate import Candidate
from app.models.certificate import Certificate
from app.models.certificate_history import CertificateHistory
from app.models.certificate_template import CertificateTemplate
from app.models.organization import Organization
from app.schemas.certificates import (
    CertificateHistoryResponse,
    CertificateListItem,
    CertificateResponse,
    CertificateRevokeRequest,
    CertificateRenewRequest,
)
from app.services.certificates import CertificateGenerationService
from app.utils.responses import error_response, success_response

router = APIRouter()


def _cert_list(c: Certificate, candidate: Candidate | None, org: Organization | None,
               assessment: Assessment | None) -> CertificateListItem:
    return CertificateListItem(
        id=c.id, uuid=c.uuid,
        certificate_number=c.certificate_number,
        certificate_type=c.certificate_type,
        candidate_name=candidate.full_name if candidate else None,
        candidate_email=candidate.email if candidate else None,
        organization_name=org.organization_name if org else None,
        assessment_name=assessment.assessment_name if assessment else None,
        issue_date=c.issue_date, expiry_date=c.expiry_date,
        score=c.score, status=c.status,
        verification_url=c.verification_url, created_at=c.created_at,
    )


def _cert_detail(c: Certificate, candidate, org, assessment, template, history) -> CertificateResponse:
    return CertificateResponse(
        id=c.id, uuid=c.uuid,
        certificate_number=c.certificate_number,
        certificate_type=c.certificate_type,
        organization_id=c.organization_id,
        organization_name=org.organization_name if org else None,
        candidate_id=c.candidate_id,
        candidate_name=candidate.full_name if candidate else None,
        candidate_email=candidate.email if candidate else None,
        assessment_id=c.assessment_id,
        assessment_name=assessment.assessment_name if assessment else None,
        template_id=c.certificate_template_id,
        template_name=template.template_name if template else None,
        issue_date=c.issue_date, expiry_date=c.expiry_date,
        score=c.score, status=c.status,
        pdf_path=c.pdf_path, verification_hash=c.verification_hash,
        verification_url=c.verification_url, remarks=c.remarks, issued_by=c.issued_by,
        history=[CertificateHistoryResponse(
            id=h.id, action_type=h.action_type,
            previous_status=h.previous_status, new_status=h.new_status,
            remarks=h.remarks, action_by=h.action_by, created_at=h.created_at,
        ) for h in sorted(history, key=lambda x: x.created_at, reverse=True)],
        created_at=c.created_at, updated_at=c.updated_at,
    )


async def _load_related(db, c: Certificate):
    candidate = (await db.execute(select(Candidate).where(Candidate.id == c.candidate_id))).scalar_one_or_none()
    org = (await db.execute(select(Organization).where(Organization.id == c.organization_id))).scalar_one_or_none() if c.organization_id else None
    assessment = (await db.execute(select(Assessment).where(Assessment.id == c.assessment_id))).scalar_one_or_none() if c.assessment_id else None
    template = (await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == c.certificate_template_id))).scalar_one_or_none() if c.certificate_template_id else None
    history = (await db.execute(select(CertificateHistory).where(CertificateHistory.certificate_id == c.id))).scalars().all()
    return candidate, org, assessment, template, list(history)


@router.get("", summary="List org certificates")
async def list_org_certificates(
    ctx: CurrentOrgUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
):
    q = select(Certificate).where(
        and_(Certificate.organization_id == ctx.organization_id, Certificate.deleted_at.is_(None))
    )
    if status:
        q = q.where(Certificate.status == status)
    if search:
        cand_ids = (await db.execute(
            select(Candidate.id).where(
                Candidate.full_name.ilike(f"%{search}%") | Candidate.email.ilike(f"%{search}%")
            )
        )).scalars().all()
        q = q.where(
            Certificate.certificate_number.ilike(f"%{search}%") |
            Certificate.candidate_id.in_(cand_ids)
        )
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(
        q.order_by(Certificate.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    cand_map = {}
    if rows:
        cids = {c.candidate_id for c in rows}
        cand_map = {c.id: c for c in (await db.execute(select(Candidate).where(Candidate.id.in_(cids)))).scalars().all()}
    amap = {}
    if rows:
        aids = {c.assessment_id for c in rows if c.assessment_id}
        if aids:
            amap = {a.id: a for a in (await db.execute(select(Assessment).where(Assessment.id.in_(aids)))).scalars().all()}
    org = (await db.execute(select(Organization).where(Organization.id == ctx.organization_id))).scalar_one_or_none()
    return success_response({
        "items": [_cert_list(c, cand_map.get(c.candidate_id), org, amap.get(c.assessment_id)) for c in rows],
        "total": total, "page": page, "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    })


@router.get("/analytics", summary="Org certificate analytics")
async def org_analytics(ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    base = select(Certificate).where(
        and_(Certificate.organization_id == ctx.organization_id, Certificate.deleted_at.is_(None))
    )
    soon = date.today() + timedelta(days=90)
    total_issued = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Issued").subquery()))).scalar_one()
    total_expiring = (await db.execute(select(func.count()).select_from(
        base.where(and_(Certificate.status == "Issued", Certificate.expiry_date <= soon, Certificate.expiry_date >= date.today())).subquery()
    ))).scalar_one()
    total_expired = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Expired").subquery()))).scalar_one()
    total_revoked = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Revoked").subquery()))).scalar_one()
    total_suspended = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Suspended").subquery()))).scalar_one()
    return success_response({
        "total_issued": total_issued, "total_active": total_issued,
        "total_expiring_soon": total_expiring, "total_expired": total_expired,
        "total_revoked": total_revoked, "total_suspended": total_suspended,
    })


@router.get("/{uuid}", summary="Org: certificate detail")
async def get_org_cert(uuid: str, ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    c = (await db.execute(
        select(Certificate).where(and_(
            Certificate.uuid == uuid,
            Certificate.organization_id == ctx.organization_id,
            Certificate.deleted_at.is_(None),
        ))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    candidate, org, assessment, template, history = await _load_related(db, c)
    return success_response(_cert_detail(c, candidate, org, assessment, template, history))


@router.post("/{uuid}/revoke", summary="Org: revoke certificate")
async def org_revoke(
    uuid: str,
    body: CertificateRevokeRequest,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(
            Certificate.uuid == uuid,
            Certificate.organization_id == ctx.organization_id,
            Certificate.deleted_at.is_(None),
        ))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    if c.status not in ("Issued", "Suspended"):
        return error_response(f"Cannot revoke certificate in status '{c.status}'", 400)
    svc = CertificateGenerationService(db)
    await svc.revoke_certificate(c, ctx.user.uuid, body.remarks)
    await db.commit()
    candidate, org, assessment, template, history = await _load_related(db, c)
    return success_response(_cert_detail(c, candidate, org, assessment, template, history), "Certificate revoked")


@router.post("/{uuid}/renew", summary="Org: renew certificate")
async def org_renew(
    uuid: str,
    body: CertificateRenewRequest,
    ctx: CurrentOrgUser,
    _: None = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(
            Certificate.uuid == uuid,
            Certificate.organization_id == ctx.organization_id,
            Certificate.deleted_at.is_(None),
        ))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    svc = CertificateGenerationService(db)
    new_cert = await svc.renew_certificate(c, ctx.user.uuid, body.remarks)
    await db.commit()
    candidate, org, assessment, template, history = await _load_related(db, new_cert)
    return success_response(_cert_detail(new_cert, candidate, org, assessment, template, history), "Certificate renewed")


@router.get("/{uuid}/download", summary="Org: download certificate PDF")
async def org_download(uuid: str, ctx: CurrentOrgUser, db: AsyncSession = Depends(get_db)):
    c = (await db.execute(
        select(Certificate).where(and_(
            Certificate.uuid == uuid,
            Certificate.organization_id == ctx.organization_id,
            Certificate.deleted_at.is_(None),
        ))
    )).scalar_one_or_none()
    if not c or not c.pdf_path:
        return error_response("PDF not available", 404)
    full_path = os.path.join("uploads", c.pdf_path)
    if not os.path.exists(full_path):
        return error_response("PDF file not found on disk", 404)
    return FileResponse(full_path, media_type="application/pdf", filename=f"{c.certificate_number}.pdf")
