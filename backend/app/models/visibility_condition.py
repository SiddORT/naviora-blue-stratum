"""VisibilityCondition model — reusable visibility presets."""
from decimal import Decimal

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class VisibilityCondition(TimestampMixin):
    __tablename__ = "visibility_conditions"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    visibility_distance: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Distance in nautical miles"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    def __repr__(self) -> str:
        return f"<VisibilityCondition id={self.id} name={self.name!r}>"
