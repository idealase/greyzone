/**
 * Mappers to transform snake_case API responses into the camelCase types
 * expected by the AI agent's internal logic.
 *
 * API (RunStateResponse):
 *   { run_id, turn, phase, state: { order_parameter, layers: {Domain: LayerState}, actors, events, ... }, role_id }
 *
 * AI Agent (GameState):
 *   { runId, turn, phase, orderParameter, domains: DomainState[], actors, events, metadata }
 *
 * API (LegalActionsResponse):
 *   { run_id, role_id, turn, actions: [{ action_type, available_layers, actor_id, parameter_ranges, description }] }
 *
 * AI Agent (LegalAction):
 *   { actionType, targetDomain, targetActorId, description, intensityRange, estimatedStressImpact }
 */

import type { GameState, DomainState, ActorState, GameEvent, GameMetadata } from "../types/state.js";
import type { LegalAction } from "../types/index.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapRunStateToGameState(apiResponse: any): GameState {
  const state = apiResponse.state ?? apiResponse;

  const layers: Record<string, any> = state.layers ?? {};
  const domains: DomainState[] = Object.entries(layers).map(
    ([domainName, layerState]: [string, any]) => ({
      domain: domainName,
      stress: layerState.stress ?? 0,
      resilience: layerState.resilience ?? 0,
      couplingStrength: layerState.variables ?? {},
      recentEvents: [],
    })
  );

  const actors: ActorState[] = (state.actors ?? []).map((a: any) => ({
    actorId: String(a.id ?? a.actor_id ?? a.actorId ?? ""),
    role: a.role ?? a.role_id ?? "",
    resources: a.resources ?? 1.0,
    morale: a.morale ?? 1.0,
    visibility: a.visibility ?? {},
  }));

  const events: GameEvent[] = (state.events ?? []).map((e: any) => ({
    eventId: String(e.id ?? e.event_id ?? e.eventId ?? ""),
    turn: e.turn ?? 0,
    domain: e.domain ?? e.domain_layer ?? "",
    type: e.event_type ?? e.type ?? "",
    description: e.description ?? "",
    effects: e.effects ?? {},
  }));

  const metadata: GameMetadata = {
    scenarioId: state.scenario_id ?? apiResponse.scenario_id ?? "",
    maxTurns: state.max_turns ?? 30,
    phaseThresholds: [],
  };

  return {
    runId: String(apiResponse.run_id ?? ""),
    turn: state.turn ?? apiResponse.turn ?? 0,
    phase: String(state.phase ?? apiResponse.phase ?? "Competition"),
    orderParameter: state.order_parameter ?? state.orderParameter ?? 0,
    domains,
    actors,
    events,
    metadata,
  };
}

export function mapLegalActionsResponse(apiResponse: any): LegalAction[] {
  const rawActions: any[] = apiResponse.actions ?? apiResponse ?? [];
  const mapped: LegalAction[] = [];

  for (const action of rawActions) {
    const actionType = action.action_type ?? action.actionType ?? "";
    const actorId = action.actor_id ?? action.actorId ?? undefined;
    const description = action.description ?? "";
    const paramRanges = action.parameter_ranges ?? action.parameterRanges ?? {};
    const intensityRange: [number, number] = paramRanges.intensity ?? [0, 1];
    const resourceCost = action.resource_cost ?? action.resourceCost ?? 0;

    const availableLayers: string[] =
      action.available_layers ?? action.availableLayers ?? [];

    if (availableLayers.length === 0) {
      mapped.push({
        actionType,
        targetDomain: "",
        targetActorId: actorId ? String(actorId) : undefined,
        description,
        intensityRange,
        estimatedStressImpact: resourceCost,
      });
    } else {
      for (const layer of availableLayers) {
        mapped.push({
          actionType,
          targetDomain: String(layer),
          targetActorId: actorId ? String(actorId) : undefined,
          description: `${description} [${layer}]`,
          intensityRange,
          estimatedStressImpact: resourceCost,
        });
      }
    }
  }

  return mapped;
}
