"""Organization portal authentication dependency.

Validates JWT and enforces:
- user_type is one of ORG_ADMIN, INSTRUCTOR, ASSESSOR
- organization_id is set and org is active
"""
import logging
from typing import Annotated, NamedTuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import UserRepository

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)

ORG_USER_TYPES = {"ORG_ADMIN", "INSTRUCTOR", "ASSESSOR"}


class OrgContext(NamedTuple):
    user: User
    organization_id: int


async def get_current_org_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> OrgContext:
    """Return (user, organization_id) for authenticated org portal users."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(credentials.credentials, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_uuid: str = payload.get("sub", "")
    if not user_uuid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_uuid(user_uuid)

    if not user or not user.is_active or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is not active")

    if user.user_type not in ORG_USER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to organization portal users",
        )

    if not user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not assigned to any organization",
        )

    return OrgContext(user=user, organization_id=user.organization_id)


CurrentOrgUser = Annotated[OrgContext, Depends(get_current_org_user)]


def require_org_admin(ctx: CurrentOrgUser) -> None:
    """Raise 403 if the org user is not an ORG_ADMIN."""
    if ctx.user.user_type != "ORG_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin access required",
        )
