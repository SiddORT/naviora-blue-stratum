"""SimulatorSession service — read-only for UI; sessions are written by integrations."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulator_session import SimulatorSession
from app.repositories.simulator_session import SimulatorSessionRepository
from app.schemas.simulator import (
    SimulatorSessionListResponse,
    SimulatorSessionResponse,
)

logger = logging.getLogger(__name__)


def _to_response(s: SimulatorSession) -> SimulatorSessionResponse:
    vendor_name = s.vendor.name if s.vendor else None
    vendor_code = s.vendor.code if s.vendor else None
    return SimulatorSessionResponse(
        id=s.id, uuid=s.uuid,
        session_reference=s.session_reference,
        simulator_vendor_id=s.simulator_vendor_id,
        vendor_name=vendor_name, vendor_code=vendor_code,
        candidate_id=s.candidate_id,
        organization_id=s.organization_id,
        assessment_id=s.assessment_id,
        exercise_id=s.exercise_id,
        start_time=s.start_time, end_time=s.end_time,
        duration_seconds=s.duration_seconds,
        status=s.status,
        raw_payload=s.raw_payload,
        processed_payload=s.processed_payload,
        remarks=s.remarks,
        created_at=s.created_at, updated_at=s.updated_at,
    )


def _to_list_response(s: SimulatorSession) -> SimulatorSessionListResponse:
    vendor_name = s.vendor.name if s.vendor else None
    vendor_code = s.vendor.code if s.vendor else None
    return SimulatorSessionListResponse(
        id=s.id, uuid=s.uuid,
        session_reference=s.session_reference,
        vendor_name=vendor_name, vendor_code=vendor_code,
        candidate_id=s.candidate_id,
        assessment_id=s.assessment_id,
        status=s.status,
        start_time=s.start_time, end_time=s.end_time,
        duration_seconds=s.duration_seconds,
        created_at=s.created_at,
    )


class SimulatorSessionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SimulatorSessionRepository(db)

    async def list_sessions(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        simulator_vendor_id: Optional[int] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[SimulatorSessionListResponse], int]:
        sessions, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size, search=search,
            status=status, simulator_vendor_id=simulator_vendor_id,
            sort_by=sort_by, sort_order=sort_order,
        )
        return [_to_list_response(s) for s in sessions], total

    async def get_session(self, uuid: str) -> Optional[SimulatorSessionResponse]:
        s = await self.repo.get_by_uuid_with_vendor(uuid)
        return _to_response(s) if s else None
