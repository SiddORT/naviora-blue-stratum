"""SimulatorVendor service."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulator_vendor import SimulatorVendor
from app.repositories.simulator_vendor import SimulatorVendorRepository
from app.schemas.simulator import (
    SimulatorVendorCreate,
    SimulatorVendorListResponse,
    SimulatorVendorResponse,
    SimulatorVendorUpdate,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _to_response(v: SimulatorVendor) -> SimulatorVendorResponse:
    return SimulatorVendorResponse(
        id=v.id, uuid=v.uuid, name=v.name, code=v.code,
        vendor_name=v.vendor_name, version=v.version, description=v.description,
        base_url=v.base_url,
        integration_type=v.integration_type, status=v.status, is_active=v.is_active,
        created_at=v.created_at, updated_at=v.updated_at,
    )


def _to_list_response(v: SimulatorVendor) -> SimulatorVendorListResponse:
    return SimulatorVendorListResponse(
        id=v.id, uuid=v.uuid, name=v.name, code=v.code,
        vendor_name=v.vendor_name, version=v.version,
        base_url=v.base_url,
        integration_type=v.integration_type, status=v.status,
        is_active=v.is_active, created_at=v.created_at,
    )


class SimulatorVendorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SimulatorVendorRepository(db)
        self.audit = AuditService(db)

    async def list_vendors(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        integration_type: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[SimulatorVendorListResponse], int]:
        vendors, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size, search=search,
            status=status, integration_type=integration_type,
            sort_by=sort_by, sort_order=sort_order,
        )
        return [_to_list_response(v) for v in vendors], total

    async def get_vendor(self, uuid: str) -> Optional[SimulatorVendorResponse]:
        v = await self.repo.get_by_uuid(uuid)
        return _to_response(v) if v else None

    async def create_vendor(
        self, data: SimulatorVendorCreate, created_by_uuid: Optional[str] = None
    ) -> SimulatorVendorResponse:
        if await self.repo.code_exists(data.code):
            raise ValueError(f"Simulator vendor code '{data.code}' already exists")
        if await self.repo.name_exists(data.name):
            raise ValueError(f"Simulator vendor name '{data.name}' already exists")

        v = await self.repo.create({
            **data.model_dump(),
            "created_by": created_by_uuid,
            "updated_by": created_by_uuid,
        })
        await self.audit.log(
            module="simulators", action="create",
            user_id=created_by_uuid, resource_type="simulator_vendor", resource_id=v.uuid,
            new_values={"name": v.name, "code": v.code, "integration_type": v.integration_type},
        )
        return _to_response(v)

    async def update_vendor(
        self, uuid: str, data: SimulatorVendorUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[SimulatorVendorResponse]:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        if "name" in update_dict and update_dict["name"] != v.name:
            if await self.repo.name_exists(update_dict["name"], exclude_id=v.id):
                raise ValueError(f"Simulator vendor name '{update_dict['name']}' already exists")

        old = {"name": v.name, "status": v.status, "integration_type": v.integration_type}
        update_dict["updated_by"] = updated_by_uuid
        v = await self.repo.update(v, update_dict)
        await self.audit.log(
            module="simulators", action="update",
            user_id=updated_by_uuid, resource_type="simulator_vendor", resource_id=uuid,
            old_values=old, new_values=update_dict,
        )
        return _to_response(v)

    async def delete_vendor(self, uuid: str, deleted_by_uuid: str) -> bool:
        v = await self.repo.get_by_uuid(uuid)
        if not v:
            return False
        await self.repo.soft_delete(v, deleted_by_uuid)
        await self.audit.log(
            module="simulators", action="delete",
            user_id=deleted_by_uuid, resource_type="simulator_vendor", resource_id=uuid,
        )
        return True
