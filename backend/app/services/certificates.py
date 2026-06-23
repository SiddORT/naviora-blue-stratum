"""Certificate Generation, Eligibility, and Lifecycle Service."""
from __future__ import annotations

import hashlib
import io
import logging
import os
import secrets
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.assessment import Assessment
from app.models.candidate import Candidate
from app.models.certificate import Certificate
from app.models.certificate_history import CertificateHistory
from app.models.certificate_rule import CertificateRule
from app.models.certificate_settings import CertificateSettings
from app.models.certificate_template import CertificateTemplate
from app.models.organization import Organization

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return date.today()


def _add_months(d: date, months: int) -> date:
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    day = min(d.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                       31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


# ---------------------------------------------------------------------------
# Certificate Numbering Engine
# ---------------------------------------------------------------------------

class CertificateNumberingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _get_settings(self) -> CertificateSettings:
        row = (await self.db.execute(select(CertificateSettings).limit(1))).scalar_one_or_none()
        if not row:
            row = CertificateSettings(
                uuid=str(uuid.uuid4()),
                certificate_prefix="CERT",
                next_certificate_number=1,
                reset_frequency="annual",
                include_year_in_number=True,
            )
            self.db.add(row)
            await self.db.flush()
        return row

    async def _maybe_reset(self, cfg: CertificateSettings) -> None:
        now = _today()
        if cfg.reset_frequency == "annual":
            if cfg.last_reset_year != now.year:
                cfg.next_certificate_number = 1
                cfg.last_reset_year = now.year
                cfg.last_reset_month = now.month
        elif cfg.reset_frequency == "monthly":
            if cfg.last_reset_year != now.year or cfg.last_reset_month != now.month:
                cfg.next_certificate_number = 1
                cfg.last_reset_year = now.year
                cfg.last_reset_month = now.month
        # "continuous" — never reset

    async def next_number(self) -> str:
        cfg = await self._get_settings()
        await self._maybe_reset(cfg)
        seq = cfg.next_certificate_number
        cfg.next_certificate_number = seq + 1
        if cfg.include_year_in_number:
            return f"{cfg.certificate_prefix}-{_today().year}-{seq:06d}"
        return f"{cfg.certificate_prefix}-{seq:06d}"


# ---------------------------------------------------------------------------
# PDF Generation
# ---------------------------------------------------------------------------

def _generate_certificate_pdf(
    certificate_number: str,
    candidate_name: str,
    organization_name: str | None,
    assessment_name: str | None,
    issue_date: date,
    expiry_date: date | None,
    score: Decimal | None,
    certificate_type: str,
    verification_url: str,
) -> bytes:
    """Generate a professional-quality PDF certificate using reportlab."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        logger.error("reportlab not installed — cannot generate PDF")
        return b""

    try:
        import qrcode as qr_mod
        from reportlab.platypus import Image as RLImage
        qr_img = qr_mod.make(verification_url)
        qr_buf = io.BytesIO()
        qr_img.save(qr_buf, format="PNG")
        qr_buf.seek(0)
        qr_available = True
    except Exception:
        qr_available = False
        qr_buf = None

    buf = io.BytesIO()
    page_w, page_h = landscape(A4)

    # Colours
    GOLD = colors.HexColor("#D4A63A")
    DARK_BG = colors.HexColor("#0B0B0F")
    PANEL = colors.HexColor("#141821")
    WHITE = colors.white
    BLUE = colors.HexColor("#2EA8FF")

    from reportlab.pdfgen import canvas as pdfcanvas

    c = pdfcanvas.Canvas(buf, pagesize=landscape(A4))
    w, h = page_w, page_h

    # Background
    c.setFillColor(DARK_BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Gold border outer
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.rect(10 * mm, 10 * mm, w - 20 * mm, h - 20 * mm, fill=0, stroke=1)

    # Thin inner border
    c.setLineWidth(0.5)
    c.rect(13 * mm, 13 * mm, w - 26 * mm, h - 26 * mm, fill=0, stroke=1)

    # Header band
    c.setFillColor(PANEL)
    c.rect(10 * mm, h - 45 * mm, w - 20 * mm, 32 * mm, fill=1, stroke=0)

    # Platform name
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(w / 2, h - 28 * mm, "NAVIORA")
    c.setFillColor(colors.HexColor("#aaaaaa"))
    c.setFont("Helvetica", 9)
    c.drawCentredString(w / 2, h - 35 * mm, "BY BLUE STRATUM  |  MARITIME COMPETENCY PLATFORM")

    # Gold divider
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(30 * mm, h - 46 * mm, w - 30 * mm, h - 46 * mm)

    # Certificate of Competency title
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 11)
    c.drawCentredString(w / 2, h - 60 * mm, "CERTIFICATE OF COMPETENCY")

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(w / 2, h - 70 * mm, certificate_type.upper())

    # Thin line
    c.setStrokeColor(colors.HexColor("#333344"))
    c.setLineWidth(0.5)
    c.line(50 * mm, h - 74 * mm, w - 50 * mm, h - 74 * mm)

    # "This is to certify"
    c.setFillColor(colors.HexColor("#aaaaaa"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, h - 85 * mm, "This is to certify that")

    # Candidate name
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(w / 2, h - 100 * mm, candidate_name.upper())

    # Underline
    name_w = c.stringWidth(candidate_name.upper(), "Helvetica-Bold", 26)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(w / 2 - name_w / 2, h - 103 * mm, w / 2 + name_w / 2, h - 103 * mm)

    # "has successfully completed"
    c.setFillColor(colors.HexColor("#aaaaaa"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, h - 113 * mm, "has successfully completed and demonstrated competency in")

    # Assessment name
    aname = assessment_name or "Maritime Competency Assessment"
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(w / 2, h - 124 * mm, aname)

    # Score
    if score is not None:
        c.setFillColor(colors.HexColor("#aaaaaa"))
        c.setFont("Helvetica", 9)
        c.drawCentredString(w / 2, h - 132 * mm, f"Score: {score}%")

    # Bottom info row
    bottom_y = 30 * mm

    # Left: org
    c.setFillColor(colors.HexColor("#888899"))
    c.setFont("Helvetica", 8)
    c.drawString(20 * mm, bottom_y + 14 * mm, "ISSUING ORGANIZATION")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, bottom_y + 6 * mm, (organization_name or "Blue Stratum Maritime")[:40])

    # Centre: dates
    c.setFillColor(colors.HexColor("#888899"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(w / 2 - 25 * mm, bottom_y + 14 * mm, "ISSUE DATE")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(w / 2 - 25 * mm, bottom_y + 6 * mm, issue_date.strftime("%d %B %Y"))

    if expiry_date:
        c.setFillColor(colors.HexColor("#888899"))
        c.setFont("Helvetica", 8)
        c.drawCentredString(w / 2 + 25 * mm, bottom_y + 14 * mm, "EXPIRY DATE")
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(w / 2 + 25 * mm, bottom_y + 6 * mm, expiry_date.strftime("%d %B %Y"))

    # Cert number
    c.setFillColor(colors.HexColor("#888899"))
    c.setFont("Helvetica", 8)
    c.drawString(20 * mm, bottom_y - 2 * mm, f"Certificate No: {certificate_number}")

    # QR code (right side)
    if qr_available and qr_buf:
        try:
            from reportlab.lib.utils import ImageReader
            qr_reader = ImageReader(qr_buf)
            qr_size = 24 * mm
            c.drawImage(qr_reader, w - 20 * mm - qr_size, bottom_y - 4 * mm,
                        width=qr_size, height=qr_size, preserveAspectRatio=True)
            c.setFillColor(colors.HexColor("#888899"))
            c.setFont("Helvetica", 6)
            c.drawCentredString(w - 20 * mm - qr_size / 2, bottom_y - 7 * mm, "SCAN TO VERIFY")
        except Exception:
            pass

    # Verification URL small text
    c.setFillColor(colors.HexColor("#555566"))
    c.setFont("Helvetica", 7)
    c.drawCentredString(w / 2, 16 * mm, f"Verify online: {verification_url}")

    c.save()
    buf.seek(0)
    return buf.read()


# ---------------------------------------------------------------------------
# Eligibility Service
# ---------------------------------------------------------------------------

class CertificateEligibilityService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_applicable_rule(
        self, assessment_id: int
    ) -> CertificateRule | None:
        row = (await self.db.execute(
            select(CertificateRule)
            .where(
                and_(
                    CertificateRule.assessment_id == assessment_id,
                    CertificateRule.status == "Active",
                    CertificateRule.deleted_at.is_(None),
                )
            )
            .order_by(CertificateRule.id.asc())
            .limit(1)
        )).scalar_one_or_none()
        return row

    async def has_active_certificate(
        self, candidate_id: int, assessment_id: int
    ) -> bool:
        row = (await self.db.execute(
            select(Certificate.id).where(
                and_(
                    Certificate.candidate_id == candidate_id,
                    Certificate.assessment_id == assessment_id,
                    Certificate.status.in_(["Issued", "Suspended"]),
                    Certificate.deleted_at.is_(None),
                )
            ).limit(1)
        )).scalar_one_or_none()
        return row is not None

    async def check_eligibility(
        self,
        candidate_id: int,
        assessment_id: int,
        score: Decimal | None = None,
        result_status: str | None = None,
    ) -> dict[str, Any]:
        rule = await self.get_applicable_rule(assessment_id)
        if not rule:
            return {"eligible": False, "reason": "No certificate rule configured for this assessment"}

        if rule.minimum_score and score is not None and score < rule.minimum_score:
            return {
                "eligible": False,
                "reason": f"Score {score} below minimum {rule.minimum_score}",
                "rule": rule,
            }

        if result_status and result_status.lower() not in ("passed", "pass"):
            return {"eligible": False, "reason": "Assessment not passed", "rule": rule}

        if await self.has_active_certificate(candidate_id, assessment_id):
            return {"eligible": False, "reason": "Active certificate already exists", "rule": rule}

        return {"eligible": True, "rule": rule}


# ---------------------------------------------------------------------------
# Generation Service
# ---------------------------------------------------------------------------

class CertificateGenerationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.numbering = CertificateNumberingService(db)

    def _make_hash(self, certificate_number: str) -> str:
        raw = f"{certificate_number}:{secrets.token_hex(16)}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def _make_verification_url(self, certificate_number: str) -> str:
        base = os.environ.get("PUBLIC_BASE_URL", "https://naviora.app")
        return f"{base}/verify-certificate/{certificate_number}"

    async def _load_related(
        self,
        candidate_id: int,
        assessment_id: int | None,
        organization_id: int | None,
        template_id: int | None,
    ) -> dict[str, Any]:
        candidate = (await self.db.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )).scalar_one_or_none()

        assessment = None
        if assessment_id:
            assessment = (await self.db.execute(
                select(Assessment).where(Assessment.id == assessment_id)
            )).scalar_one_or_none()

        organization = None
        if organization_id:
            organization = (await self.db.execute(
                select(Organization).where(Organization.id == organization_id)
            )).scalar_one_or_none()

        template = None
        if template_id:
            template = (await self.db.execute(
                select(CertificateTemplate).where(CertificateTemplate.id == template_id)
            )).scalar_one_or_none()

        if not template:
            template = (await self.db.execute(
                select(CertificateTemplate)
                .where(
                    and_(
                        CertificateTemplate.is_default == True,  # noqa: E712
                        CertificateTemplate.status == "Active",
                        CertificateTemplate.deleted_at.is_(None),
                    )
                )
                .limit(1)
            )).scalar_one_or_none()

        return {
            "candidate": candidate,
            "assessment": assessment,
            "organization": organization,
            "template": template,
        }

    async def generate_certificate(
        self,
        candidate_id: int,
        assessment_id: int | None = None,
        result_id: int | None = None,
        organization_id: int | None = None,
        template_id: int | None = None,
        score: Decimal | None = None,
        validity_months: int | None = None,
        issued_by_uuid: str | None = None,
        remarks: str | None = None,
        auto_issue: bool = False,
    ) -> Certificate:
        related = await self._load_related(
            candidate_id, assessment_id, organization_id, template_id
        )
        candidate = related["candidate"]
        if not candidate:
            raise ValueError(f"Candidate {candidate_id} not found")

        assessment = related["assessment"]
        template = related["template"]
        organization = related["organization"]

        # Determine validity
        expiry: date | None = None
        today = _today()
        if validity_months:
            expiry = _add_months(today, validity_months)
        elif assessment and assessment.certificate_validity_months:
            expiry = _add_months(today, assessment.certificate_validity_months)

        cert_number = await self.numbering.next_number()
        v_hash = self._make_hash(cert_number)
        v_url = self._make_verification_url(cert_number)

        cert = Certificate(
            uuid=str(uuid.uuid4()),
            certificate_number=cert_number,
            certificate_type=template.certificate_type if template else "Standard",
            certificate_template_id=template.id if template else None,
            organization_id=organization.id if organization else None,
            candidate_id=candidate_id,
            assessment_id=assessment_id,
            result_id=result_id,
            issue_date=today if auto_issue else None,
            expiry_date=expiry if auto_issue else None,
            score=score,
            status="Issued" if auto_issue else "Draft",
            verification_hash=v_hash,
            verification_url=v_url,
            remarks=remarks,
            issued_by=issued_by_uuid,
        )
        self.db.add(cert)
        await self.db.flush()

        # Generate PDF
        try:
            pdf_bytes = _generate_certificate_pdf(
                certificate_number=cert_number,
                candidate_name=candidate.full_name,
                organization_name=organization.organization_name if organization else None,
                assessment_name=assessment.assessment_name if assessment else None,
                issue_date=today,
                expiry_date=expiry,
                score=score,
                certificate_type=cert.certificate_type,
                verification_url=v_url,
            )
            if pdf_bytes:
                pdf_dir = os.path.join(settings.UPLOAD_DIR, "certificates")
                os.makedirs(pdf_dir, exist_ok=True)
                safe_num = cert_number.replace("/", "-")
                pdf_filename = f"{safe_num}.pdf"
                pdf_path = os.path.join(pdf_dir, pdf_filename)
                with open(pdf_path, "wb") as f:
                    f.write(pdf_bytes)
                cert.pdf_path = f"certificates/{pdf_filename}"
        except Exception as exc:
            logger.warning("PDF generation failed for %s: %s", cert_number, exc)

        # History entry
        self.db.add(CertificateHistory(
            certificate_id=cert.id,
            action_type="Issued" if auto_issue else "Draft",
            previous_status=None,
            new_status=cert.status,
            remarks=remarks,
            action_by=issued_by_uuid,
        ))

        await self.db.flush()
        return cert

    async def issue_certificate(
        self, cert: Certificate, issued_by_uuid: str | None, remarks: str | None = None
    ) -> Certificate:
        prev = cert.status
        today = _today()
        cert.status = "Issued"
        cert.issue_date = today
        cert.issued_by = issued_by_uuid

        # Reload related for PDF regeneration
        candidate = (await self.db.execute(
            select(Candidate).where(Candidate.id == cert.candidate_id)
        )).scalar_one_or_none()
        assessment = None
        if cert.assessment_id:
            assessment = (await self.db.execute(
                select(Assessment).where(Assessment.id == cert.assessment_id)
            )).scalar_one_or_none()
        organization = None
        if cert.organization_id:
            organization = (await self.db.execute(
                select(Organization).where(Organization.id == cert.organization_id)
            )).scalar_one_or_none()

        if not cert.pdf_path and candidate:
            try:
                pdf_bytes = _generate_certificate_pdf(
                    certificate_number=cert.certificate_number,
                    candidate_name=candidate.full_name,
                    organization_name=organization.organization_name if organization else None,
                    assessment_name=assessment.assessment_name if assessment else None,
                    issue_date=today,
                    expiry_date=cert.expiry_date,
                    score=cert.score,
                    certificate_type=cert.certificate_type,
                    verification_url=cert.verification_url or "",
                )
                if pdf_bytes:
                    pdf_dir = os.path.join(settings.UPLOAD_DIR, "certificates")
                    os.makedirs(pdf_dir, exist_ok=True)
                    safe_num = cert.certificate_number.replace("/", "-")
                    pdf_path = os.path.join(pdf_dir, f"{safe_num}.pdf")
                    with open(pdf_path, "wb") as f:
                        f.write(pdf_bytes)
                    cert.pdf_path = f"certificates/{safe_num}.pdf"
            except Exception as exc:
                logger.warning("PDF generation on issue failed: %s", exc)

        self.db.add(CertificateHistory(
            certificate_id=cert.id,
            action_type="Issued",
            previous_status=prev,
            new_status="Issued",
            remarks=remarks,
            action_by=issued_by_uuid,
        ))
        await self.db.flush()
        return cert

    async def revoke_certificate(
        self, cert: Certificate, revoked_by_uuid: str | None, remarks: str
    ) -> Certificate:
        prev = cert.status
        cert.status = "Revoked"
        self.db.add(CertificateHistory(
            certificate_id=cert.id,
            action_type="Revoked",
            previous_status=prev,
            new_status="Revoked",
            remarks=remarks,
            action_by=revoked_by_uuid,
        ))
        await self.db.flush()
        return cert

    async def suspend_certificate(
        self, cert: Certificate, by_uuid: str | None, remarks: str
    ) -> Certificate:
        prev = cert.status
        cert.status = "Suspended"
        self.db.add(CertificateHistory(
            certificate_id=cert.id,
            action_type="Suspended",
            previous_status=prev,
            new_status="Suspended",
            remarks=remarks,
            action_by=by_uuid,
        ))
        await self.db.flush()
        return cert

    async def reinstate_certificate(
        self, cert: Certificate, by_uuid: str | None, remarks: str | None = None
    ) -> Certificate:
        prev = cert.status
        cert.status = "Issued"
        self.db.add(CertificateHistory(
            certificate_id=cert.id,
            action_type="Reinstated",
            previous_status=prev,
            new_status="Issued",
            remarks=remarks,
            action_by=by_uuid,
        ))
        await self.db.flush()
        return cert

    async def renew_certificate(
        self,
        cert: Certificate,
        by_uuid: str | None,
        remarks: str | None = None,
        validity_months: int | None = None,
    ) -> Certificate:
        """Create a new certificate version, mark old one as superseded."""
        old_status = cert.status
        cert.status = "Expired"
        self.db.add(CertificateHistory(
            certificate_id=cert.id,
            action_type="Superseded",
            previous_status=old_status,
            new_status="Expired",
            remarks=f"Superseded by renewal. {remarks or ''}".strip(),
            action_by=by_uuid,
        ))
        await self.db.flush()

        # Load related
        candidate = (await self.db.execute(
            select(Candidate).where(Candidate.id == cert.candidate_id)
        )).scalar_one_or_none()
        assessment = None
        if cert.assessment_id:
            assessment = (await self.db.execute(
                select(Assessment).where(Assessment.id == cert.assessment_id)
            )).scalar_one_or_none()

        months = (
            validity_months
            or (assessment.certificate_validity_months if assessment else None)
            or 24
        )

        new_cert = await self.generate_certificate(
            candidate_id=cert.candidate_id,
            assessment_id=cert.assessment_id,
            organization_id=cert.organization_id,
            template_id=cert.certificate_template_id,
            score=cert.score,
            validity_months=months,
            issued_by_uuid=by_uuid,
            remarks=f"Renewed from {cert.certificate_number}. {remarks or ''}".strip(),
            auto_issue=True,
        )
        return new_cert
