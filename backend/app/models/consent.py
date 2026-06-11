"""
Consent model — tracks user acceptance of privacy policy, terms of service,
and cookie consent.

GDPR Art. 7 requires that consent be demonstrably recorded.
Each acceptance event creates a new immutable row (never updated).

Fields:
  user_id        — FK to users.id (nullable for anonymous pre-registration)
  consent_type   — "privacy_policy" | "terms_of_service" | "cookie_analytics"
  policy_version — semver or date string identifying the document version
  accepted       — True = accept, False = withdraw
  ip_address     — IP at time of acceptance
  user_agent     — browser UA at time of acceptance
  accepted_at    — UTC timestamp of the event
"""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Consent(Base):
    """Immutable consent event record."""

    __tablename__ = "consent_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, index=True,
        comment="FK to users.id — nullable for pre-login consent capture",
    )
    user_uuid: Mapped[str | None] = mapped_column(
        String(36), nullable=True, index=True,
        comment="UUID reference — denormalised for easy lookup without join",
    )

    consent_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        comment="privacy_policy | terms_of_service | cookie_analytics | marketing",
    )
    policy_version: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="Document version at time of acceptance, e.g. '2026-01-01'",
    )
    accepted: Mapped[bool] = mapped_column(
        Boolean, nullable=False,
        comment="True = accepted, False = withdrawn",
    )

    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    def __repr__(self) -> str:
        return (
            f"<Consent id={self.id} user={self.user_uuid!r} "
            f"type={self.consent_type!r} accepted={self.accepted}>"
        )
