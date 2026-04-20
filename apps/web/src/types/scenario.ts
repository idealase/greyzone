import { DomainLayer } from "./domain";

/**
 * Scenario config as stored in DB and returned by API.
 * The config blob has roles, actors, initial_layers, stochastic_events, etc.
 */

export interface ScenarioRead {
  id: string;
  name: string;
  description: string;
  config: ScenarioConfig;
  created_at: string;
  updated_at: string;
}

export interface ScenarioConfig {
  roles: RoleConfig[];
  actors: RawActorConfig[];
  initial_layers?: Record<string, { stress: number; resilience: number }>;
  stochastic_events?: unknown[];
  coupling_matrix?: Record<string, Record<string, number>>;
  initial_phase?: string;
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  controlled_actors: string[];
}

export interface RawActorConfig {
  id: string;
  name: string;
  kind: string;
  capabilities: Record<string, number>;
  resources: number;
  morale: number;
  visibility: string | { RoleScoped: string[] };
}

export interface ScenarioCreate {
  name: string;
  description: string;
  author?: string;
  config?: ScenarioConfig;
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

/** Derived actor config for display in ScenarioBriefing. */
export interface ActorConfig {
  name: string;
  side: "blue" | "red" | "neutral";
  description: string;
  objectives: string[];
}

/**
 * Derive displayable ActorConfig list from raw scenario config.
 * Maps role.controlled_actors to determine side (blue/red/neutral).
 */
export function deriveActorConfigs(config: ScenarioConfig): ActorConfig[] {
  const blueRole = config.roles.find(
    (r) => r.id === "blue_commander" || r.name.toLowerCase().includes("blue"),
  );
  const redRole = config.roles.find(
    (r) => r.id === "red_commander" || r.name.toLowerCase().includes("red"),
  );

  const blueActorIds = new Set(blueRole?.controlled_actors ?? []);
  const redActorIds = new Set(redRole?.controlled_actors ?? []);

  return config.actors.map((actor) => {
    let side: "blue" | "red" | "neutral" = "neutral";
    if (blueActorIds.has(actor.id)) side = "blue";
    else if (redActorIds.has(actor.id)) side = "red";

    const topCapabilities = Object.entries(actor.capabilities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([domain]) => domain);

    return {
      name: actor.name,
      side,
      description: `${actor.kind} actor — primary strengths: ${topCapabilities.join(", ")}`,
      objectives:
        side === "blue"
          ? [`Supports ${blueRole?.name ?? "blue"} objectives`]
          : side === "red"
            ? [`Supports ${redRole?.name ?? "red"} objectives`]
            : ["Neutral party"],
    };
  });
}
