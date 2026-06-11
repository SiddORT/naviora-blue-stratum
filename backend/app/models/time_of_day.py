"""TimeOfDay model — standardised environmental time settings."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class TimeOfDay(TimestampMixin):
    __tablename__ = "time_of_day"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)

    def __repr__(self) -> str:
        return f"<TimeOfDay id={self.id} name={self.name!r}>"
