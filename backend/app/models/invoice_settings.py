"""Invoice Settings — billing document configuration."""
from sqlalchemy import Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class InvoiceSettings(TimestampMixin):
    __tablename__ = "invoice_settings"

    # Numbering
    invoice_prefix: Mapped[str] = mapped_column(String(20), nullable=False, default="INV")
    invoice_start_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    quotation_prefix: Mapped[str] = mapped_column(String(20), nullable=False, default="QTN")
    quotation_start_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Currency
    currency_code: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    currency_symbol: Mapped[str] = mapped_column(String(10), nullable=False, default="$")

    # Tax
    tax_name: Mapped[str] = mapped_column(String(50), nullable=False, default="Tax")
    tax_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0.0)

    # Document
    invoice_footer: Mapped[str | None] = mapped_column(Text, nullable=True)
