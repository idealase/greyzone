"""Structured logging middleware."""

import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """Logs request/response details with structlog."""

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
            duration_ms = (time.monotonic() - start_time) * 1000
            logger.exception(
                "http_request_error",
                method=request.method,
                path=request.url.path,
                status_code=500,
                duration_ms=round(duration_ms, 2),
                correlation_id=correlation_id,
                error=str(exc),
            )
            structlog.contextvars.unbind_contextvars("request_path", "request_method")
            raise

        duration_ms = (time.monotonic() - start_time) * 1000
        logger.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
            correlation_id=correlation_id,
        )
        structlog.contextvars.unbind_contextvars("request_path", "request_method")
        return response
