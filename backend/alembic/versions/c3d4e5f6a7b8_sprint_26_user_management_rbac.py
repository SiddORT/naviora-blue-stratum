"""Sprint 2.6 — User Management & Dynamic RBAC.

Adds:
- user_type column to users
- scope column to role_permissions
- user_invitations table
- organization_assignments table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-23 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add user_type to users
    op.add_column('users', sa.Column('user_type', sa.String(50), nullable=False, server_default='ADMIN'))

    # Add scope to role_permissions
    op.add_column('role_permissions', sa.Column('scope', sa.String(50), nullable=False, server_default='ALL'))

    # Create user_invitations table (no index=True on columns — use explicit create_index below)
    op.create_table(
        'user_invitations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), unique=True, nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('token', sa.String(255), unique=True, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('invited_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
    )
    op.create_index('ix_user_invitations_email', 'user_invitations', ['email'])
    op.create_index('ix_user_invitations_token', 'user_invitations', ['token'])

    # Create organization_assignments table
    op.create_table(
        'organization_assignments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assignment_type', sa.String(50), nullable=False, server_default='SECONDARY'),
        sa.Column('assigned_by', sa.String(36), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'organization_id', name='uq_org_assignment'),
    )
    op.create_index('ix_org_assignments_user_id', 'organization_assignments', ['user_id'])
    op.create_index('ix_org_assignments_org_id', 'organization_assignments', ['organization_id'])


def downgrade() -> None:
    op.drop_index('ix_org_assignments_org_id', table_name='organization_assignments')
    op.drop_index('ix_org_assignments_user_id', table_name='organization_assignments')
    op.drop_table('organization_assignments')

    op.drop_index('ix_user_invitations_token', table_name='user_invitations')
    op.drop_index('ix_user_invitations_email', table_name='user_invitations')
    op.drop_table('user_invitations')

    op.drop_column('role_permissions', 'scope')
    op.drop_column('users', 'user_type')
