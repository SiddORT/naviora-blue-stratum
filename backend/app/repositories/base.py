"""Generic async repository — base class for all entity repositories."""
import logging
from datetime import datetime, timezone
from typing import Any, Generic, Optional, Type, TypeVar

from sqlalchemy import Select, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.models.base import TimestampMixin

ModelType = TypeVar("ModelType", bound=TimestampMixin)
logger = logging.getLogger(__name__)


class BaseRepository(Generic[ModelType]):
    """
    Provides standard CRUD operations for any model that inherits TimestampMixin.
    Business logic lives in the service layer — repositories only touch the DB.
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    async def get_by_id(self, record_id: int, include_deleted: bool = False) -> Optional[ModelType]:
        query = select(self.model).where(self.model.id == record_id)
        if not include_deleted:
            query = query.where(self.model.deleted_at.is_(None))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_uuid(self, uuid: str, include_deleted: bool = False) -> Optional[ModelType]:
        query = select(self.model).where(self.model.uuid == uuid)
        if not include_deleted:
            query = query.where(self.model.deleted_at.is_(None))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        include_deleted: bool = False,
        active_only: bool = True,
    ) -> list[ModelType]:
        query = select(self.model)
        if not include_deleted:
            query = query.where(self.model.deleted_at.is_(None))
        if active_only:
            query = query.where(self.model.is_active.is_(True))
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, base_query: Optional[Select] = None, include_deleted: bool = False) -> int:
        if base_query is None:
            base_query = select(self.model)
        if not include_deleted:
            base_query = base_query.where(self.model.deleted_at.is_(None))
        count_query = select(func.count()).select_from(base_query.subquery())
        result = await self.db.execute(count_query)
        return result.scalar_one()

    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: ModelType, obj_in: dict[str, Any]) -> ModelType:
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        db_obj.updated_at = datetime.now(timezone.utc)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def soft_delete(self, db_obj: ModelType, deleted_by_uuid: str) -> ModelType:
        db_obj.soft_delete(deleted_by_uuid)
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj

    async def activate(self, db_obj: ModelType, updated_by: str) -> ModelType:
        db_obj.is_active = True
        if hasattr(db_obj, "status"):
            db_obj.status = "active"
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.now(timezone.utc)
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj

    async def deactivate(self, db_obj: ModelType, updated_by: str) -> ModelType:
        db_obj.is_active = False
        if hasattr(db_obj, "status"):
            db_obj.status = "inactive"
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.now(timezone.utc)
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj
