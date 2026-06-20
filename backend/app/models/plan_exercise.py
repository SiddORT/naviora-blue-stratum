"""PlanExercise — exercise access granted by a plan."""
from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PlanExercise(Base):
    __tablename__ = "plan_exercises"

    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True)
    exercise_id: Mapped[int] = mapped_column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    plan: Mapped["Plan"] = relationship("Plan", back_populates="plan_exercises", lazy="select")  # type: ignore[name-defined]
    exercise: Mapped["Exercise"] = relationship("Exercise", lazy="select")  # type: ignore[name-defined]
