"""AssessmentResult — placeholder for result engine integration."""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import _utcnow


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessment_participants.id", ondelete="SET NULL"), nullable=True, index=True
    )
    total_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    result_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Pending",
        comment="Passed | Failed | Pending",
    )
    simulator_session_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    assessment: Mapped["Assessment"] = relationship(
        "Assessment", back_populates="results", lazy="noload"
    )
    participant: Mapped["AssessmentParticipant | None"] = relationship(
        "AssessmentParticipant", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<AssessmentResult assessment_id={self.assessment_id} status={self.result_status!r}>"
