import { DomainLayer } from "./domain";

export interface EventRead {
  id: string;
  run_id: string;
  type: EventType;
  description: string;
  domain: DomainLayer | null;
  actor: string | null;
  turn: number;
  visibility: "all" | "blue" | "red";
  data: Record<string, unknown>;
  created_at: string;
}

export type EventType =
  | "action_executed"
  | "stochastic_event"
  | "phase_transition"
  | "coupling_cascade"
  | "stress_threshold"
  | "resilience_recovery"
  | "ai_move"
  | "player_joined"
  | "player_left"
  | "turn_advanced";
