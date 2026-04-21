import apiClient from "./client";
import { AdvisorRequest, AdvisorResponse } from "../types/advisor";

type AdvisorRequestPayload = Pick<
  AdvisorRequest,
  "run_id" | "role_id" | "max_suggestions"
>;

export async function requestAdvisorGuidance(
  request: AdvisorRequest
): Promise<AdvisorResponse> {
  const payload: AdvisorRequestPayload = {
    run_id: request.run_id,
    role_id: request.role_id,
    max_suggestions: request.max_suggestions,
  };
  const response = await apiClient.post<AdvisorResponse>(
    `/runs/${request.run_id}/advisor`,
    payload
  );
  return response.data;
}
