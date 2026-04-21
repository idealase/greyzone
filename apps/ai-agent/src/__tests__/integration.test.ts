import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import http from "node:http";
import express from "express";
import type { LegalAction } from "../types/index.js";
import type { GameState } from "../types/state.js";

// Mock axios at the module level so all imports use the mock
vi.mock("axios", () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  return {
    default: {
      get: mockGet,
      post: mockPost,
      create: vi.fn().mockReturnThis(),
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    },
  };
});

import axios from "axios";
import healthRouter from "../routes/health.js";
import aiTurnRouter from "../routes/aiTurn.js";
import advisorRouter from "../routes/advisor.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedAxios = axios as any;

function makeGameState(): GameState {
  return {
    runId: "run-integration",
    turn: 2,
    phase: "Crisis",
    orderParameter: 0.35,
    domains: [
      {
        domain: "cyber",
        stress: 0.55,
        resilience: 0.6,
        couplingStrength: { kinetic: 0.3 },
        recentEvents: ["Probing activity detected"],
      },
      {
        domain: "kinetic",
        stress: 0.25,
        resilience: 0.75,
        couplingStrength: { cyber: 0.2 },
        recentEvents: [],
      },
    ],
    actors: [
      {
        actorId: "blue-1",
        role: "blue_commander",
        resources: 0.7,
        morale: 0.65,
        visibility: { cyber: true, kinetic: true },
      },
    ],
    events: [],
    metadata: {
      scenarioId: "test-scenario",
      maxTurns: 20,
      phaseThresholds: [
        { phase: "Competition", orderParameterMin: 0, orderParameterMax: 0.3 },
        { phase: "Crisis", orderParameterMin: 0.3, orderParameterMax: 0.6 },
      ],
    },
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
      actionType: "deescalate",
      targetDomain: "kinetic",
      description: "Signal de-escalation",
      intensityRange: [0.1, 0.6],
      estimatedStressImpact: -0.08,
    },
  ];
}

function request(
  server: http.Server,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === "string") {
      reject(new Error("Server not listening"));
      return;
    }

    const data = body ? JSON.stringify(body) : undefined;

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path,
        method: method.toUpperCase(),
        headers: {
          "Content-Type": "application/json",
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode ?? 500,
              body: JSON.parse(raw),
            });
          } catch {
            resolve({
              status: res.statusCode ?? 500,
              body: { raw },
            });
          }
        });
      }
    );

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

describe("Integration: POST /ai/take-turn", () => {
  let server: http.Server;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use("/health", healthRouter);
    app.use("/ai", aiTurnRouter);
    app.use("/ai", advisorRouter);

    server = app.listen(0); // random port
    await new Promise<void>((resolve) => server.on("listening", resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();

    const state = makeGameState();
    const actions = makeLegalActions();

    mockedAxios.get.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/state")) {
        return Promise.resolve({ data: state });
      }
      if (typeof url === "string" && url.includes("/legal-actions")) {
        return Promise.resolve({ data: actions });
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    mockedAxios.post.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/actions")) {
        return Promise.resolve({
          data: { success: true, appliedEffects: { stress: -0.03 }, message: "Applied" },
        });
      }
      if (typeof url === "string" && url.includes("/advance-turn")) {
        return Promise.resolve({
          data: { success: true, nextTurn: 3, message: "Turn advanced" },
        });
      }
      if (typeof url === "string" && url.includes("/audit")) {
        return Promise.resolve({ data: { ok: true } });
      }
      return Promise.reject(new Error(`Unexpected POST: ${url}`));
    });
  });

  it("GET /health returns ok status", async () => {
    const result = await request(server, "GET", "/health");
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: "ok", version: "0.1.0" });
  });

  it("POST /ai/take-turn with valid body returns action decision", async () => {
    const result = await request(server, "POST", "/ai/take-turn", {
      runId: "run-integration",
      roleId: "blue_commander",
    });

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.action).toBeDefined();
    expect(result.body.rationale).toBeDefined();
  });

  it("POST /ai/take-turn without runId returns 400", async () => {
    const result = await request(server, "POST", "/ai/take-turn", {
      roleId: "blue_commander",
    });

    expect(result.status).toBe(400);
    expect((result.body.error as string)).toContain("runId");
  });

  it("POST /ai/take-turn without roleId returns 400", async () => {
    const result = await request(server, "POST", "/ai/take-turn", {
      runId: "run-1",
    });

    expect(result.status).toBe(400);
    expect((result.body.error as string)).toContain("roleId");
  });

  it("POST /ai/take-turn with backend failure returns error", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Backend unreachable"));

    const result = await request(server, "POST", "/ai/take-turn", {
      runId: "run-1",
      roleId: "blue_commander",
    });

    expect([422, 500]).toContain(result.status);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toBeDefined();
  });

  it("POST /ai/advisor with valid body returns ranked suggestions", async () => {
    const result = await request(server, "POST", "/ai/advisor", {
      runId: "00000000-0000-0000-0000-000000000001",
      roleId: "blue_commander",
      maxSuggestions: 1,
    });

    expect(result.status).toBe(200);
    expect(typeof result.body.stateSummary).toBe("string");
    expect(typeof result.body.strategicOutlook).toBe("string");
    expect(Array.isArray(result.body.suggestions)).toBe(true);
    expect((result.body.suggestions as unknown[]).length).toBe(1);
    const firstSuggestion = (result.body.suggestions as Record<string, unknown>[])[0];
    expect(firstSuggestion.rank).toBe(1);
    expect(firstSuggestion.action).toBeDefined();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("POST /ai/advisor without runId returns 400", async () => {
    const result = await request(server, "POST", "/ai/advisor", {
      roleId: "blue_commander",
    });

    expect(result.status).toBe(400);
    expect((result.body.error as string)).toContain("runId");
  });

  it("POST /ai/advisor without roleId returns 400", async () => {
    const result = await request(server, "POST", "/ai/advisor", {
      runId: "00000000-0000-0000-0000-000000000001",
    });

    expect(result.status).toBe(400);
    expect((result.body.error as string)).toContain("roleId");
  });

  it("POST /ai/advisor with invalid runId returns 400", async () => {
    const result = await request(server, "POST", "/ai/advisor", {
      runId: "run-1",
      roleId: "blue_commander",
    });

    expect(result.status).toBe(400);
    expect((result.body.error as string)).toContain("runId");
  });

  it("POST /ai/advisor with invalid maxSuggestions returns 400", async () => {
    const result = await request(server, "POST", "/ai/advisor", {
      runId: "00000000-0000-0000-0000-000000000001",
      roleId: "blue_commander",
      maxSuggestions: 0,
    });

    expect(result.status).toBe(400);
    expect((result.body.error as string)).toContain("maxSuggestions");
  });

  it("POST /ai/advisor with backend failure returns 500", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Backend unreachable"));

    const result = await request(server, "POST", "/ai/advisor", {
      runId: "00000000-0000-0000-0000-000000000001",
      roleId: "blue_commander",
    });

    expect(result.status).toBe(500);
    expect(result.body.error).toBeDefined();
  });
});
