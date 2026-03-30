import { DomainLayer, LayerState } from "./domain";
import { Phase } from "./phase";

export type RunStatus = "created" | "lobby" | "in_progress" | "running" | "paused" | "completed" | "aborted";
export type Role = "blue_commander" | "red_commander" | "observer";

export interface RunRead {
  id: string;
  name: string;
  scenario_id: string;
  scenario_name?: string;
  status: RunStatus;
  current_turn: number;
  current_phase: Phase;
  order_parameter?: number;
  seed: number | null;
  world_state: WorldState | null;
  participants: RunParticipant[];
  created_at: string;
  updated_at: string;
}

export interface RunCreate {
  name: string;
  scenario_id: string;
  seed?: number | null;
}

export interface RunSummary {
  id: string;
  name: string;
  scenario_name?: string;
  status: RunStatus;
  current_turn: number;
  current_phase: Phase;
  participant_count?: number;
  created_at: string;
}

export interface RunParticipant {
  id?: string;
  user_id: string;
  username: string;
  display_name?: string;
  role: Role;
  role_id?: string;
  is_human: boolean;
  is_online?: boolean;
  joined_at: string;
}

export interface WorldState {
  layers: Record<DomainLayer, LayerState>;
  phase: Phase;
  order_parameter: number;
  turn: number;
  coupling_matrix: Record<string, Record<string, number>>;
}

export interface JoinRunRequest {
  user_id: string;
  role_id: string;
  is_ai?: boolean;
}

export interface LegalAction {
  action_type: string;
  target_domain: DomainLayer;
  target_actor: string | null;
  description: string;
  min_intensity: number;
  max_intensity: number;
  side: "blue" | "red";
}

export interface TurnResult {
  turn: number;
  phase: Phase;
  order_parameter: number;
  world_state: WorldState;
  events: TurnEvent[];
  phase_changed: boolean;
  previous_phase: Phase | null;
}

export interface TurnEvent {
  id: string;
  type: "action" | "stochastic" | "phase_transition" | "coupling_effect";
  description: string;
  domain: DomainLayer | null;
  actor: string | null;
  turn: number;
  visibility: "all" | "blue" | "red";
}
