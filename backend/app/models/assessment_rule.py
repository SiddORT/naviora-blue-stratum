"""Assessment Rule model — behavioral configuration for an assessment."""
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class AssessmentRule(TimestampMixin):
    __tablename__ = "assessment_rules"

    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessment_templates.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    minimum_pass_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    assessment_duration: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Minutes")
    allow_reassessment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    reassessment_wait_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    variant_selection_mode: Mapped[str] = mapped_column(String(50), nullable=False, default="MANUAL")
    randomize_exercises: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    randomize_variants: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    auto_fail_on_collision: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    auto_fail_on_major_violation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    assessment: Mapped["AssessmentTemplate"] = relationship(
        "AssessmentTemplate", back_populates="rule", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<AssessmentRule assessment_id={self.assessment_id}>"
