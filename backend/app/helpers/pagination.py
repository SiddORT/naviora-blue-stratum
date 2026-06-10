"""Pagination helper — standard page/page_size/total response contract."""
import math
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameter model for paginated endpoints."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(default=None, description="Free-text search")
    sort_by: Optional[str] = Field(default=None, description="Column to sort by")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response envelope."""

    items: list[T]
    page: int
    page_size: int
    total: int
    total_pages: int

    @classmethod
    def build(cls, items: list[T], total: int, page: int, page_size: int) -> "PaginatedResponse[T]":
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
        return cls(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )


async def paginate(
    db: AsyncSession,
    query: Select,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Any], int]:
    """
    Execute a SQLAlchemy select query with offset/limit pagination.
    Returns (rows, total_count).
    """
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * page_size
    paginated_query = query.offset(offset).limit(page_size)
    result = await db.execute(paginated_query)
    rows = result.scalars().all()

    return list(rows), total
