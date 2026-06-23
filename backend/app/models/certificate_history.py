"""CertificateHistory — immutable audit trail for certificate lifecycle events."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import _utcnow

if TYPE_CHECKING:
    from app.models.certificate import Certificate


class CertificateHistory(Base):
    __tablename__ = "certificate_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    certificate_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("certificates.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    action_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="Issued | Renewed | Revoked | Expired | Reinstated | Suspended | Draft",
    )
    previous_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow,
    )

    certificate: Mapped["Certificate"] = relationship(
        "Certificate", back_populates="history", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<CertificateHistory cert_id={self.certificate_id} action={self.action_type!r}>"
