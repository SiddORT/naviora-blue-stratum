"""SessionAttempt model — tracks individual launch attempts for a simulator session."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.simulator_session import SimulatorSession

ATTEMPT_STATUSES = ["Running", "Completed", "Failed"]


class SessionAttempt(TimestampMixin):
    __tablename__ = "session_attempts"

    simulator_session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("simulator_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Running", comment="Running | Completed | Failed")

    session: Mapped["SimulatorSession"] = relationship("SimulatorSession", back_populates="attempts", lazy="noload")

    def __repr__(self) -> str:
        return f"<SessionAttempt id={self.id} attempt={self.attempt_number} status={self.status!r}>"
