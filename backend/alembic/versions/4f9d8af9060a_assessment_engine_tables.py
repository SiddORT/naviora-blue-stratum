"""assessment engine tables

Revision ID: 4f9d8af9060a
Revises: 
Create Date: 2026-06-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4f9d8af9060a'
down_revision = 'f360393c1ccb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # assessment_categories
    op.create_table(
        'assessment_categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('category_name', sa.String(255), nullable=False),
        sa.Column('category_code', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('category_code', name='uq_assessment_categories_code'),
        sa.UniqueConstraint('uuid', name='uq_assessment_categories_uuid'),
    )
    op.create_index('ix_assessment_categories_category_name', 'assessment_categories', ['category_name'])
    op.create_index('ix_assessment_categories_category_code', 'assessment_categories', ['category_code'])
    op.create_index('ix_assessment_categories_status', 'assessment_categories', ['status'])

    # assessment_templates
    op.create_table(
        'assessment_templates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('assessment_name', sa.String(255), nullable=False),
        sa.Column('assessment_code', sa.String(50), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('passing_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('max_attempts', sa.Integer(), nullable=True),
        sa.Column('variant_selection_mode', sa.String(50), nullable=False, server_default='MANUAL'),
        sa.Column('randomize_exercise_order', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('randomize_variant_selection', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('version_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['assessment_categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_code', name='uq_assessment_templates_code'),
        sa.UniqueConstraint('uuid', name='uq_assessment_templates_uuid'),
    )
    op.create_index('ix_assessment_templates_assessment_name', 'assessment_templates', ['assessment_name'])
    op.create_index('ix_assessment_templates_assessment_code', 'assessment_templates', ['assessment_code'])
    op.create_index('ix_assessment_templates_category_id', 'assessment_templates', ['category_id'])
    op.create_index('ix_assessment_templates_status', 'assessment_templates', ['status'])

    # assessment_exercises (junction)
    op.create_table(
        'assessment_exercises',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('weightage', sa.Numeric(5, 2), nullable=False, server_default='0.00'),
        sa.Column('mandatory', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessment_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id', 'exercise_id', name='uq_assessment_exercise'),
    )
    op.create_index('ix_assessment_exercises_assessment_id', 'assessment_exercises', ['assessment_id'])
    op.create_index('ix_assessment_exercises_exercise_id', 'assessment_exercises', ['exercise_id'])

    # assessment_rules
    op.create_table(
        'assessment_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('uuid', sa.String(36), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('minimum_pass_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('max_attempts', sa.Integer(), nullable=True),
        sa.Column('assessment_duration', sa.Integer(), nullable=True),
        sa.Column('allow_reassessment', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('reassessment_wait_days', sa.Integer(), nullable=True),
        sa.Column('variant_selection_mode', sa.String(50), nullable=False, server_default='MANUAL'),
        sa.Column('randomize_exercises', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('randomize_variants', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('auto_fail_on_collision', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('auto_fail_on_major_violation', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('updated_by', sa.String(36), nullable=True),
        sa.Column('deleted_by', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessment_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id', name='uq_assessment_rules_assessment'),
        sa.UniqueConstraint('uuid', name='uq_assessment_rules_uuid'),
    )
    op.create_index('ix_assessment_rules_assessment_id', 'assessment_rules', ['assessment_id'])

    # assessment_versions
    op.create_table(
        'assessment_versions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessment_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_assessment_versions_assessment_id', 'assessment_versions', ['assessment_id'])


def downgrade() -> None:
    op.drop_table('assessment_versions')
    op.drop_table('assessment_rules')
    op.drop_table('assessment_exercises')
    op.drop_table('assessment_templates')
    op.drop_table('assessment_categories')
