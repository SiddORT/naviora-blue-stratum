"""CertificateTemplate — reusable certificate design definitions."""
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.certificate_rule import CertificateRule
    from app.models.certificate import Certificate


class CertificateTemplate(TimestampMixin):
    __tablename__ = "certificate_templates"

    template_name: Mapped[str] = mapped_column(String(255), nullable=False)
    template_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    certificate_type: Mapped[str] = mapped_column(String(100), nullable=False, default="Standard")
    background_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    signature_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    template_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_config: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Draft", index=True,
        comment="Draft | Active | Archived",
    )

    rules: Mapped[list["CertificateRule"]] = relationship(
        "CertificateRule", back_populates="template", lazy="noload",
    )
    certificates: Mapped[list["Certificate"]] = relationship(
        "Certificate", back_populates="template", lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<CertificateTemplate id={self.id} code={self.template_code!r}>"
