"""Audit service — wraps AuditLogRepository for use by all other services."""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.audit_log import AuditLogRepository

logger = logging.getLogger(__name__)


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = AuditLogRepository(db)

    async def log(
        self,
        module: str,
        action: str,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        try:
            await self.repo.create(
                user_id=user_id,
                module=module,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        except Exception as exc:
            logger.error("Failed to write audit log: %s", exc)
