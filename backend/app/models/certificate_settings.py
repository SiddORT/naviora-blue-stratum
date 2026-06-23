"""CertificateSettings — platform-wide numbering and format configuration."""
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class CertificateSettings(TimestampMixin):
    __tablename__ = "certificate_settings"

    certificate_prefix: Mapped[str] = mapped_column(String(50), nullable=False, default="CERT")
    next_certificate_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    reset_frequency: Mapped[str] = mapped_column(
        String(50), nullable=False, default="annual",
        comment="annual | monthly | continuous",
    )
    last_reset_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_reset_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    include_year_in_number: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    def __repr__(self) -> str:
        return f"<CertificateSettings prefix={self.certificate_prefix!r}>"
