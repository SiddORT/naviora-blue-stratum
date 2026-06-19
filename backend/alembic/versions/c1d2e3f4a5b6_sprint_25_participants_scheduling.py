"""Sprint 2.5 — Assessment Participants & Scheduling: add missing columns + assessment_attempts table.

Revision ID: c1d2e3f4a5b6
Revises: b9e0f1a2c3d4
Create Date: 2026-06-19 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'c1d2e3f4a5b6'
down_revision = 'b9e0f1a2c3d4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── assessment_participants — add missing columns ───────────────────────────
    op.add_column('assessment_participants', sa.Column('assigned_by', sa.String(36), nullable=True))
    op.add_column('assessment_participants', sa.Column('max_attempts_override', sa.Integer(), nullable=True))
    op.add_column('assessment_participants', sa.Column('result_status', sa.String(50), nullable=False, server_default='Pending'))
    op.add_column('assessment_participants', sa.Column('remarks', sa.Text(), nullable=True))
    op.add_column('assessment_participants', sa.Column('created_by', sa.String(36), nullable=True))
    op.add_column('assessment_participants', sa.Column('updated_by', sa.String(36), nullable=True))
    op.add_column('assessment_participants', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('assessment_participants', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('assessment_participants', sa.Column('deleted_by', sa.String(36), nullable=True))

    # ── assessment_schedules — add missing columns ─────────────────────────────
    op.add_column('assessment_schedules', sa.Column('schedule_type', sa.String(50), nullable=False, server_default='Always Open'))
    op.add_column('assessment_schedules', sa.Column('allow_late_start', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('assessment_schedules', sa.Column('grace_period_minutes', sa.Integer(), nullable=True))
    op.add_column('assessment_schedules', sa.Column('schedule_status', sa.String(50), nullable=False, server_default='Draft'))
    op.add_column('assessment_schedules', sa.Column('created_by', sa.String(36), nullable=True))
    op.add_column('assessment_schedules', sa.Column('updated_by', sa.String(36), nullable=True))
    op.add_column('assessment_schedules', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('assessment_schedules', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('assessment_schedules', sa.Column('deleted_by', sa.String(36), nullable=True))

    # ── assessment_attempts ────────────────────────────────────────────────────
    op.create_table(
        'assessment_attempts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('assessment_participant_id', sa.Integer(), nullable=False),
        sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('simulator_session_id', sa.Integer(), nullable=True),
        sa.Column('score', sa.Numeric(5, 2), nullable=True),
        sa.Column('result_status', sa.String(50), nullable=False, server_default='Pending'),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['assessment_participant_id'], ['assessment_participants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['simulator_session_id'], ['simulator_sessions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid', name='uq_assessment_attempts_uuid'),
    )
    op.create_index('ix_assessment_attempts_participant_id', 'assessment_attempts', ['assessment_participant_id'])
    op.create_index('ix_assessment_attempts_simulator_session_id', 'assessment_attempts', ['simulator_session_id'])
    op.create_index('ix_assessment_attempts_result_status', 'assessment_attempts', ['result_status'])


def downgrade() -> None:
    op.drop_table('assessment_attempts')

    for col in ['assigned_by', 'max_attempts_override', 'result_status', 'remarks',
                'created_by', 'updated_by', 'is_active', 'deleted_at', 'deleted_by']:
        op.drop_column('assessment_participants', col)

    for col in ['schedule_type', 'allow_late_start', 'grace_period_minutes', 'schedule_status',
                'created_by', 'updated_by', 'is_active', 'deleted_at', 'deleted_by']:
        op.drop_column('assessment_schedules', col)
