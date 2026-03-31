import { describe, it, expect } from "vitest";
import { HeuristicAiClient } from "../services/aiClient.js";
import type { LegalAction, TurnBrief } from "../types/index.js";

const brief: TurnBrief = {
  role: "red_commander",
  turn: 5,
  phase: "Crisis",
  orderParameter: 0.62,
  salientChanges: ["Information stress rising"],
  currentObjectives: ["Pressure Blue logistics"],
  constraints: ["Fog of war in maritime"],
  strategicTradeoffs: ["Escalation vs. exposure"],
  legalActionCount: 2,
  domainSummary: [
    {
      domain: "cyber",
      stress: 0.82,
      resilience: 0.35,
      trend: "rising",
      keyEvents: ["Blue patching cadence slowing"],
    },
    {
      domain: "information",
      stress: 0.28,
      resilience: 0.7,
      trend: "stable",
      keyEvents: [],
    },
  ],
};

const actions: LegalAction[] = [
  {
    actionType: "cyber_offensive",
    targetDomain: "cyber",
    description: "Launch offensive cyber operation",
    intensityRange: [0.35, 0.95],
    estimatedStressImpact: 0.18,
  },
  {
    actionType: "public_reassurance",
    targetDomain: "information",
    description: "Calm domestic narratives",
    intensityRange: [0.1, 0.55],
    estimatedStressImpact: -0.08,
  },
];

describe("HeuristicAiClient", () => {
  it("prefers high-stress domains with higher intensity selection", async () => {
    const client = new HeuristicAiClient();

    const decision = await client.selectAction(brief, actions, "", "", []);

    expect(decision.targetDomain).toBe("cyber");
    expect(decision.intensity).toBeGreaterThan(0.65);
    expect(decision.intensity).toBeLessThanOrEqual(actions[0].intensityRange[1]);
  });
});
