"""
Base mixin applied to every entity in PASE Compass.

Columns provided:
  id           — integer primary key (internal)
  uuid         — public UUID (never expose numeric id in APIs)
  created_at   — UTC timestamp of record creation
  updated_at   — UTC timestamp of last update (auto-updated)
  created_by   — user UUID that created the record
  updated_by   — user UUID that last updated the record
  is_active    — soft-disable flag (default True)
  deleted_at   — soft-delete timestamp (NULL = not deleted)
  deleted_by   — user UUID that performed the soft delete
"""
import uuid as _uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin(Base):
    """Abstract base mixin. All entity models must inherit from this."""

    __abstract__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    uuid: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        nullable=False,
        default=lambda: str(_uuid.uuid4()),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
        server_default=func.now(),
    )
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self, deleted_by_uuid: str) -> None:
        """Mark record as deleted without removing it from the database."""
        self.deleted_at = _utcnow()
        self.deleted_by = deleted_by_uuid
        self.is_active = False
