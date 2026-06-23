"""Portal Settings — public-facing URL configuration."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class PortalSettings(TimestampMixin):
    __tablename__ = "portal_settings"

    public_url: Mapped[str] = mapped_column(String(500), nullable=False, default="/")
    admin_url: Mapped[str] = mapped_column(String(500), nullable=False, default="/admin/login")
    organization_url: Mapped[str] = mapped_column(String(500), nullable=False, default="/org/login")
    candidate_url: Mapped[str] = mapped_column(String(500), nullable=False, default="/candidate/login")

    # Future: custom domain support
    custom_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ssl_enabled: Mapped[bool | None] = mapped_column(nullable=True, default=False)
