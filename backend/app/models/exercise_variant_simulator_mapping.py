"""ExerciseVariantSimulatorMapping — links exercise variants to simulator vendors."""
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class ExerciseVariantSimulatorMapping(TimestampMixin):
    __tablename__ = "exercise_variant_simulator_mappings"
    __table_args__ = (
        UniqueConstraint("variant_id", "simulator_vendor_id", name="uq_variant_vendor"),
    )

    variant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercise_variants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    simulator_vendor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("simulator_vendors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    runtime_mode: Mapped[str] = mapped_column(
        String(50), nullable=False, default="CLOUD_API",
        comment="CLOUD_API | DESKTOP_OFFLINE | MANUAL",
    )
    vendor_exercise_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vendor_scenario_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    launch_config: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    variant: Mapped["ExerciseVariant"] = relationship("ExerciseVariant", lazy="noload")  # type: ignore[name-defined]
    vendor: Mapped["SimulatorVendor"] = relationship("SimulatorVendor", lazy="noload")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<ExerciseVariantSimulatorMapping variant={self.variant_id} vendor={self.simulator_vendor_id}>"
