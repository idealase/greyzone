import pino from "pino";
import type {
  ActionDecision,
  AiTurnResponse,
  LegalAction,
  TurnBrief,
} from "../types/index.js";
import type { AiClient } from "./aiClient.js";
import { ToolExecutor } from "./toolExecutor.js";
import { StateCompiler } from "./stateCompiler.js";
import { Guardrails } from "./guardrails.js";
import { AuditLogger } from "./auditLogger.js";
import { buildSystemPrompt } from "../prompts/systemPrompt.js";
import { buildTurnPrompt } from "../prompts/turnPrompt.js";
import { getToolDefinitions } from "../types/tools.js";
import { config } from "../config.js";

const logger = pino({ level: config.logLevel });

export class ActionSelector {
  constructor(
    private aiClient: AiClient,
    private toolExecutor: ToolExecutor,
    private stateCompiler: StateCompiler,
    private guardrails: Guardrails,
    private auditLogger: AuditLogger
  ) {}

  async takeTurn(runId: string, roleId: string): Promise<AiTurnResponse> {
    this.toolExecutor.reset();

    try {
      // 1. Get turn brief
      logger.info({ runId, roleId }, "Starting AI turn");

      const brief = (await this.toolExecutor.executeTool("getTurnBrief", {
        runId,
        roleId,
      })) as TurnBrief;

      // 2. Get legal actions
      const legalActions = (await this.toolExecutor.executeTool(
        "listLegalActions",
        { runId, roleId }
      )) as LegalAction[];

      if (legalActions.length === 0) {
        logger.warn({ runId, roleId }, "No legal actions available");

        await this.toolExecutor.executeTool("endTurn", { runId, roleId });

        return {
          success: true,
          rationale: "No legal actions available this turn. Ending turn.",
          toolCalls: this.toolExecutor.getCallLog(),
        };
      }

      // 3. Let AI client select action
      const systemPrompt = buildSystemPrompt(roleId);
      const turnPrompt = buildTurnPrompt(brief, legalActions);
      const tools = getToolDefinitions();

      const decision = await this.aiClient.selectAction(
        brief,
        legalActions,
        systemPrompt,
        turnPrompt,
        tools
      );

      // 4. Validate decision through guardrails
      const validation = this.guardrails.validateActionDecision(
        decision,
        legalActions
      );

      if (!validation.valid) {
        logger.warn(
          { runId, roleId, reason: validation.reason, decision },
          "Action validation failed"
        );

        // Attempt a retry with the heuristic as fallback
        const retryDecision = this.selectFallbackAction(legalActions, brief);
        const retryValidation = this.guardrails.validateActionDecision(
          retryDecision,
          legalActions
        );

        if (!retryValidation.valid) {
          await this.auditLog(runId, brief, null, "Validation failed after retry", validation.reason ?? "unknown");
          return {
            success: false,
            rationale: `Action validation failed: ${validation.reason}`,
            toolCalls: this.toolExecutor.getCallLog(),
            error: validation.reason,
          };
        }

        return await this.executeAndFinish(
          runId,
          roleId,
          brief,
          retryDecision,
          legalActions
        );
      }

      return await this.executeAndFinish(
        runId,
        roleId,
        brief,
        decision,
        legalActions
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error({ runId, roleId, error: errorMsg }, "AI turn failed");

      return {
        success: false,
        rationale: `AI turn failed: ${errorMsg}`,
        toolCalls: this.toolExecutor.getCallLog(),
        error: errorMsg,
      };
    }
  }

  private async executeAndFinish(
    runId: string,
    roleId: string,
    brief: TurnBrief,
    decision: ActionDecision,
    legalActions: LegalAction[]
  ): Promise<AiTurnResponse> {
    // Submit action
    let appliedEffects: Record<string, unknown> = {};
    try {
      const result = await this.toolExecutor.executeTool("submitAction", {
        runId,
        roleId,
        action: decision,
      });
      appliedEffects = (result as Record<string, unknown>) ?? {};
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error({ runId, roleId, error: errorMsg }, "Action submission failed");
      return {
        success: false,
        action: decision,
        rationale: `Action submission failed: ${errorMsg}`,
        toolCalls: this.toolExecutor.getCallLog(),
        error: errorMsg,
      };
    }

    // End turn
    try {
      await this.toolExecutor.executeTool("endTurn", { runId, roleId });
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        "End turn call failed (non-fatal)"
      );
    }

    // Record action in guardrails for loop detection
    this.guardrails.recordAction(decision);

    // Audit log
    await this.auditLog(runId, brief, decision, decision.rationale, "valid", appliedEffects);

    logger.info(
      {
        runId,
        roleId,
        action: decision.actionType,
        domain: decision.targetDomain,
        intensity: decision.intensity,
      },
      "AI turn completed"
    );

    return {
      success: true,
      action: decision,
      rationale: decision.rationale,
      toolCalls: this.toolExecutor.getCallLog(),
    };
  }

  private selectFallbackAction(
    legalActions: LegalAction[],
    brief: TurnBrief
  ): ActionDecision {
    // Simple fallback: pick the first legal action with moderate intensity
    const action = legalActions[0];
    const [min, max] = action.intensityRange;
    const intensity = Math.round(((min + max) / 2) * 100) / 100;

    return {
      actionType: action.actionType,
      targetDomain: action.targetDomain,
      targetActorId: action.targetActorId,
      intensity,
      rationale: `Fallback action selected after primary decision failed validation. Turn ${brief.turn}, Phase ${brief.phase}.`,
      confidence: 0.3,
    };
  }

  private async auditLog(
    runId: string,
    brief: TurnBrief,
    action: ActionDecision | null,
    rationale: string,
    validationResult: string,
    appliedEffects: Record<string, unknown> = {}
  ): Promise<void> {
    await this.auditLogger.log({
      runId,
      turn: brief.turn,
      roleId: brief.role,
      promptSummary: `Turn ${brief.turn}, Phase ${brief.phase}, OP ${brief.orderParameter.toFixed(3)}, ${brief.legalActionCount} actions available`,
      toolCalls: this.toolExecutor.getCallLog(),
      selectedAction: action,
      rationale,
      validationResult,
      appliedEffects,
    });
  }
}
