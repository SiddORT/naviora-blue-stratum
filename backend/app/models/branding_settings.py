"""Branding Settings — visual identity configuration."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class BrandingSettings(TimestampMixin):
    __tablename__ = "branding_settings"

    platform_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Naviora")
    platform_tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Colors
    primary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#D4A63A")
    secondary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#2EA8FF")
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#B8860B")

    # Asset paths
    login_background_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email_header_logo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    report_logo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
