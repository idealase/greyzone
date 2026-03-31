# Greyzone AI Agent Specification

Version: 1.0
Status: Governing

## 1. Overview

The AI agent service provides automated opponents and allies for Greyzone simulation runs. An AI agent fills a player role (e.g., Red Commander, Blue Diplomat) and participates in the simulation through the same move submission pipeline as human players. The agent is a bounded planner: it receives a compiled state view, reasons about strategy using an LLM, and submits legal moves. It never directly mutates simulation state.

## 2. Design Principles

1. **Bounded**: The agent operates within strict tool call budgets, token limits, and time constraints. It cannot consume unbounded compute.
2. **Observable**: Every tool call, prompt, and response is logged for audit. Operator can inspect the agent's reasoning.
3. **Constrained**: The agent can only read state through its compiled view and act through the move submission API. It has no backdoor to the engine.
4. **Role-scoped**: The agent sees exactly what a human player in the same role would see. Fog of war applies equally.
5. **Deterministic replay**: Agent behavior is seeded for reproducibility when using the same LLM version and parameters.

## 3. Architecture

```
┌────────────────────────────────────────────────────────┐
│                    AI Agent Service                      │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  State    │  │   Prompt     │  │   Tool            │ │
│  │  Compiler │→ │   Assembler  │→ │   Executor        │ │
│  └──────────┘  └──────────────┘  └───────┬───────────┘ │
│                                          │              │
│                                          ▼              │
│                                   ┌─────────────┐      │
│                                   │  LLM Client │      │
│                                   │  (Copilot   │      │
│                                   │   SDK)      │      │
│                                   └─────────────┘      │
└────────────────────────────────────────────────────────┘
         ▲                                    │
         │ Compiled State                     │ Move Submission
         │ (from FastAPI)                     ▼ (to FastAPI)
```

## 4. State Compiler

The state compiler transforms the raw role-scoped state view (received from FastAPI) into a structured prompt-friendly representation.

### 4.1 Input

The control plane sends the AI agent a request containing:

```json
{
  "run_id": "uuid",
  "tick": 42,
  "role": "red_commander",
  "state_view": { ... },
  "available_moves": [ ... ],
  "phase": 2,
  "recent_events": [ ... ],
  "agent_config": { ... }
}
```

- `state_view`: The role-filtered world state (same format a human client receives).
- `available_moves`: List of legal move types with their parameters, costs, and preconditions.
- `recent_events`: Last N events visible to this role (configurable, default: 20).
- `agent_config`: Difficulty, persona, strategy hints, tool budget.

### 4.2 Compilation Steps

1. **Prune**: Remove state variables that have not changed in the last 5 ticks (reduces token count).
2. **Summarize**: Convert numerical state vectors into natural-language summaries (e.g., "Force readiness: HIGH (0.82), declining from 0.91 three ticks ago").
3. **Highlight**: Flag state variables near critical thresholds (e.g., "WARNING: Fiscal reserves at 0.12, approaching exhaustion").
4. **Contextualize**: Add phase-specific strategic context (e.g., "Current phase: Acute Polycrisis. Full mobilization is not yet available.").
5. **Budget**: Estimate token count; if over limit, progressively summarize less-critical layers.

### 4.3 Output

A structured text block (Markdown) suitable for insertion into the LLM prompt.

## 5. Prompt Assembly

The prompt assembler constructs the full LLM prompt from the following components, in order:

### 5.1 System Prompt

```
You are a strategic AI advisor playing the role of {role_name} in a distributed
battlespace simulation called Greyzone. You must analyze the current situation
and decide on moves for this tick.

CONSTRAINTS:
- You may only submit moves from the provided available_moves list.
- You must respect move costs; do not submit moves whose costs exceed your resources.
- You must think strategically across all layers within your visibility.
- Your goal is: {persona_goal}

PHASE: {current_phase_name} ({current_phase_number}/5)
This means: {phase_description}
```

### 5.2 State Block

The compiled state view from Section 4.

### 5.3 Recent Events Block

Narrative summary of the last N events visible to the role:

```
## Recent Events (last 5 ticks)
- Tick 38: Blue increased force posture in Region A to 0.6
- Tick 39: SLOC throughput on Route Alpha dropped to 0.4 (likely Blue naval presence)
- Tick 40: Energy price index spiked to 2.1 (sanctions impact)
- Tick 41: Your cyber attack on Blue energy grid partially succeeded (infrastructure -0.15)
- Tick 42: Phase transition to Acute Polycrisis
```

### 5.4 Available Moves Block

```
## Available Moves
1. increase_force_posture(region="Baltic", amount=0.1) — Cost: readiness -0.05, fiscal -0.03
2. launch_cyber_attack(target="blue", sector="energy") — Cost: attack_capacity -0.3
3. impose_sanctions(target="blue_ally_1") — Cost: trade_flow -0.1, credibility -0.05
4. conduct_psyop(target="blue", narrative="war_weariness") — Cost: fiscal -0.02
...
```

### 5.5 Instruction Block

```
## Instructions
Analyze the situation. Use the provided tools to inspect specific state details
if needed. Then submit 1-{max_moves_per_tick} moves for this tick.

Call submit_moves with your chosen moves when ready.
```

## 6. Tool Definitions

The AI agent has access to the following tools via the LLM tool-use interface:

### 6.1 `inspect_layer`

Retrieve detailed state for a specific layer.

```json
{
  "name": "inspect_layer",
  "description": "Get detailed current state for a simulation layer",
  "parameters": {
    "layer": "string — one of: kinetic, maritime, energy, geoeconomic, cyber, space, information, domestic"
  }
}
```

Returns the full state view for that layer (within role visibility).

### 6.2 `inspect_actor`

Retrieve detailed state for a specific actor.

```json
{
  "name": "inspect_actor",
  "description": "Get detailed current state for a specific actor",
  "parameters": {
    "actor_id": "string — UUID of the actor"
  }
}
```

Returns the actor's state variables within role visibility.

### 6.3 `query_history`

Retrieve historical values for a state variable.

```json
{
  "name": "query_history",
  "description": "Get historical values of a state variable over recent ticks",
  "parameters": {
    "layer": "string",
    "variable": "string",
    "ticks_back": "integer — max 20"
  }
}
```

Returns an array of (tick, value) pairs.

### 6.4 `evaluate_move`

Hypothetically evaluate a move without submitting it.

```json
{
  "name": "evaluate_move",
  "description": "Preview the estimated effects of a move without submitting it",
  "parameters": {
    "move_type": "string",
    "parameters": "object"
  }
}
```

Returns estimated effects (deterministic component only, no stochastic preview) and cost. This does not consume a "real" move; it is purely informational.

### 6.5 `submit_moves`

Submit the agent's chosen moves for this tick.

```json
{
  "name": "submit_moves",
  "description": "Submit one or more moves for the current tick. This is a terminal action.",
  "parameters": {
    "moves": [
      {
        "move_type": "string",
        "parameters": "object"
      }
    ]
  }
}
```

This is a terminal tool call. After `submit_moves`, the LLM conversation ends for this tick. The moves are forwarded to FastAPI for standard validation and processing.

### 6.6 `pass_turn`

Submit no moves for this tick.

```json
{
  "name": "pass_turn",
  "description": "Explicitly pass this tick without submitting any moves",
  "parameters": {}
}
```

## 7. Tool Budget

Each AI agent invocation (one tick) is constrained by:

| Constraint | Default | Configurable |
|---|---|---|
| Max tool calls | 10 | Yes, range [3, 25] |
| Max input tokens | 8,000 | Yes, range [2000, 32000] |
| Max output tokens | 2,000 | Yes, range [500, 8000] |
| Timeout | 10 seconds | Yes, range [5, 30] |
| Max moves per tick | 3 | Yes, range [1, 5] |

If the LLM exceeds the tool call budget, the executor stops processing further calls and submits whatever moves have been accumulated (or passes if none).

If the timeout expires, the agent passes the turn.

## 8. Difficulty Levels

Agent difficulty is controlled through several knobs:

| Difficulty | Tool Budget | State Detail | Strategy Hints | Mistakes |
|---|---|---|---|---|
| Easy | 5 calls | Summarized | None | Injects suboptimal moves 30% of the time |
| Medium | 10 calls | Full | Phase-appropriate hints | No injection |
| Hard | 15 calls | Full + trends | Detailed strategic guidance | No injection |
| Expert | 25 calls | Full + trends + forecasts | Comprehensive doctrine | No injection |

### 8.1 Mistake Injection (Easy Mode)

On Easy difficulty, after the LLM produces its moves, the agent service randomly replaces 30% of them with suboptimal alternatives. The replacement is drawn from the available move set using a weighted random selection that favors low-impact or misdirected moves. The seed for this randomness comes from the run seed, so mistakes are reproducible in replay.

## 9. Persona System

Each AI agent can be configured with a persona that affects its strategic priorities:

```json
{
  "persona": {
    "name": "The Hawk",
    "goal": "Maximize military advantage and escalation dominance",
    "priorities": ["kinetic", "cyber", "space"],
    "risk_tolerance": 0.8,
    "description": "Aggressive military strategist who prioritizes force projection and escalation dominance. Willing to accept economic and political costs for military gains."
  }
}
```

The persona is injected into the system prompt and guides the LLM's strategic reasoning. Available personas:

| Persona | Goal | Priority Layers | Risk Tolerance |
|---|---|---|---|
| The Hawk | Escalation dominance | Kinetic, Cyber, Space | 0.8 |
| The Diplomat | De-escalation and negotiation advantage | Geoeconomic, Information, Domestic | 0.3 |
| The Strategist | Balanced advantage across all domains | All equally | 0.5 |
| The Disruptor | Maximize opponent cost and chaos | Cyber, Energy, Information | 0.7 |
| The Turtle | Defensive posture and attrition warfare | Maritime, Energy, Domestic | 0.2 |

## 10. Guardrails

### 10.1 Move Validation

All moves submitted by the AI go through the same FastAPI validation pipeline as human moves. The AI agent service does not have any privileged access.

### 10.2 State Isolation

The AI agent service does not have direct access to the database or the simulation engine. It receives state only through the compiled view provided by FastAPI and submits moves only through the REST API.

### 10.3 Output Sanitization

LLM output is parsed strictly. Only recognized tool calls are processed. Free-text output is logged but not acted upon. If the LLM produces malformed tool calls, they are rejected and logged.

### 10.4 Rate Limiting

The AI agent service enforces its own rate limits independent of the control plane:

- Maximum 1 concurrent invocation per run.
- Maximum 6 invocations per minute per run (one per tick at maximum tick rate).
- Maximum 100 invocations per hour per run.

### 10.5 Content Filtering

The LLM prompt includes an instruction to avoid generating content that is gratuitously violent, discriminatory, or otherwise inappropriate. The agent service applies a post-filter to LLM output that redacts flagged content from logs while still processing valid tool calls.

### 10.6 Fallback Behavior

If the LLM fails (error, timeout, malformed output), the agent service:

1. Logs the failure with full context.
2. Passes the turn (submits no moves).
3. Increments a failure counter.
4. If failures exceed 3 consecutive ticks, notifies the run admin.
5. If failures exceed 10 consecutive ticks, the AI player is deactivated and the run admin is prompted to replace or remove the AI player.

## 11. Observability

### 11.1 Logging

Every AI agent invocation produces a detailed log entry:

```json
{
  "run_id": "uuid",
  "tick": 42,
  "role": "red_commander",
  "persona": "the_hawk",
  "difficulty": "medium",
  "prompt_tokens": 6500,
  "completion_tokens": 1200,
  "tool_calls": [
    {"tool": "inspect_layer", "args": {"layer": "kinetic"}, "duration_ms": 50},
    {"tool": "evaluate_move", "args": {"move_type": "increase_force_posture", "parameters": {"region": "Baltic", "amount": 0.1}}, "duration_ms": 30},
    {"tool": "submit_moves", "args": {"moves": [...]}, "duration_ms": 10}
  ],
  "total_duration_ms": 3200,
  "moves_submitted": 2,
  "outcome": "success"
}
```

### 11.2 Metrics

The agent service exposes Prometheus metrics:

- `ai_agent_invocation_duration_seconds` (histogram)
- `ai_agent_tool_calls_total` (counter, labeled by tool name)
- `ai_agent_moves_submitted_total` (counter)
- `ai_agent_failures_total` (counter, labeled by failure type)
- `ai_agent_token_usage_total` (counter, labeled by direction: input/output)

## 12. Configuration

Agent configuration is stored per-run and can be modified by admins:

```json
{
  "agent_config": {
    "enabled": true,
    "role": "red_commander",
    "difficulty": "medium",
    "persona": "the_hawk",
    "tool_budget": 10,
    "max_input_tokens": 8000,
    "max_output_tokens": 2000,
    "timeout_seconds": 10,
    "max_moves_per_tick": 3,
    "llm_model": "gpt-4",
    "llm_temperature": 0.3,
    "seed": 12345
  }
}
```

The `seed` field, combined with `llm_temperature: 0` and a deterministic model, enables reproducible agent behavior for replay validation. Note that exact reproducibility depends on the LLM provider's determinism guarantees.

## 13. Runtime Settings

- `USE_MOCK_AI`: Defaults to `false` for deployed services. CI/test runs force this to `true` so suites don't depend on an external LLM. When `true`, the agent always uses the heuristic client. Set to `false` (or unset) in production to allow LLM-backed turns.
- `COPILOT_API_KEY` / `COPILOT_MODEL`: Provide these to enable Copilot-powered action selection. If missing, the agent cleanly falls back to heuristic mode.
- `AI_AGENT_PORT`, `API_BASE_URL`, `LOG_LEVEL`: Standard service settings; defaults target local development.

## 14. Heuristic Decision Path

When operating without an LLM (or when guardrails reject an LLM decision), the heuristic client:

1. Scores legal actions by domain stress and resilience, preferring the most stressed domains.
2. Biases intensity toward the upper end of the allowed range for high-stress domains to create meaningful pressure.
3. Uses deterministic pseudo-random tie-breakers for variety while remaining reproducible per turn seed.
4. Falls back to the highest-stress legal action if validation fails, logging the rationale for auditability.
