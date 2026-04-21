"""Advisor schemas."""

import uuid

from pydantic import BaseModel, Field


class AdvisorRequest(BaseModel):
    run_id: uuid.UUID
    role_id: str | None = None
    max_suggestions: int = Field(default=3, ge=1, le=10)


class AdvisorSuggestedAction(BaseModel):
    action_type: str
    target_domain: str
    target_actor: str | None = None
    intensity: float = Field(ge=0.0, le=1.0)


class AdvisorExpectedLocalEffects(BaseModel):
    summary: str | None = None
    stress_delta: float | None = None
    resilience_delta: float | None = None


class AdvisorSuggestion(BaseModel):
    rank: int = Field(ge=1)
    action: AdvisorSuggestedAction
    rationale: str
    confidence: float = Field(ge=0.0, le=1.0)
    expected_local_effects: AdvisorExpectedLocalEffects | None = None


class AdvisorResponse(BaseModel):
    state_summary: str
    strategic_outlook: str
    suggestions: list[AdvisorSuggestion] = Field(default_factory=list)
