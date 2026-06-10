"""User model."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class User(TimestampMixin):
    __tablename__ = "users"

    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id"), nullable=True, index=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_reset_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization | None"] = relationship("Organization", back_populates="users", lazy="select")  # type: ignore[name-defined]
    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="user", lazy="select")  # type: ignore[name-defined]
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship("RefreshToken", back_populates="user", lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
