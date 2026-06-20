"""OrganizationUsage — live usage counters per organization."""
import uuid as _uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class OrganizationUsage(Base):
    __tablename__ = "organization_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, default=lambda: str(_uuid.uuid4()))
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    current_users: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_candidates: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assessments_this_month: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_used_gb: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    active_simulators: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    organization: Mapped["Organization"] = relationship("Organization", lazy="select")  # type: ignore[name-defined]
