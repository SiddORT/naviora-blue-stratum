"""RolePermission join table — maps roles to permissions with optional scope."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Scope values: ALL, ASSIGNED_ONLY, OWNED_ONLY
SCOPE_ALL = "ALL"
SCOPE_ASSIGNED_ONLY = "ASSIGNED_ONLY"
SCOPE_OWNED_ONLY = "OWNED_ONLY"


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id: Mapped[int] = mapped_column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)
    scope: Mapped[str] = mapped_column(String(50), nullable=False, default=SCOPE_ALL)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="role_permissions")  # type: ignore[name-defined]
    permission: Mapped["Permission"] = relationship("Permission", back_populates="role_permissions")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<RolePermission role_id={self.role_id} permission_id={self.permission_id}>"
