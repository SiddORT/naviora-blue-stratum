"""SimulatorConfiguration model — connection settings for a vendor instance."""
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class SimulatorConfiguration(TimestampMixin):
    __tablename__ = "simulator_configurations"

    simulator_vendor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("simulator_vendors.id"), nullable=False
    )
    configuration_name: Mapped[str] = mapped_column(String(255), nullable=False)
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    authentication_type: Mapped[str] = mapped_column(String(50), nullable=False, default="NONE")
    api_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_secret: Mapped[str | None] = mapped_column(String(500), nullable=True)
    webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    connection_timeout: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")

    # Relationship
    vendor: Mapped["SimulatorVendor"] = relationship(  # type: ignore[name-defined]
        "SimulatorVendor", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<SimulatorConfiguration id={self.id} name={self.configuration_name!r}>"
