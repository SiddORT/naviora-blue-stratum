"""Organization — add structured address fields and phone_country_code.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-22 15:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('organizations', sa.Column('address_line1', sa.String(255), nullable=True))
    op.add_column('organizations', sa.Column('address_line2', sa.String(255), nullable=True))
    op.add_column('organizations', sa.Column('pincode', sa.String(20), nullable=True))
    op.add_column('organizations', sa.Column('country', sa.String(100), nullable=True))
    op.add_column('organizations', sa.Column('state', sa.String(100), nullable=True))
    op.add_column('organizations', sa.Column('city', sa.String(100), nullable=True))
    op.add_column('organizations', sa.Column('district', sa.String(100), nullable=True))
    op.add_column('organizations', sa.Column('phone_country_code', sa.String(10), nullable=True))
    op.add_column('candidates', sa.Column('phone_country_code', sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column('organizations', 'phone_country_code')
    op.drop_column('organizations', 'district')
    op.drop_column('organizations', 'city')
    op.drop_column('organizations', 'state')
    op.drop_column('organizations', 'country')
    op.drop_column('organizations', 'pincode')
    op.drop_column('organizations', 'address_line2')
    op.drop_column('organizations', 'address_line1')
    op.drop_column('candidates', 'phone_country_code')
