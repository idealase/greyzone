import apiClient from "./client";
import { WorldState, TurnEvent } from "../types/run";
import { EventRead } from "../types/event";

export interface ReplayTurn {
  turn: number;
  world_state: WorldState;
  events: TurnEvent[];
}

export interface ReplayData {
  run_id: string;
  scenario_name: string;
  total_turns: number;
  turns: ReplayTurn[];
}

export async function getReplayData(runId: string): Promise<ReplayData> {
  const response = await apiClient.get<ReplayData>(`/runs/${runId}/replay`);
  return response.data;
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
