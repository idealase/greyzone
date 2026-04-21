"""API routers."""

from app.routers.health import metrics_router, router as health_router
from app.routers.auth import router as auth_router
from app.routers.scenarios import router as scenarios_router
from app.routers.runs import router as runs_router, ws_router as runs_ws_router
from app.routers.actions import router as actions_router
from app.routers.advisor import router as advisor_router
from app.routers.users import router as users_router
from app.routers.replay import router as replay_router
from app.routers.ai_audit import router as ai_audit_router
from app.routers.narrative import router as narrative_router

__all__ = [
    "health_router",
    "auth_router",
    "metrics_router",
    "scenarios_router",
    "runs_router",
    "runs_ws_router",
    "actions_router",
    "advisor_router",
    "users_router",
    "replay_router",
    "ai_audit_router",
    "narrative_router",
]
