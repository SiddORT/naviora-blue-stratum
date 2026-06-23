"""Sprint 2.8 — Assessment Campaigns, Assignments & Activity Logs.

Revision ID: b3c4d5e6f7a8
Revises: f7a8b9c0d1e2
Create Date: 2026-06-23 08:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "b3c4d5e6f7a8"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── assessment_campaigns ──────────────────────────────────────────────────
    op.create_table(
        "assessment_campaigns",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), unique=True, nullable=False),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("campaign_name", sa.String(255), nullable=False),
        sa.Column("campaign_code", sa.String(50), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("timezone", sa.String(100), nullable=False, server_default="UTC"),
        sa.Column("duration_override_minutes", sa.Integer(), nullable=True),
        sa.Column("passing_score_override", sa.Numeric(5, 2), nullable=True),
        sa.Column("max_attempts_override", sa.Integer(), nullable=True),
        sa.Column("randomize_exercises", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("randomize_variants", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("status", sa.String(50), nullable=False, server_default="Draft"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
    )
    op.create_index("ix_assessment_campaigns_organization_id", "assessment_campaigns", ["organization_id"])
    op.create_index("ix_assessment_campaigns_assessment_id", "assessment_campaigns", ["assessment_id"])
    op.create_index("ix_assessment_campaigns_status", "assessment_campaigns", ["status"])
    op.create_index("ix_assessment_campaigns_campaign_name", "assessment_campaigns", ["campaign_name"])
    op.create_index("ix_assessment_campaigns_campaign_code", "assessment_campaigns", ["campaign_code"])

    # ── assessment_assignments ────────────────────────────────────────────────
    op.create_table(
        "assessment_assignments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), unique=True, nullable=False),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("assessment_campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assignment_status", sa.String(50), nullable=False, server_default="Assigned"),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("final_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("result_status", sa.String(50), nullable=False, server_default="Pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
    )
    op.create_index("ix_assessment_assignments_campaign_id", "assessment_assignments", ["campaign_id"])
    op.create_index("ix_assessment_assignments_candidate_id", "assessment_assignments", ["candidate_id"])
    op.create_index("ix_assessment_assignments_status", "assessment_assignments", ["assignment_status"])
    # Unique: one active assignment per campaign per candidate
    op.create_index(
        "uq_active_assignment",
        "assessment_assignments",
        ["campaign_id", "candidate_id"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    # ── assignment_activity_logs ──────────────────────────────────────────────
    op.create_table(
        "assignment_activity_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("assignment_id", sa.Integer(), sa.ForeignKey("assessment_assignments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_type", sa.String(100), nullable=False),
        sa.Column("activity_description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_assignment_activity_logs_assignment_id", "assignment_activity_logs", ["assignment_id"])


def downgrade() -> None:
    op.drop_table("assignment_activity_logs")
    op.drop_table("assessment_assignments")
    op.drop_table("assessment_campaigns")
