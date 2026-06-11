"""ExerciseObjective — junction table: one Exercise → many Objectives."""
from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ExerciseObjective(Base):
    __tablename__ = "exercise_objectives"
    __table_args__ = (
        UniqueConstraint("exercise_id", "objective_id", name="uq_exercise_objective"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    objective_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("objectives.id", ondelete="CASCADE"), nullable=False, index=True
    )

    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="exercise_objectives", lazy="noload")
    objective: Mapped["Objective"] = relationship("Objective", back_populates="exercise_objectives", lazy="noload")
