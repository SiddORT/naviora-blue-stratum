"""Admin — Runtime Dashboard aggregated statistics."""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import require_admin
from app.models.desktop_agent import DesktopAgent
from app.models.runtime_configuration import RuntimeConfiguration
from app.models.simulator_session import SimulatorSession
from app.models.simulator_vendor import SimulatorVendor
from app.utils.responses import success_response

router = APIRouter()


@router.get("", summary="Runtime dashboard statistics")
async def runtime_dashboard(
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    # Sessions by status
    status_list = ["Pending", "Launching", "Running", "Completed", "Failed", "Cancelled", "Timed Out"]
    sessions_by_status: dict[str, int] = {}
    for st in status_list:
        cnt = (await db.execute(
            select(func.count()).where(
                and_(SimulatorSession.status == st, SimulatorSession.deleted_at.is_(None))
            )
        )).scalar_one()
        sessions_by_status[st] = cnt

    total_sessions = sum(sessions_by_status.values())
    sessions_today = (await db.execute(
        select(func.count()).where(
            and_(
                SimulatorSession.created_at >= today_start,
                SimulatorSession.deleted_at.is_(None),
            )
        )
    )).scalar_one()

    # Sessions by runtime mode
    mode_list = ["CLOUD_API", "DESKTOP_OFFLINE", "MANUAL"]
    sessions_by_mode: dict[str, int] = {}
    for mode in mode_list:
        cnt = (await db.execute(
            select(func.count()).where(
                and_(
                    SimulatorSession.runtime_mode == mode,
                    SimulatorSession.deleted_at.is_(None),
                )
            )
        )).scalar_one()
        sessions_by_mode[mode] = cnt

    # Desktop agents
    agents_online = (await db.execute(
        select(func.count()).where(DesktopAgent.status == "Online")
    )).scalar_one()
    agents_total = (await db.execute(
        select(func.count()).where(DesktopAgent.deleted_at.is_(None))
    )).scalar_one()

    # Runtime configurations
    configs_total = (await db.execute(
        select(func.count()).where(
            and_(RuntimeConfiguration.deleted_at.is_(None), RuntimeConfiguration.status == "active")
        )
    )).scalar_one()

    # Vendors
    vendors_active = (await db.execute(
        select(func.count()).where(SimulatorVendor.status == "active")
    )).scalar_one()

    # Recent active sessions (last 10)
    recent_rows = (await db.execute(
        select(SimulatorSession)
        .where(
            and_(
                SimulatorSession.status.in_(["Running", "Launching"]),
                SimulatorSession.deleted_at.is_(None),
            )
        )
        .order_by(SimulatorSession.started_at.desc())
        .limit(10)
    )).scalars().all()

    recent_sessions = [
        {
            "uuid": s.uuid,
            "session_reference": s.session_reference,
            "status": s.status,
            "runtime_mode": s.runtime_mode,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "candidate_fk_id": s.candidate_fk_id,
            "organization_id": s.organization_id,
        }
        for s in recent_rows
    ]

    return success_response(
        data={
            "sessions": {
                "total": total_sessions,
                "today": sessions_today,
                "by_status": sessions_by_status,
                "by_mode": sessions_by_mode,
                "active": recent_sessions,
            },
            "agents": {
                "total": agents_total,
                "online": agents_online,
                "offline": agents_total - agents_online,
            },
            "configurations": {
                "active": configs_total,
            },
            "vendors": {
                "active": vendors_active,
            },
        }
    )
