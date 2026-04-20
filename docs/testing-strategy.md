# Testing Strategy

Version: 1.1
Last Updated: April 2026

## Overview

Greyzone uses a full testing pyramid with tests at every level: unit, integration, contract, and end-to-end. All test suites run automatically in CI on every push and pull request via GitHub Actions.

## Test Distribution

| Service | Framework | Test Count | Focus |
|---------|-----------|------------|-------|
| sim-engine (Rust) | cargo test | 51 | State transitions, phases, couplings, determinism |
| api (Python) | pytest | 34 | CRUD, run lifecycle, engine bridge, replay |
| web (React) | vitest | ~95 | Components, stores, hooks, formatters |
| ai-agent (Node) | vitest | 42 | Guardrails, state compiler, tool executor, integration |
| E2E | Playwright | 3 suites | Login, scenarios, run lifecycle |

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

- **PhaseIndicator**: Renders phase name, color, Ψ value, transition warning, escalation timeline
- **DomainPanel**: Renders all 8 domains, stress/resilience bars, handles zero values, detail popovers
- **BattlespaceCanvas**: Canvas rendering, actor nodes, coupling lines, tooltips, legend toggle
- **EventFeed**: Event rendering, type filtering, search, domain filter, turn range, detail expansion
- **AiMovePanel**: Move history, domain heatmap, rationale expansion, confidence badges
- **ActionPanel**: Legal actions, move budget, effect previews, turn confirmation
- **RunStore**: State initialization, updates, reset, Ψ history tracking
- **Formatters**: Phase labels, domain names, percentages, order parameter formatting
- **Hooks**: useActions, useRunState, useWebSocket

**Note**: Frontend tests should be run with `npx vitest run` (not `npm run test`, which also invokes Playwright E2E suites).

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

Coverage targets:
- **Simulation engine**: 80% — phase transitions, action application, coupling propagation
- **API**: 80% — run lifecycle state machine, action validation pipeline
- **Frontend**: 70% — components, stores, hooks
- **AI agent**: 80% — guardrail enforcement, tool budget limits

## CI Integration

All tests run in GitHub Actions CI on every push and pull request to main. The CI pipeline (`.github/workflows/ci.yml`) runs four parallel jobs:

1. **Engine** (`services/sim-engine`): `cargo test`, `cargo clippy -- -D warnings`, `cargo fmt --check`
2. **API** (`apps/api`): `pytest app/tests/ -v`, `ruff check app/`, `mypy app/`
3. **Web** (`apps/web`): `npx vitest run`, `npx tsc --noEmit`, `npm run lint`
4. **AI Agent** (`apps/ai-agent`): `npx vitest run`, `npm run lint`

After all four jobs pass, a deploy job runs on the self-hosted runner (`[self-hosted, linux, x64, greyzone]`) to build and deploy to `greyzone.sandford.systems`.

## E2E Tests

End-to-end tests use **Playwright** with Chromium and run post-deployment against the live site.

```bash
npx playwright test           # Run all E2E suites
npx playwright test --headed  # Run with browser visible
```

E2E suites cover:
- **Login flow**: Registration, authentication, session management
- **Scenario management**: Create, browse, select scenarios
- **Run lifecycle**: Create run, join, play turns, advance phases, complete game

E2E tests require all services to be running and accessible at the configured base URL. They run as a separate CI job after successful deployment.

## Known Test Issues

- Two pre-existing `authStore.test.ts` failures related to `localStorage` not being available in the Vitest test environment. These do not affect production functionality.
