"""OnboardingRequest — tracks the approval-to-provisioning pipeline."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class OnboardingRequest(TimestampMixin):
    """
    Created when an admin approves an enquiry.
    Tracks the full conversion flow through to account creation.
    """
    __tablename__ = "onboarding_requests"

    enquiry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("enquiries.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )

    onboarding_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="ORGANIZATION | CANDIDATE",
    )
    onboarding_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PENDING", server_default="PENDING", index=True,
        comment="PENDING | APPROVED | REJECTED | CONVERTED",
    )

    # Set during conversion
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True,
        comment="Populated after org is created (ORGANIZATION flow) or selected (CANDIDATE flow)",
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
        comment="Populated after candidate/admin user account is created",
    )

    # Approval metadata
    approved_by:  Mapped[str | None]      = mapped_column(String(36),           nullable=True, comment="user.uuid")
    approved_at:  Mapped[datetime | None]  = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_by:  Mapped[str | None]      = mapped_column(String(36),           nullable=True)
    rejected_at:  Mapped[datetime | None]  = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None]  = mapped_column(Text,                 nullable=True)

    # Relationships
    enquiry:      Mapped["Enquiry"]       = relationship("Enquiry",      back_populates="onboarding_request")
    organization: Mapped["Organization | None"] = relationship("Organization", foreign_keys=[organization_id], lazy="select")
    user:         Mapped["User | None"]   = relationship("User",         foreign_keys=[user_id],         lazy="select")
