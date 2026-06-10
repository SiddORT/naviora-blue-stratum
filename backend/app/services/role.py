"""Role service."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.role_permission import RolePermission
from app.repositories.role import PermissionRepository, RoleRepository
from app.schemas.role import PermissionResponse, RoleCreate, RoleListResponse, RoleResponse, RoleUpdate
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _perm_to_response(rp: RolePermission) -> Optional[PermissionResponse]:
    p = rp.permission
    if not p:
        return None
    return PermissionResponse(
        id=p.id, uuid=p.uuid, name=p.name, slug=p.slug,
        module=p.module, action=p.action, description=p.description, is_active=p.is_active,
    )


def _to_response(role: Role) -> RoleResponse:
    perms = [_perm_to_response(rp) for rp in (role.role_permissions or []) if rp.permission]
    return RoleResponse(
        id=role.id, uuid=role.uuid, name=role.name, slug=role.slug,
        description=role.description, is_system=role.is_system,
        is_active=role.is_active, created_at=role.created_at, updated_at=role.updated_at,
        permissions=[p for p in perms if p],
    )


class RoleService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = RoleRepository(db)
        self.perm_repo = PermissionRepository(db)
        self.audit = AuditService(db)

    async def list_roles(
        self, page: int = 1, page_size: int = 20, search: Optional[str] = None
    ) -> tuple[list[RoleListResponse], int]:
        roles, total = await self.repo.get_all_paginated(page=page, page_size=page_size, search=search)
        results = []
        for role in roles:
            full_role = await self.repo.get_with_permissions(role.id)
            perm_count = len(full_role.role_permissions) if full_role else 0
            results.append(RoleListResponse(
                id=role.id, uuid=role.uuid, name=role.name, slug=role.slug,
                description=role.description, is_system=role.is_system,
                is_active=role.is_active, permission_count=perm_count,
            ))
        return results, total

    async def get_role(self, uuid: str) -> Optional[RoleResponse]:
        role = await self.repo.get_by_uuid(uuid)
        if not role:
            return None
        full = await self.repo.get_with_permissions(role.id)
        return _to_response(full)  # type: ignore[arg-type]

    async def get_all_permissions(self) -> list[PermissionResponse]:
        perms = await self.perm_repo.get_all_active()
        return [
            PermissionResponse(
                id=p.id, uuid=p.uuid, name=p.name, slug=p.slug,
                module=p.module, action=p.action, description=p.description, is_active=p.is_active,
            )
            for p in perms
        ]

    async def create_role(self, data: RoleCreate, created_by_uuid: Optional[str] = None) -> RoleResponse:
        existing = await self.repo.get_by_slug(data.slug)
        if existing:
            raise ValueError(f"Role slug '{data.slug}' already exists")
        role = await self.repo.create({
            "name": data.name, "slug": data.slug,
            "description": data.description, "is_system": False,
            "created_by": created_by_uuid, "updated_by": created_by_uuid,
        })
        if data.permission_ids:
            await self.repo.set_permissions(role.id, data.permission_ids)
        await self.audit.log(
            module="roles", action="create", user_id=created_by_uuid,
            resource_type="role", resource_id=role.uuid,
        )
        full = await self.repo.get_with_permissions(role.id)
        return _to_response(full)  # type: ignore[arg-type]

    async def update_role(
        self, uuid: str, data: RoleUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[RoleResponse]:
        role = await self.repo.get_by_uuid(uuid)
        if not role:
            return None
        update_dict = data.model_dump(exclude_unset=True, exclude={"permission_ids"})
        update_dict["updated_by"] = updated_by_uuid
        role = await self.repo.update(role, update_dict)
        if data.permission_ids is not None:
            await self.repo.set_permissions(role.id, data.permission_ids)
        await self.audit.log(
            module="roles", action="update", user_id=updated_by_uuid,
            resource_type="role", resource_id=uuid,
        )
        full = await self.repo.get_with_permissions(role.id)
        return _to_response(full)  # type: ignore[arg-type]

    async def delete_role(self, uuid: str, deleted_by_uuid: str) -> bool:
        role = await self.repo.get_by_uuid(uuid)
        if not role:
            return False
        if role.is_system:
            raise ValueError("System roles cannot be deleted")
        await self.repo.soft_delete(role, deleted_by_uuid)
        await self.audit.log(
            module="roles", action="delete", user_id=deleted_by_uuid,
            resource_type="role", resource_id=uuid,
        )
        return True
