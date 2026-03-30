import apiClient from "./client";
import { ScenarioRead, ScenarioCreate, ScenarioSummary } from "../types/scenario";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export async function listScenarios(): Promise<ScenarioSummary[]> {
  const response = await apiClient.get<PaginatedResponse<ScenarioSummary>>("/scenarios");
  return response.data.items;
}

export async function getScenario(id: string): Promise<ScenarioRead> {
  const response = await apiClient.get<ScenarioRead>(`/scenarios/${id}`);
  return response.data;
}

export async function createScenario(data: ScenarioCreate): Promise<ScenarioRead> {
  const response = await apiClient.post<ScenarioRead>("/scenarios", data);
  return response.data;
}

export async function deleteScenario(id: string): Promise<void> {
  await apiClient.delete(`/scenarios/${id}`);
}
