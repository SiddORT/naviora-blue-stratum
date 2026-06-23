"""System Preferences — global platform behaviour settings."""
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class SystemPreferences(TimestampMixin):
    __tablename__ = "system_preferences"

    default_timezone: Mapped[str] = mapped_column(String(100), nullable=False, default="UTC")
    default_currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    default_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")

    # Session & security
    session_timeout_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    password_expiry_days: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    max_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    lockout_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
