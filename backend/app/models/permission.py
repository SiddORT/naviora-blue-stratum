"""Permission model — dynamic database-driven permissions."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Permission(TimestampMixin):
    __tablename__ = "permissions"

    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    module: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="permission", lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Permission id={self.id} name={self.name!r}>"
