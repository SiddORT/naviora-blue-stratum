"""WeatherCondition model — reusable weather templates."""
from decimal import Decimal

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class WeatherCondition(TimestampMixin):
    __tablename__ = "weather_conditions"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    wind_speed: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Wind speed in knots"
    )
    precipitation_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    visibility_range: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Visibility range in nautical miles"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    def __repr__(self) -> str:
        return f"<WeatherCondition id={self.id} name={self.name!r}>"
