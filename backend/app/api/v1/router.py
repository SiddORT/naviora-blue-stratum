"""API v1 router — aggregates all endpoint modules."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, users, organizations, roles, dashboard, files,
    audit_logs, simulators, master_data, exercises, assessments, plans, contact,
    enquiries, candidates, invitations, org_assignments, permissions,
)

api_router = APIRouter()

api_router.include_router(auth.router,              prefix="/auth",                   tags=["Authentication"])
api_router.include_router(users.router,             prefix="/users",                  tags=["Users"])
api_router.include_router(organizations.router,     prefix="/organizations",          tags=["Organizations"])
api_router.include_router(roles.router,             prefix="/roles",                  tags=["Roles & Permissions"])
api_router.include_router(permissions.router,       prefix="/permissions",            tags=["Permissions"])
api_router.include_router(invitations.router,       prefix="/invitations",            tags=["User Invitations"])
api_router.include_router(org_assignments.router,   prefix="/org-assignments",        tags=["Organization Assignments"])
api_router.include_router(dashboard.router,         prefix="/dashboard",              tags=["Dashboard"])
api_router.include_router(files.router,             prefix="/files",                  tags=["Files"])
api_router.include_router(audit_logs.router,        prefix="/audit-logs",             tags=["Audit Logs"])
api_router.include_router(simulators.router,        prefix="/simulators",             tags=["Simulator Management"])
api_router.include_router(master_data.router,       prefix="/master-data",            tags=["Master Data"])
api_router.include_router(exercises.router,         prefix="/exercises",              tags=["Exercise Management"])
api_router.include_router(assessments.router,       prefix="/assessments",            tags=["Assessment Management"])
api_router.include_router(plans.router,             prefix="",                        tags=["Plans & Entitlements"])
api_router.include_router(contact.router,           prefix="",                        tags=["Public"])
api_router.include_router(enquiries.router,         prefix="",                        tags=["CRM"])
api_router.include_router(candidates.router,        prefix="/candidates",             tags=["Candidates"])

from app.api.v1.endpoints import settings as settings_ep
api_router.include_router(settings_ep.router, prefix="/settings", tags=["Platform Settings"])
