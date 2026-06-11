"""Simulator Integration Hub — adds simulator_vendors, simulator_configurations,
simulator_sessions, and integration_logs tables.

Revision ID: 002
Revises: 001
Create Date: 2026-06-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # simulator_vendors
    op.create_table(
        "simulator_vendors",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("vendor_name", sa.String(255), nullable=True),
        sa.Column("version", sa.String(50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("integration_type", sa.String(50), nullable=False, server_default="REST_API"),
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
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_simulator_vendors_code", "simulator_vendors", ["code"])
    op.create_index("ix_simulator_vendors_status", "simulator_vendors", ["status"])

    # simulator_configurations
    op.create_table(
        "simulator_configurations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("simulator_vendor_id", sa.Integer(), nullable=False),
        sa.Column("configuration_name", sa.String(255), nullable=False),
        sa.Column("base_url", sa.String(500), nullable=True),
        sa.Column("authentication_type", sa.String(50), nullable=False, server_default="NONE"),
        sa.Column("api_key", sa.String(500), nullable=True),
        sa.Column("client_id", sa.String(255), nullable=True),
        sa.Column("client_secret", sa.String(500), nullable=True),
        sa.Column("webhook_url", sa.String(500), nullable=True),
        sa.Column("connection_timeout", sa.Integer(), nullable=False, server_default="30"),
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
        sa.ForeignKeyConstraint(["simulator_vendor_id"], ["simulator_vendors.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_simulator_configurations_vendor", "simulator_configurations", ["simulator_vendor_id"])

    # simulator_sessions
    op.create_table(
        "simulator_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("session_reference", sa.String(100), nullable=False),
        sa.Column("simulator_vendor_id", sa.Integer(), nullable=True),
        sa.Column("candidate_id", sa.String(36), nullable=True),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("assessment_id", sa.String(36), nullable=True),
        sa.Column("exercise_id", sa.String(36), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="PENDING"),
        sa.Column("raw_payload", postgresql.JSONB(), nullable=True),
        sa.Column("processed_payload", postgresql.JSONB(), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.ForeignKeyConstraint(["simulator_vendor_id"], ["simulator_vendors.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_simulator_sessions_reference", "simulator_sessions", ["session_reference"])
    op.create_index("ix_simulator_sessions_status", "simulator_sessions", ["status"])
    op.create_index("ix_simulator_sessions_start_time", "simulator_sessions", ["start_time"])

    # integration_logs
    op.create_table(
        "integration_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", sa.String(36), nullable=False),
        sa.Column("simulator_vendor_id", sa.Integer(), nullable=True),
        sa.Column("request_type", sa.String(100), nullable=False),
        sa.Column("request_url", sa.String(500), nullable=True),
        sa.Column("request_payload", postgresql.JSONB(), nullable=True),
        sa.Column("response_payload", postgresql.JSONB(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="success"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.ForeignKeyConstraint(["simulator_vendor_id"], ["simulator_vendors.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_integration_logs_vendor", "integration_logs", ["simulator_vendor_id"])
    op.create_index("ix_integration_logs_status", "integration_logs", ["status"])
    op.create_index("ix_integration_logs_created_at", "integration_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("integration_logs")
    op.drop_table("simulator_sessions")
    op.drop_table("simulator_configurations")
    op.drop_table("simulator_vendors")
