"""Assessment model — unified maritime assessment entity."""
from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Assessment(TimestampMixin):
    __tablename__ = "assessments"

    assessment_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    assessment_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Training", index=True,
        comment="Training | Evaluation | Certification | Practice",
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passing_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    randomize_exercise_order: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    randomize_variant_selection: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    certificate_eligible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    certificate_validity_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="draft", index=True,
        comment="draft | active | archived",
    )

    assessment_exercises: Mapped[list["AssessmentExercise"]] = relationship(
        "AssessmentExercise", back_populates="assessment",
        cascade="all, delete-orphan", lazy="noload",
    )
    participants: Mapped[list["AssessmentParticipant"]] = relationship(
        "AssessmentParticipant", back_populates="assessment",
        cascade="all, delete-orphan", lazy="noload",
    )
    schedules: Mapped[list["AssessmentSchedule"]] = relationship(
        "AssessmentSchedule", back_populates="assessment",
        cascade="all, delete-orphan", lazy="noload",
    )
    results: Mapped[list["AssessmentResult"]] = relationship(
        "AssessmentResult", back_populates="assessment",
        cascade="all, delete-orphan", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<Assessment id={self.id} code={self.assessment_code!r} status={self.status!r}>"
