"""UserInvitation model — tracks email invitations sent to new users."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class UserInvitation(TimestampMixin):
    __tablename__ = "user_invitations"

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    role_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    invited_by_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    organization: Mapped["Organization | None"] = relationship("Organization", lazy="select")  # type: ignore[name-defined]
    role: Mapped["Role | None"] = relationship("Role", lazy="select")  # type: ignore[name-defined]
    invited_by: Mapped["User | None"] = relationship("User", foreign_keys=[invited_by_id], lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<UserInvitation id={self.id} email={self.email!r} status={self.status!r}>"
