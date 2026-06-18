"""AssessmentExercise — junction linking exercises to assessments."""
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AssessmentExercise(Base):
    __tablename__ = "assessment_exercises"
    __table_args__ = (
        UniqueConstraint("assessment_id", "exercise_id", name="uq_assessment_exercise"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assessment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    weightage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    mandatory: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    assessment: Mapped["Assessment"] = relationship(
        "Assessment", back_populates="assessment_exercises", lazy="noload"
    )
    exercise: Mapped["Exercise"] = relationship("Exercise", lazy="noload")

    def __repr__(self) -> str:
        return f"<AssessmentExercise assessment_id={self.assessment_id} exercise_id={self.exercise_id}>"
