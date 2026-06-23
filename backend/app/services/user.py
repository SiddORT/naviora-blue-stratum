"""User service."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User
from app.models.user_role import UserRole
from app.repositories.role import RoleRepository
from app.repositories.user import UserRepository
from app.schemas.user import (
    UserCreate, UserListResponse, UserResponse, UserUpdate,
    UserRoleAssign, UserStatusUpdate, UserAdminResetPassword,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


def _to_response(user: User) -> UserResponse:
    roles = [ur.role.slug for ur in (user.user_roles or []) if ur.role]
    return UserResponse(
        id=user.id,
        uuid=user.uuid,
        email=user.email,
        full_name=user.full_name,
        username=user.username,
        phone=user.phone,
        avatar_url=user.avatar_url,
        status=user.status,
        user_type=getattr(user, "user_type", "ADMIN"),
        organization_id=user.organization_id,
        is_active=user.is_active,
        last_login=user.last_login,
        notes=user.notes,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=roles,
    )


def _to_list_response(user: User) -> UserListResponse:
    roles = [ur.role.slug for ur in (user.user_roles or []) if ur.role]
    return UserListResponse(
        id=user.id,
        uuid=user.uuid,
        email=user.email,
        full_name=user.full_name,
        status=user.status,
        user_type=getattr(user, "user_type", "ADMIN"),
        organization_id=user.organization_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        roles=roles,
    )


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)
        self.role_repo = RoleRepository(db)
        self.audit = AuditService(db)

    async def list_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        organization_id: Optional[int] = None,
        status: Optional[str] = None,
        user_type: Optional[str] = None,
    ) -> tuple[list[UserListResponse], int]:
        users, total = await self.repo.get_all_paginated(
            page=page, page_size=page_size,
            search=search, organization_id=organization_id,
            status=status, user_type=user_type,
        )
        return [_to_list_response(u) for u in users], total

    async def get_user(self, uuid: str) -> Optional[UserResponse]:
        user = await self.repo.get_by_uuid_with_roles(uuid)
        if not user:
            return None
        return _to_response(user)

    async def create_user(self, data: UserCreate, created_by_uuid: Optional[str] = None) -> UserResponse:
        if await self.repo.email_exists(data.email):
            raise ValueError(f"Email {data.email} is already registered")

        user = await self.repo.create({
            "email": data.email,
            "full_name": data.full_name,
            "username": data.username,
            "phone": data.phone,
            "hashed_password": hash_password(data.password),
            "organization_id": data.organization_id,
            "status": "active",
            "user_type": data.user_type or "ADMIN",
            "notes": data.notes,
            "created_by": created_by_uuid,
            "updated_by": created_by_uuid,
        })

        for slug in data.role_slugs:
            role = await self.role_repo.get_by_slug(slug)
            if role:
                self.db.add(UserRole(
                    user_id=user.id, role_id=role.id,
                    organization_id=data.organization_id,
                    created_by=created_by_uuid,
                ))
        await self.db.flush()
        full_user = await self.repo.get_by_uuid_with_roles(user.uuid)
        await self.audit.log(
            module="users", action="create",
            user_id=created_by_uuid, resource_type="user", resource_id=user.uuid,
            new_values={"email": user.email, "full_name": user.full_name},
        )
        return _to_response(full_user)  # type: ignore[arg-type]

    async def update_user(
        self, uuid: str, data: UserUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[UserResponse]:
        user = await self.repo.get_by_uuid(uuid)
        if not user:
            return None
        old = {"full_name": user.full_name, "status": user.status}
        update_dict = data.model_dump(exclude_unset=True)
        update_dict["updated_by"] = updated_by_uuid
        user = await self.repo.update(user, update_dict)
        await self.audit.log(
            module="users", action="update",
            user_id=updated_by_uuid, resource_type="user", resource_id=uuid,
            old_values=old, new_values=update_dict,
        )
        full_user = await self.repo.get_by_uuid_with_roles(uuid)
        return _to_response(full_user)  # type: ignore[arg-type]

    async def assign_roles(
        self, uuid: str, data: UserRoleAssign, updated_by_uuid: Optional[str] = None
    ) -> Optional[UserResponse]:
        from sqlalchemy import delete
        from app.models.user_role import UserRole as UR

        user = await self.repo.get_by_uuid(uuid)
        if not user:
            return None

        await self.db.execute(delete(UR).where(UR.user_id == user.id))

        for slug in data.role_slugs:
            role = await self.role_repo.get_by_slug(slug)
            if role:
                self.db.add(UR(
                    user_id=user.id,
                    role_id=role.id,
                    organization_id=data.organization_id,
                    created_by=updated_by_uuid,
                ))
        await self.db.flush()

        await self.audit.log(
            module="users", action="assign_roles",
            user_id=updated_by_uuid, resource_type="user", resource_id=uuid,
            new_values={"role_slugs": data.role_slugs},
        )
        full = await self.repo.get_by_uuid_with_roles(uuid)
        return _to_response(full)  # type: ignore[arg-type]

    async def set_status(
        self, uuid: str, data: UserStatusUpdate, updated_by_uuid: Optional[str] = None
    ) -> Optional[UserResponse]:
        user = await self.repo.get_by_uuid(uuid)
        if not user:
            return None
        old_status = user.status
        user.status = data.status
        user.is_active = data.status == "active"
        self.db.add(user)
        await self.db.flush()
        await self.audit.log(
            module="users", action="status_change",
            user_id=updated_by_uuid, resource_type="user", resource_id=uuid,
            old_values={"status": old_status}, new_values={"status": data.status},
        )
        full = await self.repo.get_by_uuid_with_roles(uuid)
        return _to_response(full)  # type: ignore[arg-type]

    async def admin_reset_password(
        self, uuid: str, data: UserAdminResetPassword, updated_by_uuid: Optional[str] = None
    ) -> bool:
        user = await self.repo.get_by_uuid(uuid)
        if not user:
            return False
        user.hashed_password = hash_password(data.new_password)
        self.db.add(user)
        await self.db.flush()
        await self.audit.log(
            module="users", action="admin_password_reset",
            user_id=updated_by_uuid, resource_type="user", resource_id=uuid,
        )
        return True

    async def delete_user(self, uuid: str, deleted_by_uuid: str) -> bool:
        user = await self.repo.get_by_uuid(uuid)
        if not user:
            return False
        await self.repo.soft_delete(user, deleted_by_uuid)
        await self.audit.log(
            module="users", action="delete",
            user_id=deleted_by_uuid, resource_type="user", resource_id=uuid,
        )
        return True
