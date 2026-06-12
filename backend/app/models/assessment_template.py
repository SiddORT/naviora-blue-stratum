"""Assessment Template model — reusable assessment definition."""
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class AssessmentTemplate(TimestampMixin):
    __tablename__ = "assessment_templates"

    assessment_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    assessment_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("assessment_categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passing_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    variant_selection_mode: Mapped[str] = mapped_column(String(50), nullable=False, default="MANUAL")
    randomize_exercise_order: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    randomize_variant_selection: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    category: Mapped["AssessmentCategory | None"] = relationship(
        "AssessmentCategory", back_populates="templates", lazy="noload"
    )
    assessment_exercises: Mapped[list["AssessmentExercise"]] = relationship(
        "AssessmentExercise", back_populates="assessment", cascade="all, delete-orphan", lazy="noload"
    )
    rule: Mapped["AssessmentRule | None"] = relationship(
        "AssessmentRule", back_populates="assessment", uselist=False, cascade="all, delete-orphan", lazy="noload"
    )
    versions: Mapped[list["AssessmentVersion"]] = relationship(
        "AssessmentVersion", back_populates="assessment", cascade="all, delete-orphan", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<AssessmentTemplate id={self.id} code={self.assessment_code!r} v{self.version_number}>"
