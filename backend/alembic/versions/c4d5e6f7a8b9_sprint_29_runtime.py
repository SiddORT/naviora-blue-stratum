"""Sprint 2.9 — Simulator Runtime, Session Management & Execution Engine.

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-06-23 09:00:00.000000
"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision = "c4d5e6f7a8b9"
down_revision = "b3c4d5e6f7a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extend simulator_sessions ──────────────────────────────────────────────
    op.add_column("simulator_sessions", sa.Column("campaign_id", sa.Integer(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("assignment_id", sa.Integer(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("candidate_fk_id", sa.Integer(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("assessment_fk_id", sa.Integer(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("exercise_fk_id", sa.Integer(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("variant_id", sa.Integer(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("runtime_config_id", sa.Integer(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("runtime_mode", sa.String(50), nullable=False, server_default="MANUAL"))
    op.add_column("simulator_sessions", sa.Column("launch_payload", postgresql.JSONB(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("raw_result", postgresql.JSONB(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("result_received", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("simulator_sessions", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("simulator_sessions", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("simulator_sessions", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("simulator_sessions", sa.Column("failure_reason", sa.Text(), nullable=True))
    op.add_column("simulator_sessions", sa.Column("launched_by", sa.String(36), nullable=True))

    # Unique constraint on session_reference if not already there
    try:
        op.create_unique_constraint("uq_session_reference", "simulator_sessions", ["session_reference"])
    except Exception:
        pass

    # FK constraints
    op.create_foreign_key("fk_ss_campaign", "simulator_sessions", "assessment_campaigns", ["campaign_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_ss_assignment", "simulator_sessions", "assessment_assignments", ["assignment_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_ss_candidate", "simulator_sessions", "candidates", ["candidate_fk_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_ss_assessment", "simulator_sessions", "assessments", ["assessment_fk_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_ss_exercise", "simulator_sessions", "exercises", ["exercise_fk_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_ss_variant", "simulator_sessions", "exercise_variants", ["variant_id"], ["id"], ondelete="SET NULL")

    op.create_index("ix_ss_campaign_id", "simulator_sessions", ["campaign_id"])
    op.create_index("ix_ss_assignment_id", "simulator_sessions", ["assignment_id"])
    op.create_index("ix_ss_candidate_fk", "simulator_sessions", ["candidate_fk_id"])
    op.create_index("ix_ss_runtime_mode", "simulator_sessions", ["runtime_mode"])

    # ── runtime_configurations ─────────────────────────────────────────────────
    op.create_table(
        "runtime_configurations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("simulator_vendor_id", sa.Integer(), nullable=False),
        sa.Column("config_name", sa.String(255), nullable=False),
        sa.Column("runtime_mode", sa.String(50), nullable=False, server_default="CLOUD_API"),
        sa.Column("api_endpoint", sa.String(500), nullable=True),
        sa.Column("executable_path", sa.String(500), nullable=True),
        sa.Column("working_directory", sa.String(500), nullable=True),
        sa.Column("launch_arguments", sa.Text(), nullable=True),
        sa.Column("result_directory", sa.String(500), nullable=True),
        sa.Column("auto_sync", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.ForeignKeyConstraint(["simulator_vendor_id"], ["simulator_vendors.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_runtime_configs_vendor", "runtime_configurations", ["simulator_vendor_id"])
    op.create_index("ix_runtime_configs_status", "runtime_configurations", ["status"])

    # Add FK from simulator_sessions to runtime_configurations (now that table exists)
    op.create_foreign_key("fk_ss_runtime_config", "simulator_sessions", "runtime_configurations", ["runtime_config_id"], ["id"], ondelete="SET NULL")

    # ── session_logs ───────────────────────────────────────────────────────────
    op.create_table(
        "session_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("simulator_session_id", sa.Integer(), nullable=False),
        sa.Column("log_level", sa.String(20), nullable=False, server_default="Info"),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("event_message", sa.Text(), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.ForeignKeyConstraint(["simulator_session_id"], ["simulator_sessions.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_session_logs_session", "session_logs", ["simulator_session_id"])
    op.create_index("ix_session_logs_level", "session_logs", ["log_level"])

    # ── session_attempts ───────────────────────────────────────────────────────
    op.create_table(
        "session_attempts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("simulator_session_id", sa.Integer(), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="Running"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.ForeignKeyConstraint(["simulator_session_id"], ["simulator_sessions.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_session_attempts_session", "session_attempts", ["simulator_session_id"])

    # ── desktop_agents ────────────────────────────────────────────────────────
    op.create_table(
        "desktop_agents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("agent_name", sa.String(255), nullable=False),
        sa.Column("machine_name", sa.String(255), nullable=False),
        sa.Column("version", sa.String(50), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="Offline"),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("last_heartbeat", sa.DateTime(timezone=True), nullable=True),
        sa.Column("runtime_mode", sa.String(50), nullable=False, server_default="DESKTOP_OFFLINE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index("ix_desktop_agents_status", "desktop_agents", ["status"])

    # ── exercise_variant_simulator_mappings ────────────────────────────────────
    op.create_table(
        "exercise_variant_simulator_mappings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("variant_id", sa.Integer(), nullable=False),
        sa.Column("simulator_vendor_id", sa.Integer(), nullable=False),
        sa.Column("runtime_mode", sa.String(50), nullable=False, server_default="CLOUD_API"),
        sa.Column("vendor_exercise_id", sa.String(255), nullable=True),
        sa.Column("vendor_scenario_id", sa.String(255), nullable=True),
        sa.Column("launch_config", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("variant_id", "simulator_vendor_id", name="uq_variant_vendor"),
        sa.ForeignKeyConstraint(["variant_id"], ["exercise_variants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["simulator_vendor_id"], ["simulator_vendors.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_evsm_variant", "exercise_variant_simulator_mappings", ["variant_id"])
    op.create_index("ix_evsm_vendor", "exercise_variant_simulator_mappings", ["simulator_vendor_id"])


def downgrade() -> None:
    op.drop_table("exercise_variant_simulator_mappings")
    op.drop_table("desktop_agents")
    op.drop_table("session_attempts")
    op.drop_table("session_logs")
    op.drop_constraint("fk_ss_runtime_config", "simulator_sessions", type_="foreignkey")
    op.drop_table("runtime_configurations")
    op.drop_constraint("fk_ss_campaign", "simulator_sessions", type_="foreignkey")
    op.drop_constraint("fk_ss_assignment", "simulator_sessions", type_="foreignkey")
    op.drop_constraint("fk_ss_candidate", "simulator_sessions", type_="foreignkey")
    op.drop_constraint("fk_ss_assessment", "simulator_sessions", type_="foreignkey")
    op.drop_constraint("fk_ss_exercise", "simulator_sessions", type_="foreignkey")
    op.drop_constraint("fk_ss_variant", "simulator_sessions", type_="foreignkey")
    for col in ["campaign_id","assignment_id","candidate_fk_id","assessment_fk_id","exercise_fk_id",
                "variant_id","runtime_config_id","runtime_mode","launch_payload","raw_result",
                "result_received","started_at","completed_at","cancelled_at","failure_reason","launched_by"]:
        op.drop_column("simulator_sessions", col)
