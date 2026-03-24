"""Scenario CRUD endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.scenario import Scenario
from app.schemas.scenario import (
    ScenarioCreate,
    ScenarioList,
    ScenarioRead,
    ScenarioUpdate,
)

router = APIRouter(prefix="/api/v1/scenarios", tags=["scenarios"])


@router.get("", response_model=ScenarioList)
async def list_scenarios(db: AsyncSession = Depends(get_session)) -> dict:
    result = await db.execute(select(Scenario).order_by(Scenario.created_at.desc()))
    items = list(result.scalars().all())
    return {"items": items, "total": len(items)}


@router.post("", response_model=ScenarioRead, status_code=201)
async def create_scenario(
    data: ScenarioCreate, db: AsyncSession = Depends(get_session)
) -> Scenario:
    scenario = Scenario(
        name=data.name,
        description=data.description,
        config=data.config,
    )
    db.add(scenario)
    await db.flush()
    await db.refresh(scenario)
    return scenario


@router.get("/{scenario_id}", response_model=ScenarioRead)
async def get_scenario(
    scenario_id: uuid.UUID, db: AsyncSession = Depends(get_session)
) -> Scenario:
    scenario = await db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.put("/{scenario_id}", response_model=ScenarioRead)
async def update_scenario(
    scenario_id: uuid.UUID,
    data: ScenarioUpdate,
    db: AsyncSession = Depends(get_session),
) -> Scenario:
    scenario = await db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    if data.name is not None:
        scenario.name = data.name
    if data.description is not None:
        scenario.description = data.description
    if data.config is not None:
        scenario.config = data.config
    await db.flush()
    await db.refresh(scenario)
    return scenario


@router.delete("/{scenario_id}", status_code=204)
async def delete_scenario(
    scenario_id: uuid.UUID, db: AsyncSession = Depends(get_session)
) -> None:
    scenario = await db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    await db.delete(scenario)
    await db.flush()
