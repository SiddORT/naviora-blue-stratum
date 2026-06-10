"""Dashboard service — aggregated statistics for the admin dashboard."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.user import User
from app.schemas.dashboard import DashboardStats


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_stats(self) -> DashboardStats:
        total_orgs = (await self.db.execute(
            select(func.count()).where(Organization.deleted_at.is_(None))
        )).scalar_one()

        active_orgs = (await self.db.execute(
            select(func.count()).where(
                Organization.deleted_at.is_(None),
                Organization.is_active.is_(True),
            )
        )).scalar_one()

        total_users = (await self.db.execute(
            select(func.count()).where(User.deleted_at.is_(None))
        )).scalar_one()

        active_users = (await self.db.execute(
            select(func.count()).where(
                User.deleted_at.is_(None),
                User.is_active.is_(True),
                User.status == "active",
            )
        )).scalar_one()

        return DashboardStats(
            total_organizations=total_orgs,
            active_organizations=active_orgs,
            total_users=total_users,
            active_users=active_users,
            total_assessments=0,
            total_simulator_sessions=0,
            pending_enquiries=0,
            active_plans=0,
        )
