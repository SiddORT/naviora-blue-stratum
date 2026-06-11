"""IntegrationLog model — immutable communication log between Naviora and simulators."""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class IntegrationLog(TimestampMixin):
    __tablename__ = "integration_logs"

    simulator_vendor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("simulator_vendors.id"), nullable=True
    )
    request_type: Mapped[str] = mapped_column(String(100), nullable=False)
    request_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    request_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="success")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationship
    vendor: Mapped["SimulatorVendor"] = relationship(  # type: ignore[name-defined]
        "SimulatorVendor", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<IntegrationLog id={self.id} type={self.request_type!r} status={self.status!r}>"
