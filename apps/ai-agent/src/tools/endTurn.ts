export interface EndTurnResult {
  success: boolean;
  nextTurn: number;
  message: string;
}

// No-op: the API controls turn advancement via run_manager.advance_turn().
// The AI agent must NOT call advance-turn itself because that triggers
// another AI auto-play cycle, creating an infinite recursive loop.
export async function endTurn(
  _runId: string,
  _roleId: string
): Promise<EndTurnResult> {
  return {
    success: true,
    nextTurn: -1,
    message: "Turn signoff acknowledged (API manages advancement)",
  };
}
