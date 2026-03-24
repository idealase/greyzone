import axios from "axios";
import { config } from "../config.js";
import type { GameState } from "../types/state.js";

export async function getRoleVisibleState(
  runId: string,
  roleId: string
): Promise<GameState> {
  const response = await axios.get<GameState>(
    `${config.apiBaseUrl}/runs/${runId}/state`,
    { params: { role_id: roleId }, timeout: 10000 }
  );

  return response.data;
}
