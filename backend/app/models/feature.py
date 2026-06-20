"""Feature model — reusable platform feature flags."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Feature(TimestampMixin):
    __tablename__ = "features"

    feature_name: Mapped[str] = mapped_column(String(150), nullable=False)
    feature_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False, default="General")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active", index=True)

    # Relationships
    plan_features: Mapped[list["PlanFeature"]] = relationship(  # type: ignore[name-defined]
        "PlanFeature", back_populates="feature", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Feature code={self.feature_code!r}>"
