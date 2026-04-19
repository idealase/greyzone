import axios from "axios";
import { config } from "../config.js";

export interface SubmitActionResult {
  success: boolean;
  appliedEffects: Record<string, number>;
  message: string;
}

export async function submitAction(
  runId: string,
  roleId: string,
  action: Record<string, unknown>
): Promise<SubmitActionResult> {
  const payload = {
    roleId,
    actionType: action.actionType,
    targetDomain: action.targetDomain,
    targetActorId: action.targetActorId,
    intensity: action.intensity,
    rationale: action.rationale,
  };

  const response = await axios.post<SubmitActionResult>(
    `${config.apiBaseUrl}/runs/${runId}/actions`,
    payload,
    {
      timeout: 10000,
      headers: { "X-Service-Key": config.internalServiceKey, "X-User-Id": config.aiUserId },
    }
  );

  return response.data;
}
