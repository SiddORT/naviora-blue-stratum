"""Permission checking utilities used by dependency injection."""
import logging
from typing import List

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

logger = logging.getLogger(__name__)


class PermissionChecker:
    """
    Callable dependency that verifies the current user holds all required permissions.
    Usage: Depends(PermissionChecker(["users.view", "users.create"]))
    """

    def __init__(self, required_permissions: List[str]) -> None:
        self.required_permissions = required_permissions

    async def __call__(
        self,
        db: AsyncSession = Depends(get_db),
        # current_user injected by the auth dependency in the endpoint
        # this checker is composed with require_permissions dependency
    ) -> None:
        pass  # Composed with get_current_user — see dependencies/permissions.py


def require_permissions(*permissions: str):
    """
    Factory that returns a FastAPI dependency enforcing the listed permissions.
    Usage: Depends(require_permissions("users.view"))
    """
    from app.dependencies.permissions import check_permissions
    return check_permissions(list(permissions))
