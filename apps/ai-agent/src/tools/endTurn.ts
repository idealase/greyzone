import axios from "axios";
import { config } from "../config.js";

export interface EndTurnResult {
  success: boolean;
  nextTurn: number;
  message: string;
}

export async function endTurn(
  runId: string,
  roleId: string
): Promise<EndTurnResult> {
  const response = await axios.post<EndTurnResult>(
    `${config.apiBaseUrl}/runs/${runId}/advance-turn`,
    { roleId },
    {
      timeout: 10000,
      headers: { "X-User-Id": config.aiUserId },
    }
  );

  return response.data;
}
