"""DesktopAgent model — registry of desktop agent clients."""
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin

AGENT_STATUSES = ["Online", "Offline", "Disabled"]


class DesktopAgent(TimestampMixin):
    __tablename__ = "desktop_agents"

    agent_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    machine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Offline", index=True,
        comment="Online | Offline | Disabled",
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    runtime_mode: Mapped[str] = mapped_column(
        String(50), nullable=False, default="DESKTOP_OFFLINE",
        comment="DESKTOP_OFFLINE",
    )

    def __repr__(self) -> str:
        return f"<DesktopAgent id={self.id} name={self.agent_name!r} status={self.status!r}>"
