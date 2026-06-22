"""Candidate service."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.candidate import Candidate
from app.repositories.candidate import CandidateRepository
from app.schemas.candidate import CandidateCreate, CandidateListResponse, CandidateResponse, CandidateUpdate
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _to_response(c: Candidate) -> CandidateResponse:
    return CandidateResponse(
        id=c.id,
        uuid=c.uuid,
        email=c.email,
        full_name=c.full_name,
        username=c.username,
        phone=c.phone,
        organization_id=c.organization_id,
        date_of_birth=c.date_of_birth,
        nationality=c.nationality,
        rank_or_designation=c.rank_or_designation,
        seafarer_id=c.seafarer_id,
        avatar_url=c.avatar_url,
        status=c.status,
        is_active=c.is_active,
        last_login=c.last_login,
        notes=c.notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _to_list_response(c: Candidate) -> CandidateListResponse:
    return CandidateListResponse(
        id=c.id,
        uuid=c.uuid,
        email=c.email,
        full_name=c.full_name,
        phone=c.phone,
        organization_id=c.organization_id,
        rank_or_designation=c.rank_or_designation,
        seafarer_id=c.seafarer_id,
        status=c.status,
        is_active=c.is_active,
        last_login=c.last_login,
        created_at=c.created_at,
    )


class CandidateService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CandidateRepository(db)
        self.audit = AuditService(db)

    async def list_candidates(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        organization_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> tuple[list[CandidateListResponse], int]:
        candidates, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size,
            search=search, organization_id=organization_id, status=status,
        )
        return [_to_list_response(c) for c in candidates], total

    async def get_candidate(self, uuid: str) -> Optional[CandidateResponse]:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        return _to_response(c)

    async def create_candidate(
        self, data: CandidateCreate, created_by_uuid: Optional[str] = None
    ) -> CandidateResponse:
        if await self.repo.email_exists(data.email):
            raise ValueError(f"Email {data.email} is already registered")
        if data.seafarer_id and await self.repo.seafarer_id_exists(data.seafarer_id):
            raise ValueError(f"Seafarer ID {data.seafarer_id} is already in use")

        c = await self.repo.create({
            "email": data.email,
            "full_name": data.full_name,
            "username": data.username,
            "phone": data.phone,
            "hashed_password": hash_password(data.password),
            "organization_id": data.organization_id,
            "date_of_birth": data.date_of_birth,
            "nationality": data.nationality,
            "rank_or_designation": data.rank_or_designation,
            "seafarer_id": data.seafarer_id,
            "notes": data.notes,
            "status": "active",
            "created_by": created_by_uuid,
            "updated_by": created_by_uuid,
        })
        await self.audit.log(
            module="candidates", action="create",
            user_id=created_by_uuid, resource_type="candidate", resource_id=c.uuid,
            new_values={"email": c.email, "full_name": c.full_name},
        )
        return _to_response(c)

    async def update_candidate(
        self, uuid: str, data: CandidateUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[CandidateResponse]:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return None
        if data.seafarer_id and await self.repo.seafarer_id_exists(data.seafarer_id, exclude_id=c.id):
            raise ValueError(f"Seafarer ID {data.seafarer_id} is already in use")
        old = {"full_name": c.full_name, "status": c.status}
        update_dict = data.model_dump(exclude_unset=True)
        update_dict["updated_by"] = updated_by_uuid
        c = await self.repo.update(c, update_dict)
        await self.audit.log(
            module="candidates", action="update",
            user_id=updated_by_uuid, resource_type="candidate", resource_id=uuid,
            old_values=old, new_values=update_dict,
        )
        return _to_response(c)

    async def delete_candidate(self, uuid: str, deleted_by_uuid: str) -> bool:
        c = await self.repo.get_by_uuid(uuid)
        if not c:
            return False
        await self.repo.soft_delete(c, deleted_by_uuid)
        await self.audit.log(
            module="candidates", action="delete",
            user_id=deleted_by_uuid, resource_type="candidate", resource_id=uuid,
        )
        return True
