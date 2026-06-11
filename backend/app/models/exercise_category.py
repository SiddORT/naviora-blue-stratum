"""Exercise Category model — groups exercises by domain."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class ExerciseCategory(TimestampMixin):
    __tablename__ = "exercise_categories"

    category_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    exercises: Mapped[list["Exercise"]] = relationship("Exercise", back_populates="category", lazy="noload")

    def __repr__(self) -> str:
        return f"<ExerciseCategory id={self.id} code={self.category_code!r}>"
