"""Prometheus metrics utilities."""

from __future__ import annotations

from fastapi.responses import Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

METRIC_REGISTRY = CollectorRegistry()

# --- HTTP request metrics ---

http_requests_total = Counter(
    "greyzone_http_requests_total",
    "Total HTTP requests by method, endpoint, and status.",
    ["method", "endpoint", "status_code"],
    registry=METRIC_REGISTRY,
)

http_request_duration_seconds = Histogram(
    "greyzone_http_request_duration_seconds",
    "HTTP request latency in seconds.",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    registry=METRIC_REGISTRY,
)

# --- Business metrics ---

turns_advanced_total = Counter(
    "greyzone_turns_advanced_total",
    "Total turns advanced through the simulation engine.",
    registry=METRIC_REGISTRY,
)

actions_submitted_total = Counter(
    "greyzone_actions_submitted_total",
    "Total player or AI actions submitted.",
    registry=METRIC_REGISTRY,
)

narratives_generated_total = Counter(
    "greyzone_narratives_generated_total",
    "Total narratives generated for turns.",
    registry=METRIC_REGISTRY,
)

engine_errors_total = Counter(
    "greyzone_engine_errors_total",
    "Total engine errors encountered by the API.",
    ["operation"],
    registry=METRIC_REGISTRY,
)

# --- Infrastructure gauges ---

websocket_connections_active = Gauge(
    "greyzone_websocket_connections_active",
    "Number of active WebSocket connections.",
    registry=METRIC_REGISTRY,
)

active_games = Gauge(
    "greyzone_active_games",
    "Number of currently running game sessions (engine processes).",
    registry=METRIC_REGISTRY,
)

# --- AI agent metrics ---

ai_agent_request_duration_seconds = Histogram(
    "greyzone_ai_agent_request_duration_seconds",
    "Latency of requests to the AI agent service.",
    ["endpoint"],
    buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0),
    registry=METRIC_REGISTRY,
)

ai_agent_errors_total = Counter(
    "greyzone_ai_agent_errors_total",
    "Total failed requests to the AI agent service.",
    registry=METRIC_REGISTRY,
)


def record_engine_error(operation: str) -> None:
    """Increment engine error counter with an operation label."""
    engine_errors_total.labels(operation=operation).inc()


def generate_metrics_response() -> Response:
    """Return a Response containing the latest Prometheus metrics snapshot."""
    payload = generate_latest(METRIC_REGISTRY)
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)


def reset_metrics_registry() -> None:
    """Reset counters for test runs or application restarts."""
    turns_advanced_total._value.set(0)  # type: ignore[attr-defined]
    actions_submitted_total._value.set(0)  # type: ignore[attr-defined]
    narratives_generated_total._value.set(0)  # type: ignore[attr-defined]
    engine_errors_total._metrics.clear()  # type: ignore[attr-defined]
    websocket_connections_active._value.set(0)  # type: ignore[attr-defined]
    active_games._value.set(0)  # type: ignore[attr-defined]
    ai_agent_errors_total._value.set(0)  # type: ignore[attr-defined]
