import axios from "axios";
import { config } from "../config.js";
import { StateCompiler } from "../services/stateCompiler.js";
import type { TurnBrief } from "../types/index.js";
import { mapRunStateToGameState, mapLegalActionsResponse } from "../mappers/apiResponse.js";

const stateCompiler = new StateCompiler();

export async function getTurnBrief(
  runId: string,
  roleId: string,
  userId?: string
): Promise<TurnBrief> {
  const effectiveUserId = userId ?? config.aiUserId;
  const [stateResponse, actionsResponse] = await Promise.all([
    axios.get(
      `${config.apiBaseUrl}/runs/${runId}/state`,
      {
        params: { role_id: roleId },
        timeout: 10000,
        headers: { "X-Service-Key": config.internalServiceKey, "X-User-Id": effectiveUserId },
      }
    ),
    axios.get(
      `${config.apiBaseUrl}/runs/${runId}/legal-actions`,
      {
        params: { role_id: roleId },
        timeout: 10000,
        headers: { "X-Service-Key": config.internalServiceKey, "X-User-Id": effectiveUserId },
      }
    ),
  ]);

  const currentState = mapRunStateToGameState(stateResponse.data);
  const legalActions = mapLegalActionsResponse(actionsResponse.data);

  return stateCompiler.compileTurnBrief(runId, roleId, currentState, legalActions);
}
