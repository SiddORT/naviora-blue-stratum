"""SimulatorVendor model — represents a supported simulator vendor/brand."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class SimulatorVendor(TimestampMixin):
    __tablename__ = "simulator_vendors"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    integration_type: Mapped[str] = mapped_column(String(50), nullable=False, default="REST_API")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")

    def __repr__(self) -> str:
        return f"<SimulatorVendor id={self.id} code={self.code!r} name={self.name!r}>"
