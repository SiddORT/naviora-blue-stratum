"""Organization Assignment service."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.org_assignment import OrgAssignmentRepository
from app.schemas.org_assignment import OrgAssignmentCreate, OrgAssignmentResponse, OrgAssignmentUpdate
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _to_response(a) -> OrgAssignmentResponse:
    return OrgAssignmentResponse(
        id=a.id,
        user_id=a.user_id,
        organization_id=a.organization_id,
        user_name=a.user.full_name if a.user else None,
        user_email=a.user.email if a.user else None,
        organization_name=a.organization.name if a.organization else None,
        assignment_type=a.assignment_type,
        assigned_by=a.assigned_by,
        notes=a.notes,
        is_active=a.is_active,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


class OrgAssignmentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = OrgAssignmentRepository(db)
        self.audit = AuditService(db)

    async def list_assignments(
        self,
        page: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> tuple[list[OrgAssignmentResponse], int]:
        items, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size,
            user_id=user_id, organization_id=organization_id, search=search,
        )
        return [_to_response(a) for a in items], total

    async def create_assignment(
        self, data: OrgAssignmentCreate, assigned_by_uuid: Optional[str] = None
    ) -> OrgAssignmentResponse:
        existing = await self.repo.get_by_user_org(data.user_id, data.organization_id)
        if existing:
            raise ValueError("User is already assigned to this organization")
        a = await self.repo.create({
            "user_id": data.user_id,
            "organization_id": data.organization_id,
            "assignment_type": data.assignment_type,
            "assigned_by": assigned_by_uuid,
            "notes": data.notes,
            "is_active": True,
        })
        await self.audit.log(
            module="org_assignments", action="create",
            user_id=assigned_by_uuid, resource_type="org_assignment",
            resource_id=str(a.id),
        )
        full = await self.repo.get_by_id(a.id)
        return _to_response(full)  # type: ignore[arg-type]

    async def update_assignment(
        self, record_id: int, data: OrgAssignmentUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[OrgAssignmentResponse]:
        a = await self.repo.get_by_id(record_id)
        if not a:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        a = await self.repo.update(a, update_dict)
        full = await self.repo.get_by_id(a.id)
        return _to_response(full)  # type: ignore[arg-type]

    async def delete_assignment(self, record_id: int, deleted_by_uuid: Optional[str] = None) -> bool:
        a = await self.repo.get_by_id(record_id)
        if not a:
            return False
        await self.repo.delete(a)
        await self.audit.log(
            module="org_assignments", action="delete",
            user_id=deleted_by_uuid, resource_type="org_assignment",
            resource_id=str(record_id),
        )
        return True
