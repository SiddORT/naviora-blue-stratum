"""Candidate Portal — Certificate wallet endpoints."""
from __future__ import annotations

import math
import os
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.candidate_auth import get_current_candidate
from app.models.assessment import Assessment
from app.models.candidate import Candidate
from app.models.certificate import Certificate
from app.models.certificate_history import CertificateHistory
from app.models.certificate_template import CertificateTemplate
from app.models.organization import Organization
from app.schemas.certificates import CertificateHistoryResponse, CertificateListItem, CertificateResponse
from app.utils.responses import error_response, success_response

router = APIRouter()
CurrentCandidate = get_current_candidate


def _cert_list(c: Certificate, assessment: Assessment | None, org: Organization | None) -> CertificateListItem:
    return CertificateListItem(
        id=c.id, uuid=c.uuid,
        certificate_number=c.certificate_number,
        certificate_type=c.certificate_type,
        candidate_name=None,
        candidate_email=None,
        organization_name=org.organization_name if org else None,
        assessment_name=assessment.assessment_name if assessment else None,
        issue_date=c.issue_date, expiry_date=c.expiry_date,
        score=c.score, status=c.status,
        verification_url=c.verification_url, created_at=c.created_at,
    )


@router.get("", summary="My certificate wallet")
async def my_certificates(
    candidate: Candidate = Depends(CurrentCandidate),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
):
    q = select(Certificate).where(
        and_(Certificate.candidate_id == candidate.id, Certificate.deleted_at.is_(None))
    )
    if status:
        q = q.where(Certificate.status == status)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(q.order_by(Certificate.issue_date.desc().nulls_last(), Certificate.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()

    aids = {c.assessment_id for c in rows if c.assessment_id}
    oids = {c.organization_id for c in rows if c.organization_id}
    amap = {a.id: a for a in (await db.execute(select(Assessment).where(Assessment.id.in_(aids)))).scalars().all()} if aids else {}
    omap = {o.id: o for o in (await db.execute(select(Organization).where(Organization.id.in_(oids)))).scalars().all()} if oids else {}

    return {
        "items": [_cert_list(c, amap.get(c.assessment_id), omap.get(c.organization_id)) for c in rows],
        "total": total, "page": page, "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    }


@router.get("/summary", summary="My certificate summary stats")
async def my_summary(
    candidate: Candidate = Depends(CurrentCandidate),
    db: AsyncSession = Depends(get_db),
):
    q = select(Certificate).where(and_(Certificate.candidate_id == candidate.id, Certificate.deleted_at.is_(None)))
    soon = date.today() + timedelta(days=90)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    active = (await db.execute(select(func.count()).select_from(q.where(Certificate.status == "Issued").subquery()))).scalar_one()
    expiring = (await db.execute(select(func.count()).select_from(
        q.where(and_(Certificate.status == "Issued", Certificate.expiry_date <= soon, Certificate.expiry_date >= date.today())).subquery()
    ))).scalar_one()
    expired = (await db.execute(select(func.count()).select_from(q.where(Certificate.status == "Expired").subquery()))).scalar_one()
    return success_response({
        "total": total, "active": active, "expiring_soon": expiring, "expired": expired,
    })


@router.get("/{uuid}", summary="My certificate detail")
async def my_certificate_detail(
    uuid: str,
    candidate: Candidate = Depends(CurrentCandidate),
    db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(
            Certificate.uuid == uuid,
            Certificate.candidate_id == candidate.id,
            Certificate.deleted_at.is_(None),
        ))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)

    org = (await db.execute(select(Organization).where(Organization.id == c.organization_id))).scalar_one_or_none() if c.organization_id else None
    assessment = (await db.execute(select(Assessment).where(Assessment.id == c.assessment_id))).scalar_one_or_none() if c.assessment_id else None
    template = (await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == c.certificate_template_id))).scalar_one_or_none() if c.certificate_template_id else None
    history = (await db.execute(select(CertificateHistory).where(CertificateHistory.certificate_id == c.id))).scalars().all()

    return success_response(CertificateResponse(
        id=c.id, uuid=c.uuid,
        certificate_number=c.certificate_number,
        certificate_type=c.certificate_type,
        organization_id=c.organization_id,
        organization_name=org.organization_name if org else None,
        candidate_id=c.candidate_id,
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
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
    ))


@router.get("/{uuid}/download", summary="Download my certificate PDF")
async def download_my_certificate(
    uuid: str,
    candidate: Candidate = Depends(CurrentCandidate),
    db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(
            Certificate.uuid == uuid,
            Certificate.candidate_id == candidate.id,
            Certificate.deleted_at.is_(None),
        ))
    )).scalar_one_or_none()
    if not c or not c.pdf_path:
        return error_response("PDF not available", 404)
    full_path = os.path.join("uploads", c.pdf_path)
    if not os.path.exists(full_path):
        return error_response("PDF file not found on disk", 404)
    return FileResponse(full_path, media_type="application/pdf", filename=f"{c.certificate_number}.pdf")
