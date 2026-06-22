"""
EnquiryConsent — immutable GDPR consent record linked to an Enquiry.

One row per enquiry submission. Never updated after creation.
Art. 6(1)(a) compliance: each consent type is tracked separately with
version, IP, and UA for full audit trail.
"""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EnquiryConsent(Base):
    """Immutable per-enquiry GDPR consent snapshot."""
    __tablename__ = "enquiry_consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    enquiry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("enquiries.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )

    # Consent flags
    privacy_accepted:         Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    terms_accepted:           Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    data_processing_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    marketing_accepted:       Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Provenance
    consent_version: Mapped[str | None] = mapped_column(String(50),  nullable=True)
    ip_address:      Mapped[str | None] = mapped_column(String(50),  nullable=True)
    user_agent:      Mapped[str | None] = mapped_column(String(500), nullable=True)
    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow,
    )

    enquiry: Mapped["Enquiry"] = relationship("Enquiry", back_populates="consent")
