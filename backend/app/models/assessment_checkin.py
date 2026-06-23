"""Assessment check-in — candidate readiness verification before assessment launch."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class AssessmentCheckin(TimestampMixin):
    __tablename__ = "assessment_checkins"

    assignment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_assignments.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    candidate_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
    )
    identity_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    rules_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    webcam_snapshot_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    browser_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    browser_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    operating_system: Mapped[str | None] = mapped_column(String(150), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    screen_resolution: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(60), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    timezone_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    checked_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    rules_version: Mapped[str | None] = mapped_column(String(20), nullable=True, default="1.0")
