"""SeaState model — reusable sea condition definitions."""
from decimal import Decimal

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class SeaState(TimestampMixin):
    __tablename__ = "sea_states"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    wave_height_min: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Minimum wave height in metres"
    )
    wave_height_max: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Maximum wave height in metres"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    def __repr__(self) -> str:
        return f"<SeaState id={self.id} name={self.name!r}>"
