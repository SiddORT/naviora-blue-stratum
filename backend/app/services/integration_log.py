"""IntegrationLog service — read-only for UI; logs are written by adapters."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration_log import IntegrationLog
from app.repositories.integration_log import IntegrationLogRepository
from app.schemas.simulator import (
    IntegrationLogListResponse,
    IntegrationLogResponse,
)

logger = logging.getLogger(__name__)


def _to_response(log: IntegrationLog) -> IntegrationLogResponse:
    vendor_name = log.vendor.name if log.vendor else None
    vendor_code = log.vendor.code if log.vendor else None
    return IntegrationLogResponse(
        id=log.id, uuid=log.uuid,
        simulator_vendor_id=log.simulator_vendor_id,
        vendor_name=vendor_name, vendor_code=vendor_code,
        request_type=log.request_type, request_url=log.request_url,
        request_payload=log.request_payload, response_payload=log.response_payload,
        status=log.status, error_message=log.error_message,
        created_at=log.created_at,
    )


def _to_list_response(log: IntegrationLog) -> IntegrationLogListResponse:
    vendor_name = log.vendor.name if log.vendor else None
    vendor_code = log.vendor.code if log.vendor else None
    return IntegrationLogListResponse(
        id=log.id, uuid=log.uuid,
        vendor_name=vendor_name, vendor_code=vendor_code,
        request_type=log.request_type, request_url=log.request_url,
        status=log.status, error_message=log.error_message,
        created_at=log.created_at,
    )


class IntegrationLogService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = IntegrationLogRepository(db)

    async def list_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        simulator_vendor_id: Optional[int] = None,
    ) -> tuple[list[IntegrationLogListResponse], int]:
        logs, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size, search=search,
            status=status, simulator_vendor_id=simulator_vendor_id,
        )
        return [_to_list_response(log) for log in logs], total

    async def get_log(self, uuid: str) -> Optional[IntegrationLogResponse]:
        log = await self.repo.get_by_uuid_with_vendor(uuid)
        return _to_response(log) if log else None
