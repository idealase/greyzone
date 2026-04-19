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
    user_id: config.aiUserId,
    role_id: roleId,
    action_type: action.actionType,
    target_domain: action.targetDomain,
    target_actor: action.targetActorId,
    intensity: action.intensity,
    action_payload: {
      rationale: action.rationale,
    },
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
