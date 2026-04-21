import axios from "axios";
import { config } from "../config.js";
import type { GameState } from "../types/state.js";
import { mapRunStateToGameState } from "../mappers/apiResponse.js";

export async function getRoleVisibleState(
  runId: string,
  roleId: string,
  userId?: string
): Promise<GameState> {
  const effectiveUserId = userId ?? config.aiUserId;
  const response = await axios.get(
    `${config.apiBaseUrl}/runs/${runId}/state`,
    {
      params: { role_id: roleId },
      timeout: 10000,
      headers: { "X-Service-Key": config.internalServiceKey, "X-User-Id": effectiveUserId },
    }
  );

  return mapRunStateToGameState(response.data);
}
