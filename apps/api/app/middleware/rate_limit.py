"""Rate limiting middleware using slowapi.

Limits:
- Auth endpoints: 5 req/min
- Game creation: 10 req/min
- General API: 60 req/min
"""

from __future__ import annotations

import os

import structlog
from fastapi import Request, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

logger = structlog.get_logger()


def _key_func(request: Request) -> str:
    """Extract client IP, preferring X-Forwarded-For behind nginx."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


_enabled = os.environ.get("TESTING", "").lower() not in ("1", "true")

limiter = Limiter(
    key_func=_key_func,
    default_limits=["60/minute"],
    enabled=_enabled,
)

# Decorators for specific route limits
auth_limit = limiter.limit("5/minute")
create_limit = limiter.limit("10/minute")
general_limit = limiter.limit("60/minute")


async def rate_limit_exceeded_handler(
    request: Request, exc: RateLimitExceeded
) -> Response:
    """Return 429 with Retry-After header."""
    retry_after = getattr(exc, "retry_after", 60)
    logger.warning(
        "rate_limited",
        path=request.url.path,
        method=request.method,
        client=_key_func(request),
        limit=str(exc.detail),
    )
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
        headers={"Retry-After": str(retry_after)},
    )
