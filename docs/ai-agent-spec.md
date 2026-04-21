# Greyzone AI Agent Specification

Version: 2.0
Status: Governing

## 1. Overview

The AI agent service provides automated opponents and allies for Greyzone simulation runs. An AI agent fills a player role (e.g., Red Commander, Blue Commander) and participates in the simulation through the same action submission pipeline as human players.

The agent operates in one of two modes:
1. **Heuristic Mode** (default when `USE_MOCK_AI=true` or no LLM API key configured): Uses deterministic scoring algorithms to select actions based on domain stress, resilience, phase, and role objectives.
2. **LLM Mode** (when `USE_MOCK_AI=false` and `COPILOT_API_KEY` is set): Uses GitHub Copilot API (GPT-4) to reason about strategy and select actions, with automatic fallback to heuristic mode on API failures.

The agent never directly mutates simulation state—it only reads compiled state and submits actions through the standard API.

## 2. Design Principles

1. **Bounded**: The agent operates within strict tool call budgets, token limits, and time constraints. It cannot consume unbounded compute.
2. **Observable**: Every tool call, prompt, and response is logged for audit. Operator can inspect the agent's reasoning.
3. **Constrained**: The agent can only read state through its compiled view and act through the move submission API. It has no backdoor to the engine.
4. **Role-scoped**: The agent sees exactly what a human player in the same role would see. Fog of war applies equally.
5. **Deterministic replay**: Agent behavior is seeded for reproducibility when using the same LLM version and parameters.

## 3. Architecture

### 3.1 Current Implementation

```
┌────────────────────────────────────────────────────────┐
│                    AI Agent Service                      │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  State    │  │  Action      │  │   AI Client       │ │
│  │  Compiler │→ │  Selector    │→ │   (Heuristic or   │ │
│  └──────────┘  └──────────────┘  │    Copilot LLM)   │ │
│                                   └───────────────────┘ │
│                                          │              │
│                                          ▼              │
│                                   ┌─────────────┐      │
│                                   │  Tool       │      │
│                                   │  Executor   │      │
│                                   │  +          │      │
│                                   │  Guardrails │      │
│                                   └─────────────┘      │
└────────────────────────────────────────────────────────┘
         ▲                                    │
         │ State + Legal Actions              │ Action Submission
         │ (from FastAPI)                     ▼ (to FastAPI)
```

### 3.2 Key Components

1. **State Compiler** (`stateCompiler.ts`): Transforms raw state into strategic briefing including domain status, trends, couplings, and objectives
2. **Action Selector** (`actionSelector.ts`): Orchestrates the turn-taking workflow
3. **AI Client** (`aiClient.ts`): Two implementations:
   - `HeuristicAiClient`: Deterministic scoring-based decision making
   - `CopilotAiClient`: LLM-based reasoning with automatic fallback
4. **Tool Executor** (`toolExecutor.ts`): Executes API calls with guardrail enforcement
5. **Guardrails** (`guardrails.ts`): Validates actions and detects loops
6. **Audit Logger** (`auditLogger.ts`): Records all decisions for analysis

### 3.3 Decision Flow

1. Receive `/ai/take-turn` request with `runId` and `roleId`
2. Compile turn brief (objectives, constraints, domain status)
3. Fetch legal actions from backend
4. AI client selects action based on:
   - **Heuristic**: Score all actions, pick from top 3 with pseudo-randomness
   - **LLM**: Prompt GPT-4 with strategic context, parse JSON response
5. Validate decision through guardrails (legality, intensity range, loop detection)
6. Submit action to backend API
7. End turn
8. Log decision with rationale and timing

### 3.4 Configuration

The agent mode is controlled by environment variables:

```bash
USE_MOCK_AI=false           # false = try LLM first, true = always heuristic
COPILOT_API_KEY=sk-...      # Required for LLM mode
COPILOT_MODEL=gpt-4         # LLM model (default: gpt-4)
AI_AGENT_PORT=3100          # Service port
API_BASE_URL=...            # Backend API endpoint
LOG_LEVEL=info              # Logging verbosity
```

**Default behavior**: If `COPILOT_API_KEY` is not set, the agent automatically uses heuristic mode regardless of `USE_MOCK_AI` setting.

## 4. Heuristic AI Implementation

### 4.1 Overview

The heuristic AI (`HeuristicAiClient`) provides deterministic, strategic decision-making without requiring external LLM APIs. It uses a sophisticated scoring system that considers:
- Domain stress and resilience levels
- Current escalation phase
- Role-specific objectives (Red vs Blue)
- Domain trend analysis (rising/falling)
- Action impact predictions

### 4.2 Action Scoring Algorithm

For each legal action, the AI computes a score based on:

**Red Commander (Adversary)**:
- High-stress domains: `score += stress × 2`
- Low-resilience targets: `score += (1 - resilience) × 1.5`
- Phase-dependent escalation:
  - Competition/Crisis: Prefer stress-increasing actions (+2)
  - War/Escalation: Heavy weight on stress impact (×3)
  - Penalize de-escalation unless critical (-2)
- Rising trend domains: +1 bonus
- Pseudo-random variation: 0-0.5 based on turn seed

**Blue Commander (Defender)**:
- Prioritize high-stress domains: `score += stress × 3` (if >0.5)
- Build resilience: `score += (1 - resilience) × 2`
- Prefer defensive actions (negative stress impact): +2
- Late-phase de-escalation: +3 bonus
- Defensive keywords (defense, counter, reinforcement): +1.5
- Rising trend domains: +1 bonus

### 4.3 Selection Strategy

1. Score all legal actions
2. Sort by score descending
3. Select from top 3 actions with weighted randomness (ensures variety)
4. Compute intensity based on phase and role
5. Generate rationale explaining decision

### 4.4 Intensity Calculation

**Red**: Escalation curve by phase
- Competition: 30% + randomness
- Crisis: 40% + randomness
- HybridCoercion: 50% + randomness
- Later phases: 60% + randomness

**Blue**: Stress-responsive
- Base 30% + (domain_stress × 40%) + randomness

### 4.5 Determinism

All randomness is seeded by turn number, ensuring reproducible behavior for testing and replay validation.

## 5. LLM AI Implementation

### 5.1 Overview

The LLM AI (`CopilotAiClient`) uses GitHub Copilot API (GPT-4 by default) for strategic reasoning. It:
- Receives compiled turn brief with domain status and strategic context
- Is prompted with role-specific objectives
- Returns structured JSON with action selection and rationale
- Automatically falls back to heuristic mode on API failures

### 5.2 API Configuration

- Endpoint: `https://api.githubcopilot.com/chat/completions`
- Model: Configurable (default: `gpt-4`)
- Temperature: 0.7 (some creativity)
- Max tokens: 1024
- Timeout: 25 seconds

### 5.3 Fallback Strategy

If the LLM API call fails (timeout, error, invalid response), the client automatically falls back to `HeuristicAiClient` and logs the failure for monitoring.

## 6. State Compiler

The state compiler transforms the raw role-scoped state view (received from FastAPI) into a strategic turn brief.

### 6.1 Input

The control plane sends the AI agent a request containing:

```json
{
  "runId": "uuid",
  "roleId": "red_commander" | "blue_commander"
}
```

The AI agent then fetches:
- Current world state from `/runs/{runId}/state`
- Legal actions from `/runs/{runId}/actions/legal`
- Recent events from `/runs/{runId}/events`

### 6.2 Compilation Steps

1. **Extract domain status**: Compute stress, resilience, and trends for each domain
2. **Identify couplings**: Flag strong domain couplings (>0.3 strength) that could cause cascades
3. **Analyze trends**: Detect rising/falling patterns in stress and order parameter
4. **Generate objectives**: Create role-specific strategic objectives based on phase
5. **Compile constraints**: List resource limits and action constraints
6. **Suggest tradeoffs**: Identify key strategic choices and their implications

### 6.3 Output (TurnBrief)

```typescript
{
  turn: number;
  phase: "competition" | "crisis" | "hybrid_coercion" | "war_transition" | "limited_war";
  orderParameter: number;
  orderTrend: "rising" | "falling" | "stable";
  domains: {
    [key: string]: {
      stress: number;
      resilience: number;
      trend: "rising" | "falling" | "stable";
    };
  };
  objectives: string[];      // Role-specific goals
  constraints: string[];     // Resource/policy limits
  tradeoffs: string[];       // Strategic considerations
  couplings: string[];       // Domain interdependencies
}
```

## 7. API Interface

### 7.1 Take Turn Endpoint

**POST** `/ai/take-turn`

Request:
```json
{
  "runId": "uuid",
  "roleId": "red_commander" | "blue_commander"
}
```

Response:
```json
{
  "success": boolean,
  "action": {
    "actionType": "string",
    "targetDomain": "string",
    "targetActorId": "string?",
    "intensity": number,
    "rationale": "string",
    "confidence": number
  },
  "rationale": "string",
  "toolCalls": [
    {
      "tool": "string",
      "input": {},
      "output": {},
      "durationMs": number
    }
  ],
  "error": "string?"
}
```

### 7.2 Advisor Endpoint

**POST** `/ai/advisor`

Request:
```json
{
  "runId": "uuid",
  "roleId": "red_commander" | "blue_commander",
  "maxSuggestions": 3
}
```

Response:
```json
{
  "stateSummary": "Turn 7 in Crisis...",
  "strategicOutlook": "Escalation risk is moderate...",
  "suggestions": [
    {
      "rank": 1,
      "action": {
        "actionType": "cyber_defense_hardening",
        "targetDomain": "cyber",
        "targetActorId": "string?",
        "intensity": 0.62
      },
      "rationale": "string",
      "confidence": 0.78,
      "expectedLocalEffects": {
        "summary": "string",
        "stressDelta": -0.07,
        "resilienceDelta": 0.04
      }
    }
  ]
}
```

The advisor endpoint performs read-only analysis: it calls briefing and action-inspection tools but does not submit actions or advance turns.

### 7.3 Health Check

**GET** `/health`

Returns service health status and configuration mode (heuristic/LLM).

## 8. Guardrails

### 8.1 Action Validation

All actions submitted by the AI are validated:
- Must be in the legal actions list
- Intensity must be within allowed range
- Cannot submit forbidden action types (configurable)

### 8.2 Loop Detection

The guardrails system detects and prevents action loops:
- Tracks last 3 actions
- Rejects if new action is identical to all 3 previous actions
- Forces the AI to try a different approach

### 8.3 Tool Call Limits

- Maximum 10 tool calls per turn (configurable)
- Maximum 2 retries on validation failures
- Maximum 30 seconds thinking time

### 8.4 State Isolation

The AI agent service does not have direct access to the database or simulation engine. It receives state only through the API and submits actions only through the REST API—same as human players.

## 9. Observability

### 9.1 Logging

Every AI agent invocation produces a detailed log entry:

```json
{
  "runId": "uuid",
  "turn": 42,
  "roleId": "red_commander",
  "mode": "heuristic" | "llm",
  "toolCalls": [
    {
      "tool": "getTurnBrief",
      "durationMs": 50
    },
    {
      "tool": "listLegalActions",
      "durationMs": 30
    },
    {
      "tool": "submitAction",
      "durationMs": 10
    }
  ],
  "totalDurationMs": 3200,
  "actionSubmitted": true,
  "outcome": "success" | "error"
}
```

### 9.2 Audit Trail

All decisions are logged with:
- Full turn brief
- List of legal actions considered
- Selected action with scores
- Rationale for decision
- Validation results

This enables post-game analysis and AI behavior tuning.

## 10. Deployment

### 10.1 Production Configuration

For production deployment with real LLM opponent:

```bash
# .env or systemd Environment
USE_MOCK_AI=false
COPILOT_API_KEY=your_api_key_here
COPILOT_MODEL=gpt-4
AI_AGENT_PORT=3100
API_BASE_URL=http://localhost:8010/api/v1
LOG_LEVEL=info
```

### 10.2 Development/CI Configuration

For development and CI environments using deterministic heuristic AI:

```bash
USE_MOCK_AI=true
AI_AGENT_PORT=3100
API_BASE_URL=http://localhost:8010/api/v1
LOG_LEVEL=debug
```

### 10.3 Graceful Degradation

If `COPILOT_API_KEY` is not set or LLM calls fail:
1. Agent automatically falls back to heuristic mode
2. Logs the fallback for monitoring
3. Continues gameplay without interruption
4. No manual intervention required

This ensures the game remains playable even if the LLM service is unavailable.

## 11. Future Enhancements

Potential improvements for future versions:

1. **Difficulty Levels**: Easy/Medium/Hard modes with adjustable scoring weights
2. **Persona System**: Different AI personalities (Hawk, Diplomat, Strategist)
3. **Learning System**: Track successful strategies and adapt over time
4. **Multi-action Turns**: Allow AI to submit multiple actions per turn
5. **Lookahead Planning**: Evaluate action sequences, not just single actions
6. **Metrics Dashboard**: Real-time visualization of AI decision-making

## Appendix A: Action Types

The AI can select from 30+ action types across 8 domains:

- **Kinetic**: military_posture, air_defense_activation, naval_patrol, special_operations
- **Maritime & Logistics**: trade_route_disruption, port_security, logistics_reinforcement
- **Energy**: energy_supply_pressure, pipeline_interdiction, energy_reserve_release
- **Geoeconomic & Industrial**: sanction_package, trade_incentive, industrial_sabotage, supply_chain_diversification
- **Cyber**: cyber_intrusion, cyber_defense_hardening, ddos_attack
- **Space & PNT**: satellite_interference, pnt_spoofing, space_surveillance
- **Information & Cognitive**: disinformation_campaign, media_counter_narrative, strategic_leaks
- **Domestic Political & Fiscal**: domestic_mobilization, fiscal_stimulus, political_messaging
- **Meta**: deescalate, hold_steady

Each action has:
- Specific intensity ranges
- Estimated stress impact on target domains
- Role visibility constraints
- Phase availability rules
