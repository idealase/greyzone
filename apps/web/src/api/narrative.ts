import apiClient from "./client";
import type { TurnNarrative } from "../types/narrative";

export async function getTurnNarrative(runId: string, turn: number): Promise<TurnNarrative> {
  const res = await apiClient.get<TurnNarrative>(`/runs/${runId}/turns/${turn}/narrative`);
  return res.data;
}

export async function generateNarrative(runId: string): Promise<TurnNarrative> {
  const res = await apiClient.post<TurnNarrative>(`/runs/${runId}/narrative/generate`);
  return res.data;
}
