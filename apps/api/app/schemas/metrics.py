"""Metrics schemas."""

import uuid

from pydantic import BaseModel


class MetricsResponse(BaseModel):
    run_id: uuid.UUID
    turn: int
    metrics: dict
