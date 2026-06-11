"""Add base_url column to simulator_vendors.

Revision ID: 003
Revises: 002
Create Date: 2026-06-11
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "simulator_vendors",
        sa.Column("base_url", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("simulator_vendors", "base_url")
