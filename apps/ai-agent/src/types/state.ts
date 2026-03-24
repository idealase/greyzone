import type { Domain } from "./actions.js";

export interface GameState {
  runId: string;
  turn: number;
  phase: string;
  orderParameter: number;
  domains: DomainState[];
  actors: ActorState[];
  events: GameEvent[];
  metadata: GameMetadata;
}

export interface DomainState {
  domain: Domain | string;
  stress: number;
  resilience: number;
  couplingStrength: Record<string, number>;
  recentEvents: string[];
}

export interface ActorState {
  actorId: string;
  role: string;
  resources: number;
  morale: number;
  visibility: Record<string, boolean>;
}

export interface GameEvent {
  eventId: string;
  turn: number;
  domain: string;
  type: string;
  description: string;
  effects: Record<string, number>;
}

export interface GameMetadata {
  scenarioId: string;
  maxTurns: number;
  phaseThresholds: PhaseThreshold[];
}

export interface PhaseThreshold {
  phase: string;
  orderParameterMin: number;
  orderParameterMax: number;
}

export const PHASES = [
  "Competition",
  "Crisis",
  "HybridCoercion",
  "WarTransition",
  "LimitedWar",
  "Escalation",
] as const;

export type Phase = (typeof PHASES)[number];
