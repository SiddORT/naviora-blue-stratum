"""OrganizationAssignment model — links users to organizations with type."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrganizationAssignment(Base):
    __tablename__ = "organization_assignments"
    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_org_assignment"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assignment_type: Mapped[str] = mapped_column(String(50), nullable=False, default="SECONDARY")
    assigned_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Integer, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="select")  # type: ignore[name-defined]
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<OrganizationAssignment user_id={self.user_id} org_id={self.organization_id}>"
