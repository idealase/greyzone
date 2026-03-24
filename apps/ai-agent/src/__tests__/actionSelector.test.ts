import { describe, it, expect, beforeEach, vi } from "vitest";
import { ActionSelector } from "../services/actionSelector.js";
import { ToolExecutor } from "../services/toolExecutor.js";
import { StateCompiler } from "../services/stateCompiler.js";
import { Guardrails } from "../services/guardrails.js";
import { AuditLogger } from "../services/auditLogger.js";
import type { AiClient } from "../services/aiClient.js";
import type { TurnBrief, LegalAction, ActionDecision, GuardrailConfig } from "../types/index.js";
import type { GameState } from "../types/state.js";

// Mock the tool imports so ToolExecutor does not make real HTTP calls
vi.mock("../tools/getTurnBrief.js", () => ({
  getTurnBrief: vi.fn(),
}));
vi.mock("../tools/getRoleVisibleState.js", () => ({
  getRoleVisibleState: vi.fn(),
}));
vi.mock("../tools/listLegalActions.js", () => ({
  listLegalActions: vi.fn(),
}));
vi.mock("../tools/inspectAction.js", () => ({
  inspectAction: vi.fn(),
}));
vi.mock("../tools/estimateLocalEffects.js", () => ({
  estimateLocalEffects: vi.fn(),
}));
vi.mock("../tools/submitAction.js", () => ({
  submitAction: vi.fn(),
}));
vi.mock("../tools/endTurn.js", () => ({
  endTurn: vi.fn(),
}));

const { getTurnBrief } = await import("../tools/getTurnBrief.js");
const { listLegalActions } = await import("../tools/listLegalActions.js");
const { submitAction } = await import("../tools/submitAction.js");
const { endTurn } = await import("../tools/endTurn.js");

const mockedGetTurnBrief = vi.mocked(getTurnBrief);
const mockedListLegalActions = vi.mocked(listLegalActions);
const mockedSubmitAction = vi.mocked(submitAction);
const mockedEndTurn = vi.mocked(endTurn);

function makeBrief(): TurnBrief {
  return {
    role: "blue_commander",
    turn: 3,
    phase: "Crisis",
    orderParameter: 0.35,
    salientChanges: ["Cyber stress rose by 0.10"],
    currentObjectives: ["De-escalate while maintaining deterrence"],
    constraints: ["Current phase: Crisis"],
    strategicTradeoffs: ["Escalation vs stability"],
    legalActionCount: 2,
    domainSummary: [
      {
        domain: "cyber",
        stress: 0.6,
        resilience: 0.5,
        trend: "rising",
        keyEvents: ["Intrusion detected"],
      },
      {
        domain: "kinetic",
        stress: 0.3,
        resilience: 0.7,
        trend: "stable",
        keyEvents: [],
      },
    ],
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

function makeGuardrailConfig(): GuardrailConfig {
  return {
    maxToolCalls: 10,
    maxRetries: 2,
    maxThinkingTime: 30000,
    forbiddenActions: [],
  };
}

describe("ActionSelector", () => {
  let mockAiClient: AiClient;
  let toolExecutor: ToolExecutor;
  let stateCompiler: StateCompiler;
  let guardrails: Guardrails;
  let auditLogger: AuditLogger;
  let selector: ActionSelector;

  beforeEach(() => {
    vi.clearAllMocks();

    const guardrailConfig = makeGuardrailConfig();

    mockAiClient = {
      selectAction: vi.fn<AiClient["selectAction"]>().mockResolvedValue({
        actionType: "cyber_defense_hardening",
        targetDomain: "cyber",
        intensity: 0.5,
        rationale: "Cyber stress is rising, need to harden defenses.",
        confidence: 0.85,
      }),
    };

    toolExecutor = new ToolExecutor(guardrailConfig);
    stateCompiler = new StateCompiler();
    guardrails = new Guardrails(guardrailConfig);
    auditLogger = new AuditLogger("http://localhost:8000/api/v1");

    // Mock audit logger to avoid HTTP calls
    vi.spyOn(auditLogger, "log").mockResolvedValue(undefined);

    selector = new ActionSelector(
      mockAiClient,
      toolExecutor,
      stateCompiler,
      guardrails,
      auditLogger
    );

    // Setup tool mocks for happy path
    mockedGetTurnBrief.mockResolvedValue(makeBrief());
    mockedListLegalActions.mockResolvedValue(makeLegalActions());
    mockedSubmitAction.mockResolvedValue({
      success: true,
      appliedEffects: { stress: -0.03 },
      message: "Action applied",
    });
    mockedEndTurn.mockResolvedValue({
      success: true,
      nextTurn: 4,
      message: "Turn advanced",
    });
  });

  it("completes happy path: brief, actions, select, submit, end turn", async () => {
    const result = await selector.takeTurn("run-1", "blue_commander");

    expect(result.success).toBe(true);
    expect(result.action).toBeDefined();
    expect(result.action?.actionType).toBe("cyber_defense_hardening");
    expect(result.action?.targetDomain).toBe("cyber");
    expect(result.toolCalls.length).toBeGreaterThan(0);

    // Verify tools were called in order
    expect(mockedGetTurnBrief).toHaveBeenCalledWith("run-1", "blue_commander");
    expect(mockedListLegalActions).toHaveBeenCalledWith("run-1", "blue_commander");
    expect(mockedSubmitAction).toHaveBeenCalled();
    expect(mockedEndTurn).toHaveBeenCalledWith("run-1", "blue_commander");
  });

  it("handles validation failure gracefully with fallback", async () => {
    // AI returns an action not in the legal list
    (mockAiClient.selectAction as ReturnType<typeof vi.fn>).mockResolvedValue({
      actionType: "nuclear_strike",
      targetDomain: "kinetic",
      intensity: 1.0,
      rationale: "Invalid action",
      confidence: 0.9,
    });

    const result = await selector.takeTurn("run-1", "blue_commander");

    // Fallback should pick first legal action
    expect(result.success).toBe(true);
    expect(result.action?.actionType).toBe("cyber_defense_hardening");
  });

  it("respects tool call budget", async () => {
    const tightConfig: GuardrailConfig = {
      maxToolCalls: 2,
      maxRetries: 2,
      maxThinkingTime: 30000,
      forbiddenActions: [],
    };

    const tightExecutor = new ToolExecutor(tightConfig);
    const tightGuardrails = new Guardrails(tightConfig);

    const tightSelector = new ActionSelector(
      mockAiClient,
      tightExecutor,
      stateCompiler,
      tightGuardrails,
      auditLogger
    );

    // With only 2 tool calls allowed, we can get brief and legal actions
    // but submitAction will be blocked
    const result = await tightSelector.takeTurn("run-1", "blue_commander");

    // Should fail due to tool budget exhaustion
    expect(result.success).toBe(false);
    expect(result.error).toContain("Max tool calls exceeded");
  });

  it("returns no-action response when legal actions list is empty", async () => {
    mockedListLegalActions.mockResolvedValue([]);

    const result = await selector.takeTurn("run-1", "blue_commander");

    expect(result.success).toBe(true);
    expect(result.action).toBeUndefined();
    expect(result.rationale).toContain("No legal actions available");
  });

  it("handles tool execution error gracefully", async () => {
    mockedGetTurnBrief.mockRejectedValue(new Error("Network timeout"));

    const result = await selector.takeTurn("run-1", "blue_commander");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network timeout");
  });
});
