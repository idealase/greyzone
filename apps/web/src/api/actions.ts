import apiClient from "./client";
import { ActionSubmit, ActionRead, AiMoveResult } from "../types/action";

export async function submitAction(data: ActionSubmit): Promise<ActionRead> {
  const response = await apiClient.post<ActionRead>(
    `/runs/${data.run_id}/actions`,
    data
  );
  return response.data;
}

export async function getActions(
  runId: string,
  turn?: number
): Promise<ActionRead[]> {
  const params = turn !== undefined ? { turn } : {};
  const response = await apiClient.get<ActionRead[]>(
    `/runs/${runId}/actions`,
    { params }
  );
  return response.data;
}

export async function getAiMoves(
  runId: string,
  turn?: number
): Promise<AiMoveResult[]> {
  const params = turn !== undefined ? { turn } : {};
  const response = await apiClient.get<AiMoveResult[]>(
    `/runs/${runId}/ai-moves`,
    { params }
  );
  return response.data;
}
