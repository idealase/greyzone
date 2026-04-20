"""Structured logging middleware with Prometheus instrumentation."""

import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.observability.metrics import (
    http_request_duration_seconds,
    http_requests_total,
)

logger = structlog.get_logger()

# Paths excluded from per-route metrics to avoid cardinality explosion.
_METRICS_SKIP_PATHS = frozenset({"/metrics", "/api/v1/health"})


def _normalise_path(path: str) -> str:
    """Collapse UUID path segments to reduce metric label cardinality."""
    parts = path.rstrip("/").split("/")
    normalised = []
    for part in parts:
        # Collapse UUIDs and numeric IDs to placeholders
        if len(part) == 36 and part.count("-") == 4:
            normalised.append("{id}")
        elif part.isdigit():
            normalised.append("{id}")
        else:
            normalised.append(part)
    return "/".join(normalised) or "/"


class LoggingMiddleware(BaseHTTPMiddleware):
    """Logs request/response details and records Prometheus HTTP metrics."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.monotonic()
        correlation_id = getattr(request.state, "correlation_id", "unknown")
        structlog.contextvars.bind_contextvars(
            request_path=request.url.path,
            request_method=request.method,
        )

        try:
            response = await call_next(request)
        except Exception as exc:  # Log unexpected errors with request context
            duration = time.monotonic() - start_time
            user_id = self._get_user_id(request)
            logger.exception(
                "http_request_error",
                method=request.method,
                path=request.url.path,
                status_code=500,
                duration_ms=round(duration * 1000, 2),
                correlation_id=correlation_id,
                user_id=user_id,
                error=str(exc),
            )
            self._record_metrics(request.method, request.url.path, 500, duration)
            self._unbind()
            raise

        duration = time.monotonic() - start_time
        user_id = self._get_user_id(request)
        logger.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration * 1000, 2),
            correlation_id=correlation_id,
            user_id=user_id,
        )
        self._record_metrics(
            request.method, request.url.path, response.status_code, duration
        )
        self._unbind()
        return response

    @staticmethod
    def _record_metrics(
        method: str, path: str, status_code: int, duration: float
    ) -> None:
        if path in _METRICS_SKIP_PATHS:
            return
        endpoint = _normalise_path(path)
        http_requests_total.labels(
            method=method, endpoint=endpoint, status_code=str(status_code)
        ).inc()
        http_request_duration_seconds.labels(
            method=method, endpoint=endpoint
        ).observe(duration)

    @staticmethod
    def _get_user_id(request: Request) -> str | None:
        # Prefer the plain string stashed by auth middleware to avoid
        # touching a potentially detached SQLAlchemy User instance.
        uid = getattr(request.state, "user_id", None)
        if uid is not None:
            return str(uid)
        user = getattr(request.state, "user", None)
        if user is not None:
            try:
                return str(user.id)
            except Exception:
                return None
        return None

    @staticmethod
    def _unbind() -> None:
        structlog.contextvars.unbind_contextvars(
            "request_path", "request_method", "user_id"
        )
