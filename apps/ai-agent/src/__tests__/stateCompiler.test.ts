import { describe, it, expect, beforeEach } from "vitest";
import { StateCompiler } from "../services/stateCompiler.js";
import type { LegalAction } from "../types/index.js";
import type { GameState } from "../types/state.js";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    runId: "run-1",
    turn: 1,
    phase: "Competition",
    orderParameter: 0.2,
    domains: [
      {
        domain: "kinetic",
        stress: 0.3,
        resilience: 0.7,
        couplingStrength: { cyber: 0.4 },
        recentEvents: ["Naval exercise observed"],
      },
      {
        domain: "cyber",
        stress: 0.5,
        resilience: 0.6,
        couplingStrength: { kinetic: 0.3 },
        recentEvents: ["Phishing campaign detected"],
      },
    ],
    actors: [
      {
        actorId: "blue-1",
        role: "blue_commander",
        resources: 0.8,
        morale: 0.7,
        visibility: { kinetic: true, cyber: true },
      },
    ],
    events: [
      {
        eventId: "evt-1",
        turn: 1,
        domain: "cyber",
        type: "attack",
        description: "Minor cyber probing detected",
        effects: { stress: 0.02 },
      },
    ],
    metadata: {
      scenarioId: "scenario-1",
      maxTurns: 20,
      phaseThresholds: [
        { phase: "Competition", orderParameterMin: 0, orderParameterMax: 0.3 },
        { phase: "Crisis", orderParameterMin: 0.3, orderParameterMax: 0.6 },
      ],
    },
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

describe("StateCompiler", () => {
  let compiler: StateCompiler;

  beforeEach(() => {
    compiler = new StateCompiler();
  });

  it("produces correct briefings from raw state", async () => {
    const state = makeState();
    const actions = makeLegalActions();
    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state, actions);

    expect(brief.role).toBe("blue_commander");
    expect(brief.turn).toBe(1);
    expect(brief.phase).toBe("Competition");
    expect(brief.orderParameter).toBe(0.2);
    expect(brief.legalActionCount).toBe(2);
    expect(brief.domainSummary).toHaveLength(2);
    expect(brief.currentObjectives.length).toBeGreaterThan(0);
    expect(brief.constraints.length).toBeGreaterThan(0);
  });

  it("detects rising trend when stress increases between turns", async () => {
    const state1 = makeState({ turn: 1 });
    const state2 = makeState({
      turn: 2,
      domains: [
        {
          domain: "kinetic",
          stress: 0.3,
          resilience: 0.7,
          couplingStrength: { cyber: 0.4 },
          recentEvents: [],
        },
        {
          domain: "cyber",
          stress: 0.7, // rose from 0.5
          resilience: 0.6,
          couplingStrength: { kinetic: 0.3 },
          recentEvents: [],
        },
      ],
    });

    const actions = makeLegalActions();

    // First call caches state
    await compiler.compileTurnBrief("run-1", "blue_commander", state1, actions);

    // Second call detects changes
    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state2, actions);

    const cyberSummary = brief.domainSummary.find((d) => d.domain === "cyber");
    expect(cyberSummary?.trend).toBe("rising");
  });

  it("detects falling trend when stress decreases between turns", async () => {
    const state1 = makeState({ turn: 1 });
    const state2 = makeState({
      turn: 2,
      domains: [
        {
          domain: "kinetic",
          stress: 0.3,
          resilience: 0.7,
          couplingStrength: { cyber: 0.4 },
          recentEvents: [],
        },
        {
          domain: "cyber",
          stress: 0.2, // fell from 0.5
          resilience: 0.6,
          couplingStrength: { kinetic: 0.3 },
          recentEvents: [],
        },
      ],
    });

    const actions = makeLegalActions();

    await compiler.compileTurnBrief("run-1", "blue_commander", state1, actions);
    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state2, actions);

    const cyberSummary = brief.domainSummary.find((d) => d.domain === "cyber");
    expect(cyberSummary?.trend).toBe("falling");
  });

  it("reports stable trend when stress changes are minor", async () => {
    const state1 = makeState({ turn: 1 });
    const state2 = makeState({
      turn: 2,
      domains: [
        {
          domain: "kinetic",
          stress: 0.31, // negligible change from 0.3
          resilience: 0.7,
          couplingStrength: { cyber: 0.4 },
          recentEvents: [],
        },
        {
          domain: "cyber",
          stress: 0.51, // negligible change from 0.5
          resilience: 0.6,
          couplingStrength: { kinetic: 0.3 },
          recentEvents: [],
        },
      ],
    });

    const actions = makeLegalActions();

    await compiler.compileTurnBrief("run-1", "blue_commander", state1, actions);
    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state2, actions);

    for (const summary of brief.domainSummary) {
      expect(summary.trend).toBe("stable");
    }
  });

  it("computes role-specific objectives for red commander", async () => {
    const state = makeState();
    const actions = makeLegalActions();

    const brief = await compiler.compileTurnBrief("run-1", "red_commander", state, actions);

    expect(brief.currentObjectives.some((o) => o.includes("Probe") || o.includes("leverage"))).toBe(
      true
    );
  });

  it("computes role-specific objectives for blue commander", async () => {
    const state = makeState();
    const actions = makeLegalActions();

    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state, actions);

    expect(
      brief.currentObjectives.some((o) => o.includes("alliance") || o.includes("resilience") || o.includes("deterrence"))
    ).toBe(true);
  });

  it("handles missing previous state gracefully (first turn)", async () => {
    const state = makeState();
    const actions = makeLegalActions();

    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state, actions);

    expect(brief.salientChanges).toContain("First turn - no prior state to compare");
    // All trends should be stable when there is no previous state
    for (const summary of brief.domainSummary) {
      expect(summary.trend).toBe("stable");
    }
  });

  it("detects salient stress changes above threshold", async () => {
    const state1 = makeState({ turn: 1 });
    const state2 = makeState({
      turn: 2,
      domains: [
        {
          domain: "kinetic",
          stress: 0.5, // rose from 0.3 by 0.2
          resilience: 0.7,
          couplingStrength: { cyber: 0.4 },
          recentEvents: [],
        },
        {
          domain: "cyber",
          stress: 0.5,
          resilience: 0.6,
          couplingStrength: { kinetic: 0.3 },
          recentEvents: [],
        },
      ],
    });

    const actions = makeLegalActions();

    await compiler.compileTurnBrief("run-1", "blue_commander", state1, actions);
    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state2, actions);

    expect(brief.salientChanges.some((c) => c.includes("kinetic") && c.includes("stress"))).toBe(
      true
    );
  });

  it("clears cache correctly", async () => {
    const state = makeState();
    const actions = makeLegalActions();

    await compiler.compileTurnBrief("run-1", "blue_commander", state, actions);
    compiler.clearCache("run-1");

    // After clearing, should behave like first turn again
    const brief = await compiler.compileTurnBrief("run-1", "blue_commander", state, actions);
    expect(brief.salientChanges).toContain("First turn - no prior state to compare");
  });
});
