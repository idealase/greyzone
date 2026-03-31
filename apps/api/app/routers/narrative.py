"""Narrative generation endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.event import RunEvent, RunSnapshot
from app.models.narrative import RunNarrative
from app.models.run import Run
from app.models.scenario import Scenario
from app.services.narrative_service import NarrativeService
from app.observability.metrics import narratives_generated_total

router = APIRouter(prefix="/api/v1/runs", tags=["narrative"])

_narrative_service = NarrativeService()


class DomainHighlightResponse(BaseModel):
    domain: str
    label: str
    direction: str
    delta: float
    note: str


class TurnNarrativeResponse(BaseModel):
    turn: int
    headline: str
    body: str
    domain_highlights: list[DomainHighlightResponse]
    threat_assessment: str
    intelligence_note: Optional[str]
    cached: bool = False


async def _fetch_run_and_scenario(
    run_id: uuid.UUID, db: AsyncSession
) -> tuple[Run, Scenario]:
    run = await db.get(Run, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    scenario = await db.get(Scenario, run.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return run, scenario


async def _fetch_snapshot_state(
    run_id: uuid.UUID, turn: int, db: AsyncSession
) -> dict:
    result = await db.execute(
        select(RunSnapshot)
        .where(RunSnapshot.run_id == run_id, RunSnapshot.turn == turn)
    )
    snapshot = result.scalar_one_or_none()
    return snapshot.state if snapshot is not None else {}


async def _fetch_turn_events(
    run_id: uuid.UUID, turn: int, db: AsyncSession
) -> list[dict]:
    result = await db.execute(
        select(RunEvent).where(RunEvent.run_id == run_id, RunEvent.turn == turn)
    )
    events = result.scalars().all()
    return [
        {
            "event_type": e.event_type,
            "description": e.payload.get("description", ""),
            "layer": e.payload.get("layer", ""),
        }
        for e in events
    ]


async def _generate_and_persist(
    run: Run,
    scenario: Scenario,
    turn: int,
    db: AsyncSession,
) -> RunNarrative:
    state = await _fetch_snapshot_state(run.id, turn, db)
    prev_state = await _fetch_snapshot_state(run.id, turn - 1, db)
    events = await _fetch_turn_events(run.id, turn, db)

    domain_states = state.get("layers", {})
    prev_domain_states = prev_state.get("layers", {})
    order_parameter = float(state.get("order_parameter", 0.0))
    prev_order_parameter = float(prev_state.get("order_parameter", 0.0))

    narrative = _narrative_service.generate(
        turn=turn,
        phase=run.current_phase,
        order_parameter=order_parameter,
        prev_order_parameter=prev_order_parameter,
        events=events,
        domain_states=domain_states,
        prev_domain_states=prev_domain_states,
        scenario_name=scenario.name,
        scenario_id=str(run.scenario_id),
    )

    record = RunNarrative(
        run_id=run.id,
        turn=turn,
        headline=narrative.headline,
        body=narrative.body,
        domain_highlights=[
            {
                "domain": h.domain,
                "label": h.label,
                "direction": h.direction,
                "delta": h.delta,
                "note": h.note,
            }
            for h in narrative.domain_highlights
        ],
        threat_assessment=narrative.threat_assessment,
        intelligence_note=narrative.intelligence_note,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    narratives_generated_total.inc()
    return record


def _to_response(record: RunNarrative, cached: bool = False) -> TurnNarrativeResponse:
    return TurnNarrativeResponse(
        turn=record.turn,
        headline=record.headline,
        body=record.body,
        domain_highlights=[DomainHighlightResponse(**h) for h in record.domain_highlights],
        threat_assessment=record.threat_assessment,
        intelligence_note=record.intelligence_note,
        cached=cached,
    )


@router.get("/{run_id}/turns/{turn}/narrative", response_model=TurnNarrativeResponse)
async def get_turn_narrative(
    run_id: uuid.UUID,
    turn: int,
    db: AsyncSession = Depends(get_session),
) -> TurnNarrativeResponse:
    result = await db.execute(
        select(RunNarrative).where(
            RunNarrative.run_id == run_id, RunNarrative.turn == turn
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        return _to_response(existing, cached=True)

    run, scenario = await _fetch_run_and_scenario(run_id, db)
    record = await _generate_and_persist(run, scenario, turn, db)
    return _to_response(record, cached=False)


@router.post("/{run_id}/narrative/generate", response_model=TurnNarrativeResponse)
async def generate_narrative(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> TurnNarrativeResponse:
    run, scenario = await _fetch_run_and_scenario(run_id, db)
    turn = run.current_turn

    result = await db.execute(
        select(RunNarrative).where(
            RunNarrative.run_id == run_id, RunNarrative.turn == turn
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        await db.delete(existing)
        await db.flush()

    record = await _generate_and_persist(run, scenario, turn, db)
    return _to_response(record, cached=False)
