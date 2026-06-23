"""User Invitation service."""
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.invitation import InvitationRepository
from app.schemas.invitation import (
    InvitationCreate, InvitationListResponse, InvitationResponse, InvitationUpdate,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _to_response(inv) -> InvitationResponse:
    return InvitationResponse(
        id=inv.id,
        uuid=inv.uuid,
        email=inv.email,
        full_name=inv.full_name,
        organization_id=inv.organization_id,
        role_id=inv.role_id,
        organization_name=inv.organization.name if inv.organization else None,
        role_name=inv.role.name if inv.role else None,
        status=inv.status,
        message=inv.message,
        expires_at=inv.expires_at,
        accepted_at=inv.accepted_at,
        invited_by_name=inv.invited_by.full_name if inv.invited_by else None,
        is_active=inv.is_active,
        created_at=inv.created_at,
    )


def _to_list_response(inv) -> InvitationListResponse:
    return InvitationListResponse(
        id=inv.id,
        uuid=inv.uuid,
        email=inv.email,
        full_name=inv.full_name,
        organization_name=inv.organization.name if inv.organization else None,
        role_name=inv.role.name if inv.role else None,
        status=inv.status,
        expires_at=inv.expires_at,
        accepted_at=inv.accepted_at,
        invited_by_name=inv.invited_by.full_name if inv.invited_by else None,
        created_at=inv.created_at,
    )


class InvitationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = InvitationRepository(db)
        self.audit = AuditService(db)

    async def list_invitations(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[list[InvitationListResponse], int]:
        items, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size, search=search, status=status
        )
        return [_to_list_response(i) for i in items], total

    async def get_invitation(self, uuid: str) -> Optional[InvitationResponse]:
        inv = await self.repo.get_by_uuid(uuid)
        if not inv:
            return None
        return _to_response(inv)

    async def create_invitation(
        self, data: InvitationCreate, created_by_user_id: int, created_by_uuid: Optional[str] = None
    ) -> InvitationResponse:
        token = InvitationRepository.generate_token()
        expires_at = InvitationRepository.default_expires_at()

        inv = await self.repo.create({
            "email": data.email,
            "full_name": data.full_name,
            "organization_id": data.organization_id,
            "role_id": data.role_id,
            "token": token,
            "status": "pending",
            "message": data.message,
            "expires_at": expires_at,
            "invited_by_id": created_by_user_id,
            "created_by": created_by_uuid,
            "updated_by": created_by_uuid,
        })

        await self.audit.log(
            module="invitations", action="create",
            user_id=created_by_uuid, resource_type="invitation", resource_id=inv.uuid,
            new_values={"email": inv.email},
        )

        full = await self.repo.get_by_uuid(inv.uuid)
        return _to_response(full)  # type: ignore[arg-type]

    async def revoke_invitation(self, uuid: str, revoked_by_uuid: Optional[str] = None) -> bool:
        inv = await self.repo.get_by_uuid(uuid)
        if not inv:
            return False
        if inv.status not in ("pending",):
            raise ValueError("Only pending invitations can be revoked")
        inv.status = "revoked"
        inv.is_active = False
        self.db.add(inv)
        await self.db.flush()
        await self.audit.log(
            module="invitations", action="revoke",
            user_id=revoked_by_uuid, resource_type="invitation", resource_id=uuid,
        )
        return True

    async def resend_invitation(self, uuid: str, resent_by_uuid: Optional[str] = None) -> Optional[InvitationResponse]:
        inv = await self.repo.get_by_uuid(uuid)
        if not inv:
            return None
        if inv.status not in ("pending", "expired"):
            raise ValueError("Only pending or expired invitations can be resent")
        inv.status = "pending"
        inv.token = InvitationRepository.generate_token()
        inv.expires_at = InvitationRepository.default_expires_at()
        inv.is_active = True
        self.db.add(inv)
        await self.db.flush()
        await self.audit.log(
            module="invitations", action="resend",
            user_id=resent_by_uuid, resource_type="invitation", resource_id=uuid,
        )
        full = await self.repo.get_by_uuid(uuid)
        return _to_response(full)  # type: ignore[arg-type]

    async def delete_invitation(self, uuid: str, deleted_by_uuid: str) -> bool:
        inv = await self.repo.get_by_uuid(uuid)
        if not inv:
            return False
        inv.soft_delete(deleted_by_uuid)
        self.db.add(inv)
        await self.db.flush()
        return True
