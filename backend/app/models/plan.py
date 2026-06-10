"""Plan model — subscription plans available to organizations."""
from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Plan(TimestampMixin):
    __tablename__ = "plans"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    price_yearly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    max_users: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    max_simulators: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_trial: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trial_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    organizations: Mapped[list["Organization"]] = relationship("Organization", back_populates="plan", lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Plan id={self.id} slug={self.slug!r}>"
