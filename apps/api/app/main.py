"""Greyzone API main application."""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import async_session_factory
from app.middleware.correlation import CorrelationIdMiddleware
from app.middleware.logging import LoggingMiddleware
from app.routers import (
    actions_router,
    ai_audit_router,
    health_router,
    narrative_router,
    replay_router,
    runs_router,
    scenarios_router,
    users_router,
)
from app.services.engine_bridge import EngineBridge
from app.services.run_manager import RunManager
from app.services.streaming import ConnectionManager

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        getattr(structlog, "_log_once", None) or __import__("logging").getLevelName(settings.log_level.upper())
    ),
)
logger = structlog.get_logger()

# Shared service instances
engine_bridge = EngineBridge(settings.engine_binary)
run_manager = RunManager(engine_bridge)
ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown."""
    # Wire up service dependencies to routers
    from app.routers import runs as runs_mod
    from app.routers import actions as actions_mod
    from app.routers import replay as replay_mod

    runs_mod.set_services(engine_bridge, run_manager, ws_manager)
    actions_mod.set_services(engine_bridge, run_manager)
    replay_mod.set_services(engine_bridge)
    engine_bridge.install_signal_handlers()

    async with async_session_factory() as db:
        try:
            await run_manager.restore_running_runs(db)
        except Exception as e:
            logger.warning("running_runs_restore_failed", error=str(e))

    yield

    # Shutdown all engine subprocesses
    await engine_bridge.shutdown_all()


app = FastAPI(
    title="Greyzone API",
    description="Control plane for the Greyzone distributed battlespace simulation",
    version="0.1.0",
    lifespan=lifespan,
)

# Middleware (order matters: first added = outermost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)
app.add_middleware(CorrelationIdMiddleware)

# Routers
app.include_router(health_router)
app.include_router(scenarios_router)
app.include_router(runs_router)
app.include_router(actions_router)
app.include_router(users_router)
app.include_router(replay_router)
app.include_router(ai_audit_router)
app.include_router(narrative_router)
