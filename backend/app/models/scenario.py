"""Scenario model — reusable maritime training scenarios."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Scenario(TimestampMixin):
    __tablename__ = "scenarios"

    scenario_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    scenario_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    scenario_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    exercises: Mapped[list["Exercise"]] = relationship("Exercise", back_populates="scenario", lazy="noload")

    def __repr__(self) -> str:
        return f"<Scenario id={self.id} code={self.scenario_code!r}>"
