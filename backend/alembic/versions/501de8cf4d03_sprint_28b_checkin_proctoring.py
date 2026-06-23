"""sprint_28b_checkin_proctoring

Revision ID: 501de8cf4d03
Revises: d1e2f3a4b5c6
Create Date: 2026-06-23 13:29:56.042742

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '501de8cf4d03'
down_revision: Union[str, None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'assessment_checkins',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('identity_confirmed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('rules_accepted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('webcam_snapshot_path', sa.String(length=500), nullable=True),
        sa.Column('browser_name', sa.String(length=100), nullable=True),
        sa.Column('browser_version', sa.String(length=100), nullable=True),
        sa.Column('operating_system', sa.String(length=150), nullable=True),
        sa.Column('device_type', sa.String(length=100), nullable=True),
        sa.Column('screen_resolution', sa.String(length=50), nullable=True),
        sa.Column('ip_address', sa.String(length=60), nullable=True),
        sa.Column('user_agent', sa.String(length=512), nullable=True),
        sa.Column('timezone_name', sa.String(length=100), nullable=True),
        sa.Column('checked_in_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rules_version', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.String(length=36), nullable=True),
        sa.Column('updated_by', sa.String(length=36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(['assignment_id'], ['assessment_assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
    )
    op.create_index('ix_assessment_checkins_assignment_id', 'assessment_checkins', ['assignment_id'])
    op.create_index('ix_assessment_checkins_candidate_id', 'assessment_checkins', ['candidate_id'])

    op.create_table(
        'assessment_proctoring_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('event_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.String(length=36), nullable=True),
        sa.Column('updated_by', sa.String(length=36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(['assignment_id'], ['assessment_assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['simulator_sessions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
    )
    op.create_index('ix_assessment_proctoring_events_assignment_id', 'assessment_proctoring_events', ['assignment_id'])
    op.create_index('ix_assessment_proctoring_events_candidate_id', 'assessment_proctoring_events', ['candidate_id'])
    op.create_index('ix_assessment_proctoring_events_event_type', 'assessment_proctoring_events', ['event_type'])
    op.create_index('ix_assessment_proctoring_events_session_id', 'assessment_proctoring_events', ['session_id'])


def downgrade() -> None:
    op.drop_index('ix_assessment_proctoring_events_session_id', 'assessment_proctoring_events')
    op.drop_index('ix_assessment_proctoring_events_event_type', 'assessment_proctoring_events')
    op.drop_index('ix_assessment_proctoring_events_candidate_id', 'assessment_proctoring_events')
    op.drop_index('ix_assessment_proctoring_events_assignment_id', 'assessment_proctoring_events')
    op.drop_table('assessment_proctoring_events')
    op.drop_index('ix_assessment_checkins_candidate_id', 'assessment_checkins')
    op.drop_index('ix_assessment_checkins_assignment_id', 'assessment_checkins')
    op.drop_table('assessment_checkins')
