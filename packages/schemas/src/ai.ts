import { z } from "zod";

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
