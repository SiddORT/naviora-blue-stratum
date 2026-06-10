"""Permission checking dependency factory."""
import logging
from typing import Callable

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.user import UserRepository

logger = logging.getLogger(__name__)


def check_permissions(required_permissions: list[str]) -> Callable:
    """
    Returns a FastAPI dependency that raises 403 if the current user
    lacks any of the required permissions.
    """
    async def _dependency(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if not required_permissions:
            return current_user

        user_repo = UserRepository(db)
        user_permissions = await user_repo.get_permissions(current_user.id)
        user_perm_set = set(user_permissions)

        missing = [p for p in required_permissions if p not in user_perm_set]
        if missing:
            logger.warning(
                "Permission denied for user %s — missing: %s",
                current_user.uuid, missing,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permissions: {', '.join(missing)}",
            )

        return current_user

    return _dependency
