import axios from "axios";
import { config } from "../config.js";
import { StateCompiler } from "../services/stateCompiler.js";
import type { TurnBrief, LegalAction } from "../types/index.js";
import type { GameState } from "../types/state.js";

const stateCompiler = new StateCompiler();

export async function getTurnBrief(
  runId: string,
  roleId: string
): Promise<TurnBrief> {
  const [stateResponse, actionsResponse] = await Promise.all([
    axios.get<GameState>(
      `${config.apiBaseUrl}/runs/${runId}/state`,
      { params: { role_id: roleId }, timeout: 10000 }
    ),
    axios.get<LegalAction[]>(
      `${config.apiBaseUrl}/runs/${runId}/legal-actions`,
      { params: { role_id: roleId }, timeout: 10000 }
    ),
  ]);

  const currentState = stateResponse.data;
  const legalActions = actionsResponse.data;

  return stateCompiler.compileTurnBrief(runId, roleId, currentState, legalActions);
}
