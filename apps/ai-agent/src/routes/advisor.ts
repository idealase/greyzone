import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { ToolExecutor } from "../services/toolExecutor.js";
import { AdvisorService } from "../services/advisorService.js";

const router = Router();

const AdvisorRequestSchema = z.object({
  runId: z.string().uuid(),
  roleId: z.string().min(1),
  maxSuggestions: z.number().int().min(1).max(10).optional(),
});

router.post("/advisor", async (req: Request, res: Response) => {
  const parsed = AdvisorRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path.length > 0 ? issue.path.join(".") : "request";
    res.status(400).json({ error: `Invalid '${field}': ${issue.message}` });
    return;
  }

  const { runId, roleId, maxSuggestions = 3 } = parsed.data;

  try {
    const minToolBudget = 2 + maxSuggestions * 2 + 2;
    const toolExecutor = new ToolExecutor({
      ...config.guardrails,
      maxToolCalls: Math.max(config.guardrails.maxToolCalls, minToolBudget),
    });
    const advisor = new AdvisorService(toolExecutor);

    const result = await advisor.advise(runId, roleId, maxSuggestions);
    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
