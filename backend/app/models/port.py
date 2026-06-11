"""Port model — master port library for exercises."""
from decimal import Decimal

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class Port(TimestampMixin):
    __tablename__ = "ports"

    port_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    port_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    traffic_density: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium", index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    def __repr__(self) -> str:
        return f"<Port id={self.id} code={self.port_code!r}>"
