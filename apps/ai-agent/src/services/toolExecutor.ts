import pino from "pino";
import type { GuardrailConfig, ToolCallLog } from "../types/index.js";
import { Guardrails } from "./guardrails.js";
import { getTurnBrief } from "../tools/getTurnBrief.js";
import { getRoleVisibleState } from "../tools/getRoleVisibleState.js";
import { listLegalActions } from "../tools/listLegalActions.js";
import { inspectAction } from "../tools/inspectAction.js";
import { estimateLocalEffects } from "../tools/estimateLocalEffects.js";
import { submitAction } from "../tools/submitAction.js";
import { endTurn } from "../tools/endTurn.js";

const logger = pino({ level: "info" });

type ToolFunction = (input: Record<string, unknown>) => Promise<unknown>;

const TOOL_REGISTRY: Record<string, ToolFunction> = {
  getTurnBrief: (input) =>
    getTurnBrief(
      input.runId as string,
      input.roleId as string,
      input.userId as string | undefined
    ),
  getRoleVisibleState: (input) =>
    getRoleVisibleState(
      input.runId as string,
      input.roleId as string,
      input.userId as string | undefined
    ),
  listLegalActions: (input) =>
    listLegalActions(
      input.runId as string,
      input.roleId as string,
      input.userId as string | undefined
    ),
  inspectAction: (input) =>
    inspectAction(
      input.runId as string,
      input.actionType as string,
      input.targetDomain as string
    ),
  estimateLocalEffects: (input) =>
    estimateLocalEffects(input as Record<string, unknown>),
  submitAction: (input) =>
    submitAction(
      input.runId as string,
      input.roleId as string,
      input.action as Record<string, unknown>
    ),
  endTurn: (input) =>
    endTurn(input.runId as string, input.roleId as string),
};

export class ToolExecutor {
  private callCount = 0;
  private callLog: ToolCallLog[] = [];
  private guardrails: Guardrails;

  constructor(guardrailConfig: GuardrailConfig) {
    this.guardrails = new Guardrails(guardrailConfig);
  }

  async executeTool(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    // Check guardrails
    const validation = this.guardrails.validateToolCall(
      toolName,
      this.callCount
    );
    if (!validation.allowed) {
      const error = `Tool call blocked: ${validation.reason}`;
      logger.warn({ toolName, callCount: this.callCount }, error);
      throw new Error(error);
    }

    const toolFn = TOOL_REGISTRY[toolName];
    if (!toolFn) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const start = Date.now();
    this.callCount++;

    try {
      const output = await toolFn(input);
      const durationMs = Date.now() - start;

      const logEntry: ToolCallLog = {
        tool: toolName,
        input,
        output: (output ?? {}) as Record<string, unknown>,
        durationMs,
      };
      this.callLog.push(logEntry);

      logger.debug(
        { tool: toolName, durationMs, callCount: this.callCount },
        "Tool executed successfully"
      );

      return output;
    } catch (err) {
      const durationMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);

      this.callLog.push({
        tool: toolName,
        input,
        output: { error: errorMsg },
        durationMs,
      });

      logger.error(
        { tool: toolName, error: errorMsg, durationMs },
        "Tool execution failed"
      );
      throw err;
    }
  }

  getCallLog(): ToolCallLog[] {
    return [...this.callLog];
  }

  getCallCount(): number {
    return this.callCount;
  }

  reset(): void {
    this.callCount = 0;
    this.callLog = [];
  }
}
