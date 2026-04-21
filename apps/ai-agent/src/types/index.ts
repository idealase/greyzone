import type { ActionType, Domain } from "./actions.js";

export interface TurnContext {
  runId: string;
  roleId: string;
  turn: number;
  phase: string;
  orderParameter: number;
}

export interface TurnBrief {
  role: string;
  turn: number;
  phase: string;
  orderParameter: number;
  salientChanges: string[];
  currentObjectives: string[];
  constraints: string[];
  strategicTradeoffs: string[];
  legalActionCount: number;
  domainSummary: DomainSummary[];
}

export interface DomainSummary {
  domain: string;
  stress: number;
  resilience: number;
  trend: "rising" | "falling" | "stable";
  keyEvents: string[];
}

export interface LegalAction {
  actionType: string;
  targetDomain: string;
  targetActorId?: string;
  description: string;
  intensityRange: [number, number];
  estimatedStressImpact: number;
}

export interface ActionDecision {
  actionType: string;
  targetDomain: string;
  targetActorId?: string;
  intensity: number;
  rationale: string;
  confidence: number;
}

export interface AiTurnRequest {
  runId: string;
  roleId: string;
}

export interface AiTurnResponse {
  success: boolean;
  action?: ActionDecision;
  rationale: string;
  toolCalls: ToolCallLog[];
  error?: string;
}

export interface ToolCallLog {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
}

export interface AiAuditEntry {
  runId: string;
  turn: number;
  roleId: string;
  promptSummary: string;
  toolCalls: ToolCallLog[];
  selectedAction: ActionDecision | null;
  rationale: string;
  validationResult: string;
  appliedEffects: Record<string, unknown>;
}

export interface GuardrailConfig {
  maxToolCalls: number;
  maxRetries: number;
  maxThinkingTime: number;
  forbiddenActions: string[];
}

export interface AdvisorRequest {
  runId: string;
  roleId: string;
  maxSuggestions?: number;
}

export interface AdvisorSuggestedAction {
  actionType: ActionType | string;
  targetDomain: Domain | string;
  targetActorId?: string;
  intensity: number;
}

export interface AdvisorExpectedLocalEffects {
  summary?: string;
  stressDelta?: number;
  resilienceDelta?: number;
}

export interface AdvisorSuggestion {
  rank: number;
  action: AdvisorSuggestedAction;
  rationale: string;
  confidence: number;
  expectedLocalEffects?: AdvisorExpectedLocalEffects;
}

export interface AdvisorResponse {
  stateSummary: string;
  strategicOutlook: string;
  suggestions: AdvisorSuggestion[];
}
