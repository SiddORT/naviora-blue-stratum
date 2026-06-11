"""SimulatorConfiguration service — with field-level encryption for api_key / client_secret."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulator_configuration import SimulatorConfiguration
from app.repositories.simulator_configuration import SimulatorConfigurationRepository
from app.schemas.simulator import (
    SimulatorConfigurationCreate,
    SimulatorConfigurationListResponse,
    SimulatorConfigurationResponse,
    SimulatorConfigurationUpdate,
)
from app.services.audit import AuditService
from app.services.encryption import encryption_service

logger = logging.getLogger(__name__)

# Fields that are encrypted at rest and must never be returned in listings
_ENCRYPTED_FIELDS = ("api_key", "client_secret")


def _encrypt_sensitive(data: dict) -> dict:
    """Encrypt api_key and client_secret before writing to the database."""
    out = dict(data)
    for field in _ENCRYPTED_FIELDS:
        if out.get(field):
            out[field] = encryption_service.encrypt(out[field])
    return out


def _decrypt_config(c: SimulatorConfiguration) -> tuple[Optional[str], Optional[str]]:
    """Return decrypted (api_key, client_secret) for a single record."""
    api_key = encryption_service.decrypt_if_present(c.api_key)
    client_secret = encryption_service.decrypt_if_present(c.client_secret)
    return api_key, client_secret


def _to_response(c: SimulatorConfiguration) -> SimulatorConfigurationResponse:
    vendor_name = c.vendor.name if c.vendor else None
    vendor_code = c.vendor.code if c.vendor else None
    api_key, client_secret = _decrypt_config(c)
    return SimulatorConfigurationResponse(
        id=c.id, uuid=c.uuid,
        simulator_vendor_id=c.simulator_vendor_id,
        vendor_name=vendor_name, vendor_code=vendor_code,
        configuration_name=c.configuration_name,
        base_url=c.base_url, authentication_type=c.authentication_type,
        api_key=api_key, client_id=c.client_id, client_secret=client_secret,
        webhook_url=c.webhook_url, connection_timeout=c.connection_timeout,
        status=c.status, is_active=c.is_active,
        created_at=c.created_at, updated_at=c.updated_at,
    )


def _to_list_response(c: SimulatorConfiguration) -> SimulatorConfigurationListResponse:
    vendor_name = c.vendor.name if c.vendor else None
    vendor_code = c.vendor.code if c.vendor else None
    return SimulatorConfigurationListResponse(
        id=c.id, uuid=c.uuid,
        simulator_vendor_id=c.simulator_vendor_id,
        vendor_name=vendor_name, vendor_code=vendor_code,
        configuration_name=c.configuration_name,
        base_url=c.base_url, authentication_type=c.authentication_type,
        status=c.status, is_active=c.is_active, updated_at=c.updated_at,
    )


class SimulatorConfigurationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SimulatorConfigurationRepository(db)
        self.audit = AuditService(db)

    async def list_configurations(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        authentication_type: Optional[str] = None,
        status: Optional[str] = None,
        simulator_vendor_id: Optional[int] = None,
    ) -> tuple[list[SimulatorConfigurationListResponse], int]:
        configs, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size, search=search,
            authentication_type=authentication_type, status=status,
            simulator_vendor_id=simulator_vendor_id,
        )
        return [_to_list_response(c) for c in configs], total

    async def get_configuration(self, uuid: str) -> Optional[SimulatorConfigurationResponse]:
        c = await self.repo.get_by_uuid_with_vendor(uuid)
        return _to_response(c) if c else None

    async def create_configuration(
        self, data: SimulatorConfigurationCreate, created_by_uuid: Optional[str] = None
    ) -> SimulatorConfigurationResponse:
        raw = data.model_dump()
        encrypted = _encrypt_sensitive(raw)
        c = await self.repo.create({
            **encrypted,
            "created_by": created_by_uuid,
            "updated_by": created_by_uuid,
        })
        c = await self.repo.get_by_uuid_with_vendor(c.uuid)
        await self.audit.log(
            module="simulators", action="create",
            user_id=created_by_uuid, resource_type="simulator_configuration", resource_id=c.uuid,
            new_values={
                "configuration_name": c.configuration_name,
                "base_url": c.base_url,
                "authentication_type": c.authentication_type,
            },
        )
        return _to_response(c)

    async def update_configuration(
        self, uuid: str, data: SimulatorConfigurationUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[SimulatorConfigurationResponse]:
        c = await self.repo.get_by_uuid_with_vendor(uuid)
        if not c:
            return None
        old = {"configuration_name": c.configuration_name, "status": c.status}
        update_dict = data.model_dump(exclude_unset=True)
        update_dict = _encrypt_sensitive(update_dict)
        update_dict["updated_by"] = updated_by_uuid
        c = await self.repo.update(c, update_dict)
        c = await self.repo.get_by_uuid_with_vendor(uuid)
        await self.audit.log(
            module="simulators", action="update",
            user_id=updated_by_uuid, resource_type="simulator_configuration", resource_id=uuid,
            old_values=old,
            new_values={k: v for k, v in update_dict.items() if k not in _ENCRYPTED_FIELDS},
        )
        return _to_response(c)

    async def delete_configuration(self, uuid: str, deleted_by_uuid: str) -> bool:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return False
        await self.repo.soft_delete(c, deleted_by_uuid)
        await self.audit.log(
            module="simulators", action="delete",
            user_id=deleted_by_uuid, resource_type="simulator_configuration", resource_id=uuid,
        )
        return True
