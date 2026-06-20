"""PlanFeature — which features are enabled on a plan."""
from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PlanFeature(Base):
    __tablename__ = "plan_features"

    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True)
    feature_id: Mapped[int] = mapped_column(Integer, ForeignKey("features.id", ondelete="CASCADE"), primary_key=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    configuration_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    plan: Mapped["Plan"] = relationship("Plan", back_populates="plan_features", lazy="select")  # type: ignore[name-defined]
    feature: Mapped["Feature"] = relationship("Feature", back_populates="plan_features", lazy="select")  # type: ignore[name-defined]
