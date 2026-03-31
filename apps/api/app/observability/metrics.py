"""Prometheus metrics utilities."""

from __future__ import annotations

from fastapi.responses import Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    generate_latest,
)

METRIC_REGISTRY = CollectorRegistry()

# Core counters
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
