"""CertificateRule — defines when a certificate is auto-generated for an assessment."""
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.assessment import Assessment
    from app.models.certificate_template import CertificateTemplate


class CertificateRule(TimestampMixin):
    __tablename__ = "certificate_rules"

    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    template_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("certificate_templates.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    minimum_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    require_review_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    auto_issue: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    validity_period_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Active", index=True,
        comment="Active | Inactive",
    )

    assessment: Mapped["Assessment"] = relationship("Assessment", lazy="noload")
    template: Mapped["CertificateTemplate"] = relationship(
        "CertificateTemplate", back_populates="rules", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<CertificateRule id={self.id} assessment_id={self.assessment_id}>"
