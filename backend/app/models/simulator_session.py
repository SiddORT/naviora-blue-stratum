"""SimulatorSession model — stores every simulator exercise session."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class SimulatorSession(TimestampMixin):
    __tablename__ = "simulator_sessions"

    session_reference: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    simulator_vendor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("simulator_vendors.id"), nullable=True
    )
    candidate_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id"), nullable=True
    )
    assessment_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    exercise_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING")
    raw_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    processed_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    vendor: Mapped["SimulatorVendor"] = relationship(  # type: ignore[name-defined]
        "SimulatorVendor", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<SimulatorSession id={self.id} ref={self.session_reference!r} status={self.status!r}>"
