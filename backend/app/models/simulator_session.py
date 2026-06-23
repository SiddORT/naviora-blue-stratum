"""SimulatorSession model — runtime execution record for a candidate assessment."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.simulator_vendor import SimulatorVendor
    from app.models.assessment_campaign import AssessmentCampaign
    from app.models.assessment_assignment import AssessmentAssignment
    from app.models.candidate import Candidate
    from app.models.session_log import SessionLog
    from app.models.session_attempt import SessionAttempt

SESSION_STATUSES = ["Pending", "Launching", "Running", "Completed", "Failed", "Cancelled", "Timed Out"]
RUNTIME_MODES = ["CLOUD_API", "DESKTOP_OFFLINE", "MANUAL"]


class SimulatorSession(TimestampMixin):
    __tablename__ = "simulator_sessions"

    # Legacy string references (kept for backward compat)
    session_reference: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)

    # Foreign Keys — new runtime architecture
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    campaign_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessment_campaigns.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assignment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessment_assignments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    candidate_fk_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("candidates.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assessment_fk_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    exercise_fk_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="SET NULL"), nullable=True, index=True
    )
    variant_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("exercise_variants.id", ondelete="SET NULL"), nullable=True, index=True
    )
    simulator_vendor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("simulator_vendors.id", ondelete="SET NULL"), nullable=True, index=True
    )
    runtime_config_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("runtime_configurations.id", ondelete="SET NULL"), nullable=True
    )

    # Runtime mode
    runtime_mode: Mapped[str] = mapped_column(
        String(50), nullable=False, default="MANUAL",
        comment="CLOUD_API | DESKTOP_OFFLINE | MANUAL",
    )

    # Status lifecycle
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Pending", index=True,
        comment="Pending | Launching | Running | Completed | Failed | Cancelled | Timed Out",
    )

    # Payloads
    launch_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    raw_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    result_received: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Timing
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Failure
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Who triggered
    launched_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    # Relationships
    vendor: Mapped["SimulatorVendor | None"] = relationship("SimulatorVendor", lazy="noload")
    campaign: Mapped["AssessmentCampaign | None"] = relationship("AssessmentCampaign", lazy="noload")
    assignment: Mapped["AssessmentAssignment | None"] = relationship("AssessmentAssignment", lazy="noload")
    candidate: Mapped["Candidate | None"] = relationship("Candidate", foreign_keys=[candidate_fk_id], lazy="noload")
    logs: Mapped[list["SessionLog"]] = relationship(
        "SessionLog", back_populates="session", cascade="all, delete-orphan", lazy="noload",
    )
    attempts: Mapped[list["SessionAttempt"]] = relationship(
        "SessionAttempt", back_populates="session", cascade="all, delete-orphan", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<SimulatorSession id={self.id} ref={self.session_reference!r} status={self.status!r}>"
