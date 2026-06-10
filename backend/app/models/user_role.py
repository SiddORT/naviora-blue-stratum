"""UserRole join table — assigns roles to users, optionally scoped to an organization."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", "organization_id", name="uq_user_role_org"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_roles")  # type: ignore[name-defined]
    role: Mapped["Role"] = relationship("Role", back_populates="user_roles")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<UserRole user_id={self.user_id} role_id={self.role_id}>"
