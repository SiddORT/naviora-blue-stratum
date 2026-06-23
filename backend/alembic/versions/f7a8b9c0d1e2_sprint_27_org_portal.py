"""Sprint 2.7 — Organization Portal enhancements.

Adds organization_type, timezone, runtime_mode to organizations.

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-06-23 13:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'f7a8b9c0d1e2'
down_revision = 'e6f7a8b9c0d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('organizations', sa.Column('organization_type', sa.String(100), nullable=True))
    op.add_column('organizations', sa.Column('timezone', sa.String(100), nullable=True, server_default='UTC'))
    op.add_column('organizations', sa.Column('runtime_mode', sa.String(50), nullable=True, server_default='CLOUD'))


def downgrade() -> None:
    op.drop_column('organizations', 'runtime_mode')
    op.drop_column('organizations', 'timezone')
    op.drop_column('organizations', 'organization_type')
