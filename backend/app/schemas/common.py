"""Shared Pydantic v2 schema primitives."""
from datetime import datetime
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with ORM mode enabled."""
    model_config = ConfigDict(from_attributes=True)


class TimestampSchema(BaseSchema):
    """Mirrors the TimestampMixin columns for read responses."""
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    is_active: bool
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated list response."""
    items: list[T]
    page: int
    page_size: int
    total: int
    total_pages: int


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: list[Any] = []
