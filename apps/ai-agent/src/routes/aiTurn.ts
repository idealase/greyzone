import { Router } from "express";
import type { Request, Response } from "express";
import { ActionSelector } from "../services/actionSelector.js";
import { ToolExecutor } from "../services/toolExecutor.js";
import { StateCompiler } from "../services/stateCompiler.js";
import { Guardrails } from "../services/guardrails.js";
import { AuditLogger } from "../services/auditLogger.js";
import { createAiClient } from "../services/aiClient.js";
import { config } from "../config.js";

const router = Router();

router.post("/take-turn", async (req: Request, res: Response) => {
  const { runId, roleId } = req.body as { runId?: string; roleId?: string };

  if (!runId || typeof runId !== "string") {
    res.status(400).json({ error: "Missing or invalid 'runId' in request body" });
    return;
  }

  if (!roleId || typeof roleId !== "string") {
    res.status(400).json({ error: "Missing or invalid 'roleId' in request body" });
    return;
  }

  try {
    const aiClient = createAiClient();
    const toolExecutor = new ToolExecutor(config.guardrails);
    const stateCompiler = new StateCompiler();
    const guardrails = new Guardrails(config.guardrails);
    const auditLogger = new AuditLogger(config.apiBaseUrl);

    const actionSelector = new ActionSelector(
      aiClient,
      toolExecutor,
      stateCompiler,
      guardrails,
      auditLogger
    );

    const result = await actionSelector.takeTurn(runId, roleId);

    const statusCode = result.success ? 200 : 422;
    res.status(statusCode).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      rationale: "Internal server error during AI turn",
      toolCalls: [],
      error: message,
    });
  }
});

export default router;
