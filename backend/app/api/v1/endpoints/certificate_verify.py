"""Public — Certificate verification endpoint (no authentication required)."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.assessment import Assessment
from app.models.candidate import Candidate
from app.models.certificate import Certificate
from app.models.organization import Organization
from app.schemas.certificates import CertificateVerifyResponse
from app.utils.responses import success_response

router = APIRouter()


def _verification_status(cert: Certificate) -> str:
    if cert.status == "Issued":
        if cert.expiry_date and cert.expiry_date < date.today():
            return "Expired"
        return "Valid"
    return cert.status


@router.get("/{certificate_number}", summary="Public certificate verification", tags=["Public"])
async def verify_certificate(
    certificate_number: str,
    db: AsyncSession = Depends(get_db),
):
    c = (await db.execute(
        select(Certificate).where(
            and_(
                Certificate.certificate_number == certificate_number,
                Certificate.deleted_at.is_(None),
            )
        )
    )).scalar_one_or_none()

    if not c:
        return success_response(CertificateVerifyResponse(
            found=False,
            certificate_number=certificate_number,
            verification_status="Not Found",
        ))

    candidate = (await db.execute(
        select(Candidate).where(Candidate.id == c.candidate_id)
    )).scalar_one_or_none()
    assessment = (await db.execute(
        select(Assessment).where(Assessment.id == c.assessment_id)
    )).scalar_one_or_none() if c.assessment_id else None
    org = (await db.execute(
        select(Organization).where(Organization.id == c.organization_id)
    )).scalar_one_or_none() if c.organization_id else None

    return success_response(CertificateVerifyResponse(
        found=True,
        certificate_number=c.certificate_number,
        candidate_name=candidate.full_name if candidate else None,
        assessment_name=assessment.assessment_name if assessment else None,
        organization_name=org.organization_name if org else None,
        issue_date=c.issue_date,
        expiry_date=c.expiry_date,
        status=c.status,
        verification_status=_verification_status(c),
        score=c.score,
        certificate_type=c.certificate_type,
    ))
