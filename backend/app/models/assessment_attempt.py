"""AssessmentAttempt — tracks each participant's execution of an assessment."""
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.assessment_participant import AssessmentParticipant


ATTEMPT_RESULT_STATUSES = ["Pending", "Passed", "Failed", "Abandoned"]


class AssessmentAttempt(TimestampMixin):
    __tablename__ = "assessment_attempts"

    assessment_participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_participants.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    simulator_session_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("simulator_sessions.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    result_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Pending",
        comment="Pending | Passed | Failed | Abandoned",
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    participant: Mapped["AssessmentParticipant"] = relationship(
        "AssessmentParticipant", back_populates="attempts", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<AssessmentAttempt participant_id={self.assessment_participant_id} attempt={self.attempt_number} status={self.result_status!r}>"
