"""Candidate portal authentication dependency."""
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.db.session import get_db
from app.models.candidate import Candidate

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_candidate(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> Candidate:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = verify_token(credentials.credentials, token_type="access")
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    # Candidates have user_type="candidate" in their token payload
    if payload.get("user_type") != "candidate":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate access only")

    sub: str = payload.get("sub", "")
    result = await db.execute(select(Candidate).where(Candidate.uuid == sub))
    candidate = result.scalar_one_or_none()

    if not candidate or candidate.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Candidate account not active")

    return candidate


CurrentCandidate = Annotated[Candidate, Depends(get_current_candidate)]
