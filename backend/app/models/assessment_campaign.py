"""Assessment Campaign model — org-scoped operational assessment event."""
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.assessment import Assessment
    from app.models.assessment_assignment import AssessmentAssignment


CAMPAIGN_STATUSES = ["Draft", "Published", "Active", "Completed", "Archived"]


class AssessmentCampaign(TimestampMixin):
    __tablename__ = "assessment_campaigns"

    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assessment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    campaign_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    campaign_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    timezone: Mapped[str] = mapped_column(String(100), nullable=False, default="UTC")

    duration_override_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passing_score_override: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    max_attempts_override: Mapped[int | None] = mapped_column(Integer, nullable=True)

    randomize_exercises: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    randomize_variants: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Draft", index=True,
        comment="Draft | Published | Active | Completed | Archived",
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship(
        "Organization", foreign_keys=[organization_id], lazy="noload"
    )
    assessment: Mapped["Assessment | None"] = relationship(
        "Assessment", foreign_keys=[assessment_id], lazy="noload"
    )
    assignments: Mapped[list["AssessmentAssignment"]] = relationship(
        "AssessmentAssignment", back_populates="campaign",
        cascade="all, delete-orphan", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<AssessmentCampaign id={self.id} code={self.campaign_code!r} status={self.status!r}>"
