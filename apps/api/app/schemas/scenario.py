"""Scenario schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScenarioCreate(BaseModel):
    name: str
    description: str = ""
    config: dict = {}


class ScenarioUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    config: dict | None = None


class ScenarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    config: dict
    created_at: datetime
    updated_at: datetime


class ScenarioList(BaseModel):
    items: list[ScenarioRead]
    total: int
