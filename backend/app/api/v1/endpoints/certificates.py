"""Admin — Certificate Templates, Rules, Certificates, Settings, Analytics."""
from __future__ import annotations

import math
import os
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.db.session import get_db
from app.models.assessment import Assessment
from app.models.candidate import Candidate
from app.models.certificate import Certificate
from app.models.certificate_history import CertificateHistory
from app.models.certificate_rule import CertificateRule
from app.models.certificate_settings import CertificateSettings
from app.models.certificate_template import CertificateTemplate
from app.models.organization import Organization
from app.schemas.certificates import (
    CertificateAnalyticsResponse,
    CertificateGenerateRequest,
    CertificateHistoryResponse,
    CertificateIssueRequest,
    CertificateListItem,
    CertificateResponse,
    CertificateRevokeRequest,
    CertificateRenewRequest,
    CertificateRuleCreate,
    CertificateRuleResponse,
    CertificateRuleUpdate,
    CertificateSettingsResponse,
    CertificateSettingsUpdate,
    CertificateSuspendRequest,
    CertificateTemplateCreate,
    CertificateTemplateResponse,
    CertificateTemplateUpdate,
)
from app.services.certificates import CertificateGenerationService
from app.utils.responses import error_response, success_response

router = APIRouter(dependencies=[Depends(check_permissions(["certificates.manage"]))])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _template_resp(t: CertificateTemplate) -> CertificateTemplateResponse:
    return CertificateTemplateResponse(
        id=t.id, uuid=t.uuid,
        template_name=t.template_name,
        template_code=t.template_code,
        description=t.description,
        certificate_type=t.certificate_type,
        background_image_path=t.background_image_path,
        logo_path=t.logo_path,
        signature_image_path=t.signature_image_path,
        is_default=t.is_default,
        status=t.status,
        template_html=t.template_html,
        template_config=t.template_config,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


def _rule_resp(r: CertificateRule, assessment: Assessment | None,
               template: CertificateTemplate | None) -> CertificateRuleResponse:
    return CertificateRuleResponse(
        id=r.id, uuid=r.uuid,
        assessment_id=r.assessment_id,
        assessment_name=assessment.assessment_name if assessment else None,
        template_id=r.template_id,
        template_name=template.template_name if template else None,
        minimum_score=r.minimum_score,
        require_review_approval=r.require_review_approval,
        auto_issue=r.auto_issue,
        validity_period_months=r.validity_period_months,
        status=r.status,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


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


def _cert_detail(c: Certificate, candidate: Candidate | None, org: Organization | None,
                 assessment: Assessment | None, template: CertificateTemplate | None,
                 history: list) -> CertificateResponse:
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


async def _load_cert_related(db: AsyncSession, c: Certificate):
    candidate = (await db.execute(
        select(Candidate).where(Candidate.id == c.candidate_id)
    )).scalar_one_or_none()
    org = (await db.execute(
        select(Organization).where(Organization.id == c.organization_id)
    )).scalar_one_or_none() if c.organization_id else None
    assessment = (await db.execute(
        select(Assessment).where(Assessment.id == c.assessment_id)
    )).scalar_one_or_none() if c.assessment_id else None
    template = (await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.id == c.certificate_template_id)
    )).scalar_one_or_none() if c.certificate_template_id else None
    history = (await db.execute(
        select(CertificateHistory).where(CertificateHistory.certificate_id == c.id)
    )).scalars().all()
    return candidate, org, assessment, template, list(history)


# ── Certificate Templates ─────────────────────────────────────────────────────

@router.get("/templates", summary="List certificate templates")
async def list_templates(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
):
    q = select(CertificateTemplate).where(CertificateTemplate.deleted_at.is_(None))
    if status:
        q = q.where(CertificateTemplate.status == status)
    if search:
        q = q.where(CertificateTemplate.template_name.ilike(f"%{search}%"))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(
        q.order_by(CertificateTemplate.template_name)
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return success_response({
        "items": [_template_resp(t) for t in rows],
        "total": total, "page": page, "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    })


@router.post("/templates", summary="Create certificate template")
async def create_template(
    body: CertificateTemplateCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    existing = (await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.template_code == body.template_code)
    )).scalar_one_or_none()
    if existing:
        return error_response("Template code already exists", 409)
    if body.is_default:
        await db.execute(
            CertificateTemplate.__table__.update()
            .where(CertificateTemplate.deleted_at.is_(None))
            .values(is_default=False)
        )
    t = CertificateTemplate(**body.model_dump(), created_by=current_user.uuid)
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return success_response(_template_resp(t), "Template created")


@router.get("/templates/{uuid}", summary="Get template detail")
async def get_template(uuid: str, db: AsyncSession = Depends(get_db)):
    t = (await db.execute(
        select(CertificateTemplate).where(
            and_(CertificateTemplate.uuid == uuid, CertificateTemplate.deleted_at.is_(None))
        )
    )).scalar_one_or_none()
    if not t:
        return error_response("Template not found", 404)
    return success_response(_template_resp(t))


@router.patch("/templates/{uuid}", summary="Update template")
async def update_template(
    uuid: str, body: CertificateTemplateUpdate, current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    t = (await db.execute(
        select(CertificateTemplate).where(
            and_(CertificateTemplate.uuid == uuid, CertificateTemplate.deleted_at.is_(None))
        )
    )).scalar_one_or_none()
    if not t:
        return error_response("Template not found", 404)
    data = body.model_dump(exclude_none=True)
    if data.get("is_default"):
        await db.execute(
            CertificateTemplate.__table__.update()
            .where(CertificateTemplate.deleted_at.is_(None))
            .values(is_default=False)
        )
    for k, v in data.items():
        setattr(t, k, v)
    t.updated_by = current_user.uuid
    await db.commit()
    await db.refresh(t)
    return success_response(_template_resp(t), "Template updated")


@router.delete("/templates/{uuid}", summary="Archive template")
async def delete_template(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    t = (await db.execute(
        select(CertificateTemplate).where(
            and_(CertificateTemplate.uuid == uuid, CertificateTemplate.deleted_at.is_(None))
        )
    )).scalar_one_or_none()
    if not t:
        return error_response("Template not found", 404)
    t.soft_delete(current_user.uuid)
    await db.commit()
    return success_response(None, "Template archived")


# ── Certificate Rules ─────────────────────────────────────────────────────────

@router.get("/rules", summary="List certificate rules")
async def list_rules(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    assessment_id: int | None = Query(None),
):
    q = select(CertificateRule).where(CertificateRule.deleted_at.is_(None))
    if assessment_id:
        q = q.where(CertificateRule.assessment_id == assessment_id)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(
        q.order_by(CertificateRule.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    a_ids = {r.assessment_id for r in rows}
    t_ids = {r.template_id for r in rows}
    assessments = {a.id: a for a in (await db.execute(
        select(Assessment).where(Assessment.id.in_(a_ids))
    )).scalars().all()} if a_ids else {}
    templates = {t.id: t for t in (await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.id.in_(t_ids))
    )).scalars().all()} if t_ids else {}
    return success_response({
        "items": [_rule_resp(r, assessments.get(r.assessment_id), templates.get(r.template_id)) for r in rows],
        "total": total, "page": page, "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    })


@router.post("/rules", summary="Create certificate rule")
async def create_rule(
    body: CertificateRuleCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    r = CertificateRule(**body.model_dump(), created_by=current_user.uuid)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    assessment = (await db.execute(select(Assessment).where(Assessment.id == r.assessment_id))).scalar_one_or_none()
    template = (await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == r.template_id))).scalar_one_or_none()
    return success_response(_rule_resp(r, assessment, template), "Rule created")


@router.patch("/rules/{uuid}", summary="Update certificate rule")
async def update_rule(
    uuid: str, body: CertificateRuleUpdate, current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(
        select(CertificateRule).where(and_(CertificateRule.uuid == uuid, CertificateRule.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not r:
        return error_response("Rule not found", 404)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(r, k, v)
    r.updated_by = current_user.uuid
    await db.commit()
    await db.refresh(r)
    assessment = (await db.execute(select(Assessment).where(Assessment.id == r.assessment_id))).scalar_one_or_none()
    template = (await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == r.template_id))).scalar_one_or_none()
    return success_response(_rule_resp(r, assessment, template), "Rule updated")


@router.delete("/rules/{uuid}", summary="Delete certificate rule")
async def delete_rule(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(
        select(CertificateRule).where(and_(CertificateRule.uuid == uuid, CertificateRule.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not r:
        return error_response("Rule not found", 404)
    r.soft_delete(current_user.uuid)
    await db.commit()
    return success_response(None, "Rule deleted")


# ── Certificates ──────────────────────────────────────────────────────────────

@router.get("", summary="List all certificates (admin)")
async def list_certificates(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    organization_id: int | None = Query(None),
    assessment_id: int | None = Query(None),
):
    q = select(Certificate).where(Certificate.deleted_at.is_(None))
    if status:
        q = q.where(Certificate.status == status)
    if organization_id:
        q = q.where(Certificate.organization_id == organization_id)
    if assessment_id:
        q = q.where(Certificate.assessment_id == assessment_id)
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
    cand_ids2 = {c.candidate_id for c in rows}
    org_ids = {c.organization_id for c in rows if c.organization_id}
    a_ids = {c.assessment_id for c in rows if c.assessment_id}
    candidates = {c.id: c for c in (await db.execute(select(Candidate).where(Candidate.id.in_(cand_ids2)))).scalars().all()} if cand_ids2 else {}
    orgs = {o.id: o for o in (await db.execute(select(Organization).where(Organization.id.in_(org_ids)))).scalars().all()} if org_ids else {}
    assessments = {a.id: a for a in (await db.execute(select(Assessment).where(Assessment.id.in_(a_ids)))).scalars().all()} if a_ids else {}
    return success_response({
        "items": [_cert_list(c, candidates.get(c.candidate_id), orgs.get(c.organization_id), assessments.get(c.assessment_id)) for c in rows],
        "total": total, "page": page, "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    })


@router.post("/generate", summary="Generate a certificate")
async def generate_certificate(
    body: CertificateGenerateRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    candidate = (await db.execute(select(Candidate).where(Candidate.id == body.candidate_id))).scalar_one_or_none()
    if not candidate:
        return error_response("Candidate not found", 404)
    svc = CertificateGenerationService(db)
    from app.services.certificates import CertificateEligibilityService
    elig = CertificateEligibilityService(db)
    check = await elig.check_eligibility(body.candidate_id, body.assessment_id)
    rule = check.get("rule")
    cert = await svc.generate_certificate(
        candidate_id=body.candidate_id,
        assessment_id=body.assessment_id,
        result_id=body.result_id,
        organization_id=candidate.organization_id,
        template_id=body.template_id or (rule.template_id if rule else None),
        validity_months=rule.validity_period_months if rule else None,
        issued_by_uuid=current_user.uuid,
        remarks=body.remarks,
        auto_issue=rule.auto_issue if rule else False,
    )
    await db.commit()
    c2, org, assessment, template, history = await _load_cert_related(db, cert)
    return success_response(_cert_detail(cert, c2, org, assessment, template, history), "Certificate generated")


@router.get("/settings/config", summary="Get certificate settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    cfg = (await db.execute(select(CertificateSettings).limit(1))).scalar_one_or_none()
    if not cfg:
        return error_response("Settings not configured", 404)
    return success_response(CertificateSettingsResponse(
        id=cfg.id, uuid=cfg.uuid,
        certificate_prefix=cfg.certificate_prefix,
        next_certificate_number=cfg.next_certificate_number,
        reset_frequency=cfg.reset_frequency,
        last_reset_year=cfg.last_reset_year,
        last_reset_month=cfg.last_reset_month,
        include_year_in_number=cfg.include_year_in_number,
        updated_at=cfg.updated_at,
    ))


@router.patch("/settings/config", summary="Update certificate settings")
async def update_settings(
    body: CertificateSettingsUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    cfg = (await db.execute(select(CertificateSettings).limit(1))).scalar_one_or_none()
    if not cfg:
        return error_response("Settings not found", 404)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(cfg, k, v)
    cfg.updated_by = current_user.uuid
    await db.commit()
    await db.refresh(cfg)
    return success_response(CertificateSettingsResponse(
        id=cfg.id, uuid=cfg.uuid,
        certificate_prefix=cfg.certificate_prefix,
        next_certificate_number=cfg.next_certificate_number,
        reset_frequency=cfg.reset_frequency,
        last_reset_year=cfg.last_reset_year,
        last_reset_month=cfg.last_reset_month,
        include_year_in_number=cfg.include_year_in_number,
        updated_at=cfg.updated_at,
    ), "Settings updated")


@router.get("/analytics/summary", summary="Certificate analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    base = select(Certificate).where(Certificate.deleted_at.is_(None))
    soon = date.today() + timedelta(days=90)
    total_issued = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Issued").subquery()))).scalar_one()
    total_expiring = (await db.execute(select(func.count()).select_from(
        base.where(and_(Certificate.status == "Issued", Certificate.expiry_date <= soon, Certificate.expiry_date >= date.today())).subquery()
    ))).scalar_one()
    total_expired = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Expired").subquery()))).scalar_one()
    total_revoked = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Revoked").subquery()))).scalar_one()
    total_suspended = (await db.execute(select(func.count()).select_from(base.where(Certificate.status == "Suspended").subquery()))).scalar_one()
    recent = (await db.execute(
        select(Certificate).where(and_(Certificate.status == "Issued", Certificate.deleted_at.is_(None)))
        .order_by(Certificate.issue_date.desc()).limit(5)
    )).scalars().all()
    cand_ids = {c.candidate_id for c in recent}
    candidates = {c.id: c for c in (await db.execute(select(Candidate).where(Candidate.id.in_(cand_ids)))).scalars().all()} if cand_ids else {}
    return success_response(CertificateAnalyticsResponse(
        total_issued=total_issued, total_active=total_issued,
        total_expiring_soon=total_expiring, total_expired=total_expired,
        total_revoked=total_revoked, total_suspended=total_suspended,
        recent_issuances=[{
            "certificate_number": c.certificate_number,
            "candidate_name": candidates[c.candidate_id].full_name if c.candidate_id in candidates else None,
            "issue_date": c.issue_date.isoformat() if c.issue_date else None,
            "status": c.status,
        } for c in recent],
    ))


@router.get("/{uuid}", summary="Get certificate detail")
async def get_certificate(uuid: str, db: AsyncSession = Depends(get_db)):
    c = (await db.execute(
        select(Certificate).where(and_(Certificate.uuid == uuid, Certificate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    candidate, org, assessment, template, history = await _load_cert_related(db, c)
    return success_response(_cert_detail(c, candidate, org, assessment, template, history))


@router.post("/{uuid}/issue", summary="Issue a draft certificate")
async def issue_certificate(
    uuid: str, body: CertificateIssueRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(Certificate.uuid == uuid, Certificate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    if c.status != "Draft":
        return error_response(f"Cannot issue certificate in status '{c.status}'", 400)
    svc = CertificateGenerationService(db)
    await svc.issue_certificate(c, current_user.uuid, body.remarks)
    await db.commit()
    candidate, org, assessment, template, history = await _load_cert_related(db, c)
    return success_response(_cert_detail(c, candidate, org, assessment, template, history), "Certificate issued")


@router.post("/{uuid}/revoke", summary="Revoke a certificate")
async def revoke_certificate(
    uuid: str, body: CertificateRevokeRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(Certificate.uuid == uuid, Certificate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    if c.status not in ("Issued", "Suspended"):
        return error_response(f"Cannot revoke certificate in status '{c.status}'", 400)
    svc = CertificateGenerationService(db)
    await svc.revoke_certificate(c, current_user.uuid, body.remarks)
    await db.commit()
    candidate, org, assessment, template, history = await _load_cert_related(db, c)
    return success_response(_cert_detail(c, candidate, org, assessment, template, history), "Certificate revoked")


@router.post("/{uuid}/suspend", summary="Suspend a certificate")
async def suspend_certificate(
    uuid: str, body: CertificateSuspendRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(Certificate.uuid == uuid, Certificate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    if c.status != "Issued":
        return error_response(f"Cannot suspend certificate in status '{c.status}'", 400)
    svc = CertificateGenerationService(db)
    await svc.suspend_certificate(c, current_user.uuid, body.remarks)
    await db.commit()
    candidate, org, assessment, template, history = await _load_cert_related(db, c)
    return success_response(_cert_detail(c, candidate, org, assessment, template, history), "Certificate suspended")


@router.post("/{uuid}/reinstate", summary="Reinstate a certificate")
async def reinstate_certificate(
    uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(Certificate.uuid == uuid, Certificate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    if c.status != "Suspended":
        return error_response(f"Cannot reinstate certificate in status '{c.status}'", 400)
    svc = CertificateGenerationService(db)
    await svc.reinstate_certificate(c, current_user.uuid)
    await db.commit()
    candidate, org, assessment, template, history = await _load_cert_related(db, c)
    return success_response(_cert_detail(c, candidate, org, assessment, template, history), "Certificate reinstated")


@router.post("/{uuid}/renew", summary="Renew a certificate")
async def renew_certificate(
    uuid: str, body: CertificateRenewRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(and_(Certificate.uuid == uuid, Certificate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not c:
        return error_response("Certificate not found", 404)
    svc = CertificateGenerationService(db)
    new_cert = await svc.renew_certificate(c, current_user.uuid, body.remarks)
    await db.commit()
    candidate, org, assessment, template, history = await _load_cert_related(db, new_cert)
    return success_response(_cert_detail(new_cert, candidate, org, assessment, template, history), "Certificate renewed")


@router.get("/{uuid}/download", summary="Download certificate PDF")
async def download_certificate(uuid: str, db: AsyncSession = Depends(get_db)):
    c = (await db.execute(
        select(Certificate).where(and_(Certificate.uuid == uuid, Certificate.deleted_at.is_(None)))
    )).scalar_one_or_none()
    if not c or not c.pdf_path:
        return error_response("PDF not available", 404)
    full_path = os.path.join("uploads", c.pdf_path)
    if not os.path.exists(full_path):
        return error_response("PDF file not found on disk", 404)
    return FileResponse(full_path, media_type="application/pdf", filename=f"{c.certificate_number}.pdf")
