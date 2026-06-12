"""Assessment Version model — full history of assessment changes."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import _utcnow


class AssessmentVersion(Base):
    __tablename__ = "assessment_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_templates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    assessment: Mapped["AssessmentTemplate"] = relationship(
        "AssessmentTemplate", back_populates="versions", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<AssessmentVersion assessment_id={self.assessment_id} v{self.version_number}>"
