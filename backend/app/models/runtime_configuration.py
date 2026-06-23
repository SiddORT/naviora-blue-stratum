"""RuntimeConfiguration model — per-vendor runtime launch settings."""
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

RUNTIME_MODES = ["CLOUD_API", "DESKTOP_OFFLINE", "MANUAL"]


class RuntimeConfiguration(TimestampMixin):
    __tablename__ = "runtime_configurations"

    simulator_vendor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("simulator_vendors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    config_name: Mapped[str] = mapped_column(String(255), nullable=False)
    runtime_mode: Mapped[str] = mapped_column(
        String(50), nullable=False, default="CLOUD_API",
        comment="CLOUD_API | DESKTOP_OFFLINE | MANUAL",
    )
    # Cloud API settings
    api_endpoint: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Desktop offline settings
    executable_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    working_directory: Mapped[str | None] = mapped_column(String(500), nullable=True)
    launch_arguments: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_directory: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # General
    auto_sync: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    vendor: Mapped["SimulatorVendor"] = relationship("SimulatorVendor", lazy="noload")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<RuntimeConfiguration id={self.id} vendor={self.simulator_vendor_id} mode={self.runtime_mode!r}>"
