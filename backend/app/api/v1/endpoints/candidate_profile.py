"""Candidate Portal — Profile view and update endpoints."""
import os
import shutil
import uuid as _uuid
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.models.candidate import Candidate
from app.utils.responses import error_response, success_response

router = APIRouter()

UPLOAD_DIR = "uploads/candidate_avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _candidate_dict(c: Candidate) -> dict:
    return {
        "uuid": c.uuid,
        "full_name": c.full_name,
        "email": c.email,
        "phone": c.phone,
        "phone_country_code": c.phone_country_code,
        "rank_or_designation": c.rank_or_designation,
        "seafarer_id": c.seafarer_id,
        "nationality": c.nationality,
        "date_of_birth": c.date_of_birth.isoformat() if c.date_of_birth else None,
        "avatar_url": c.avatar_url,
        "status": c.status,
        "last_login": c.last_login.isoformat() if c.last_login else None,
        "organization_id": c.organization_id,
        "notes": c.notes,
    }


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    phone_country_code: str | None = None
    nationality: str | None = None
    rank_or_designation: str | None = None
    date_of_birth: date | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("", summary="Get my profile")
async def get_profile(candidate: CurrentCandidate, db: AsyncSession = Depends(get_db)):
    c = await db.get(Candidate, candidate.id)
    return success_response(_candidate_dict(c))


@router.put("", summary="Update my profile")
async def update_profile(
    body: ProfileUpdateRequest,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    c = await db.get(Candidate, candidate.id)
    if body.full_name is not None:
        c.full_name = body.full_name
    if body.phone is not None:
        c.phone = body.phone
    if body.phone_country_code is not None:
        c.phone_country_code = body.phone_country_code
    if body.nationality is not None:
        c.nationality = body.nationality
    if body.rank_or_designation is not None:
        c.rank_or_designation = body.rank_or_designation
    if body.date_of_birth is not None:
        c.date_of_birth = body.date_of_birth
    await db.commit()
    await db.refresh(c)
    return success_response(_candidate_dict(c))


@router.post("/photo", summary="Upload profile photo")
async def upload_photo(
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        return error_response("Only JPEG, PNG and WebP images are allowed", 400)
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{candidate.uuid}_{_uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    c = await db.get(Candidate, candidate.id)
    c.avatar_url = f"/uploads/candidate_avatars/{filename}"
    await db.commit()
    return success_response({"avatar_url": c.avatar_url})


@router.post("/change-password", summary="Change my password")
async def change_password(
    body: PasswordChangeRequest,
    candidate: CurrentCandidate,
    db: AsyncSession = Depends(get_db),
):
    from app.core.security import get_password_hash, verify_password
    c = await db.get(Candidate, candidate.id)
    if not verify_password(body.current_password, c.hashed_password):
        return error_response("Current password is incorrect", 400)
    if len(body.new_password) < 8:
        return error_response("New password must be at least 8 characters", 400)
    c.hashed_password = get_password_hash(body.new_password)
    await db.commit()
    return success_response({"message": "Password changed successfully"})
