"""Organization service."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.repositories.organization import OrganizationRepository
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationListResponse,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _to_response(org: Organization, user_count: int = 0) -> OrganizationResponse:
    return OrganizationResponse(
        id=org.id, uuid=org.uuid, name=org.name, code=org.code,
        email=org.email, phone=org.phone, address=org.address, website=org.website,
        logo_url=org.logo_url, plan_id=org.plan_id,
        subscription_status=org.subscription_status, max_users=org.max_users,
        is_active=org.is_active, created_at=org.created_at, updated_at=org.updated_at,
        user_count=user_count,
    )


def _to_list_response(org: Organization, user_count: int = 0) -> OrganizationListResponse:
    return OrganizationListResponse(
        id=org.id, uuid=org.uuid, name=org.name, code=org.code,
        email=org.email, subscription_status=org.subscription_status,
        max_users=org.max_users, is_active=org.is_active,
        created_at=org.created_at, user_count=user_count,
    )


class OrganizationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = OrganizationRepository(db)
        self.audit = AuditService(db)

    async def list_organizations(
        self, page: int = 1, page_size: int = 20,
        search: Optional[str] = None, status: Optional[str] = None,
    ) -> tuple[list[OrganizationListResponse], int]:
        orgs, total = await self.repo.get_all_paginated(page=page, page_size=page_size, search=search, status=status)
        results = []
        for org in orgs:
            cnt = await self.repo.get_user_count(org.id)
            results.append(_to_list_response(org, cnt))
        return results, total

    async def get_organization(self, uuid: str) -> Optional[OrganizationResponse]:
        org = await self.repo.get_by_uuid(uuid)
        if not org:
            return None
        cnt = await self.repo.get_user_count(org.id)
        return _to_response(org, cnt)

    async def create_organization(
        self, data: OrganizationCreate, created_by_uuid: Optional[str] = None
    ) -> OrganizationResponse:
        if await self.repo.code_exists(data.code):
            raise ValueError(f"Organization code '{data.code}' already exists")
        org = await self.repo.create({
            **data.model_dump(),
            "created_by": created_by_uuid,
            "updated_by": created_by_uuid,
        })
        await self.audit.log(
            module="organizations", action="create",
            user_id=created_by_uuid, resource_type="organization", resource_id=org.uuid,
            new_values={"name": org.name, "code": org.code},
        )
        return _to_response(org)

    async def update_organization(
        self, uuid: str, data: OrganizationUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[OrganizationResponse]:
        org = await self.repo.get_by_uuid(uuid)
        if not org:
            return None
        old = {"name": org.name, "subscription_status": org.subscription_status}
        update_dict = data.model_dump(exclude_unset=True)
        update_dict["updated_by"] = updated_by_uuid
        org = await self.repo.update(org, update_dict)
        await self.audit.log(
            module="organizations", action="update",
            user_id=updated_by_uuid, resource_type="organization", resource_id=uuid,
            old_values=old, new_values=update_dict,
        )
        cnt = await self.repo.get_user_count(org.id)
        return _to_response(org, cnt)

    async def delete_organization(self, uuid: str, deleted_by_uuid: str) -> bool:
        org = await self.repo.get_by_uuid(uuid)
        if not org:
            return False
        await self.repo.soft_delete(org, deleted_by_uuid)
        await self.audit.log(
            module="organizations", action="delete",
            user_id=deleted_by_uuid, resource_type="organization", resource_id=uuid,
        )
        return True
