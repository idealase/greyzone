import apiClient from "./client";
import { ScenarioRead, ScenarioCreate, ScenarioSummary } from "../types/scenario";

export async function listScenarios(): Promise<ScenarioSummary[]> {
  const response = await apiClient.get<ScenarioSummary[]>("/scenarios");
  return response.data;
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
