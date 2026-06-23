"""Sprint 3.1 — Certificate Management tables.

Revision ID: d1e2f3a4b5c6
Revises: c4d5e6f7a8b9
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = "d1e2f3a4b5c6"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "certificate_settings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False, unique=True),
        sa.Column("certificate_prefix", sa.String(50), nullable=False, server_default="CERT"),
        sa.Column("next_certificate_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("reset_frequency", sa.String(50), nullable=False, server_default="annual"),
        sa.Column("last_reset_year", sa.Integer(), nullable=True),
        sa.Column("last_reset_month", sa.Integer(), nullable=True),
        sa.Column("include_year_in_number", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
    )

    op.create_table(
        "certificate_templates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False, unique=True),
        sa.Column("template_name", sa.String(255), nullable=False),
        sa.Column("template_code", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("certificate_type", sa.String(100), nullable=False, server_default="Standard"),
        sa.Column("background_image_path", sa.String(500), nullable=True),
        sa.Column("logo_path", sa.String(500), nullable=True),
        sa.Column("signature_image_path", sa.String(500), nullable=True),
        sa.Column("template_html", sa.Text(), nullable=True),
        sa.Column("template_config", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("status", sa.String(50), nullable=False, server_default="Draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
    )
    op.create_index("ix_certificate_templates_template_code", "certificate_templates", ["template_code"])
    op.create_index("ix_certificate_templates_status", "certificate_templates", ["status"])

    op.create_table(
        "certificate_rules",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False, unique=True),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("certificate_templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("minimum_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("require_review_approval", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("auto_issue", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("validity_period_months", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="Active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
    )
    op.create_index("ix_certificate_rules_assessment_id", "certificate_rules", ["assessment_id"])
    op.create_index("ix_certificate_rules_template_id", "certificate_rules", ["template_id"])
    op.create_index("ix_certificate_rules_status", "certificate_rules", ["status"])

    op.create_table(
        "certificates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False, unique=True),
        sa.Column("certificate_number", sa.String(100), nullable=False, unique=True),
        sa.Column("certificate_type", sa.String(100), nullable=False, server_default="Standard"),
        sa.Column("certificate_template_id", sa.Integer(), sa.ForeignKey("certificate_templates.id", ondelete="SET NULL"), nullable=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("result_id", sa.Integer(), sa.ForeignKey("assessment_results.id", ondelete="SET NULL"), nullable=True),
        sa.Column("issue_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("score", sa.Numeric(5, 2), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="Draft"),
        sa.Column("pdf_path", sa.String(500), nullable=True),
        sa.Column("verification_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("verification_url", sa.String(500), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("issued_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("updated_by", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(36), nullable=True),
    )
    op.create_index("ix_certificates_certificate_number", "certificates", ["certificate_number"])
    op.create_index("ix_certificates_status", "certificates", ["status"])
    op.create_index("ix_certificates_candidate_id", "certificates", ["candidate_id"])
    op.create_index("ix_certificates_organization_id", "certificates", ["organization_id"])
    op.create_index("ix_certificates_assessment_id", "certificates", ["assessment_id"])
    op.create_index("ix_certificates_verification_hash", "certificates", ["verification_hash"])

    op.create_table(
        "certificate_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("certificate_id", sa.Integer(), sa.ForeignKey("certificates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("previous_status", sa.String(50), nullable=True),
        sa.Column("new_status", sa.String(50), nullable=False),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("action_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_certificate_history_certificate_id", "certificate_history", ["certificate_id"])

    # Seed default settings row
    op.execute(
        "INSERT INTO certificate_settings (uuid, certificate_prefix, next_certificate_number, "
        "reset_frequency, include_year_in_number, created_at, updated_at, is_active) "
        "VALUES (gen_random_uuid()::text, 'CERT', 1, 'annual', true, now(), now(), true)"
    )

    # Seed default template
    op.execute(
        "INSERT INTO certificate_templates (uuid, template_name, template_code, description, "
        "certificate_type, is_default, status, created_at, updated_at, is_active) "
        "VALUES (gen_random_uuid()::text, 'Standard Maritime Certificate', 'STANDARD-MARITIME', "
        "'Default certificate template for maritime competency assessments', "
        "'Standard', true, 'Active', now(), now(), true)"
    )


def downgrade() -> None:
    op.drop_table("certificate_history")
    op.drop_table("certificates")
    op.drop_table("certificate_rules")
    op.drop_table("certificate_templates")
    op.drop_table("certificate_settings")
