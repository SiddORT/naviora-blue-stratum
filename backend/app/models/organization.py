"""Organization model — top-level tenant in the multi-tenant architecture."""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Organization(TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    plan_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("plans.id"), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    max_users: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="organization", lazy="select")  # type: ignore[name-defined]
    candidates: Mapped[list["Candidate"]] = relationship("Candidate", back_populates="organization", lazy="select")  # type: ignore[name-defined]
    plan: Mapped["Plan | None"] = relationship("Plan", back_populates="organizations", lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name!r} code={self.code!r}>"
