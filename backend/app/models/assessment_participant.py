"""AssessmentParticipant — assignment of a user to an assessment."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import _utcnow


class AssessmentParticipant(Base):
    __tablename__ = "assessment_participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assignment_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Assigned", index=True,
        comment="Assigned | In Progress | Completed | Passed | Failed | Expired",
    )
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    assessment: Mapped["Assessment"] = relationship(
        "Assessment", back_populates="participants", lazy="noload"
    )
    user: Mapped["User | None"] = relationship("User", lazy="noload")

    def __repr__(self) -> str:
        return f"<AssessmentParticipant assessment_id={self.assessment_id} user_id={self.user_id}>"
