import apiClient from "./client";
import {
  RunRead,
  RunCreate,
  RunSummary,
  JoinRunRequest,
  LegalAction,
  TurnResult,
} from "../types/run";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export async function listRuns(): Promise<RunSummary[]> {
  const response = await apiClient.get<PaginatedResponse<RunSummary>>("/runs");
  return response.data.items;
}

export async function getRun(id: string): Promise<RunRead> {
  const response = await apiClient.get<RunRead>(`/runs/${id}`);
  return response.data;
}

export async function createRun(data: RunCreate): Promise<RunRead> {
  const response = await apiClient.post<RunRead>("/runs", data);
  return response.data;
}

export async function joinRun(runId: string, data: JoinRunRequest): Promise<unknown> {
  const response = await apiClient.post(`/runs/${runId}/join`, data);
  return response.data;
}

export async function leaveRun(runId: string, userId: string): Promise<void> {
  await apiClient.post(`/runs/${runId}/leave`, { user_id: userId });
}

export async function startRun(runId: string): Promise<RunRead> {
  const response = await apiClient.post<RunRead>(`/runs/${runId}/start`);
  return response.data;
}

export async function getLegalActions(
  runId: string,
  side: "blue" | "red"
): Promise<LegalAction[]> {
  const response = await apiClient.get(
    `/runs/${runId}/legal-actions?side=${side}`
  );
  return response.data.actions;
}

export async function quickStart(params: {
  scenario_id: string;
  user_id: string;
  name?: string;
  seed?: number;
}): Promise<RunRead> {
  const response = await apiClient.post('/runs/quick-start', params);
  return response.data;
}

export async function advanceTurn(runId: string): Promise<TurnResult> {
  const response = await apiClient.post<TurnResult>(`/runs/${runId}/advance`);
  return response.data;
}

export async function abortRun(runId: string): Promise<void> {
  await apiClient.post(`/runs/${runId}/abort`);
}
