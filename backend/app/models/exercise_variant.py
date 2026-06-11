"""ExerciseVariant model — actual simulator setup under an Exercise."""
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class ExerciseVariant(TimestampMixin):
    __tablename__ = "exercise_variants"

    variant_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    variant_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    port_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("ports.id", ondelete="SET NULL"), nullable=True, index=True
    )
    environment_profile_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("environment_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    primary_vessel_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("vessels.id", ondelete="SET NULL"), nullable=True, index=True
    )
    secondary_vessel_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("vessels.id", ondelete="SET NULL"), nullable=True
    )
    tertiary_vessel_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("vessels.id", ondelete="SET NULL"), nullable=True
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passing_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, comment="0–100")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)

    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="variants", lazy="noload")
    port: Mapped["Port | None"] = relationship("Port", foreign_keys=[port_id], lazy="noload")
    environment_profile: Mapped["EnvironmentProfile | None"] = relationship(
        "EnvironmentProfile", foreign_keys=[environment_profile_id], lazy="noload"
    )
    primary_vessel: Mapped["Vessel | None"] = relationship(
        "Vessel", foreign_keys=[primary_vessel_id], lazy="noload"
    )
    secondary_vessel: Mapped["Vessel | None"] = relationship(
        "Vessel", foreign_keys=[secondary_vessel_id], lazy="noload"
    )
    tertiary_vessel: Mapped["Vessel | None"] = relationship(
        "Vessel", foreign_keys=[tertiary_vessel_id], lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<ExerciseVariant id={self.id} code={self.variant_code!r}>"
