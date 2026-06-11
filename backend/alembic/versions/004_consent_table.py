"""004 — consent records table

Revision ID: 004
Revises: 003
Create Date: 2026-06-11
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "consent_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=True, index=True,
                  comment="FK to users.id — nullable for pre-login consent capture"),
        sa.Column("user_uuid", sa.String(36), nullable=True, index=True,
                  comment="UUID reference — denormalised for easy lookup"),
        sa.Column("consent_type", sa.String(50), nullable=False, index=True,
                  comment="privacy_policy | terms_of_service | cookie_analytics | marketing"),
        sa.Column("policy_version", sa.String(50), nullable=False,
                  comment="Document version at time of acceptance, e.g. 2026-01-01"),
        sa.Column("accepted", sa.Boolean(), nullable=False,
                  comment="True = accepted, False = withdrawn"),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column(
            "accepted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
            index=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("consent_records")
