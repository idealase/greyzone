import { DomainLayer } from "./domain";

export interface ActionSubmit {
  run_id: string;
  user_id: string;
  action_type: string;
  target_domain: DomainLayer | string;
  target_actor: string | null;
  intensity: number;
}

export interface ActionRead {
  id: string;
  run_id: string;
  user_id: string;
  username: string;
  action_type: string;
  target_domain: DomainLayer;
  target_actor: string | null;
  intensity: number;
  turn: number;
  side: "blue" | "red";
  submitted_at: string;
}

export interface AiMoveResult {
  action: ActionRead;
  rationale: string;
  tool_calls: AiToolCall[];
  validation: AiValidation;
}

export interface AiToolCall {
  tool_name: string;
  arguments: Record<string, unknown>;
  result: string;
}

export interface AiValidation {
  is_valid: boolean;
  message: string;
}
