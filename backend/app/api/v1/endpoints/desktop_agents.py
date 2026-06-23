"""Admin — Desktop Agent registry endpoints."""
import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser, require_admin
from app.helpers.pagination import PaginatedResponse
from app.models.desktop_agent import DesktopAgent
from app.schemas.sessions import AgentStatusUpdate
from app.utils.responses import not_found_response, success_response

router = APIRouter()


def _agent_dict(a: DesktopAgent) -> dict:
    return {
        "uuid": a.uuid,
        "agent_name": a.agent_name,
        "machine_name": a.machine_name,
        "version": a.version,
        "status": a.status,
        "ip_address": a.ip_address,
        "last_heartbeat": a.last_heartbeat.isoformat() if a.last_heartbeat else None,
        "runtime_mode": a.runtime_mode,
        "created_at": a.created_at.isoformat(),
        "updated_at": a.updated_at.isoformat(),
    }


async def _get_agent(uuid: str, db: AsyncSession) -> DesktopAgent | None:
    result = await db.execute(
        select(DesktopAgent).where(
            and_(DesktopAgent.uuid == uuid, DesktopAgent.deleted_at.is_(None))
        )
    )
    return result.scalar_one_or_none()


@router.get("", summary="List registered desktop agents")
async def list_agents(
    _: None = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(DesktopAgent).where(DesktopAgent.deleted_at.is_(None))
    if status:
        base_q = base_q.where(DesktopAgent.status == status)

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar_one()
    rows = (await db.execute(
        base_q.order_by(DesktopAgent.agent_name.asc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    return success_response(
        data=PaginatedResponse(
            items=[_agent_dict(a) for a in rows], total=total, page=page, page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        ).model_dump()
    )


@router.get("/{uuid}", summary="Get agent detail")
async def get_agent(
    uuid: str,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent(uuid, db)
    if not agent:
        return not_found_response("Desktop Agent")
    return success_response(data=_agent_dict(agent))


@router.patch("/{uuid}/status", summary="Update agent status")
async def update_agent_status(
    uuid: str,
    body: AgentStatusUpdate,
    current_user: CurrentUser,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent(uuid, db)
    if not agent:
        return not_found_response("Desktop Agent")

    agent.status = body.status
    agent.updated_by = current_user.uuid
    await db.commit()
    return success_response(data=_agent_dict(agent), message="Agent status updated")


@router.post("/{uuid}/heartbeat", summary="Agent heartbeat (called by agent client)")
async def agent_heartbeat(
    uuid: str,
    db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent(uuid, db)
    if not agent:
        return not_found_response("Desktop Agent")

    agent.last_heartbeat = datetime.now(timezone.utc)
    agent.status = "Online"
    await db.commit()
    return success_response(message="Heartbeat recorded")


@router.delete("/{uuid}", summary="Remove desktop agent")
async def delete_agent(
    uuid: str,
    current_user: CurrentUser,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent(uuid, db)
    if not agent:
        return not_found_response("Desktop Agent")

    agent.soft_delete(current_user.uuid)
    await db.commit()
    return success_response(message="Agent removed")
