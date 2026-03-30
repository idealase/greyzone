import { DomainLayer } from "./domain";

export interface ScenarioRead {
  id: string;
  name: string;
  description: string;
  author?: string;
  domain_config: Record<DomainLayer, DomainConfig>;
  actors: ActorConfig[];
  coupling_matrix: Record<string, Record<string, number>>;
  initial_phase: string;
  created_at: string;
  updated_at: string;
}

export interface ScenarioCreate {
  name: string;
  description: string;
  author?: string;
  domain_config?: Record<DomainLayer, DomainConfig>;
  actors?: ActorConfig[];
  coupling_matrix?: Record<string, Record<string, number>>;
  initial_phase?: string;
}

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  author?: string;
  created_at: string;
}

export interface DomainConfig {
  initial_stress: number;
  initial_resilience: number;
  stress_cap: number;
  variables: Record<string, number>;
}

export interface ActorConfig {
  name: string;
  side: "blue" | "red" | "neutral";
  description: string;
  objectives: string[];
}
