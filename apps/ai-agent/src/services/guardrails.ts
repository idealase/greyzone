import type { ActionDecision, GuardrailConfig, LegalAction } from "../types/index.js";

export class Guardrails {
  private recentActions: ActionDecision[] = [];

  constructor(private config: GuardrailConfig) {}

  validateToolCall(
    toolName: string,
    callCount: number
  ): { allowed: boolean; reason?: string } {
    if (callCount >= this.config.maxToolCalls) {
      return {
        allowed: false,
        reason: `Max tool calls exceeded (limit: ${this.config.maxToolCalls})`,
      };
    }
    return { allowed: true };
  }

  validateActionDecision(
    decision: ActionDecision,
    legalActions: LegalAction[]
  ): { valid: boolean; reason?: string } {
    // Check action is in legal actions list
    const matchingAction = legalActions.find(
      (la) =>
        la.actionType === decision.actionType &&
        la.targetDomain === decision.targetDomain
    );

    if (!matchingAction) {
      return {
        valid: false,
        reason: `Action "${decision.actionType}" targeting "${decision.targetDomain}" is not in the legal actions list`,
      };
    }

    // Check intensity is within allowed range
    const [minIntensity, maxIntensity] = matchingAction.intensityRange;
    if (decision.intensity < minIntensity || decision.intensity > maxIntensity) {
      return {
        valid: false,
        reason: `Intensity ${decision.intensity} is outside allowed range [${minIntensity}, ${maxIntensity}]`,
      };
    }

    // Check forbidden actions
    if (this.config.forbiddenActions.includes(decision.actionType)) {
      return {
        valid: false,
        reason: `Action "${decision.actionType}" is forbidden by guardrail config`,
      };
    }

    // Check for loop
    if (this.detectLoop([...this.recentActions, decision])) {
      return {
        valid: false,
        reason: "Loop detected: last 3 actions are identical",
      };
    }

    return { valid: true };
  }

  detectLoop(recentActions: ActionDecision[]): boolean {
    if (recentActions.length < 3) return false;

    const last3 = recentActions.slice(-3);
    const allSame = last3.every(
      (a) =>
        a.actionType === last3[0].actionType &&
        a.targetDomain === last3[0].targetDomain &&
        Math.abs(a.intensity - last3[0].intensity) < 0.01
    );

    return allSame;
  }

  recordAction(decision: ActionDecision): void {
    this.recentActions.push(decision);
    // Keep only last 10 actions
    if (this.recentActions.length > 10) {
      this.recentActions = this.recentActions.slice(-10);
    }
  }

  reset(): void {
    this.recentActions = [];
  }
}
