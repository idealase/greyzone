import apiClient from "./client";
import {
  RunRead,
  RunCreate,
  RunSummary,
  JoinRunRequest,
  LegalAction,
  TurnResult,
} from "../types/run";

export async function listRuns(): Promise<RunSummary[]> {
  const response = await apiClient.get<RunSummary[]>("/runs");
  return response.data;
}

export async function getRun(id: string): Promise<RunRead> {
  const response = await apiClient.get<RunRead>(`/runs/${id}`);
  return response.data;
}

export async function createRun(data: RunCreate): Promise<RunRead> {
  const response = await apiClient.post<RunRead>("/runs", data);
  return response.data;
}

export async function joinRun(runId: string, data: JoinRunRequest): Promise<RunRead> {
  const response = await apiClient.post<RunRead>(`/runs/${runId}/join`, data);
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
  const response = await apiClient.get<LegalAction[]>(
    `/runs/${runId}/legal-actions?side=${side}`
  );
  return response.data;
}

export async function advanceTurn(runId: string): Promise<TurnResult> {
  const response = await apiClient.post<TurnResult>(`/runs/${runId}/advance`);
  return response.data;
}

export async function abortRun(runId: string): Promise<void> {
  await apiClient.post(`/runs/${runId}/abort`);
}
