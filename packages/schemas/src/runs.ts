import { z } from "zod";
import { Phase } from "./phases.js";
import { DomainLayer, LayerState, Actor } from "./domains.js";

export const RunStatus = z.enum([
  "created",
  "lobby",
  "running",
  "paused",
  "completed",
  "aborted",
]);
export type RunStatus = z.infer<typeof RunStatus>;

export const RunCreate = z.object({
  scenario_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  seed: z.number().int().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
});
export type RunCreate = z.infer<typeof RunCreate>;

export const RunParticipant = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  username: z.string(),
  role_id: z.string(),
  is_ai: z.boolean(),
  joined_at: z.string(),
});
export type RunParticipant = z.infer<typeof RunParticipant>;

export const RunRead = z.object({
  id: z.string().uuid(),
  scenario_id: z.string().uuid(),
  name: z.string(),
  status: RunStatus,
  seed: z.number(),
  current_turn: z.number(),
  current_phase: Phase,
  config: z.record(z.string(), z.unknown()),
  participants: z.array(RunParticipant).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RunRead = z.infer<typeof RunRead>;

export const WorldStateResponse = z.object({
  turn: z.number(),
  phase: Phase,
  order_parameter: z.number(),
  layers: z.record(DomainLayer, LayerState),
  actors: z.array(Actor),
  recent_events: z.array(z.unknown()),
  role_id: z.string().optional(),
});
export type WorldStateResponse = z.infer<typeof WorldStateResponse>;

export const RunJoin = z.object({
  user_id: z.string().uuid(),
  role_id: z.string(),
});
export type RunJoin = z.infer<typeof RunJoin>;

export const MetricsResponse = z.object({
  turn: z.number(),
  phase: Phase,
  order_parameter: z.number(),
  domain_stresses: z.record(DomainLayer, z.number()),
  domain_resiliences: z.record(DomainLayer, z.number()),
  average_stress: z.number(),
  average_resilience: z.number(),
  escalation_velocity: z.number(),
  dominant_domain: DomainLayer,
  phase_history: z.array(z.object({ turn: z.number(), phase: Phase })),
});
export type MetricsResponse = z.infer<typeof MetricsResponse>;
