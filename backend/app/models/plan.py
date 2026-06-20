"""Plan model — commercial subscription plans."""
from sqlalchemy import Boolean, Float, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampMixin


class Plan(TimestampMixin):
    __tablename__ = "plans"

    # Core identity
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Pricing
    price_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    price_yearly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    billing_cycle: Mapped[str] = mapped_column(String(30), nullable=False, default="Monthly")

    # Limits
    max_users: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    max_candidates: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    max_assessments_per_month: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    max_storage_gb: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_simulators: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Flags
    certificate_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    offline_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    custom_exercises_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Legacy
    is_trial: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trial_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Catalogue
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Draft", index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    organizations: Mapped[list["Organization"]] = relationship(  # type: ignore[name-defined]
        "Organization", back_populates="plan", lazy="select"
    )
    plan_features: Mapped[list["PlanFeature"]] = relationship(  # type: ignore[name-defined]
        "PlanFeature", back_populates="plan", lazy="select", cascade="all, delete-orphan"
    )
    plan_exercises: Mapped[list["PlanExercise"]] = relationship(  # type: ignore[name-defined]
        "PlanExercise", back_populates="plan", lazy="select", cascade="all, delete-orphan"
    )
    plan_simulators: Mapped[list["PlanSimulator"]] = relationship(  # type: ignore[name-defined]
        "PlanSimulator", back_populates="plan", lazy="select", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Plan id={self.id} slug={self.slug!r}>"
