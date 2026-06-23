"""Email Template — rich HTML email template engine."""
from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin

# Status values
TEMPLATE_DRAFT = "draft"
TEMPLATE_ACTIVE = "active"
TEMPLATE_ARCHIVED = "archived"


class EmailTemplate(TimestampMixin):
    __tablename__ = "email_templates"
    __table_args__ = (UniqueConstraint("template_code", name="uq_email_template_code"),)

    template_name: Mapped[str] = mapped_column(String(255), nullable=False)
    template_code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    html_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    plain_text_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON array of variable names: ["user_name", "platform_name", ...]
    available_variables: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=TEMPLATE_DRAFT)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
