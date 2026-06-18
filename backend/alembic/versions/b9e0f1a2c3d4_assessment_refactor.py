"""Assessment Engine Refactor — replace template/category/rule model with unified Assessment entity.

Revision ID: b9e0f1a2c3d4
Revises: 4f9d8af9060a
Create Date: 2026-06-12 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'b9e0f1a2c3d4'
down_revision = '4f9d8af9060a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Drop old assessment engine tables (reverse dependency order) ──────────
    op.drop_table('assessment_versions')
    op.drop_table('assessment_rules')
    op.drop_table('assessment_exercises')
    op.drop_table('assessment_templates')
    op.drop_table('assessment_categories')

    # ── assessments ───────────────────────────────────────────────────────────
    op.create_table(
        'assessments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('assessment_name', sa.String(255), nullable=False),
        sa.Column('assessment_code', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('assessment_type', sa.String(50), nullable=False, server_default='Training'),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('passing_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('max_attempts', sa.Integer(), nullable=True),
        sa.Column('randomize_exercise_order', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('randomize_variant_selection', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('certificate_eligible', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('certificate_validity_months', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid', name='uq_assessments_uuid'),
        sa.UniqueConstraint('assessment_code', name='uq_assessments_code'),
    )
    op.create_index('ix_assessments_assessment_name', 'assessments', ['assessment_name'])
    op.create_index('ix_assessments_assessment_code', 'assessments', ['assessment_code'])
    op.create_index('ix_assessments_assessment_type', 'assessments', ['assessment_type'])
    op.create_index('ix_assessments_status', 'assessments', ['status'])

    # ── assessment_exercises (junction) ───────────────────────────────────────
    op.create_table(
        'assessment_exercises',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('weightage', sa.Numeric(5, 2), nullable=False, server_default='0.00'),
        sa.Column('mandatory', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id', 'exercise_id', name='uq_assessment_exercise'),
    )
    op.create_index('ix_assessment_exercises_assessment_id', 'assessment_exercises', ['assessment_id'])
    op.create_index('ix_assessment_exercises_exercise_id', 'assessment_exercises', ['exercise_id'])

    # ── assessment_participants ───────────────────────────────────────────────
    op.create_table(
        'assessment_participants',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('assignment_status', sa.String(50), nullable=False, server_default='Assigned'),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid', name='uq_assessment_participants_uuid'),
    )
    op.create_index('ix_assessment_participants_assessment_id', 'assessment_participants', ['assessment_id'])
    op.create_index('ix_assessment_participants_user_id', 'assessment_participants', ['user_id'])
    op.create_index('ix_assessment_participants_assignment_status', 'assessment_participants', ['assignment_status'])

    # ── assessment_schedules ──────────────────────────────────────────────────
    op.create_table(
        'assessment_schedules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('timezone', sa.String(100), nullable=False, server_default='UTC'),
        sa.Column('duration_override', sa.Integer(), nullable=True),
        sa.Column('is_open', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid', name='uq_assessment_schedules_uuid'),
    )
    op.create_index('ix_assessment_schedules_assessment_id', 'assessment_schedules', ['assessment_id'])

    # ── assessment_results (placeholder) ─────────────────────────────────────
    op.create_table(
        'assessment_results',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('participant_id', sa.Integer(), nullable=True),
        sa.Column('total_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('result_status', sa.String(50), nullable=False, server_default='Pending'),
        sa.Column('simulator_session_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['participant_id'], ['assessment_participants.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid', name='uq_assessment_results_uuid'),
    )
    op.create_index('ix_assessment_results_assessment_id', 'assessment_results', ['assessment_id'])
    op.create_index('ix_assessment_results_participant_id', 'assessment_results', ['participant_id'])


def downgrade() -> None:
    op.drop_table('assessment_results')
    op.drop_table('assessment_schedules')
    op.drop_table('assessment_participants')
    op.drop_table('assessment_exercises')
    op.drop_table('assessments')
    # Note: old tables not restored in downgrade
