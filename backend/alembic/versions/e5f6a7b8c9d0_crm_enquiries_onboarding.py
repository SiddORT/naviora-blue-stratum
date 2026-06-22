"""CRM module — enquiries, enquiry_notes, enquiry_consents, onboarding_requests tables.

Revision ID: e5f6a7b8c9d0
Revises: d2e3f4a5b6c7
Create Date: 2026-06-22
"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


def upgrade() -> None:

    # ── enquiries ─────────────────────────────────────────────────────────────
    op.create_table(
        "enquiries",
        sa.Column("id",         sa.Integer(),    autoincrement=True, nullable=False),
        sa.Column("uuid",       sa.String(36),   nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36),   nullable=True),
        sa.Column("updated_by", sa.String(36),   nullable=True),
        sa.Column("is_active",  sa.Boolean(),    server_default="true", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36),   nullable=True),

        sa.Column("enquiry_type",     sa.String(50),  nullable=False),
        sa.Column("first_name",       sa.String(100), nullable=False),
        sa.Column("last_name",        sa.String(100), nullable=False),
        sa.Column("email",            sa.String(255), nullable=False),
        sa.Column("phone",            sa.String(50),  nullable=True),
        sa.Column("company_name",     sa.String(255), nullable=True),
        sa.Column("country",          sa.String(100), nullable=True),
        sa.Column("selected_plan_id", sa.Integer(),   nullable=True),
        sa.Column("message",          sa.Text(),      nullable=True),
        sa.Column("source_page",      sa.String(255), nullable=True),
        sa.Column("status",           sa.String(50),  server_default="NEW", nullable=False),
        sa.Column("assigned_to",      sa.String(36),  nullable=True),
        sa.Column("ip_address",       sa.String(50),  nullable=True),
        sa.Column("user_agent",       sa.String(500), nullable=True),
        sa.Column("duplicate_flag",   sa.Boolean(),   server_default="false", nullable=False),

        sa.ForeignKeyConstraint(["selected_plan_id"], ["plans.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index("ix_enquiries_email",        "enquiries", ["email"])
    op.create_index("ix_enquiries_status",       "enquiries", ["status"])
    op.create_index("ix_enquiries_enquiry_type", "enquiries", ["enquiry_type"])
    op.create_index("ix_enquiries_company_name", "enquiries", ["company_name"])

    # ── enquiry_notes ─────────────────────────────────────────────────────────
    op.create_table(
        "enquiry_notes",
        sa.Column("id",         sa.Integer(),    autoincrement=True, nullable=False),
        sa.Column("uuid",       sa.String(36),   nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36),   nullable=True),
        sa.Column("updated_by", sa.String(36),   nullable=True),
        sa.Column("is_active",  sa.Boolean(),    server_default="true", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36),   nullable=True),

        sa.Column("enquiry_id",   sa.Integer(),   nullable=False),
        sa.Column("note",         sa.Text(),      nullable=False),
        sa.Column("note_by",      sa.String(255), nullable=True),
        sa.Column("note_by_uuid", sa.String(36),  nullable=True),

        sa.ForeignKeyConstraint(["enquiry_id"], ["enquiries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index("ix_enquiry_notes_enquiry_id", "enquiry_notes", ["enquiry_id"])

    # ── enquiry_consents ──────────────────────────────────────────────────────
    op.create_table(
        "enquiry_consents",
        sa.Column("id",          sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("enquiry_id",  sa.Integer(), nullable=False),

        sa.Column("privacy_accepted",         sa.Boolean(), server_default="false", nullable=False),
        sa.Column("terms_accepted",           sa.Boolean(), server_default="false", nullable=False),
        sa.Column("data_processing_accepted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("marketing_accepted",       sa.Boolean(), server_default="false", nullable=False),

        sa.Column("consent_version", sa.String(50),  nullable=True),
        sa.Column("ip_address",      sa.String(50),  nullable=True),
        sa.Column("user_agent",      sa.String(500), nullable=True),
        sa.Column("accepted_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),

        sa.ForeignKeyConstraint(["enquiry_id"], ["enquiries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("enquiry_id"),
    )
    op.create_index("ix_enquiry_consents_enquiry_id", "enquiry_consents", ["enquiry_id"])

    # ── onboarding_requests ───────────────────────────────────────────────────
    op.create_table(
        "onboarding_requests",
        sa.Column("id",         sa.Integer(),    autoincrement=True, nullable=False),
        sa.Column("uuid",       sa.String(36),   nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(36),   nullable=True),
        sa.Column("updated_by", sa.String(36),   nullable=True),
        sa.Column("is_active",  sa.Boolean(),    server_default="true", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36),   nullable=True),

        sa.Column("enquiry_id",         sa.Integer(),   nullable=False),
        sa.Column("onboarding_type",    sa.String(50),  nullable=False),
        sa.Column("onboarding_status",  sa.String(50),  server_default="PENDING", nullable=False),
        sa.Column("organization_id",    sa.Integer(),   nullable=True),
        sa.Column("user_id",            sa.Integer(),   nullable=True),
        sa.Column("approved_by",        sa.String(36),  nullable=True),
        sa.Column("approved_at",        sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_by",        sa.String(36),  nullable=True),
        sa.Column("rejected_at",        sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason",   sa.Text(),      nullable=True),

        sa.ForeignKeyConstraint(["enquiry_id"],      ["enquiries.id"],      ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"],  ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"],         ["users.id"],          ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("enquiry_id"),
    )
    op.create_index("ix_onboarding_requests_enquiry_id",      "onboarding_requests", ["enquiry_id"])
    op.create_index("ix_onboarding_requests_onboarding_status", "onboarding_requests", ["onboarding_status"])


def downgrade() -> None:
    op.drop_table("onboarding_requests")
    op.drop_table("enquiry_consents")
    op.drop_table("enquiry_notes")
    op.drop_table("enquiries")
