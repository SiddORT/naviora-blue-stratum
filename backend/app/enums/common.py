"""Application-wide enumerations."""
from enum import Enum


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class RoleSlug(str, Enum):
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    CANDIDATE = "candidate"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TRIAL = "trial"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


class StorageProvider(str, Enum):
    LOCAL = "local"
    S3 = "s3"
    AZURE = "azure"
    MINIO = "minio"


class AuditAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    RESTORE = "restore"
    ACTIVATE = "activate"
    DEACTIVATE = "deactivate"
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_RESET = "password_reset"
    PASSWORD_CHANGE = "password_change"
    UPLOAD = "upload"
    PERMISSION_DENIED = "permission_denied"
