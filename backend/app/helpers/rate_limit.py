"""
In-memory rate limiter — token-bucket algorithm per IP address.

Designed as a lightweight FastAPI dependency.  For multi-process or
Redis-backed rate limiting in production, swap the _store for a Redis client.

Usage:
    from app.helpers.rate_limit import RateLimiter

    # Allow 5 requests per 60 seconds per IP
    login_limiter = RateLimiter(max_requests=5, window_seconds=60)

    @router.post("/login")
    async def login(
        request: Request,
        _: None = Depends(login_limiter),
    ):
        ...
"""
import asyncio
import logging
import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)


class _Bucket:
    """Sliding-window request timestamps for one IP address."""

    __slots__ = ("timestamps",)

    def __init__(self) -> None:
        self.timestamps: Deque[float] = deque()


class RateLimiter:
    """
    Sliding-window rate limiter implemented as a FastAPI callable dependency.

    Args:
        max_requests:   Maximum requests allowed within the window.
        window_seconds: Rolling time window in seconds.
        key_func:       Callable(Request) -> str to derive the bucket key.
                        Defaults to client IP address.
    """

    def __init__(
        self,
        max_requests: int = 60,
        window_seconds: int = 60,
        key_func=None,
    ) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._key_func = key_func or self._default_key
        self._store: dict[str, _Bucket] = defaultdict(_Bucket)
        self._lock = asyncio.Lock()

    @staticmethod
    def _default_key(request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def __call__(self, request: Request) -> None:
        key = self._key_func(request)
        now = time.monotonic()
        window_start = now - self.window_seconds

        async with self._lock:
            bucket = self._store[key]

            # Purge timestamps outside the window
            while bucket.timestamps and bucket.timestamps[0] < window_start:
                bucket.timestamps.popleft()

            if len(bucket.timestamps) >= self.max_requests:
                retry_after = int(bucket.timestamps[0] - window_start) + 1
                logger.warning("Rate limit exceeded for %s", key)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.timestamps.append(now)


# ── Pre-configured limiters ───────────────────────────────────────────────

# Strict: login / password-reset — 5 attempts per minute per IP
auth_limiter = RateLimiter(max_requests=5, window_seconds=60)

# Standard: general API — 120 requests per minute per IP
api_limiter = RateLimiter(max_requests=120, window_seconds=60)
