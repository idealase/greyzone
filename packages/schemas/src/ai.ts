import { z } from "zod";
import { ActionType } from "./actions.js";
import { DomainLayer } from "./domains.js";

export const AiTurnRequest = z.object({
  runId: z.string().uuid(),
  roleId: z.string(),
});
export type AiTurnRequest = z.infer<typeof AiTurnRequest>;

export const ToolCallLog = z.object({
  tool: z.string(),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
  durationMs: z.number(),
});
export type ToolCallLog = z.infer<typeof ToolCallLog>;

export const ActionDecision = z.object({
  actionType: z.string(),
  targetDomain: z.string(),
  targetActorId: z.string().uuid().optional(),
  intensity: z.number().min(0).max(1),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
});
export type ActionDecision = z.infer<typeof ActionDecision>;

export const AiTurnResponse = z.object({
  success: z.boolean(),
  action: ActionDecision.optional(),
  rationale: z.string(),
  toolCalls: z.array(ToolCallLog),
  error: z.string().optional(),
});
export type AiTurnResponse = z.infer<typeof AiTurnResponse>;

export const AiAuditEntry = z.object({
  runId: z.string().uuid(),
  turn: z.number(),
  roleId: z.string(),
  promptSummary: z.string(),
  toolCalls: z.array(ToolCallLog),
  selectedAction: ActionDecision.nullable(),
  rationale: z.string(),
  validationResult: z.string(),
  appliedEffects: z.record(z.string(), z.unknown()),
});
export type AiAuditEntry = z.infer<typeof AiAuditEntry>;

export const DomainSummary = z.object({
  domain: z.string(),
  stress: z.number(),
  resilience: z.number(),
  trend: z.enum(["rising", "falling", "stable"]),
  keyEvents: z.array(z.string()),
});
export type DomainSummary = z.infer<typeof DomainSummary>;

export const TurnBrief = z.object({
  role: z.string(),
  turn: z.number(),
  phase: z.string(),
  orderParameter: z.number(),
  salientChanges: z.array(z.string()),
  currentObjectives: z.array(z.string()),
  constraints: z.array(z.string()),
  strategicTradeoffs: z.array(z.string()),
  legalActionCount: z.number(),
  domainSummary: z.array(DomainSummary),
});
export type TurnBrief = z.infer<typeof TurnBrief>;

export const AdvisorRequest = z.object({
  runId: z.string().uuid(),
  roleId: z.string(),
  maxSuggestions: z.number().int().min(1).max(10).default(3),
});
export type AdvisorRequest = z.infer<typeof AdvisorRequest>;

export const AdvisorApiRequest = z.object({
  run_id: z.string().uuid(),
  role_id: z.string(),
  max_suggestions: z.number().int().min(1).max(10).default(3),
});
export type AdvisorApiRequest = z.infer<typeof AdvisorApiRequest>;

export const AdvisorSuggestedAction = z.object({
  actionType: ActionType,
  targetDomain: DomainLayer,
  targetActorId: z.string().optional(),
  intensity: z.number().min(0).max(1),
});
export type AdvisorSuggestedAction = z.infer<typeof AdvisorSuggestedAction>;

export const AdvisorExpectedLocalEffects = z.object({
  summary: z.string().optional(),
  stressDelta: z.number().optional(),
  resilienceDelta: z.number().optional(),
});
export type AdvisorExpectedLocalEffects = z.infer<typeof AdvisorExpectedLocalEffects>;

export const AdvisorSuggestion = z.object({
  rank: z.number().int().min(1),
  action: AdvisorSuggestedAction,
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  expectedLocalEffects: AdvisorExpectedLocalEffects.optional(),
});
export type AdvisorSuggestion = z.infer<typeof AdvisorSuggestion>;

export const AdvisorResponse = z.object({
  stateSummary: z.string(),
  strategicOutlook: z.string(),
  suggestions: z.array(AdvisorSuggestion),
});
export type AdvisorResponse = z.infer<typeof AdvisorResponse>;

export const AdvisorApiSuggestedAction = z.object({
  action_type: ActionType,
  target_domain: DomainLayer,
  target_actor: z.string().optional(),
  intensity: z.number().min(0).max(1),
});
export type AdvisorApiSuggestedAction = z.infer<typeof AdvisorApiSuggestedAction>;

export const AdvisorApiExpectedLocalEffects = z.object({
  summary: z.string().optional(),
  stress_delta: z.number().optional(),
  resilience_delta: z.number().optional(),
});
export type AdvisorApiExpectedLocalEffects = z.infer<typeof AdvisorApiExpectedLocalEffects>;

export const AdvisorApiSuggestion = z.object({
  rank: z.number().int().min(1),
  action: AdvisorApiSuggestedAction,
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  expected_local_effects: AdvisorApiExpectedLocalEffects.optional(),
});
export type AdvisorApiSuggestion = z.infer<typeof AdvisorApiSuggestion>;

export const AdvisorApiResponse = z.object({
  state_summary: z.string(),
  strategic_outlook: z.string(),
  suggestions: z.array(AdvisorApiSuggestion),
});
export type AdvisorApiResponse = z.infer<typeof AdvisorApiResponse>;
