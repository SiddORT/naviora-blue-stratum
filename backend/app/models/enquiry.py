"""CRM — Enquiry and EnquiryNote models."""
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Enquiry(TimestampMixin):
    """
    Central record for every inbound contact, plan enquiry,
    org-registration or candidate-registration request.
    """
    __tablename__ = "enquiries"

    enquiry_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        comment="CONTACT | CUSTOM_PLAN | ORGANIZATION_REGISTRATION | CANDIDATE_REGISTRATION",
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name:  Mapped[str] = mapped_column(String(100), nullable=False)
    email:      Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone:      Mapped[str | None] = mapped_column(String(50),  nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    country:    Mapped[str | None] = mapped_column(String(100), nullable=True)

    selected_plan_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("plans.id", ondelete="SET NULL"), nullable=True,
    )
    message:     Mapped[str | None] = mapped_column(Text,       nullable=True)
    source_page: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status:      Mapped[str] = mapped_column(
        String(50), nullable=False, default="NEW", server_default="NEW", index=True,
        comment="NEW | CONTACTED | QUALIFIED | APPROVED | REJECTED | CONVERTED",
    )
    assigned_to: Mapped[str | None] = mapped_column(String(36), nullable=True, comment="user.uuid")

    # GDPR audit trail
    ip_address:  Mapped[str | None] = mapped_column(String(50),  nullable=True)
    user_agent:  Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Duplicate detection flag (set by service, never auto-merged)
    duplicate_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    # Relationships
    notes: Mapped[list["EnquiryNote"]] = relationship(
        "EnquiryNote",
        back_populates="enquiry",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="EnquiryNote.created_at",
    )
    consent: Mapped["EnquiryConsent | None"] = relationship(
        "EnquiryConsent",
        back_populates="enquiry",
        uselist=False,
        lazy="select",
    )
    onboarding_request: Mapped["OnboardingRequest | None"] = relationship(
        "OnboardingRequest",
        back_populates="enquiry",
        uselist=False,
        lazy="select",
    )
    selected_plan: Mapped["Plan | None"] = relationship(
        "Plan",
        foreign_keys=[selected_plan_id],
        lazy="select",
    )


class EnquiryNote(TimestampMixin):
    """Internal notes added by admins during review / follow-up."""
    __tablename__ = "enquiry_notes"

    enquiry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    note:        Mapped[str]       = mapped_column(Text,       nullable=False)
    note_by:     Mapped[str | None] = mapped_column(String(255), nullable=True, comment="display name")
    note_by_uuid: Mapped[str | None] = mapped_column(String(36), nullable=True, comment="user.uuid")

    enquiry: Mapped["Enquiry"] = relationship("Enquiry", back_populates="notes")
