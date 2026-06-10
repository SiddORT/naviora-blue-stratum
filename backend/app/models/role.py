"""Role model — system and custom roles."""
from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Role(TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="role", lazy="select")  # type: ignore[name-defined]
    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="role", lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Role id={self.id} slug={self.slug!r}>"
