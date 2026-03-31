import apiClient from "./client";
import { WorldState, TurnEvent } from "../types/run";
import { EventRead } from "../types/event";
import { Phase } from "../types/phase";

export interface ReplayTurn {
  turn: number;
  world_state: WorldState;
  events: TurnEvent[];
}

export interface ReplaySnapshot {
  id: string;
  turn: number;
  state: WorldState;
  created_at?: string;
}

export interface ReplayEvent {
  id: string;
  turn: number;
  event_type: string;
  payload: Record<string, unknown>;
  visibility?: string;
}

export interface ReplayData {
  run_id: string;
  scenario_name?: string;
  total_turns: number;
  turns: ReplayTurn[];
  missing_turns: number[];
}

type ReplayApiResponse = Partial<ReplayData> & {
  snapshots?: ReplaySnapshot[];
  events?: ReplayEvent[];
};

const emptyWorldState = (turn: number): WorldState => ({
  turn,
  phase: Phase.CompetitiveNormality,
  order_parameter: 0,
  layers: {} as WorldState["layers"],
  coupling_matrix: {},
});

function mapEventsByTurn(events: ReplayEvent[]): Map<number, TurnEvent[]> {
  const byTurn = new Map<number, TurnEvent[]>();
  events.forEach((evt, idx) => {
    const payload = (evt.payload ?? {}) as Record<string, unknown>;
    const description =
      typeof payload.description === "string"
        ? payload.description
        : evt.event_type.replace("_", " ");
    const domain =
      (payload.domain as TurnEvent["domain"] | undefined | null) ?? null;
    const actor = (payload.actor as string | undefined | null) ?? null;
    const type =
      (payload.type as TurnEvent["type"] | undefined) ?? "stochastic";

    const normalized: TurnEvent = {
      id: evt.id ?? `${evt.turn}-${idx}`,
      type,
      description,
      domain,
      actor,
      turn: evt.turn,
      visibility: (evt.visibility as TurnEvent["visibility"]) ?? "all",
    };

    const list = byTurn.get(evt.turn) ?? [];
    list.push(normalized);
    byTurn.set(evt.turn, list);
  });
  return byTurn;
}

function buildTurns(apiData: ReplayApiResponse): ReplayTurn[] {
  const eventsByTurn = mapEventsByTurn(apiData.events ?? []);
  const turnsByTurn = new Map<number, ReplayTurn>();

  (apiData.turns ?? []).forEach((turn) => {
    turnsByTurn.set(turn.turn, {
      ...turn,
      events: eventsByTurn.get(turn.turn) ?? turn.events ?? [],
    });
  });

  (apiData.snapshots ?? []).forEach((snapshot) => {
    if (turnsByTurn.has(snapshot.turn)) {
      return;
    }
    const worldState = (snapshot.state ?? emptyWorldState(snapshot.turn)) as WorldState;
    turnsByTurn.set(snapshot.turn, {
      turn: snapshot.turn,
      world_state: {
        ...emptyWorldState(snapshot.turn),
        ...worldState,
        turn: (worldState as WorldState).turn ?? snapshot.turn,
      },
      events: eventsByTurn.get(snapshot.turn) ?? [],
    });
  });

  return Array.from(turnsByTurn.values()).sort(
    (a, b) => a.turn - b.turn
  );
}

export async function getReplayData(runId: string): Promise<ReplayData> {
  const response = await apiClient.get<ReplayApiResponse>(
    `/runs/${runId}/replay`
  );
  const apiData = response.data;

  const turns = buildTurns(apiData);
  const total_turns =
    typeof apiData.total_turns === "number"
      ? apiData.total_turns
      : turns.length;
  const missing_turns =
    apiData.missing_turns ??
    (total_turns > 0
      ? Array.from({ length: total_turns }, (_, idx) => idx).filter(
          (turn) => !turns.some((t) => t.turn === turn)
        )
      : []);

  return {
    run_id: apiData.run_id ?? runId,
    scenario_name: apiData.scenario_name ?? "",
    total_turns,
    turns,
    missing_turns,
  };
}

export async function getRunEvents(
  runId: string,
  turn?: number
): Promise<EventRead[]> {
  const params = turn !== undefined ? { turn } : {};
  const response = await apiClient.get<EventRead[]>(
    `/runs/${runId}/events`,
    { params }
  );
  return response.data;
}
