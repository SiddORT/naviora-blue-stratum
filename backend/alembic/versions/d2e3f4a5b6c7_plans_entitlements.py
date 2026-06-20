"""Sprint — Commercial Plans & Entitlements: features, plan_features, plan_exercises,
plan_simulators, organization_subscriptions, organization_usage; extend plans table.

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d2e3f4a5b6c7"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extend plans table ──────────────────────────────────────────────────
    with op.batch_alter_table("plans") as batch:
        batch.add_column(sa.Column("billing_cycle", sa.String(30), nullable=False, server_default="Monthly"))
        batch.add_column(sa.Column("max_candidates", sa.Integer(), nullable=False, server_default="50"))
        batch.add_column(sa.Column("max_assessments_per_month", sa.Integer(), nullable=False, server_default="10"))
        batch.add_column(sa.Column("max_storage_gb", sa.Integer(), nullable=False, server_default="5"))
        batch.add_column(sa.Column("certificate_enabled", sa.Boolean(), nullable=False, server_default="false"))
        batch.add_column(sa.Column("ai_enabled", sa.Boolean(), nullable=False, server_default="false"))
        batch.add_column(sa.Column("offline_enabled", sa.Boolean(), nullable=False, server_default="false"))
        batch.add_column(sa.Column("custom_exercises_enabled", sa.Boolean(), nullable=False, server_default="false"))
        batch.add_column(sa.Column("status", sa.String(30), nullable=False, server_default="Draft"))
        batch.add_column(sa.Column("is_public", sa.Boolean(), nullable=False, server_default="false"))
        batch.add_column(sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_plans_status", "plans", ["status"])

    # ── features ────────────────────────────────────────────────────────────
    op.create_table(
        "features",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False, unique=True),
        sa.Column("feature_name", sa.String(150), nullable=False),
        sa.Column("feature_code", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(80), nullable=False, server_default="General"),
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
    )
    op.create_index("ix_features_feature_code", "features", ["feature_code"])
    op.create_index("ix_features_status", "features", ["status"])

    # ── plan_features ────────────────────────────────────────────────────────
    op.create_table(
        "plan_features",
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("feature_id", sa.Integer(), sa.ForeignKey("features.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("configuration_json", postgresql.JSONB(), nullable=True),
    )

    # ── plan_exercises ───────────────────────────────────────────────────────
    op.create_table(
        "plan_exercises",
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("exercise_id", sa.Integer(), sa.ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )

    # ── plan_simulators ──────────────────────────────────────────────────────
    op.create_table(
        "plan_simulators",
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("simulator_vendor_id", sa.Integer(), sa.ForeignKey("simulator_vendors.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )

    # ── organization_subscriptions ───────────────────────────────────────────
    op.create_table(
        "organization_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False, unique=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("subscription_status", sa.String(50), nullable=False, server_default="Active"),
        sa.Column("billing_cycle", sa.String(30), nullable=False, server_default="Monthly"),
        sa.Column("auto_renew", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("custom_limits_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
    )
    op.create_index("ix_org_subs_organization_id", "organization_subscriptions", ["organization_id"])
    op.create_index("ix_org_subs_status", "organization_subscriptions", ["subscription_status"])

    # ── organization_usage ───────────────────────────────────────────────────
    op.create_table(
        "organization_usage",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False, unique=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("current_users", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("current_candidates", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("assessments_this_month", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("storage_used_gb", sa.Float(), nullable=False, server_default="0"),
        sa.Column("active_simulators", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_org_usage_organization_id", "organization_usage", ["organization_id"])


def downgrade() -> None:
    op.drop_table("organization_usage")
    op.drop_table("organization_subscriptions")
    op.drop_table("plan_simulators")
    op.drop_table("plan_exercises")
    op.drop_table("plan_features")
    op.drop_table("features")
    op.drop_index("ix_plans_status", "plans")
    with op.batch_alter_table("plans") as batch:
        for col in ["billing_cycle", "max_candidates", "max_assessments_per_month",
                    "max_storage_gb", "certificate_enabled", "ai_enabled",
                    "offline_enabled", "custom_exercises_enabled", "status",
                    "is_public", "display_order"]:
            batch.drop_column(col)
