"""AssessmentParticipant — assignment of a user to an assessment."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.assessment import Assessment
    from app.models.assessment_attempt import AssessmentAttempt
    from app.models.user import User


ASSIGNMENT_STATUSES = ["Assigned", "In Progress", "Completed", "Passed", "Failed", "Expired", "Cancelled"]
RESULT_STATUSES = ["Pending", "Passed", "Failed"]


class AssessmentParticipant(TimestampMixin):
    __tablename__ = "assessment_participants"

    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assigned_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    assignment_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Assigned", index=True,
        comment="Assigned | In Progress | Completed | Passed | Failed | Expired | Cancelled",
    )
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_attempts_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    result_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Pending",
        comment="Pending | Passed | Failed",
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    assessment: Mapped["Assessment"] = relationship(
        "Assessment", back_populates="participants", lazy="noload"
    )
    user: Mapped["User | None"] = relationship("User", lazy="noload")
    attempts: Mapped[list["AssessmentAttempt"]] = relationship(
        "AssessmentAttempt", back_populates="participant",
        cascade="all, delete-orphan", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<AssessmentParticipant assessment_id={self.assessment_id} user_id={self.user_id} status={self.assignment_status!r}>"
