"""Greyzone API main application."""

import logging
import uuid
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import structlog
from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.middleware.auth import get_current_user
from app.middleware.correlation import CorrelationIdMiddleware
from app.middleware.logging import LoggingMiddleware
from app.routers import (
    actions_router,
    ai_audit_router,
    auth_router,
    health_router,
    metrics_router,
    narrative_router,
    replay_router,
    runs_router,
    runs_ws_router,
    scenarios_router,
    users_router,
)
from app.services.engine_bridge import EngineBridge
from app.services.run_manager import RunManager
from app.services.streaming import ConnectionManager
from app.observability.metrics import reset_metrics_registry

# Configure structlog with JSON output
log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
logging.basicConfig(format="%(message)s", level=log_level)
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.dict_tracebacks,
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
    wrapper_class=structlog.make_filtering_bound_logger(log_level),
    cache_logger_on_first_use=True,
)
logger = structlog.get_logger()

# Shared service instances
engine_bridge = EngineBridge(settings.engine_binary)
run_manager = RunManager(engine_bridge)
ws_manager = ConnectionManager()


def _error_body(detail: object, request_id: str) -> dict:
    """Attach request id to error payloads while preserving detail structure."""
    if isinstance(detail, dict):
        return {**detail, "request_id": request_id}
    return {"detail": detail, "request_id": request_id}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown."""
    # Wire up service dependencies to routers
    from app.routers import runs as runs_mod
    from app.routers import actions as actions_mod
    from app.routers import replay as replay_mod
    from app.routers import health as health_mod

    runs_mod.set_services(engine_bridge, run_manager, ws_manager)
    actions_mod.set_services(engine_bridge, run_manager)
    replay_mod.set_services(engine_bridge)
    health_mod.set_services(engine_bridge)

    reset_metrics_registry()

    yield

    # Shutdown all engine subprocesses
    await engine_bridge.shutdown_all()


app = FastAPI(
    title="Greyzone API",
    description="Control plane for the Greyzone distributed battlespace simulation",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.engine_bridge = engine_bridge
app.state.run_manager = run_manager
app.state.ws_manager = ws_manager

# Middleware (order matters: first added = outermost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(LoggingMiddleware)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    request_id = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    headers = {"X-Correlation-ID": request_id}
    if exc.headers:
        headers.update(exc.headers)
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(exc.detail, request_id),
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=422,
        content=_error_body(exc.errors(), request_id),
        headers={"X-Correlation-ID": request_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    request_id = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    logger.exception(
        "unhandled_exception",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content=_error_body("Internal server error", request_id),
        headers={"X-Correlation-ID": request_id},
    )

# Routers
app.include_router(health_router)
app.include_router(metrics_router)
app.include_router(auth_router)
app.include_router(scenarios_router, dependencies=[Depends(get_current_user)])
app.include_router(runs_router, dependencies=[Depends(get_current_user)])
app.include_router(runs_ws_router)
app.include_router(actions_router, dependencies=[Depends(get_current_user)])
app.include_router(users_router, dependencies=[Depends(get_current_user)])
app.include_router(replay_router, dependencies=[Depends(get_current_user)])
app.include_router(ai_audit_router, dependencies=[Depends(get_current_user)])
app.include_router(narrative_router, dependencies=[Depends(get_current_user)])
