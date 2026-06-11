"""Authentication endpoints — login, logout, refresh, password management."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    TokenResponse,
    UserMeResponse,
)
from app.helpers.rate_limit import auth_limiter
from app.services.auth import AuthService
from app.utils.responses import error_response, success_response, unauthorized_response

router = APIRouter()


def _get_client_ip(request: Request) -> Optional[str]:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("/login", response_model=None, summary="Login with email and password")
async def login(
    body: LoginRequest,
    request: Request,
    _rl: None = Depends(auth_limiter),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    result = await service.login(
        email=body.email,
        password=body.password,
        ip_address=_get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    if not result:
        return error_response(
            message="Invalid email or password",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    return success_response(data=result.model_dump(), message="Login successful")


@router.post("/refresh", summary="Rotate refresh token and get new access token")
async def refresh(
    body: RefreshRequest,
    request: Request,
    _rl: None = Depends(auth_limiter),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    result = await service.refresh(body.refresh_token)
    if not result:
        return error_response(message="Invalid or expired refresh token", status_code=401)
    return success_response(data=result.model_dump(), message="Token refreshed")


@router.post("/logout", summary="Revoke refresh token")
async def logout(
    body: LogoutRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.logout(body.refresh_token, user_uuid=current_user.uuid)
    return success_response(message="Logged out successfully")


@router.get("/me", summary="Get current authenticated user profile")
async def get_me(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    me = await service.get_me(current_user.uuid)
    if not me:
        return unauthorized_response()
    return success_response(data=me.model_dump())


@router.post("/change-password", summary="Change password (authenticated)")
async def change_password(
    body: PasswordChangeRequest,
    current_user: CurrentUser,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    ok = await service.change_password(
        user_uuid=current_user.uuid,
        current_password=body.current_password,
        new_password=body.new_password,
        ip_address=_get_client_ip(request),
    )
    if not ok:
        return error_response(message="Current password is incorrect", status_code=400)
    return success_response(message="Password changed successfully")


@router.post("/forgot-password", summary="Request a password reset token")
async def forgot_password(
    body: PasswordResetRequest,
    request: Request,
    _rl: None = Depends(auth_limiter),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.request_password_reset(body.email)
    # Always return success to prevent email enumeration
    return success_response(
        message="If an account with that email exists, a reset link has been sent"
    )


@router.post("/reset-password", summary="Reset password using token")
async def reset_password(body: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    ok = await service.reset_password(body.token, body.new_password)
    if not ok:
        return error_response(message="Invalid or expired reset token", status_code=400)
    return success_response(message="Password reset successfully")
