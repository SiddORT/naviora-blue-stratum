"""PlanSimulator — simulator vendor access granted by a plan."""
from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PlanSimulator(Base):
    __tablename__ = "plan_simulators"

    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True)
    simulator_vendor_id: Mapped[int] = mapped_column(Integer, ForeignKey("simulator_vendors.id", ondelete="CASCADE"), primary_key=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    plan: Mapped["Plan"] = relationship("Plan", back_populates="plan_simulators", lazy="select")  # type: ignore[name-defined]
    vendor: Mapped["SimulatorVendor"] = relationship("SimulatorVendor", lazy="select")  # type: ignore[name-defined]
