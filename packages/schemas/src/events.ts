import { z } from "zod";
import { Phase } from "./phases.js";
import { DomainLayer } from "./domains.js";
import { ActionType } from "./actions.js";

export const EventType = z.enum([
  "ActionApplied",
  "StochasticEvent",
  "PhaseTransition",
  "TurnAdvanced",
  "SnapshotTaken",
  "PlayerJoined",
  "RunStarted",
  "RunPaused",
  "RunResumed",
  "RunCompleted",
]);
export type EventType = z.infer<typeof EventType>;

export const EventRead = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  turn: z.number(),
  event_type: EventType,
  payload: z.record(z.string(), z.unknown()),
  visibility: z.string(),
  created_at: z.string(),
});
export type EventRead = z.infer<typeof EventRead>;

export const SnapshotRead = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  turn: z.number(),
  state: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});
export type SnapshotRead = z.infer<typeof SnapshotRead>;
