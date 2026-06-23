"""Sprint 2.6A — Platform Settings, Communication Center & Email Templates.

Revision ID: e6f7a8b9c0d1
Revises: c3d4e5f6a7b8
Create Date: 2026-06-23 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'e6f7a8b9c0d1'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── platform_settings ──────────────────────────────────────────────────
    op.create_table(
        'platform_settings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('company_name', sa.String(255), nullable=True),
        sa.Column('legal_name', sa.String(255), nullable=True),
        sa.Column('company_email', sa.String(255), nullable=True),
        sa.Column('support_email', sa.String(255), nullable=True),
        sa.Column('billing_email', sa.String(255), nullable=True),
        sa.Column('company_phone', sa.String(50), nullable=True),
        sa.Column('website_url', sa.String(500), nullable=True),
        sa.Column('address_line_1', sa.String(255), nullable=True),
        sa.Column('address_line_2', sa.String(255), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('postal_code', sa.String(20), nullable=True),
        sa.Column('company_logo_path', sa.String(500), nullable=True),
        sa.Column('favicon_path', sa.String(500), nullable=True),
        sa.Column('default_timezone', sa.String(100), nullable=False, server_default='UTC'),
        sa.Column('default_currency', sa.String(10), nullable=False, server_default='USD'),
        sa.Column('default_language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('date_format', sa.String(50), nullable=False, server_default='YYYY-MM-DD'),
        sa.Column('time_format', sa.String(20), nullable=False, server_default='24h'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )

    # ── branding_settings ─────────────────────────────────────────────────
    op.create_table(
        'branding_settings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('platform_name', sa.String(255), nullable=False, server_default='Naviora'),
        sa.Column('platform_tagline', sa.String(500), nullable=True),
        sa.Column('primary_color', sa.String(20), nullable=False, server_default='#D4A63A'),
        sa.Column('secondary_color', sa.String(20), nullable=False, server_default='#2EA8FF'),
        sa.Column('accent_color', sa.String(20), nullable=False, server_default='#B8860B'),
        sa.Column('login_background_path', sa.String(500), nullable=True),
        sa.Column('email_header_logo_path', sa.String(500), nullable=True),
        sa.Column('report_logo_path', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )

    # ── communication_settings ────────────────────────────────────────────
    op.create_table(
        'communication_settings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('smtp_host', sa.String(255), nullable=True),
        sa.Column('smtp_port', sa.Integer(), nullable=False, server_default='587'),
        sa.Column('smtp_username', sa.String(255), nullable=True),
        sa.Column('smtp_password_enc', sa.String(1000), nullable=True),
        sa.Column('smtp_encryption', sa.String(10), nullable=False, server_default='TLS'),
        sa.Column('sender_name', sa.String(255), nullable=True),
        sa.Column('sender_email', sa.String(255), nullable=True),
        sa.Column('reply_to_email', sa.String(255), nullable=True),
        sa.Column('test_email_address', sa.String(255), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )

    # ── notification_settings ─────────────────────────────────────────────
    op.create_table(
        'notification_settings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('enable_email_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('enable_system_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('enable_sms_notifications', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('enable_whatsapp_notifications', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('enable_teams_notifications', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('enable_slack_notifications', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sms_provider_config', sa.String(2000), nullable=True),
        sa.Column('teams_webhook_url', sa.String(500), nullable=True),
        sa.Column('slack_webhook_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )

    # ── invoice_settings ──────────────────────────────────────────────────
    op.create_table(
        'invoice_settings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('invoice_prefix', sa.String(20), nullable=False, server_default='INV'),
        sa.Column('invoice_start_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('quotation_prefix', sa.String(20), nullable=False, server_default='QTN'),
        sa.Column('quotation_start_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('currency_code', sa.String(10), nullable=False, server_default='USD'),
        sa.Column('currency_symbol', sa.String(10), nullable=False, server_default='$'),
        sa.Column('tax_name', sa.String(50), nullable=False, server_default='Tax'),
        sa.Column('tax_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.00'),
        sa.Column('invoice_footer', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )

    # ── system_preferences ────────────────────────────────────────────────
    op.create_table(
        'system_preferences',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('default_timezone', sa.String(100), nullable=False, server_default='UTC'),
        sa.Column('default_currency', sa.String(10), nullable=False, server_default='USD'),
        sa.Column('default_language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('session_timeout_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('password_expiry_days', sa.Integer(), nullable=False, server_default='90'),
        sa.Column('max_login_attempts', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('lockout_duration_minutes', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )

    # ── email_templates ───────────────────────────────────────────────────
    op.create_table(
        'email_templates',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('template_name', sa.String(255), nullable=False),
        sa.Column('template_code', sa.String(100), nullable=False, unique=True),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('html_content', sa.Text(), nullable=True),
        sa.Column('plain_text_content', sa.Text(), nullable=True),
        sa.Column('available_variables', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )
    op.create_index('ix_email_templates_template_code', 'email_templates', ['template_code'])

    # ── portal_settings ───────────────────────────────────────────────────
    op.create_table(
        'portal_settings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('public_url', sa.String(500), nullable=False, server_default='/'),
        sa.Column('admin_url', sa.String(500), nullable=False, server_default='/admin/login'),
        sa.Column('organization_url', sa.String(500), nullable=False, server_default='/org/login'),
        sa.Column('candidate_url', sa.String(500), nullable=False, server_default='/candidate/login'),
        sa.Column('custom_domain', sa.String(255), nullable=True),
        sa.Column('ssl_enabled', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('portal_settings')
    op.drop_index('ix_email_templates_template_code', 'email_templates')
    op.drop_table('email_templates')
    op.drop_table('system_preferences')
    op.drop_table('invoice_settings')
    op.drop_table('notification_settings')
    op.drop_table('communication_settings')
    op.drop_table('branding_settings')
    op.drop_table('platform_settings')
