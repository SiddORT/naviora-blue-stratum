"""EnvironmentProfile model — reusable composite environment presets."""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class EnvironmentProfile(TimestampMixin):
    __tablename__ = "environment_profiles"

    profile_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    weather_condition_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("weather_conditions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    sea_state_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sea_states.id", ondelete="SET NULL"), nullable=True, index=True
    )
    visibility_condition_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("visibility_conditions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    time_of_day_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("time_of_day.id", ondelete="SET NULL"), nullable=True, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    weather_condition: Mapped["WeatherCondition | None"] = relationship(  # type: ignore[name-defined]
        "WeatherCondition", foreign_keys=[weather_condition_id], lazy="select"
    )
    sea_state: Mapped["SeaState | None"] = relationship(  # type: ignore[name-defined]
        "SeaState", foreign_keys=[sea_state_id], lazy="select"
    )
    visibility_condition: Mapped["VisibilityCondition | None"] = relationship(  # type: ignore[name-defined]
        "VisibilityCondition", foreign_keys=[visibility_condition_id], lazy="select"
    )
    time_of_day: Mapped["TimeOfDay | None"] = relationship(  # type: ignore[name-defined]
        "TimeOfDay", foreign_keys=[time_of_day_id], lazy="select"
    )

    def __repr__(self) -> str:
        return f"<EnvironmentProfile id={self.id} name={self.profile_name!r}>"
