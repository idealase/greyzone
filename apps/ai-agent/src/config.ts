import type { GuardrailConfig } from "./types/index.js";

export const config = {
  port: parseInt(process.env.AI_AGENT_PORT || "3100"),
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8000/api/v1",
  aiUserId:
    process.env.AI_USER_ID || "00000000-0000-0000-0002-000000000001",
  internalServiceKey:
    process.env.INTERNAL_SERVICE_KEY || "dev-internal-service-key",
  copilotApiKey: process.env.COPILOT_API_KEY || "",
  copilotModel: process.env.COPILOT_MODEL || "gpt-4",
  useMockAi: process.env.USE_MOCK_AI !== "false",
  logLevel: process.env.LOG_LEVEL || "info",
  guardrails: {
    maxToolCalls: 10,
    maxRetries: 2,
    maxThinkingTime: 30000,
    forbiddenActions: [],
  } satisfies GuardrailConfig,
};
