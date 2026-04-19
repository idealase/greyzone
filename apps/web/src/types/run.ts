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
  owner_id?: string;
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
  owner_id?: string;
  current_turn: number;
  current_phase: Phase;
  participant_count?: number;
  created_at: string;
  participants?: RunParticipant[];
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

export interface WorldStateActor {
  id: string;
  name: string;
  kind: string;
  capabilities: Record<string, number>;
  resources: number;
  morale: number;
  visibility: string | { RoleScoped: string[] };
}

export interface WorldStateRole {
  id: string;
  name: string;
  controlled_actor_ids: string[];
  allied_actor_ids: string[];
}

export interface WorldState {
  layers: Record<DomainLayer, LayerState>;
  phase: Phase;
  order_parameter: number;
  turn: number;
  coupling_matrix: Record<string, Record<string, number>>;
  actors?: WorldStateActor[];
  roles?: WorldStateRole[];
}

export interface JoinRunRequest {
  user_id: string;
  role_id: string;
  is_ai?: boolean;
}

export interface LegalAction {
  action_type: string;
  actor_id: string;
  available_layers: string[];
  description: string;
  parameter_ranges: { intensity: [number, number] };
  resource_cost: number;
  // Backward compat fields (optional)
  target_domain?: DomainLayer;
  target_actor?: string | null;
  min_intensity?: number;
  max_intensity?: number;
  side?: "blue" | "red";
}

export interface NarrativeData {
  headline: string;
  body: string;
  domain_highlights: Array<{
    domain: string;
    label: string;
    direction: "rising" | "falling" | "stable";
    delta: number;
    note: string;
  }>;
  threat_assessment: string;
  intelligence_note: string | null;
}

export interface AiActionEvent {
  type: string;
  description: string;
  layer: string;
  role_id: string;
  action_type: string;
  intensity: number;
}

export interface TurnResult {
  turn: number;
  phase: Phase;
  order_parameter: number;
  world_state: WorldState;
  events: TurnEvent[];
  phase_changed: boolean;
  previous_phase: Phase | null;
  narrative: NarrativeData | null;
  ai_actions: AiActionEvent[];
}

export interface TurnEvent {
  id: string;
  type: "action" | "stochastic" | "phase_transition" | "coupling_effect" | "ai_action" | "narrative" | "intel" | "threat";
  description: string;
  domain: DomainLayer | null;
  actor: string | null;
  turn: number;
  visibility: "all" | "blue" | "red";
}
