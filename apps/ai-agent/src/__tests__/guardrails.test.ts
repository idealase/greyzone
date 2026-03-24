import { describe, it, expect, beforeEach } from "vitest";
import { Guardrails } from "../services/guardrails.js";
import type { ActionDecision, GuardrailConfig, LegalAction } from "../types/index.js";

function makeConfig(overrides: Partial<GuardrailConfig> = {}): GuardrailConfig {
  return {
    maxToolCalls: 10,
    maxRetries: 2,
    maxThinkingTime: 30000,
    forbiddenActions: [],
    ...overrides,
  };
}

function makeLegalActions(): LegalAction[] {
  return [
    {
      actionType: "cyber_defense_hardening",
      targetDomain: "cyber",
      description: "Harden cyber defenses",
      intensityRange: [0.1, 0.8],
      estimatedStressImpact: -0.05,
    },
    {
      actionType: "military_posture",
      targetDomain: "kinetic",
      description: "Adjust military readiness",
      intensityRange: [0.2, 0.9],
      estimatedStressImpact: 0.1,
    },
  ];
}

function makeDecision(overrides: Partial<ActionDecision> = {}): ActionDecision {
  return {
    actionType: "cyber_defense_hardening",
    targetDomain: "cyber",
    intensity: 0.5,
    rationale: "Test rationale",
    confidence: 0.8,
    ...overrides,
  };
}

describe("Guardrails", () => {
  let guardrails: Guardrails;

  beforeEach(() => {
    guardrails = new Guardrails(makeConfig());
  });

  describe("validateToolCall", () => {
    it("allows tool calls within budget", () => {
      const result = guardrails.validateToolCall("getTurnBrief", 0);
      expect(result.allowed).toBe(true);
    });

    it("allows tool calls at the limit minus one", () => {
      const result = guardrails.validateToolCall("getTurnBrief", 9);
      expect(result.allowed).toBe(true);
    });

    it("blocks tool calls exceeding max budget", () => {
      const result = guardrails.validateToolCall("getTurnBrief", 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Max tool calls exceeded");
    });

    it("blocks tool calls well above budget", () => {
      const result = guardrails.validateToolCall("getTurnBrief", 15);
      expect(result.allowed).toBe(false);
    });

    it("respects custom maxToolCalls config", () => {
      const tightGuardrails = new Guardrails(makeConfig({ maxToolCalls: 3 }));
      expect(tightGuardrails.validateToolCall("test", 2).allowed).toBe(true);
      expect(tightGuardrails.validateToolCall("test", 3).allowed).toBe(false);
    });
  });

  describe("validateActionDecision", () => {
    it("validates a legal action successfully", () => {
      const decision = makeDecision();
      const legalActions = makeLegalActions();
      const result = guardrails.validateActionDecision(decision, legalActions);
      expect(result.valid).toBe(true);
    });

    it("rejects action not in legal actions list", () => {
      const decision = makeDecision({ actionType: "nuclear_strike" });
      const result = guardrails.validateActionDecision(decision, makeLegalActions());
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not in the legal actions list");
    });

    it("rejects action with mismatched domain", () => {
      const decision = makeDecision({ targetDomain: "energy" });
      const result = guardrails.validateActionDecision(decision, makeLegalActions());
      expect(result.valid).toBe(false);
    });

    it("rejects intensity below allowed range", () => {
      const decision = makeDecision({ intensity: 0.05 }); // min is 0.1
      const result = guardrails.validateActionDecision(decision, makeLegalActions());
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("outside allowed range");
    });

    it("rejects intensity above allowed range", () => {
      const decision = makeDecision({ intensity: 0.95 }); // max is 0.8
      const result = guardrails.validateActionDecision(decision, makeLegalActions());
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("outside allowed range");
    });

    it("handles forbidden actions", () => {
      const forbiddenGuardrails = new Guardrails(
        makeConfig({ forbiddenActions: ["cyber_defense_hardening"] })
      );
      const decision = makeDecision();
      const result = forbiddenGuardrails.validateActionDecision(
        decision,
        makeLegalActions()
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("forbidden");
    });
  });

  describe("detectLoop", () => {
    it("detects 3 identical consecutive actions", () => {
      const action = makeDecision();

      guardrails.recordAction(action);
      guardrails.recordAction(action);

      // The third identical action should cause loop detection
      const result = guardrails.validateActionDecision(action, makeLegalActions());
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Loop detected");
    });

    it("does not flag loop with varied actions", () => {
      guardrails.recordAction(makeDecision({ intensity: 0.3 }));
      guardrails.recordAction(makeDecision({ intensity: 0.5 }));

      // Third action is different enough
      const decision = makeDecision({ intensity: 0.7 });
      const result = guardrails.validateActionDecision(decision, makeLegalActions());
      expect(result.valid).toBe(true);
    });

    it("does not flag loop with fewer than 3 actions", () => {
      guardrails.recordAction(makeDecision());

      const result = guardrails.validateActionDecision(makeDecision(), makeLegalActions());
      expect(result.valid).toBe(true);
    });

    it("does not flag loop when action types differ", () => {
      guardrails.recordAction(makeDecision());
      guardrails.recordAction(
        makeDecision({
          actionType: "military_posture",
          targetDomain: "kinetic",
          intensity: 0.5,
        })
      );

      const decision = makeDecision();
      const result = guardrails.validateActionDecision(decision, makeLegalActions());
      expect(result.valid).toBe(true);
    });
  });

  describe("reset", () => {
    it("clears recent actions after reset", () => {
      const action = makeDecision();
      guardrails.recordAction(action);
      guardrails.recordAction(action);
      guardrails.reset();

      // After reset, same action should not trigger loop
      const result = guardrails.validateActionDecision(action, makeLegalActions());
      expect(result.valid).toBe(true);
    });
  });
});
