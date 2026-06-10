"""Dashboard statistics endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.services.dashboard import DashboardService
from app.utils.responses import success_response

router = APIRouter()


@router.get(
    "/stats",
    summary="Get admin dashboard statistics",
    dependencies=[Depends(check_permissions(["dashboard.view"]))],
)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    service = DashboardService(db)
    stats = await service.get_stats()
    return success_response(data=stats.model_dump())
