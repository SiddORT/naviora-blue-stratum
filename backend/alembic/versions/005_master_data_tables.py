"""005 — Maritime master data tables

Revision ID: 005
Revises: 004
Create Date: 2026-06-11
"""
import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

_TS_COLS = [
    sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    sa.Column("updated_at",  sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    sa.Column("created_by",  sa.String(36),  nullable=True),
    sa.Column("updated_by",  sa.String(36),  nullable=True),
    sa.Column("is_active",   sa.Boolean(),   server_default=sa.text("true"), nullable=False),
    sa.Column("deleted_at",  sa.DateTime(timezone=True), nullable=True),
    sa.Column("deleted_by",  sa.String(36),  nullable=True),
]


def _std(extra: list) -> list:
    return [
        sa.Column("id",   sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", sa.String(36), nullable=False),
        *extra,
        *_TS_COLS,
    ]


def upgrade() -> None:
    op.create_table(
        "vessels",
        *_std([
            sa.Column("vessel_name",           sa.String(255), nullable=False),
            sa.Column("vessel_code",           sa.String(50),  nullable=False),
            sa.Column("vessel_type",           sa.String(100), nullable=False),
            sa.Column("imo_category",          sa.String(100), nullable=True),
            sa.Column("length",                sa.Numeric(10, 2), nullable=True),
            sa.Column("beam",                  sa.Numeric(10, 2), nullable=True),
            sa.Column("draft",                 sa.Numeric(10, 2), nullable=True),
            sa.Column("max_speed",             sa.Numeric(10, 2), nullable=True),
            sa.Column("maneuverability_rating",sa.String(50),  nullable=True),
            sa.Column("description",           sa.Text(),      nullable=True),
            sa.Column("status",                sa.String(50),  server_default="active", nullable=False),
        ]),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("vessel_code"),
    )
    op.create_index("ix_vessels_vessel_name",  "vessels", ["vessel_name"])
    op.create_index("ix_vessels_vessel_code",  "vessels", ["vessel_code"])
    op.create_index("ix_vessels_vessel_type",  "vessels", ["vessel_type"])
    op.create_index("ix_vessels_status",       "vessels", ["status"])

    op.create_table(
        "ports",
        *_std([
            sa.Column("port_name",        sa.String(255), nullable=False),
            sa.Column("port_code",        sa.String(50),  nullable=False),
            sa.Column("country",          sa.String(100), nullable=False),
            sa.Column("city",             sa.String(100), nullable=True),
            sa.Column("latitude",         sa.Numeric(10, 6), nullable=True),
            sa.Column("longitude",        sa.Numeric(10, 6), nullable=True),
            sa.Column("traffic_density",  sa.String(50),  server_default="Medium", nullable=False),
            sa.Column("description",      sa.Text(),      nullable=True),
            sa.Column("status",           sa.String(50),  server_default="active", nullable=False),
        ]),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("port_code"),
    )
    op.create_index("ix_ports_port_name",       "ports", ["port_name"])
    op.create_index("ix_ports_port_code",       "ports", ["port_code"])
    op.create_index("ix_ports_country",         "ports", ["country"])
    op.create_index("ix_ports_status",          "ports", ["status"])

    op.create_table(
        "weather_conditions",
        *_std([
            sa.Column("name",                sa.String(100), nullable=False),
            sa.Column("wind_speed",          sa.Numeric(10, 2), nullable=True),
            sa.Column("precipitation_level", sa.String(50),  nullable=True),
            sa.Column("visibility_range",    sa.Numeric(10, 2), nullable=True),
            sa.Column("description",         sa.Text(),      nullable=True),
            sa.Column("status",              sa.String(50),  server_default="active", nullable=False),
        ]),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_weather_conditions_name",   "weather_conditions", ["name"])
    op.create_index("ix_weather_conditions_status", "weather_conditions", ["status"])

    op.create_table(
        "sea_states",
        *_std([
            sa.Column("name",             sa.String(100), nullable=False),
            sa.Column("wave_height_min",  sa.Numeric(10, 2), nullable=True),
            sa.Column("wave_height_max",  sa.Numeric(10, 2), nullable=True),
            sa.Column("description",      sa.Text(),      nullable=True),
            sa.Column("status",           sa.String(50),  server_default="active", nullable=False),
        ]),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_sea_states_name",   "sea_states", ["name"])
    op.create_index("ix_sea_states_status", "sea_states", ["status"])

    op.create_table(
        "visibility_conditions",
        *_std([
            sa.Column("name",                 sa.String(100), nullable=False),
            sa.Column("visibility_distance",  sa.Numeric(10, 2), nullable=True),
            sa.Column("description",          sa.Text(),      nullable=True),
            sa.Column("status",               sa.String(50),  server_default="active", nullable=False),
        ]),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_visibility_conditions_name",   "visibility_conditions", ["name"])
    op.create_index("ix_visibility_conditions_status", "visibility_conditions", ["status"])

    op.create_table(
        "time_of_day",
        *_std([
            sa.Column("name",        sa.String(100), nullable=False),
            sa.Column("description", sa.Text(),      nullable=True),
            sa.Column("status",      sa.String(50),  server_default="active", nullable=False),
        ]),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_time_of_day_name",   "time_of_day", ["name"])
    op.create_index("ix_time_of_day_status", "time_of_day", ["status"])

    op.create_table(
        "environment_profiles",
        *_std([
            sa.Column("profile_name",            sa.String(255), nullable=False),
            sa.Column("weather_condition_id",    sa.Integer(), sa.ForeignKey("weather_conditions.id",   ondelete="SET NULL"), nullable=True),
            sa.Column("sea_state_id",            sa.Integer(), sa.ForeignKey("sea_states.id",           ondelete="SET NULL"), nullable=True),
            sa.Column("visibility_condition_id", sa.Integer(), sa.ForeignKey("visibility_conditions.id",ondelete="SET NULL"), nullable=True),
            sa.Column("time_of_day_id",          sa.Integer(), sa.ForeignKey("time_of_day.id",          ondelete="SET NULL"), nullable=True),
            sa.Column("description",             sa.Text(),      nullable=True),
            sa.Column("status",                  sa.String(50),  server_default="active", nullable=False),
        ]),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index("ix_environment_profiles_profile_name", "environment_profiles", ["profile_name"])
    op.create_index("ix_environment_profiles_status",       "environment_profiles", ["status"])


def downgrade() -> None:
    op.drop_table("environment_profiles")
    op.drop_table("time_of_day")
    op.drop_table("visibility_conditions")
    op.drop_table("sea_states")
    op.drop_table("weather_conditions")
    op.drop_table("ports")
    op.drop_table("vessels")
