import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("createAiClient factory", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses HeuristicAiClient when USE_MOCK_AI is unset and no API key is present", async () => {
    vi.stubEnv("USE_MOCK_AI", "");
    vi.stubEnv("COPILOT_API_KEY", "");

    const { createAiClient, HeuristicAiClient } = await import(
      "../services/aiClient.js"
    );
    const client = createAiClient();
    expect(client).toBeInstanceOf(HeuristicAiClient);
  });

  it("uses HeuristicAiClient when USE_MOCK_AI=true even if API key is present", async () => {
    vi.stubEnv("USE_MOCK_AI", "true");
    vi.stubEnv("COPILOT_API_KEY", "sk-test-key");

    const { createAiClient, HeuristicAiClient } = await import(
      "../services/aiClient.js"
    );
    const client = createAiClient();
    expect(client).toBeInstanceOf(HeuristicAiClient);
  });

  it("uses CopilotAiClient when USE_MOCK_AI is not 'true' and API key is set", async () => {
    vi.stubEnv("USE_MOCK_AI", "");
    vi.stubEnv("COPILOT_API_KEY", "sk-test-key");

    const { createAiClient, CopilotAiClient } = await import(
      "../services/aiClient.js"
    );
    const client = createAiClient();
    expect(client).toBeInstanceOf(CopilotAiClient);
  });

  it("uses CopilotAiClient when USE_MOCK_AI=false and API key is set", async () => {
    vi.stubEnv("USE_MOCK_AI", "false");
    vi.stubEnv("COPILOT_API_KEY", "sk-test-key");

    const { createAiClient, CopilotAiClient } = await import(
      "../services/aiClient.js"
    );
    const client = createAiClient();
    expect(client).toBeInstanceOf(CopilotAiClient);
  });

  it("falls back to HeuristicAiClient when USE_MOCK_AI=false but no API key", async () => {
    vi.stubEnv("USE_MOCK_AI", "false");
    vi.stubEnv("COPILOT_API_KEY", "");

    const { createAiClient, HeuristicAiClient } = await import(
      "../services/aiClient.js"
    );
    const client = createAiClient();
    expect(client).toBeInstanceOf(HeuristicAiClient);
  });
});
