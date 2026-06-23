"""Candidate Portal — Authentication endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password, verify_token
from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.helpers.rate_limit import auth_limiter
from app.models.candidate import Candidate
from app.schemas.sessions import CandidateLoginRequest
from app.utils.responses import error_response, success_response

router = APIRouter()


@router.post("/login", summary="Candidate portal login")
async def candidate_login(
    body: CandidateLoginRequest,
    request: Request,
    _rl: None = Depends(auth_limiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Candidate).where(Candidate.email == body.email))
    candidate = result.scalar_one_or_none()

    if not candidate or not verify_password(body.password, candidate.hashed_password):
        return error_response(message="Invalid email or password", status_code=status.HTTP_401_UNAUTHORIZED)

    if candidate.status != "active":
        return error_response(message="Account is inactive or suspended", status_code=status.HTTP_403_FORBIDDEN)

    token_data = {
        "sub": candidate.uuid,
        "email": candidate.email,
        "user_type": "candidate",
        "candidate_id": candidate.id,
        "org_id": candidate.organization_id,
    }
    access_token = create_access_token(token_data)

    candidate.last_login = datetime.now(timezone.utc)
    await db.commit()

    return success_response(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "candidate": {
                "uuid": candidate.uuid,
                "full_name": candidate.full_name,
                "email": candidate.email,
                "rank_or_designation": candidate.rank_or_designation,
                "seafarer_id": candidate.seafarer_id,
                "avatar_url": candidate.avatar_url,
                "organization_id": candidate.organization_id,
            },
        },
        message="Login successful",
    )


@router.get("/me", summary="Get current candidate profile")
async def get_me(candidate: CurrentCandidate):
    return success_response(
        data={
            "uuid": candidate.uuid,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "rank_or_designation": candidate.rank_or_designation,
            "seafarer_id": candidate.seafarer_id,
            "nationality": candidate.nationality,
            "date_of_birth": candidate.date_of_birth.isoformat() if candidate.date_of_birth else None,
            "avatar_url": candidate.avatar_url,
            "status": candidate.status,
            "last_login": candidate.last_login.isoformat() if candidate.last_login else None,
            "organization_id": candidate.organization_id,
        }
    )
