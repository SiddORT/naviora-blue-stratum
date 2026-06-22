"""Add candidates table and candidate_id to assessment_participants.

Revision ID: a1b2c3d4e5f6
Revises: c1d2e3f4a5b6
Create Date: 2026-06-22 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = ('c1d2e3f4a5b6', 'e5f6a7b8c9d0')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── candidates table ──────────────────────────────────────────────────────
    op.create_table(
        'candidates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('nationality', sa.String(100), nullable=True),
        sa.Column('rank_or_designation', sa.String(150), nullable=True),
        sa.Column('seafarer_id', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('password_reset_token', sa.String(255), nullable=True),
        sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid', name='uq_candidates_uuid'),
        sa.UniqueConstraint('email', name='uq_candidates_email'),
        sa.UniqueConstraint('username', name='uq_candidates_username'),
        sa.UniqueConstraint('seafarer_id', name='uq_candidates_seafarer_id'),
    )
    op.create_index('ix_candidates_email', 'candidates', ['email'])
    op.create_index('ix_candidates_organization_id', 'candidates', ['organization_id'])
    op.create_index('ix_candidates_status', 'candidates', ['status'])
    op.create_index('ix_candidates_seafarer_id', 'candidates', ['seafarer_id'])

    # ── assessment_participants — add candidate_id ────────────────────────────
    op.add_column(
        'assessment_participants',
        sa.Column('candidate_id', sa.Integer(), nullable=True)
    )
    op.create_index('ix_assessment_participants_candidate_id', 'assessment_participants', ['candidate_id'])
    op.create_foreign_key(
        'fk_assessment_participants_candidate_id',
        'assessment_participants', 'candidates',
        ['candidate_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_assessment_participants_candidate_id', 'assessment_participants', type_='foreignkey')
    op.drop_index('ix_assessment_participants_candidate_id', table_name='assessment_participants')
    op.drop_column('assessment_participants', 'candidate_id')

    op.drop_index('ix_candidates_seafarer_id', table_name='candidates')
    op.drop_index('ix_candidates_status', table_name='candidates')
    op.drop_index('ix_candidates_organization_id', table_name='candidates')
    op.drop_index('ix_candidates_email', table_name='candidates')
    op.drop_table('candidates')
