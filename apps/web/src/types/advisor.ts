import { DomainLayer } from "./domain";

export interface AdvisorRequest {
  run_id: string;
  role_id: string;
  max_suggestions?: number;
}

export interface AdvisorSuggestedAction {
  action_type: string;
  target_domain: DomainLayer | string;
  target_actor?: string | null;
  intensity: number;
}

export interface AdvisorExpectedLocalEffects {
  summary?: string;
  stress_delta?: number;
  resilience_delta?: number;
}

export interface AdvisorSuggestion {
  rank: number;
  action: AdvisorSuggestedAction;
  rationale: string;
  confidence: number;
  expected_local_effects?: AdvisorExpectedLocalEffects;
}

export interface AdvisorResponse {
  state_summary: string;
  strategic_outlook: string;
  suggestions: AdvisorSuggestion[];
}
