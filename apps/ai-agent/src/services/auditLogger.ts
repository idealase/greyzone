import axios from "axios";
import pino from "pino";
import type { AiAuditEntry } from "../types/index.js";

const logger = pino({ level: "info" });

export class AuditLogger {
  constructor(private apiBaseUrl: string) {}

  async log(entry: AiAuditEntry): Promise<void> {
    logger.info(
      {
        runId: entry.runId,
        turn: entry.turn,
        roleId: entry.roleId,
        action: entry.selectedAction?.actionType ?? "none",
        domain: entry.selectedAction?.targetDomain ?? "none",
        intensity: entry.selectedAction?.intensity ?? 0,
        confidence: entry.selectedAction?.confidence ?? 0,
        validationResult: entry.validationResult,
        toolCallCount: entry.toolCalls.length,
      },
      "AI decision audit"
    );

    try {
      await axios.post(`${this.apiBaseUrl}/ai/audit`, entry, {
        timeout: 5000,
      });
    } catch (err) {
      // Audit log persistence failure is non-fatal
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        "Failed to persist audit log to backend API"
      );
    }
  }
}
