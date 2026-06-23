"""Notification Settings — enable/disable notification channels."""
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class NotificationSettings(TimestampMixin):
    __tablename__ = "notification_settings"

    # Email
    enable_email_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # System
    enable_system_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Future extension points
    enable_sms_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enable_whatsapp_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enable_teams_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enable_slack_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Provider config stubs (JSON strings for future use)
    sms_provider_config: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    teams_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    slack_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
