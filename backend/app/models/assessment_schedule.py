"""AssessmentSchedule — scheduling configuration for an assessment."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.assessment import Assessment


SCHEDULE_TYPES = ["Always Open", "Scheduled Window"]
SCHEDULE_STATUSES = ["Draft", "Active", "Archived"]


class AssessmentSchedule(TimestampMixin):
    __tablename__ = "assessment_schedules"

    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    schedule_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Always Open",
        comment="Always Open | Scheduled Window",
    )
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    timezone: Mapped[str] = mapped_column(String(100), nullable=False, default="UTC")
    duration_override: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="Override duration in minutes"
    )
    allow_late_start: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    grace_period_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    schedule_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Draft",
        comment="Draft | Active | Archived",
    )
    is_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    assessment: Mapped["Assessment"] = relationship(
        "Assessment", back_populates="schedules", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<AssessmentSchedule assessment_id={self.assessment_id} type={self.schedule_type!r}>"
