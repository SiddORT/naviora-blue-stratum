"""API v1 router — aggregates all endpoint modules."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, organizations, roles, dashboard, files, audit_logs

api_router = APIRouter()

api_router.include_router(auth.router,          prefix="/auth",          tags=["Authentication"])
api_router.include_router(users.router,         prefix="/users",         tags=["Users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(roles.router,         prefix="/roles",         tags=["Roles & Permissions"])
api_router.include_router(dashboard.router,     prefix="/dashboard",     tags=["Dashboard"])
api_router.include_router(files.router,         prefix="/files",         tags=["Files"])
api_router.include_router(audit_logs.router,    prefix="/audit-logs",    tags=["Audit Logs"])
