"""Platform Settings — single-record global company configuration."""
from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class PlatformSettings(TimestampMixin):
    __tablename__ = "platform_settings"

    # Company Identity
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    billing_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Address
    address_line_1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line_2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Assets
    company_logo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favicon_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Locale
    default_timezone: Mapped[str] = mapped_column(String(100), nullable=False, default="UTC")
    default_currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    default_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    date_format: Mapped[str] = mapped_column(String(50), nullable=False, default="YYYY-MM-DD")
    time_format: Mapped[str] = mapped_column(String(20), nullable=False, default="24h")
