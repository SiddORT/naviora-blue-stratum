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

from app.api.v1.endpoints import (
    org_auth, org_dashboard, org_users, org_candidates, org_subscription, org_settings, org_profile,
    org_campaigns, org_portal_assignments, org_progress, org_calendar,
)
api_router.include_router(org_auth.router,                prefix="/org/auth",         tags=["Org Portal — Auth"])
api_router.include_router(org_dashboard.router,           prefix="/org/dashboard",    tags=["Org Portal — Dashboard"])
api_router.include_router(org_users.router,               prefix="/org/users",        tags=["Org Portal — Users"])
api_router.include_router(org_candidates.router,          prefix="/org/candidates",   tags=["Org Portal — Candidates"])
api_router.include_router(org_subscription.router,        prefix="/org/subscription", tags=["Org Portal — Subscription"])
api_router.include_router(org_settings.router,            prefix="/org/settings",     tags=["Org Portal — Settings"])
api_router.include_router(org_profile.router,             prefix="/org/profile",      tags=["Org Portal — Profile"])
api_router.include_router(org_campaigns.router,           prefix="/org/campaigns",    tags=["Org Portal — Campaigns"])
api_router.include_router(org_portal_assignments.router,  prefix="/org",              tags=["Org Portal — Assignments"])
api_router.include_router(org_progress.router,            prefix="/org/progress",     tags=["Org Portal — Progress"])
api_router.include_router(org_calendar.router,            prefix="/org/calendar",     tags=["Org Portal — Calendar"])
