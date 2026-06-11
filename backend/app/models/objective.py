"""Objective model — reusable competency objectives."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Objective(TimestampMixin):
    __tablename__ = "objectives"

    objective_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    objective_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    competency_area: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    exercise_objectives: Mapped[list["ExerciseObjective"]] = relationship(
        "ExerciseObjective", back_populates="objective", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Objective id={self.id} code={self.objective_code!r}>"
