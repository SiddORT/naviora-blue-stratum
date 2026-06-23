"""Assignment Activity Log — immutable event trail for each assignment."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.assessment_assignment import AssessmentAssignment


class AssignmentActivityLog(Base):
    __tablename__ = "assignment_activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assignment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_assignments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    activity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    activity_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    assignment: Mapped["AssessmentAssignment"] = relationship(
        "AssessmentAssignment", back_populates="activity_logs", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<AssignmentActivityLog id={self.id} assignment={self.assignment_id} type={self.activity_type!r}>"
