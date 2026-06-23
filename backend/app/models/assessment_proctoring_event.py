"""Assessment proctoring event — integrity-related events during an assessment session."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


PROCTORING_EVENT_TYPES = [
    "Assessment Started",
    "Assessment Paused",
    "Assessment Resumed",
    "Assessment Completed",
    "Browser Lost Focus",
    "Browser Regained Focus",
    "Session Timeout",
    "Candidate Disconnected",
    "Tab Changed",
    "Window Blur",
    "Window Focus",
]


class AssessmentProctoringEvent(TimestampMixin):
    __tablename__ = "assessment_proctoring_events"

    assignment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_assignments.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    candidate_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    session_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("simulator_sessions.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    event_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
