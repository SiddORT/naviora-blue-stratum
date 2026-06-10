"""
Canonical list of all application permissions.
Format: <module>.<action>
These are seeded into the permissions table on first run.
"""
from typing import NamedTuple


class PermissionDef(NamedTuple):
    name: str
    module: str
    action: str
    description: str


ALL_PERMISSIONS: list[PermissionDef] = [
    # Organizations
    PermissionDef("organizations.view",   "organizations", "view",   "View organizations"),
    PermissionDef("organizations.create", "organizations", "create", "Create organizations"),
    PermissionDef("organizations.edit",   "organizations", "edit",   "Edit organizations"),
    PermissionDef("organizations.delete", "organizations", "delete", "Delete organizations"),
    # Users
    PermissionDef("users.view",   "users", "view",   "View users"),
    PermissionDef("users.create", "users", "create", "Create users"),
    PermissionDef("users.edit",   "users", "edit",   "Edit users"),
    PermissionDef("users.delete", "users", "delete", "Delete users"),
    # Roles & Permissions
    PermissionDef("roles.view",   "roles", "view",   "View roles"),
    PermissionDef("roles.create", "roles", "create", "Create roles"),
    PermissionDef("roles.edit",   "roles", "edit",   "Edit roles"),
    PermissionDef("roles.delete", "roles", "delete", "Delete roles"),
    # Plans & Subscriptions
    PermissionDef("plans.view",   "plans", "view",   "View plans"),
    PermissionDef("plans.create", "plans", "create", "Create plans"),
    PermissionDef("plans.edit",   "plans", "edit",   "Edit plans"),
    PermissionDef("plans.delete", "plans", "delete", "Delete plans"),
    # Simulator Management
    PermissionDef("simulators.view",   "simulators", "view",   "View simulators"),
    PermissionDef("simulators.create", "simulators", "create", "Create simulators"),
    PermissionDef("simulators.edit",   "simulators", "edit",   "Edit simulators"),
    PermissionDef("simulators.delete", "simulators", "delete", "Delete simulators"),
    # Exercise Management
    PermissionDef("exercises.view",   "exercises", "view",   "View exercises"),
    PermissionDef("exercises.create", "exercises", "create", "Create exercises"),
    PermissionDef("exercises.edit",   "exercises", "edit",   "Edit exercises"),
    PermissionDef("exercises.delete", "exercises", "delete", "Delete exercises"),
    # Assessment Management
    PermissionDef("assessments.view",   "assessments", "view",   "View assessments"),
    PermissionDef("assessments.create", "assessments", "create", "Create assessments"),
    PermissionDef("assessments.edit",   "assessments", "edit",   "Edit assessments"),
    PermissionDef("assessments.delete", "assessments", "delete", "Delete assessments"),
    # Certificates
    PermissionDef("certificates.view",   "certificates", "view",   "View certificates"),
    PermissionDef("certificates.create", "certificates", "create", "Create certificates"),
    PermissionDef("certificates.edit",   "certificates", "edit",   "Edit certificates"),
    PermissionDef("certificates.delete", "certificates", "delete", "Delete certificates"),
    # Reports & Analytics
    PermissionDef("reports.view",   "reports", "view",   "View reports"),
    PermissionDef("reports.export", "reports", "export", "Export reports"),
    # Audit Logs
    PermissionDef("audit_logs.view", "audit_logs", "view", "View audit logs"),
    # Maritime Knowledge Base
    PermissionDef("knowledge_base.view",   "knowledge_base", "view",   "View knowledge base"),
    PermissionDef("knowledge_base.create", "knowledge_base", "create", "Create knowledge base entries"),
    PermissionDef("knowledge_base.edit",   "knowledge_base", "edit",   "Edit knowledge base entries"),
    PermissionDef("knowledge_base.delete", "knowledge_base", "delete", "Delete knowledge base entries"),
    # AI Management
    PermissionDef("ai_management.view",   "ai_management", "view",   "View AI management"),
    PermissionDef("ai_management.manage", "ai_management", "manage", "Manage AI settings"),
    # Settings
    PermissionDef("settings.view",   "settings", "view",   "View settings"),
    PermissionDef("settings.manage", "settings", "manage", "Manage settings"),
    # Dashboard
    PermissionDef("dashboard.view", "dashboard", "view", "View dashboard"),
    # Files
    PermissionDef("files.upload", "files", "upload", "Upload files"),
    PermissionDef("files.delete", "files", "delete", "Delete files"),
]

PERMISSION_SLUGS = {p.name for p in ALL_PERMISSIONS}

# Super Admin gets every permission
SUPER_ADMIN_PERMISSIONS = [p.name for p in ALL_PERMISSIONS]

# Org Admin gets a restricted subset
ORG_ADMIN_PERMISSIONS = [
    "users.view", "users.create", "users.edit",
    "assessments.view", "assessments.create", "assessments.edit",
    "exercises.view", "exercises.create", "exercises.edit",
    "simulators.view",
    "certificates.view", "certificates.create",
    "reports.view", "reports.export",
    "dashboard.view",
    "files.upload",
    "knowledge_base.view",
]

# Candidate gets read-only access to their own data
CANDIDATE_PERMISSIONS = [
    "assessments.view",
    "exercises.view",
    "certificates.view",
    "dashboard.view",
    "knowledge_base.view",
]
