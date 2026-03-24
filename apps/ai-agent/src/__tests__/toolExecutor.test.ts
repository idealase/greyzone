import { describe, it, expect, beforeEach, vi } from "vitest";
import { ToolExecutor } from "../services/toolExecutor.js";
import type { GuardrailConfig } from "../types/index.js";

// Mock all tool imports
vi.mock("../tools/getTurnBrief.js", () => ({
  getTurnBrief: vi.fn().mockResolvedValue({ role: "blue", turn: 1 }),
}));
vi.mock("../tools/getRoleVisibleState.js", () => ({
  getRoleVisibleState: vi.fn().mockResolvedValue({ runId: "run-1", turn: 1 }),
}));
vi.mock("../tools/listLegalActions.js", () => ({
  listLegalActions: vi.fn().mockResolvedValue([]),
}));
vi.mock("../tools/inspectAction.js", () => ({
  inspectAction: vi.fn().mockResolvedValue({ description: "test" }),
}));
vi.mock("../tools/estimateLocalEffects.js", () => ({
  estimateLocalEffects: vi.fn().mockResolvedValue({ stressDelta: 0.1 }),
}));
vi.mock("../tools/submitAction.js", () => ({
  submitAction: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("../tools/endTurn.js", () => ({
  endTurn: vi.fn().mockResolvedValue({ success: true }),
}));

function makeConfig(overrides: Partial<GuardrailConfig> = {}): GuardrailConfig {
  return {
    maxToolCalls: 10,
    maxRetries: 2,
    maxThinkingTime: 30000,
    forbiddenActions: [],
    ...overrides,
  };
}

describe("ToolExecutor", () => {
  let executor: ToolExecutor;

  beforeEach(() => {
    executor = new ToolExecutor(makeConfig());
  });

  it("counts calls correctly", async () => {
    expect(executor.getCallCount()).toBe(0);

    await executor.executeTool("getTurnBrief", { runId: "run-1", roleId: "blue" });
    expect(executor.getCallCount()).toBe(1);

    await executor.executeTool("listLegalActions", { runId: "run-1", roleId: "blue" });
    expect(executor.getCallCount()).toBe(2);
  });

  it("logs calls correctly", async () => {
    await executor.executeTool("getTurnBrief", { runId: "run-1", roleId: "blue" });

    const log = executor.getCallLog();
    expect(log).toHaveLength(1);
    expect(log[0].tool).toBe("getTurnBrief");
    expect(log[0].input).toEqual({ runId: "run-1", roleId: "blue" });
    expect(log[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("resets properly", async () => {
    await executor.executeTool("getTurnBrief", { runId: "run-1", roleId: "blue" });
    await executor.executeTool("listLegalActions", { runId: "run-1", roleId: "blue" });

    expect(executor.getCallCount()).toBe(2);
    expect(executor.getCallLog()).toHaveLength(2);

    executor.reset();

    expect(executor.getCallCount()).toBe(0);
    expect(executor.getCallLog()).toHaveLength(0);
  });

  it("enforces guardrails on tool call count", async () => {
    const tightExecutor = new ToolExecutor(makeConfig({ maxToolCalls: 2 }));

    await tightExecutor.executeTool("getTurnBrief", { runId: "run-1", roleId: "blue" });
    await tightExecutor.executeTool("listLegalActions", { runId: "run-1", roleId: "blue" });

    // Third call should be blocked
    await expect(
      tightExecutor.executeTool("endTurn", { runId: "run-1", roleId: "blue" })
    ).rejects.toThrow("Max tool calls exceeded");
  });

  it("throws for unknown tool names", async () => {
    await expect(
      executor.executeTool("nonexistentTool", {})
    ).rejects.toThrow("Unknown tool: nonexistentTool");
  });

  it("records errors in call log", async () => {
    const { getTurnBrief } = await import("../tools/getTurnBrief.js");
    vi.mocked(getTurnBrief).mockRejectedValueOnce(new Error("API down"));

    await expect(
      executor.executeTool("getTurnBrief", { runId: "run-1", roleId: "blue" })
    ).rejects.toThrow("API down");

    const log = executor.getCallLog();
    expect(log).toHaveLength(1);
    expect(log[0].output).toEqual({ error: "API down" });
  });

  it("returns a copy of the call log (not the internal reference)", async () => {
    await executor.executeTool("getTurnBrief", { runId: "run-1", roleId: "blue" });

    const log1 = executor.getCallLog();
    const log2 = executor.getCallLog();

    expect(log1).toEqual(log2);
    expect(log1).not.toBe(log2); // Different references
  });
});
