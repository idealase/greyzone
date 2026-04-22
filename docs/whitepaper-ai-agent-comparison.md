# Technical White Paper: AI Agent Architecture for Greyzone

## Current Implementation vs Claude Managed Agents

| Field | Value |
|---|---|
| **Version** | 1.0 |
| **Date** | April 2026 |
| **Status** | Internal / Draft |
| **Author** | Greyzone Engineering |
| **Scope** | AI Agent Service (`apps/ai-agent/`) |

### Abstract

This paper evaluates whether migrating the Greyzone AI agent from its current self-hosted
Node.js/Express service — which uses the GitHub Copilot API (GPT-4) with a deterministic
heuristic fallback — to Anthropic's Claude Managed Agents (CMA) service would improve
strategic reasoning quality, operational reliability, or cost efficiency for the game AI
use case.

**Conclusion**: The current architecture is the correct fit for the near term. CMA's
strengths — sandboxed code execution, long-running session management, built-in file and
web tools — are designed for multi-step agentic workflows and do not align with the
Greyzone AI agent's core task: selecting a single action per turn from a bounded set of
legal moves. The recommended improvement is to swap the LLM provider from GPT-4 via the
GitHub Copilot API to Claude via the direct Anthropic API, capturing the model quality
benefit without the managed agent overhead. CMA should be revisited when its multi-agent
coordination and persistent memory features exit research preview.

---

## 1. Executive Summary

### 1.1 Decision Question

Should the Greyzone AI agent migrate from its current self-hosted architecture to
Anthropic's Claude Managed Agents service?

### 1.2 Comparison Scorecard

| # | Dimension | Current | CMA | Verdict |
|---|---|:---:|:---:|---|
| 1 | Architecture Fit | 5 | 2 | Current — CMA is over-engineered for single-decision tasks |
| 2 | Model Quality | 3 | 5 | CMA models stronger, but accessible via direct API |
| 3 | Cost Efficiency | 5 | 3 | Current — $0 heuristic; CMA adds session-hour billing |
| 4 | Latency | 5 | 3 | Current — localhost vs cloud round-trips |
| 5 | Operational Complexity | 4 | 3 | Draw — CMA trades process management for callback infra |
| 6 | Control & Customization | 5 | 2 | Current — heuristic fallback, fine-grained guardrails |
| 7 | Vendor Lock-in | 5 | 2 | Current — `AiClient` interface makes providers swappable |
| 8 | Security & Data Privacy | 5 | 3 | Current — all state stays on the server |
| 9 | Scalability | 4 | 4 | Neither constrained; not a differentiator |
| 10 | Reliability & Degradation | 5 | 2 | Current — triple-layer fallback vs single point of failure |
| 11 | Future Roadmap | 3 | 4 | CMA research-preview features interesting for long-term |

**Overall**: Current 49 / CMA 33 (out of 55)

*Ratings: 1 = poor fit, 5 = excellent fit for the Greyzone AI agent use case.*

### 1.3 Bottom-Line Recommendation

**Stay on the current architecture**, with one targeted improvement:

1. **Swap GPT-4 via Copilot API for Claude Sonnet 4.6 via the direct Anthropic API**
   using the `@anthropic-ai/sdk` TypeScript package. This captures the model quality
   improvement without introducing managed agent infrastructure overhead. Estimated
   effort: 1-2 days.

2. **Preserve the heuristic fallback chain**: Claude API -> Heuristic. The
   `HeuristicAiClient` remains the zero-dependency safety net.

### 1.4 Conditions That Would Change This Recommendation

- Greyzone introduces **multi-agent coordination** (e.g. Red Commander + Red Diplomat
  agents collaborating on strategy) — CMA's multi-agent feature becomes relevant.
- Greyzone requires **persistent cross-game learning** (AI remembers strategies from
  prior games) — CMA's memory feature becomes relevant.
- CMA introduces a **lightweight synchronous mode** without session/container overhead.
- Deployment moves to **multiple servers** and the AI agent loses localhost access to
  FastAPI.

---

## 2. Background

### 2.1 Greyzone System Overview

Greyzone is a polycrisis geopolitical simulation featuring 8 interconnected domains
(Kinetic, Maritime, Energy, Geoeconomic, Cyber, Space, Information, Domestic Political),
6 escalation phases (Competition through Limited War), and multiplayer support with
simultaneous move resolution.

The system comprises four primary services:

```
Browser (React 19)
    │ HTTPS / WSS
    ▼
Nginx (:8020 reverse proxy)
    ├─→ Static Files (dist/)
    └─→ FastAPI Control Plane (:8010)
           ├─→ Rust Simulation Engine (subprocess, sole state authority)
           ├─→ PostgreSQL (:5432, append-only event log)
           └─→ AI Agent Service (:3100)
```

The AI agent fills a player role (Red Commander or Blue Commander) and participates
through the same action submission pipeline as human players. It never directly mutates
simulation state — it reads compiled state and submits actions through the standard REST
API. Fog of war applies equally to AI and human players.

For the full architecture specification, see `docs/architecture.md`.

### 2.2 The AI Agent Decision Problem

Each turn, the AI agent performs a constrained, synchronous decision task:

1. **Receive trigger**: FastAPI sends `POST /ai/take-turn` with `runId` and `roleId`.
2. **Fetch state**: Agent calls FastAPI to get the role-scoped world state and legal
   actions list.
3. **Compile briefing**: State compiler transforms raw state into a strategic turn brief
   (domain stress, resilience, trends, couplings, objectives, constraints).
4. **Select action**: Choose one action from ~30 legal action types across 8 target
   domains, with a continuous intensity value in [0, 1].
5. **Validate**: Guardrails check legality, intensity range, and loop detection.
6. **Submit**: Action submitted to FastAPI through the standard move API.

**Latency budget**: FastAPI enforces a 10-second timeout on AI turns. The internal
thinking cap is 30 seconds. Typical turn completion: < 3 seconds (heuristic), < 5 seconds
(LLM).

**This is fundamentally a single synchronous API call problem** — not a multi-step
agentic workflow. The agent does not execute code, manipulate files, search the web, or
perform multi-turn reasoning. It evaluates a structured game state and returns a single
JSON decision.

### 2.3 Claude Managed Agents Overview

Claude Managed Agents (CMA) is a fully managed, hosted AI agent service launched in
public beta by Anthropic on April 8, 2026. It provides pre-built infrastructure for
running autonomous agents without building your own agent loop, sandboxing, or tool
execution layer.

**Architecture** — three decoupled components:

- **Brain**: Claude inference engine and harness (stateless, scalable).
- **Hands**: Sandboxed containers provisioned on-demand for code execution, file
  manipulation, and tool invocation.
- **Session**: Durable append-only event log for recovery and state persistence.

**Designed for**: Long-running tasks (minutes to hours), multi-step tool chains, code
generation, document processing, data analysis — workflows where the agent needs to
execute code, read/write files, and search the web iteratively.

**Pricing**: Standard Claude token rates (e.g. Sonnet 4.6: $3/$15 per MTok input/output)
plus $0.08 per session-hour, billed per millisecond while the session status is `running`.

**Beta status**: Requires `managed-agents-2026-04-01` header. Multi-agent coordination,
persistent memory, and outcome evaluation are in research preview (separate access
required). Early adopters include Notion, Rakuten, and Sentry.

**SDKs**: Python, TypeScript, Java, Go, C#, Ruby, PHP.

---

## 3. Current Implementation Deep Dive

### 3.1 Architecture

The AI agent service is a standalone Node.js/Express application running on port 3100,
co-located with all other Greyzone services on a single server.

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Agent Service                        │
│                                                              │
│   ┌──────────────┐   ┌────────────────┐   ┌──────────────┐ │
│   │    State      │   │    Action      │   │  AI Client   │ │
│   │   Compiler    │──→│   Selector     │──→│ (Heuristic   │ │
│   │              │   │               │   │  or Copilot) │ │
│   └──────────────┘   └────────────────┘   └──────┬───────┘ │
│                                                   │         │
│                                            ┌──────▼───────┐ │
│                                            │    Tool      │ │
│                                            │   Executor   │ │
│                                            │      +       │ │
│                                            │  Guardrails  │ │
│                                            └──────┬───────┘ │
│                                                   │         │
│   ┌──────────────┐                                │         │
│   │    Audit     │◀───────────────────────────────┘         │
│   │   Logger     │                                          │
│   └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
         ▲                                    │
         │  State + Legal Actions             │ Action Submission
         │  (localhost:8010)                  ▼ (localhost:8010)
```

**Tool registry**: 7 bounded tools, each mapping to a specific FastAPI endpoint:

| Tool | Purpose | Backend Call |
|---|---|---|
| `getTurnBrief` | Fetch + compile strategic briefing | `GET /runs/{id}/state` |
| `getRoleVisibleState` | Fog-of-war filtered world state | `GET /runs/{id}/state?role_id=` |
| `listLegalActions` | Enumerate valid moves | `GET /runs/{id}/legal-actions` |
| `inspectAction` | Action description + domain context | Local computation |
| `estimateLocalEffects` | Approximate impact prediction | Local heuristic |
| `submitAction` | Propose an action (validated by engine) | `POST /runs/{id}/actions` |
| `endTurn` | Signal turn completion | No-op (backend manages) |

**Integration pattern**: All communication is localhost HTTP. The AI agent fetches state
from FastAPI and submits actions to FastAPI. It has no direct access to the database,
simulation engine, or any other service. This is enforced by design (ADR-004) and by
network topology (service-to-service auth key required).

Source: `apps/ai-agent/src/types/tools.ts`, `docs/adr/004-ai-bounded-tools.md`

### 3.2 Dual-Mode AI Client

The AI client layer (`apps/ai-agent/src/services/aiClient.ts`) implements an `AiClient`
interface with two concrete implementations:

**HeuristicAiClient** — deterministic scoring, zero external dependencies:

- Scores each legal action based on domain stress, resilience, phase, role objectives,
  and domain trends.
- Red Commander strategy: exploit high-stress domains, target low-resilience areas,
  escalate in early phases, apply decisive force in later phases.
- Blue Commander strategy: stabilize high-stress domains, build resilience, prefer
  defensive actions, de-escalate in later phases.
- Selects from top 3 scored actions with seeded pseudo-randomness for variety.
- Computes intensity based on escalation phase (Red: 30-60% curve) and domain urgency
  (Blue: stress-responsive).
- Generates structured rationale explaining the decision.
- All randomness seeded by turn number — fully reproducible for testing and replay.

**CopilotAiClient** — GitHub Copilot API (GPT-4) with automatic fallback:

- Sends role-specific system prompt + compiled turn prompt to
  `https://api.githubcopilot.com/chat/completions`.
- Configuration: GPT-4 model, temperature 0.7, max 1024 tokens, 25-second timeout.
- Parses JSON action decision from LLM response via regex extraction.
- On any failure (API error, timeout, unparseable response): automatically falls back to
  `HeuristicAiClient` and logs the event.

**Factory pattern** (`createAiClient()`):

```
if (USE_MOCK_AI=true OR no COPILOT_API_KEY) → HeuristicAiClient
else → CopilotAiClient (with heuristic fallback on failure)
```

This dual-mode design ensures the game is always playable, even offline, during CI, or
when the LLM provider is unavailable.

### 3.3 Guardrails and Safety

The guardrails system (`apps/ai-agent/src/services/guardrails.ts`) enforces strict
constraints on AI behavior:

- **Tool call budget**: Maximum 10 tool calls per turn (configurable). Throws error when
  exceeded.
- **Action validation**: Selected action must be in the legal actions list. Intensity must
  be within the action's allowed range. Action type must not be in the forbidden list.
- **Loop detection**: Tracks last 3 actions. Rejects if the new action is identical to
  all 3 previous consecutive actions, forcing the AI to vary its strategy.
- **Thinking time cap**: 30 seconds maximum per turn.
- **Retry with fallback**: On validation failure, retries once with the heuristic
  fallback. If that also fails, selects the first legal action at midpoint intensity.
- **State isolation**: The AI agent has no database connection, no engine access, no
  filesystem access beyond its own code. All state flows through the REST API.

### 3.4 Observability and Audit

Every AI decision produces a complete audit trail:

- **Structured logging**: Pino with JSON output. Each log entry carries `runId`, `turn`,
  `roleId`, and timing data for every tool call.
- **Audit persistence**: After each turn, the audit logger POSTs a complete decision
  record to `POST /api/v1/ai/audit`, which persists to the PostgreSQL `ai_action_logs`
  table. The record includes: prompt summary, tool call log with timing, selected action,
  rationale, validation result, and applied effects.
- **Non-fatal persistence**: If the audit POST fails, the game continues. Audit logging
  failure never blocks gameplay. The failure is logged locally for later investigation.
- **Queryable history**: The backend exposes `GET /runs/{id}/ai-audit` and
  `GET /runs/{id}/ai-audit/{turn}` for post-game analysis of AI decision-making.

Source: `apps/ai-agent/src/services/auditLogger.ts`, `apps/api/app/routers/ai_audit.py`

---

## 4. Claude Managed Agents Mapping Analysis

### 4.1 Architecture Mapping

How the Greyzone AI agent would map onto CMA's three-component architecture:

**Brain (Claude inference)** — Clean mapping. Claude replaces GPT-4 as the reasoning
model. The existing system prompt (`apps/ai-agent/src/prompts/systemPrompt.ts`) becomes
the CMA agent's `instructions` field. The turn prompt
(`apps/ai-agent/src/prompts/turnPrompt.ts`) becomes a user event sent to the session.
This component translates directly.

**Hands (sandboxed containers)** — No mapping. The Greyzone AI agent does not execute
code, manipulate files, or search the web. All its "tools" are REST API calls to the
FastAPI backend. CMA's sandboxed Docker container environment — its primary
differentiation over the direct Messages API — provides no benefit for this use case.
The container provisioning overhead (even with CMA's lazy-spin-up optimization) is pure
waste for a task that completes in under 5 seconds.

**Session (durable event log)** — Awkward mapping. CMA sessions are designed for
long-running tasks (minutes to hours) with iterative tool use. The Greyzone AI agent
makes a single decision per turn in under 5 seconds. Two session strategies exist, both
with drawbacks:

- **Session-per-turn**: Create a new session for each turn. Incurs session creation
  overhead (~1-2s) for a 3-5 second task. No benefit from session durability since the
  task is atomic.
- **Session-per-game**: Keep one session for the entire game (30+ turns). Maintains
  context across turns (useful), but accumulates tokens in the session event log
  (expensive). Session-hour billing accrues even during idle time between turns unless
  the session is explicitly paused.

**Custom tool callbacks** — Significant concern. The 7 Greyzone tools would be defined as
CMA custom tools via JSON schema. When the agent invokes a tool, CMA makes an HTTP
callback to the Greyzone server. This introduces a critical new network path:

```
CMA Cloud ──HTTP──→ Greyzone Server ──→ FastAPI ──→ Response
    ──HTTP──→ CMA Cloud ──→ AI Decision ──HTTP──→ Greyzone Server
```

Each tool call adds 100-300ms of network latency (vs < 50ms for localhost). With 3-5 tool
calls per turn, this adds 0.5-1.5 seconds. Additionally, the Greyzone server must be
reachable from Anthropic's cloud infrastructure, which currently runs behind a Cloudflare
Tunnel — requiring either public endpoint exposure or a secure callback mechanism.

### 4.2 What CMA Provides That the Current System Lacks

**Session durability**: If the AI agent process crashes mid-turn, a CMA session can
resume from its last event. Current system: if the Node.js process crashes, FastAPI treats
the AI turn as a timeout (no-op) and the game continues with human moves only. Both
approaches result in a playable game, but CMA preserves partial reasoning state.
In practice, the current system's approach is preferable — a stale AI decision from a
crashed session is worse than a clean skip.

**Built-in event streaming**: CMA provides SSE for real-time observation of agent
reasoning. Current system: Pino logs + audit API. SSE would enable a live debugging
dashboard, but this is a development convenience, not a game requirement.

**Multi-agent orchestration** (research preview): Could enable Red Commander and Blue
Commander AI agents to coordinate strategy, or allow sub-agents for specialized domain
analysis. Current system: each AI turn is independent with no inter-agent communication.
This is the most compelling future CMA capability for Greyzone, but it is not available
in stable release.

**Persistent memory** (research preview): Could allow AI to learn from previous games,
building strategic models over time. Current system: the `StateCompiler` caches state
changes only within a single run. Cross-game learning is listed in the AI agent spec's
future enhancements (Section 11) but is not on the near-term roadmap.

### 4.3 What CMA Does Not Provide

**Heuristic fallback**: CMA is Claude-only. If Anthropic's service is unavailable, there
is no fallback mechanism. The current system's `HeuristicAiClient` guarantees the game
works with zero external dependencies — no API key, no internet connection, no cloud
service. This is critical for development, testing, CI pipelines, offline demos, and
production resilience.

**Localhost communication**: CMA runs in Anthropic's cloud. Every tool call traverses the
internet. The current system's localhost integration completes tool calls in < 50ms. This
latency advantage compounds with multiple tool calls per turn.

**Deterministic replay**: The `HeuristicAiClient` is fully deterministic given the same
turn seed. CMA introduces LLM non-determinism for every decision with no deterministic
alternative. (The current `CopilotAiClient` shares this limitation, but the heuristic
mode is always available for replay validation.)

**Cost predictability**: The current system's heuristic mode costs $0. The Copilot API
is covered by an existing GitHub Copilot subscription. CMA introduces per-session-hour
billing that scales with play time, not just inference tokens.

**Zero-dependency operation**: The current heuristic mode requires only Node.js and
a network connection to localhost FastAPI. No API keys, no cloud services, no internet.
This is invaluable for the development inner loop, CI test pipelines, and environments
where external API access is restricted.

---

## 5. Dimension-by-Dimension Comparison

### 5.1 Architecture Fit

**Current**: Purpose-built for the game AI use case. The entire decision pipeline
(compile state -> score actions -> validate -> submit) runs in < 3s for heuristic,
< 5s for LLM. The service is a thin wrapper around a single decision per turn, running
on the same server as all other Greyzone services. The bounded tool interface (7 tools,
max 10 calls/turn) is explicitly designed for this constrained problem.

**CMA**: Designed for complex, multi-step agentic workflows. The session model,
sandboxed containers, and built-in tools (bash execution, file manipulation, web search,
MCP server integration) serve use cases like software development, data analysis, and
document processing. For selecting one game action from a bounded list, these capabilities
are irrelevant overhead.

**Verdict**: **Current wins (5 vs 2)**. CMA solves a fundamentally different problem than
game AI action selection.

### 5.2 Model Quality for Strategic Reasoning

**Current**: GPT-4 via the GitHub Copilot API. Competent at general reasoning but not
specifically optimized for structured strategic decision-making with complex constraint
systems. Prompt engineering is limited to a single system prompt + turn prompt, with JSON
response extraction via regex.

**CMA**: Access to Claude Opus 4.6, Sonnet 4.6, and Haiku 4.5. Claude models
demonstrate strong performance in following complex instructions, structured reasoning,
and producing well-formatted JSON. Opus 4.6 would likely produce higher-quality strategic
rationale with better domain awareness.

**Key insight**: Model quality is independent of the managed agent runtime. The same
Claude models are available through the direct Anthropic API (`@anthropic-ai/sdk`). You
can add a `ClaudeAiClient` alongside the existing `CopilotAiClient` and
`HeuristicAiClient` without any architectural change.

**Verdict**: **Claude models are stronger (3 vs 5)**, but CMA is not required to access
them. The direct API captures the same benefit.

### 5.3 Cost Analysis

**Per-turn cost model** (estimated ~1,500 input tokens, ~200 output tokens per turn):

| Provider | Token Cost/Turn | Session Cost/Turn | Total/Turn |
|---|---|---|---|
| Copilot API (GPT-4) | ~$0 (subscription) | $0 | ~$0 |
| Heuristic | $0 | $0 | $0 |
| CMA (Sonnet 4.6) | ~$0.0075 | ~$0.0001 (5s session) | ~$0.008 |
| Direct Claude API (Sonnet 4.6) | ~$0.0075 | $0 | ~$0.008 |
| CMA (Haiku 4.5) | ~$0.0025 | ~$0.0001 | ~$0.003 |

**Monthly projections** (2 AI roles per game, 30 turns per game):

| Scenario | Games/Week | Turns/Month | Current | CMA (Sonnet) | Direct API |
|---|---|---|---|---|---|
| Casual | 2 | 480 | ~$0 | ~$3.80 | ~$3.60 |
| Active | 10 | 2,400 | ~$0 | ~$19.20 | ~$18.00 |
| Stress test | 100 (one-off) | 6,000 | ~$0 | ~$48.00 | ~$45.00 |

CMA session-hour overhead is negligible (~5%) because each session runs for only a few
seconds. The real cost driver is switching from the "free" Copilot API to Claude token
pricing.

**Verdict**: **Current wins (5 vs 3)** on pure cost. The Copilot subscription is already
paid for. Claude API costs are modest but non-zero.

### 5.4 Latency

**Current**: Tool calls are localhost HTTP, completing in 10-50ms each. The LLM call
to the Copilot API takes 1-3 seconds. Total turn time: 1.5-5 seconds. Heuristic mode
completes in < 500ms.

**CMA**: Every tool call traverses the internet. Each custom tool invocation round-trips
from Anthropic's cloud to the Greyzone server and back, adding 100-300ms per call.
With 3-5 tool calls per turn, this adds 0.5-1.5 seconds. LLM inference is comparable
to the direct API (~1-3 seconds). Estimated total: 3-7 seconds per turn.

**Impact**: The difference (3-7s CMA vs 1.5-5s current) is noticeable but not
game-breaking. However, in a multiplayer game where human players are waiting for the AI
to finish its turn, every second matters for the gameplay experience.

**Verdict**: **Current wins (5 vs 3)**. Localhost communication provides a consistent
latency advantage.

### 5.5 Operational Complexity

**Current**: One systemd service (`greyzone-ai.service`), one Node.js process. In
heuristic mode, zero external dependencies. Deployment: build TypeScript, restart service.
Monitoring: structured logs + `/health` endpoint. The entire codebase is ~1,600 lines of
TypeScript with 5 test suites.

**CMA**: Zero infrastructure to run on the agent execution side — Anthropic manages
capacity, scaling, and sandboxing. But introduces new operational concerns:
- API key management for Anthropic.
- Session lifecycle management (create, monitor, clean up).
- Callback server for custom tool invocations — the Greyzone server must be reachable
  from Anthropic's cloud, which is currently behind a Cloudflare Tunnel.
- Network configuration changes to support inbound connections from Anthropic.
- Error handling for a distributed system (network partitions, callback timeouts).

**Verdict**: **Slight current advantage (4 vs 3)**. CMA trades one form of simplicity
(no Node.js process to manage) for another form of complexity (distributed system
concerns, callback infrastructure).

### 5.6 Control and Customization

**Current**: Full control over every aspect of the AI decision pipeline:
- Prompt engineering: modify `systemPrompt.ts` and `turnPrompt.ts` directly.
- Response parsing: custom JSON extraction with fallback strategies.
- Scoring algorithm: fine-tune heuristic weights for each role and phase.
- Guardrails: configurable tool call budgets, forbidden actions, loop detection.
- Fallback chain: LLM -> heuristic -> first legal action.
- Mode switching: environment variable toggles between heuristic and LLM.
- Dual-mode architecture allows mixing approaches per role or per phase.

**CMA**: Agent instructions and custom tool definitions are configurable. But:
- The agent runtime is opaque — you cannot control how it decides to sequence tool calls.
- No heuristic fallback path within the CMA runtime.
- Cannot mix deterministic and LLM reasoning within a single agent.
- Model selection is Claude-only (no multi-provider support).
- Tool invocation order and frequency are determined by the model, not the developer.

**Verdict**: **Current wins (5 vs 2)**. The heuristic fallback and fine-grained
guardrails are architectural strengths that cannot be replicated in CMA.

### 5.7 Vendor Lock-in

**Current**: The `AiClient` TypeScript interface (`selectAction` method) abstracts the
LLM provider. Swapping providers requires only implementing a new class (~80 lines).
The `HeuristicAiClient` has zero vendor dependencies. The `CopilotAiClient` depends on
GitHub's API but uses raw HTTP (no SDK lock-in). The rest of the codebase (state compiler,
guardrails, tools, audit) is provider-agnostic.

**CMA**: Deep dependency on Anthropic's ecosystem. The session model, event format, tool
definition schema, custom tool callback protocol, and SDKs are all Anthropic-specific.
Migrating away from CMA would require rebuilding the agent orchestration layer. There is
no multi-provider equivalent.

**Verdict**: **Current wins (5 vs 2)**. The `AiClient` interface is a clean abstraction
boundary that makes provider switching straightforward.

### 5.8 Security and Data Privacy

**Current**: All game state stays on the server. When using the LLM, only the compiled
turn prompt is sent externally — this is a role-scoped, fog-of-war filtered strategic
briefing, not raw world state. The full world state, event log, and player data never
leave the server. Service-to-service authentication uses an internal API key.

**CMA**: Game state must traverse the internet to reach Anthropic's cloud infrastructure
for both inference and custom tool execution. CMA sessions store event logs (including
tool call inputs and outputs) on Anthropic's infrastructure. Custom tool callbacks require
the Greyzone server to accept inbound HTTP connections from Anthropic's cloud, expanding
the attack surface.

For a non-classified game simulation, this is acceptable. For more sensitive applications,
or in environments with data residency requirements, it would not be.

**Verdict**: **Current wins (5 vs 3)**. Data locality is a meaningful advantage even for
a game simulation.

### 5.9 Scalability

**Current**: Each AI turn is stateless (the `StateCompiler` caches per-run state, but
this is in-memory and disposable). The agent could scale horizontally by running multiple
instances behind a load balancer, though this is unnecessary for the current single-server
deployment.

**CMA**: Scales inherently — Anthropic manages capacity. However, the scalability
bottleneck for Greyzone is the sequential game loop (turns are processed one at a time
per run), not AI compute capacity.

**Verdict**: **Draw (4 vs 4)**. Scalability is not a differentiator for this use case.
Neither approach is constrained by the actual workload.

### 5.10 Reliability and Graceful Degradation

**This is the single most important dimension for game AI.**

**Current**: Triple-layer fallback ensures the game never stalls:

1. **Primary**: LLM (Copilot API / future Claude API) selects the action.
2. **Fallback 1**: If the LLM call fails (timeout, error, unparseable response), the
   `HeuristicAiClient` produces a deterministic, strategically plausible action. Logged
   as a warning.
3. **Fallback 2**: If the heuristic action fails guardrail validation, the system selects
   the first legal action at midpoint intensity. Logged as an error.
4. **Fallback 3**: If the entire AI agent service is down, FastAPI treats the AI turn as
   a timeout (no-op). The game continues with human moves only.

In practice, the heuristic AI produces high-quality actions. Falling back to it is not a
degraded experience — many development games run entirely in heuristic mode.

**CMA**: Single point of failure. If Anthropic's service is unavailable:
- No fallback LLM provider (Claude-only).
- No deterministic heuristic alternative.
- No offline mode.
- The AI turn fails. The game stalls or proceeds without AI input.

To maintain the current reliability guarantees with CMA, you would need to keep the
existing Node.js agent service running as a fallback — defeating the purpose of migration.

**Verdict**: **Current wins decisively (5 vs 2)**. For a real-time multiplayer game where
players are waiting for the AI to take its turn, graceful degradation is a hard
requirement, not a nice-to-have.

### 5.11 Future Roadmap Alignment

**Current system's near-term roadmap** (from `docs/ai-agent-spec.md` Section 11):

| Enhancement | Current Architecture Support |
|---|---|
| Difficulty levels | Adjust heuristic scoring weights — trivial |
| Persona system | Different system prompts + heuristic strategies — moderate |
| Multi-action turns | Extend `ActionSelector` loop — moderate |
| Lookahead planning | Multi-step heuristic evaluation — significant but feasible |
| Metrics dashboard | Query existing audit trail — moderate |

All near-term enhancements are achievable through TypeScript modifications to the existing
codebase.

**CMA's future-relevant features** (research preview):

| Feature | Greyzone Relevance |
|---|---|
| Multi-agent coordination | High — enables Red/Blue team sub-agents |
| Persistent memory | Medium — cross-game learning |
| Outcome evaluation | Medium — automatic quality assessment |

These are compelling for the long term but are not available in stable release. Building
on research preview features in a production game is premature.

**Verdict**: **CMA has a slight edge for long-term vision (3 vs 4)**, but the current
architecture serves the near-term roadmap better, and CMA's most relevant features are
not yet production-ready.

---

## 6. Cost Model

### 6.1 Current System Costs

| Category | Monthly Cost | Notes |
|---|---|---|
| Infrastructure | $0 | Runs on existing server, no additional resources |
| LLM (heuristic mode) | $0 | Zero external dependencies |
| LLM (Copilot API) | ~$19 | GitHub Copilot subscription (shared with dev use) |
| Development maintenance | Minimal | ~1,600 LOC, stable codebase, 5 test suites |
| **Total** | **$0-19/mo** | |

### 6.2 CMA Costs

Token costs at Claude Sonnet 4.6 rates ($3/$15 per MTok), plus $0.08/session-hour:

| Component | Per Turn | Calculation |
|---|---|---|
| Input tokens (~1,500) | $0.0045 | 1,500 * $3 / 1,000,000 |
| Output tokens (~200) | $0.0030 | 200 * $15 / 1,000,000 |
| Session time (~5s) | $0.0001 | 5/3600 * $0.08 |
| **Total** | **~$0.008** | |

**Monthly projections**:

| Scenario | AI Turns/Month | Token Cost | Session Cost | Total |
|---|---|---|---|---|
| Casual (2 games/wk) | 480 | $3.60 | $0.05 | **$3.65** |
| Active (10 games/wk) | 2,400 | $18.00 | $0.27 | **$18.27** |
| Stress test (100 games) | 6,000 | $45.00 | $0.67 | **$45.67** |

### 6.3 Direct Claude API Costs (Recommended Hybrid)

Same token costs as CMA, without session-hour overhead:

| Scenario | AI Turns/Month | Token Cost | Total |
|---|---|---|---|
| Casual (2 games/wk) | 480 | $3.60 | **$3.60** |
| Active (10 games/wk) | 2,400 | $18.00 | **$18.00** |
| Stress test (100 games) | 6,000 | $45.00 | **$45.00** |

### 6.4 Migration Cost (One-Time)

| Approach | Estimated Effort | Complexity |
|---|---|---|
| Direct Claude API integration | 1-2 days | Low — add new `AiClient` implementation |
| Full CMA migration | 2-3 weeks | High — callback server, session management, network config, testing |

### 6.5 Comparison Summary

| | Current (Heuristic) | Current (Copilot) | Direct Claude API | CMA |
|---|---|---|---|---|
| Monthly (casual) | $0 | ~$19 (shared) | $3.60 | $3.65 |
| Monthly (active) | $0 | ~$19 (shared) | $18.00 | $18.27 |
| Migration effort | N/A | N/A | 1-2 days | 2-3 weeks |
| Ongoing ops | Minimal | Minimal | Minimal | Moderate |

The direct Claude API option delivers the same model quality as CMA at marginally lower
cost, with 10-15x less migration effort, and no operational overhead increase.

---

## 7. Recommendation

### 7.1 Primary Recommendation: Stay on Current Architecture

The Greyzone AI agent is a constrained, synchronous, latency-sensitive decision-making
service. Each turn, it selects one action from a bounded set of legal moves. This is the
antithesis of the long-running, multi-step, tool-heavy agentic workflows that CMA is
designed for.

**CMA's core value propositions are irrelevant to this use case**:

- Sandboxed code execution: the AI agent doesn't execute code.
- File operations: the AI agent doesn't read or write files.
- Web search: the AI agent doesn't search the web.
- Session durability: the AI agent's task completes in < 5 seconds.
- Built-in MCP integration: the AI agent's tools are simple REST API calls.

**The current architecture's strengths are not replicable in CMA**:

- Triple-layer graceful degradation (LLM -> heuristic -> first legal action -> no-op).
- Zero-dependency heuristic mode for development, testing, CI, and offline demos.
- Localhost communication for sub-50ms tool call latency.
- Deterministic replay via seeded heuristic.
- Full control over prompt engineering, guardrails, and fallback logic.

### 7.2 Recommended Improvement: Swap LLM Provider

Replace the GitHub Copilot API (GPT-4) with the direct Anthropic API (Claude Sonnet 4.6)
using the `@anthropic-ai/sdk` TypeScript package.

**Implementation scope**:

1. Add `@anthropic-ai/sdk` dependency to `apps/ai-agent/package.json`.
2. Create a `ClaudeAiClient` class in `aiClient.ts` implementing the existing `AiClient`
   interface. Use the Anthropic SDK's `messages.create()` with structured JSON output.
3. Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to `config.ts`.
4. Update the `createAiClient()` factory to support a `AI_PROVIDER` config variable
   (`heuristic`, `copilot`, `claude`).
5. Preserve the fallback chain: Claude API -> Heuristic.
6. Update tests to cover the new client.
7. Update `docs/ai-agent-spec.md` to reflect the new provider option.

**What this achieves**:

- Access to Claude's stronger strategic reasoning capabilities.
- Clean SDK integration (vs raw HTTP calls to Copilot API).
- No architectural change — same bounded tools, same guardrails, same audit trail.
- Heuristic fallback preserved for reliability.
- Estimated effort: 1-2 days.

**What this does not require**:

- No callback server or network configuration changes.
- No session management infrastructure.
- No changes to the FastAPI backend, Rust engine, or frontend.
- No changes to deployment topology or systemd services.

### 7.3 Conditions That Would Change This Recommendation

| Condition | Why It Matters | When to Reassess |
|---|---|---|
| Multi-agent coordination needed | CMA's multi-agent feature enables Red/Blue sub-agents | When feature exits research preview |
| Cross-game learning required | CMA's persistent memory enables strategic adaptation | When feature exits research preview |
| CMA adds lightweight sync mode | Removes session/container overhead for simple tasks | Monitor CMA release notes |
| Multi-server deployment | Localhost latency advantage disappears | If architecture scales beyond single server |
| Copilot API deprecated | Current LLM integration breaks | Already mitigated by Claude API swap |

---

## 8. Migration Path (If Needed in the Future)

If conditions change and CMA migration becomes warranted, the following phased approach
minimizes risk. Each phase is independently valuable and fully reversible.

### Phase 1: Direct Claude API Integration (Recommended Now)

**Scope**: Add `ClaudeAiClient` to `aiClient.ts` alongside existing implementations.

**Purpose**: Establish familiarity with Claude's API, response format, and strategic
reasoning quality in the Greyzone context. Validate model quality before considering
deeper integration.

**Reversibility**: Feature flag (`AI_PROVIDER=claude|copilot|heuristic`). Instant
rollback to Copilot or heuristic by changing an environment variable.

**No architecture change**. The same State Compiler, Action Selector, Guardrails, Tool
Executor, and Audit Logger are used regardless of provider.

### Phase 2: CMA Custom Tool Definitions

**Scope**: Define the 7 Greyzone tools as CMA custom tool schemas. Implement a callback
endpoint (or proxy through existing FastAPI routes) for CMA to invoke.

**Purpose**: Validate that CMA's custom tool system works for the Greyzone integration
pattern. Measure tool call latency over the internet. Identify networking requirements
(Cloudflare Tunnel exposure, authentication).

**Prerequisite**: CMA custom tools support authenticated callbacks to private
infrastructure.

**Reversibility**: Tool definitions are additive. Existing agent service continues to
run in parallel.

### Phase 3: CMA Session Integration

**Scope**: Implement a `CmaManagedAiClient` that creates a CMA session per turn (or per
game). The CMA agent receives the system prompt and turn context, invokes custom tools
as needed, and returns the action decision.

**Purpose**: Full CMA integration. The AI agent service becomes a thin client that
delegates to CMA rather than orchestrating the decision locally.

**Architectural change**: The `ActionSelector` orchestration logic moves from the local
Node.js service to the CMA agent. The local service handles only session lifecycle and
response forwarding.

**Prerequisite**: Acceptable latency and reliability measured in Phase 2.

**Reversibility**: The `HeuristicAiClient` and `ClaudeAiClient` (direct API) remain
available as fallbacks via the `AI_PROVIDER` config.

### Phase 4: Advanced Features (Future)

**Scope**: Explore CMA's research-preview features as they reach stable release.

- **Multi-agent**: Red Commander agent and Blue Commander agent with coordinated strategy.
  Sub-agents for domain-specific analysis (e.g. a Cyber domain specialist).
- **Memory**: Persistent strategic models that evolve across games. "This Blue Commander
  tends to reinforce Cyber when Kinetic stress rises."
- **Outcomes**: Automatic evaluation of AI decision quality against game outcomes.

**Prerequisite**: Features exit research preview and enter stable release.

### Rollback Guarantees

At every phase, the following invariants hold:

1. The `HeuristicAiClient` is always available as a zero-dependency fallback.
2. Feature flags (`AI_PROVIDER` environment variable) enable instant rollback.
3. No phase requires removing existing code — only adding new `AiClient` implementations.
4. The game never depends on CMA availability to function.

---

## 9. Conclusion

Claude Managed Agents is a powerful platform for a class of problems that does not include
the Greyzone AI agent's current use case. CMA excels at long-running, multi-step agentic
workflows requiring code execution, file manipulation, and web interaction. The Greyzone
AI agent's task — selecting a single action per turn from a bounded set of legal moves in
under 5 seconds — does not benefit from sandboxed containers, session durability, or
built-in developer tools.

The current self-hosted architecture's defining strength is its triple-layer graceful
degradation, which guarantees that the game never stalls waiting for an AI decision. This
reliability property has no equivalent in CMA and cannot be replicated without maintaining
the existing service as a parallel fallback — defeating the purpose of migration.

The recommended path forward is to upgrade the LLM provider from GPT-4 (via GitHub
Copilot API) to Claude Sonnet 4.6 (via the direct Anthropic API). This delivers the model
quality improvement at minimal cost, with zero architectural risk, in 1-2 days of
development effort. The existing heuristic fallback, guardrails, audit trail, and bounded
tool interface remain intact.

CMA should be revisited when its multi-agent coordination and persistent memory features
exit research preview, or when the Greyzone architecture evolves beyond a single-server
deployment model. The phased migration path outlined in Section 8 ensures that deeper CMA
integration remains available if conditions change, with full rollback guarantees at
every stage.

---

## Appendix A: Source Code Reference

| Component | File Path | LOC | Role |
|---|---|---|---|
| AI Client (dual-mode) | `apps/ai-agent/src/services/aiClient.ts` | 361 | Heuristic + Copilot LLM implementations |
| Action Selector | `apps/ai-agent/src/services/actionSelector.ts` | 232 | Turn-taking orchestration |
| State Compiler | `apps/ai-agent/src/services/stateCompiler.ts` | 335 | State-to-briefing transformation |
| Guardrails | `apps/ai-agent/src/services/guardrails.ts` | 93 | Action validation, loop detection |
| Tool Executor | `apps/ai-agent/src/services/toolExecutor.ts` | 135 | Tool call execution + budget |
| Audit Logger | `apps/ai-agent/src/services/auditLogger.ts` | 43 | Decision audit trail |
| Advisor Service | `apps/ai-agent/src/services/advisorService.ts` | 480 | Advisory suggestions |
| System Prompts | `apps/ai-agent/src/prompts/systemPrompt.ts` | — | Role-specific strategic instructions |
| Turn Prompts | `apps/ai-agent/src/prompts/turnPrompt.ts` | — | Turn-specific context builder |
| Configuration | `apps/ai-agent/src/config.ts` | — | Environment variable loader |
| Entry Point | `apps/ai-agent/src/index.ts` | — | Express server setup |
| Shared Schemas | `packages/schemas/src/ai.ts` | — | Zod-validated request/response types |
| AI Agent Spec | `docs/ai-agent-spec.md` | 441 | Governing specification |
| Architecture | `docs/architecture.md` | 312 | System architecture overview |
| ADR-004 | `docs/adr/004-ai-bounded-tools.md` | — | Bounded tool interface rationale |

## Appendix B: CMA API Reference Summary

**Base URL**: `https://api.anthropic.com`

**Required header**: `anthropic-beta: managed-agents-2026-04-01`

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/agents` | POST | Create an agent definition |
| `/v1/agents/{id}` | GET | Retrieve agent configuration |
| `/v1/environments` | POST | Create a container environment |
| `/v1/sessions` | POST | Start a new agent session |
| `/v1/sessions/{id}/events` | POST | Send events (user turns) to session |
| `/v1/sessions/{id}/stream` | GET | Stream responses via SSE |

**Custom tool definition format**:

```json
{
  "name": "getTurnBrief",
  "description": "Fetch role-scoped strategic briefing for the current turn",
  "input_schema": {
    "type": "object",
    "properties": {
      "runId": { "type": "string", "description": "Simulation run ID" },
      "roleId": { "type": "string", "enum": ["red_commander", "blue_commander"] }
    },
    "required": ["runId", "roleId"]
  }
}
```

**SDKs**: Python (`anthropic`), TypeScript (`@anthropic-ai/sdk`), Java, Go, C#, Ruby, PHP

**Rate limits** (organization-level):
- Create endpoints: 60 requests/minute
- Read endpoints: 600 requests/minute

**Pricing**:
- Token costs: Standard Claude API rates
- Session runtime: $0.08/session-hour (billed per millisecond)
- Web search: $0.01/query

## Appendix C: Glossary

| Term | Definition |
|---|---|
| **CMA** | Claude Managed Agents — Anthropic's hosted agent runtime service |
| **Domain** | One of 8 simulation areas (Kinetic, Maritime, Energy, Geoeconomic, Cyber, Space, Information, Domestic Political) |
| **Phase** | Escalation stage (Competition, Crisis, Hybrid Coercion, War Transition, Limited War, General War) |
| **Order parameter** | Composite metric (0-1) measuring overall system stability; drives phase transitions |
| **Fog of war** | Visibility constraint where each role sees only a subset of world state |
| **Turn brief** | Compiled strategic summary provided to the AI: domain status, objectives, constraints, tradeoffs |
| **Legal action** | A move that is valid for the current role, phase, and domain state |
| **Heuristic AI** | Deterministic scoring-based action selection with zero external dependencies |
| **Stress** | Per-domain metric (0-1) measuring instability; high stress indicates crisis |
| **Resilience** | Per-domain metric (0-1) measuring ability to absorb shocks |
| **Tool call budget** | Maximum number of API calls the AI agent can make per turn (default: 10) |
| **Session** (CMA) | A running instance of a CMA agent performing a task in a container environment |
| **Brain/Hands/Session** | CMA's three-component architecture: inference, execution, and state |
| **MCP** | Model Context Protocol — standard for connecting AI models to external tool providers |

---

*Document generated April 2026. CMA feature availability reflects public beta status
as of the `managed-agents-2026-04-01` API version. Reassess when CMA reaches general
availability or when research-preview features enter stable release.*
