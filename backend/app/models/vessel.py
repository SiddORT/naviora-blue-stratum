"""Vessel model — master vessel types for exercises and assessments."""
from decimal import Decimal

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class Vessel(TimestampMixin):
    __tablename__ = "vessels"

    vessel_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    vessel_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    vessel_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    imo_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    length: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, comment="Length in metres")
    beam: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, comment="Beam in metres")
    draft: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, comment="Draft in metres")
    max_speed: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, comment="Max speed in knots")
    maneuverability_rating: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    def __repr__(self) -> str:
        return f"<Vessel id={self.id} code={self.vessel_code!r}>"
