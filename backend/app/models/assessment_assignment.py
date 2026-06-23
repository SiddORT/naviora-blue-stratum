"""Assessment Assignment model — links a candidate to a campaign."""
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.assessment_campaign import AssessmentCampaign
    from app.models.candidate import Candidate
    from app.models.assignment_activity_log import AssignmentActivityLog


ASSIGNMENT_STATUSES = ["Assigned", "In Progress", "Completed", "Passed", "Failed", "Expired", "Cancelled"]
RESULT_STATUSES = ["Pending", "Passed", "Failed"]


class AssessmentAssignment(TimestampMixin):
    __tablename__ = "assessment_assignments"

    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True
    )

    assignment_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Assigned", index=True,
        comment="Assigned | In Progress | Completed | Passed | Failed | Expired | Cancelled",
    )
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    final_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    result_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Pending",
        comment="Pending | Passed | Failed",
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    campaign: Mapped["AssessmentCampaign"] = relationship(
        "AssessmentCampaign", back_populates="assignments", lazy="noload"
    )
    candidate: Mapped["Candidate"] = relationship(
        "Candidate", foreign_keys=[candidate_id], lazy="noload"
    )
    activity_logs: Mapped[list["AssignmentActivityLog"]] = relationship(
        "AssignmentActivityLog", back_populates="assignment",
        cascade="all, delete-orphan", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<AssessmentAssignment id={self.id} campaign={self.campaign_id} candidate={self.candidate_id} status={self.assignment_status!r}>"
