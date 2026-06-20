"""OrganizationSubscription — active or historical plan subscriptions per org."""
import uuid as _uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class OrganizationSubscription(Base):
    __tablename__ = "organization_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, default=lambda: str(_uuid.uuid4()))
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Active", index=True)
    billing_cycle: Mapped[str] = mapped_column(String(30), nullable=False, default="Monthly")
    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    custom_limits_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", lazy="select")  # type: ignore[name-defined]
    plan: Mapped["Plan"] = relationship("Plan", lazy="select")  # type: ignore[name-defined]
