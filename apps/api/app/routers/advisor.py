"""Advisor recommendation endpoint."""

import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_session
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.advisor import AdvisorRequest, AdvisorResponse
from app.services.access_control import ensure_run_member

router = APIRouter(prefix="/api/v1/runs/{run_id}", tags=["advisor"])

_ADVISOR_TIMEOUT = httpx.Timeout(10.0, connect=3.0)


def _normalize_advisor_payload(payload: dict) -> dict:
    """Normalize advisor payload keys from internal camelCase to API snake_case."""
    suggestions = payload.get("suggestions", [])
    normalized_suggestions: list[dict] = []
    if isinstance(suggestions, list):
        for suggestion in suggestions:
            if not isinstance(suggestion, dict):
                normalized_suggestions.append(suggestion)
                continue

            action = suggestion.get("action", {})
            normalized_action = action
            if isinstance(action, dict):
                normalized_action = {
                    "action_type": action.get("action_type", action.get("actionType")),
                    "target_domain": action.get("target_domain", action.get("targetDomain")),
                    "target_actor": action.get("target_actor", action.get("targetActorId")),
                    "intensity": action.get("intensity"),
                }

            effects = suggestion.get("expected_local_effects", suggestion.get("expectedLocalEffects"))
            normalized_effects = effects
            if isinstance(effects, dict):
                normalized_effects = {
                    "summary": effects.get("summary"),
                    "stress_delta": effects.get("stress_delta", effects.get("stressDelta")),
                    "resilience_delta": effects.get("resilience_delta", effects.get("resilienceDelta")),
                }

            normalized_suggestions.append({
                "rank": suggestion.get("rank"),
                "action": normalized_action,
                "rationale": suggestion.get("rationale"),
                "confidence": suggestion.get("confidence"),
                "expected_local_effects": normalized_effects,
            })

    return {
        "state_summary": payload.get("state_summary", payload.get("stateSummary")),
        "strategic_outlook": payload.get(
            "strategic_outlook", payload.get("strategicOutlook")
        ),
        "suggestions": normalized_suggestions,
    }


@router.post("/advisor", response_model=AdvisorResponse)
async def get_advisor(
    run_id: uuid.UUID,
    data: AdvisorRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> AdvisorResponse:
    _, participant = await ensure_run_member(
        db, run_id, current_user.id, require_participant=True
    )
    assert participant is not None  # enforced by require_participant=True

    if data.run_id != run_id:
        raise HTTPException(status_code=400, detail="run_id must match the requested run")

    role_id = data.role_id or participant.role_id
    if role_id != participant.role_id:
        raise HTTPException(status_code=403, detail="Role does not belong to user")

    try:
        async with httpx.AsyncClient(timeout=_ADVISOR_TIMEOUT) as client:
            response = await client.post(
                f"{settings.ai_agent_url}/ai/advisor",
                json={
                    "runId": str(run_id),
                    "roleId": role_id,
                    "maxSuggestions": data.max_suggestions,
                    "userId": str(current_user.id),
                },
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="AI advisor request timed out") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail="AI advisor service unavailable") from exc

    if response.status_code < 200 or response.status_code >= 300:
        upstream_detail = response.text.strip() or "No detail provided"
        raise HTTPException(
            status_code=502,
            detail=(
                f"AI advisor request failed with status {response.status_code}: "
                f"{upstream_detail}"
            ),
        )

    try:
        raw_payload = response.json()
        if not isinstance(raw_payload, dict):
            raise ValueError("Upstream payload is not an object")
        normalized_payload = _normalize_advisor_payload(raw_payload)
        return AdvisorResponse.model_validate(normalized_payload)
    except (ValueError, ValidationError) as exc:
        raise HTTPException(status_code=502, detail="AI advisor returned invalid response") from exc
