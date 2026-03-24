# Testing Strategy

## Overview

Greyzone uses a full testing pyramid with tests at every level: unit, integration, contract, and end-to-end.

## Test Distribution

| Service | Framework | Test Count | Focus |
|---------|-----------|------------|-------|
| sim-engine (Rust) | cargo test | 51 | State transitions, phases, couplings, determinism |
| api (Python) | pytest | 34 | CRUD, run lifecycle, engine bridge, replay |
| web (React) | vitest | 31 | Components, stores, formatters |
| ai-agent (Node) | vitest | 42 | Guardrails, state compiler, tool executor, integration |

## Simulation Engine Tests

- **State tests**: WorldState creation, serialization roundtrips
- **Action tests**: All 14 action types — validation, application, effect calculation
- **Phase tests**: Order parameter computation, phase determination, hysteresis (enter/exit thresholds)
- **Coupling tests**: Stress propagation between domains, coupling matrix serialization
- **Replay tests**: Deterministic replay with same seed produces identical state
- **Visibility tests**: Role-scoped state filtering hides actor info appropriately
- **Scenario tests**: Baltic Flashpoint loads, all domains initialized, roles reference valid actors
- **Legal action tests**: Actions derived per role and phase constraints

## API Tests

- **Scenario CRUD**: Create, list, get, update, delete
- **Run lifecycle**: Create, join, start, pause, resume, stop
- **Actions**: Get legal actions, submit valid/invalid actions, advance turn
- **Users**: Create, list, get, duplicate detection
- **Replay**: Get events, get replay at turn, get snapshots
- **Engine bridge**: Binary not found handling, command dispatch, shutdown

Tests use async SQLite backend (aiosqlite) so no PostgreSQL needed for CI.

## Frontend Tests

- **PhaseIndicator**: Renders phase name, color, Ψ value, transition warning
- **DomainPanel**: Renders all 8 domains, stress/resilience bars, handles zero values
- **RunStore**: State initialization, updates, reset
- **Formatters**: Phase labels, domain names, percentages, order parameter formatting

## AI Agent Tests

- **StateCompiler**: Briefing generation, trend detection, objective computation
- **Guardrails**: Tool call limits, action validation, loop detection, forbidden actions
- **ToolExecutor**: Call counting, logging, budget enforcement, error handling
- **ActionSelector**: Full turn-taking flow with mocked backend
- **Integration**: HTTP endpoint testing with mocked backend responses

## Running Tests

```bash
make test              # All tests
make test-engine       # Rust only
make test-api          # Python only
make test-web          # React only
make test-ai-agent     # Node only
```

## Coverage

Coverage reporting is available for Python (`pytest-cov`) and can be enabled for JS/TS (vitest coverage).

Critical path coverage targets:
- Simulation engine: phase transitions, action application, coupling propagation
- API: run lifecycle state machine, action validation pipeline
- AI agent: guardrail enforcement, tool budget limits

## CI Integration

All tests run in GitHub Actions CI on every push/PR to main. See `.github/workflows/ci.yml`.
