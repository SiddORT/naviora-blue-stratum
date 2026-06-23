"""Certificate — issued competency certificate for a candidate."""
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.certificate_template import CertificateTemplate
    from app.models.candidate import Candidate
    from app.models.organization import Organization
    from app.models.assessment import Assessment
    from app.models.certificate_history import CertificateHistory


class Certificate(TimestampMixin):
    __tablename__ = "certificates"

    certificate_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True,
    )
    certificate_type: Mapped[str] = mapped_column(String(100), nullable=False, default="Standard")
    certificate_template_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("certificate_templates.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    candidate_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    assessment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    result_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessment_results.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Draft", index=True,
        comment="Draft | Issued | Expired | Revoked | Suspended",
    )
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verification_hash: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True,
    )
    verification_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    issued_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    template: Mapped["CertificateTemplate | None"] = relationship(
        "CertificateTemplate", back_populates="certificates", lazy="noload",
    )
    candidate: Mapped["Candidate"] = relationship("Candidate", lazy="noload")
    organization: Mapped["Organization | None"] = relationship("Organization", lazy="noload")
    assessment: Mapped["Assessment | None"] = relationship("Assessment", lazy="noload")
    history: Mapped[list["CertificateHistory"]] = relationship(
        "CertificateHistory", back_populates="certificate",
        lazy="noload", cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Certificate {self.certificate_number!r} status={self.status!r}>"
