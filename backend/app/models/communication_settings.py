"""Communication Settings — SMTP outbound email configuration."""
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin

# SMTP encryption options
SMTP_NONE = "NONE"
SMTP_SSL = "SSL"
SMTP_TLS = "TLS"


class CommunicationSettings(TimestampMixin):
    __tablename__ = "communication_settings"

    # SMTP
    smtp_host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    smtp_port: Mapped[int] = mapped_column(Integer, nullable=False, default=587)
    smtp_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    smtp_password_enc: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # AES-GCM encrypted
    smtp_encryption: Mapped[str] = mapped_column(String(10), nullable=False, default=SMTP_TLS)

    # Sender identity
    sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sender_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reply_to_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    test_email_address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Flags
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
