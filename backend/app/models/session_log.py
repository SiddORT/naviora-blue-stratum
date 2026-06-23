"""SessionLog model — event timeline for a simulator session."""
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.simulator_session import SimulatorSession

LOG_LEVELS = ["Info", "Warning", "Error"]
EVENT_TYPES = [
    "Session Created", "Launch Requested", "Launch Successful", "Launch Failed",
    "Simulator Started", "Simulator Stopped", "Result Received", "Session Cancelled",
]


class SessionLog(TimestampMixin):
    __tablename__ = "session_logs"

    simulator_session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("simulator_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_level: Mapped[str] = mapped_column(String(20), nullable=False, default="Info", comment="Info | Warning | Error")
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    session: Mapped["SimulatorSession"] = relationship("SimulatorSession", back_populates="logs", lazy="noload")

    def __repr__(self) -> str:
        return f"<SessionLog id={self.id} level={self.log_level!r} event={self.event_type!r}>"
