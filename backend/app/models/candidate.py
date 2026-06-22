"""Candidate model — individuals who take assessments (distinct from admin Users)."""
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.assessment_participant import AssessmentParticipant


CANDIDATE_STATUSES = ["active", "inactive", "suspended"]


class Candidate(TimestampMixin):
    __tablename__ = "candidates"

    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    nationality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    rank_or_designation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    seafarer_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active", index=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_reset_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization | None"] = relationship(
        "Organization", back_populates="candidates", lazy="noload"
    )
    participants: Mapped[list["AssessmentParticipant"]] = relationship(
        "AssessmentParticipant", back_populates="candidate", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Candidate id={self.id} email={self.email!r}>"
