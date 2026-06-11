"""Exercise model — competency assessment objective (no environmental data)."""
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Exercise(TimestampMixin):
    __tablename__ = "exercises"

    exercise_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    exercise_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("exercise_categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    scenario_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("scenarios.id", ondelete="SET NULL"), nullable=True, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    passing_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, comment="0–100")
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_duration: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Minutes")
    generation_mode: Mapped[str] = mapped_column(String(50), nullable=False, default="MANUAL")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    category: Mapped["ExerciseCategory | None"] = relationship(
        "ExerciseCategory", back_populates="exercises", lazy="noload"
    )
    scenario: Mapped["Scenario | None"] = relationship(
        "Scenario", back_populates="exercises", lazy="noload"
    )
    exercise_objectives: Mapped[list["ExerciseObjective"]] = relationship(
        "ExerciseObjective", back_populates="exercise", cascade="all, delete-orphan", lazy="noload"
    )
    variants: Mapped[list["ExerciseVariant"]] = relationship(
        "ExerciseVariant", back_populates="exercise", cascade="all, delete-orphan", lazy="noload"
    )
    versions: Mapped[list["ExerciseVersion"]] = relationship(
        "ExerciseVersion", back_populates="exercise", cascade="all, delete-orphan", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Exercise id={self.id} code={self.exercise_code!r} v{self.version_number}>"
