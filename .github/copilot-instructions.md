# Greyzone — Copilot Instructions

## Project Overview

Greyzone is a multi-player geopolitical simulation platform modelling grey-zone conflict escalation. Players command nations through 8 cross-coupled domains (military, cyber, economic, diplomatic, information, space, social, infrastructure), competing against AI or human opponents. A Rust simulation engine enforces deterministic state transitions; a FastAPI backend orchestrates games and persists state; a React frontend renders the UI; and a Node.js AI agent provides bounded-AI opponents.

## Tech Stack

- **Frontend**: React 19 / Vite 6 / TypeScript 5.6
- **Backend (API)**: FastAPI / Python 3.12 / SQLAlchemy (async) / Alembic
- **Simulation Engine**: Rust (custom crate `greyzone-engine`) — sole state authority
- **AI Agent**: Node.js / Express 4 / TypeScript 5.6 / Pino logging
- **Shared Schemas**: `@greyzone/schemas` — Zod-validated TypeScript types
- **Data**: PostgreSQL 16 (asyncpg) with event-sourced state
- **Styling**: Tailwind CSS / vanilla CSS
- **Testing**: Vitest (frontend + AI agent), pytest (API), cargo test (engine), Playwright (E2E)
- **Deployment**: greyzone.sandford.systems via nginx reverse proxy + systemd services
- **CI/CD**: GitHub Actions on self-hosted runner (`[self-hosted, linux, x64, greyzone]`)

## Quick Commands

```bash
# === Top-level orchestration (Makefile) ===
make setup              # Install ALL dependencies across all services
make test               # Run ALL tests (engine + api + web + ai-agent)
make lint               # Lint ALL services
make build              # Build ALL services for production
make dev                # Print instructions for starting all services

# === Rust Simulation Engine (services/sim-engine/) ===
cd services/sim-engine
cargo build             # Debug build
cargo build --release   # Optimised release binary
cargo test              # Run 51 unit/integration tests
cargo clippy -- -D warnings  # Lint
cargo fmt --check       # Format check

# === FastAPI Backend (apps/api/) ===
cd apps/api
source .venv/bin/activate
pip install -e ".[dev]"          # Install with dev deps
uvicorn app.main:app --reload --port 8000  # Dev server
pytest app/tests/ -v             # Run 34 tests
ruff check app/                  # Lint
ruff format app/                 # Format
mypy app/                        # Type check

# === React Frontend (apps/web/) ===
cd apps/web
npm ci                  # Install dependencies
npm run dev             # Vite dev server at :5173
npm run build           # Production build (tsc + vite) → dist/
npx vitest run          # Unit tests
npx tsc --noEmit        # Type check only
npm run lint            # ESLint

# === AI Agent (apps/ai-agent/) ===
cd apps/ai-agent
npm ci                  # Install dependencies
npm run dev             # tsx watch dev server at :3100
npm run build           # Compile TypeScript → dist/
npx vitest run          # Unit tests
npm run lint            # ESLint

# === Database ===
make db-setup           # createdb + createuser + grant
make db-migrate         # alembic upgrade head
make db-seed            # Seed Baltic/Hormuz scenarios

# === E2E Tests ===
npx playwright test     # Chromium E2E suite (requires deployed services)

# === Deploy ===
bash infra/dev/deploy.sh  # Install nginx + systemd, restart services
```

## Project Structure

```
greyzone/
├── apps/
│   ├── web/                    # React 19 + Vite + TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/     # React components (Map, Dashboard, Controls)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── pages/          # Route-level page components
│   │   │   ├── services/       # API client, WebSocket manager
│   │   │   ├── stores/         # State management
│   │   │   └── types/          # TypeScript interfaces
│   │   ├── dist/               # Production build output
│   │   └── package.json
│   ├── api/                    # FastAPI backend (orchestration + persistence)
│   │   ├── app/
│   │   │   ├── routes/         # API route modules
│   │   │   ├── models/         # SQLAlchemy ORM models
│   │   │   ├── schemas/        # Pydantic request/response schemas
│   │   │   ├── services/       # Business logic (engine bridge, game flow)
│   │   │   ├── config.py       # Settings from environment
│   │   │   ├── database.py     # Async engine + session factory
│   │   │   └── main.py         # FastAPI app entry
│   │   ├── alembic/            # Database migrations
│   │   └── pyproject.toml
│   └── ai-agent/               # Node.js AI opponent service
│       ├── src/
│       │   ├── index.ts        # Express app + routes
│       │   └── config.ts       # Port, API URL, LLM settings
│       └── package.json
├── services/
│   └── sim-engine/             # Rust simulation engine (sole state authority)
│       ├── src/
│       │   ├── lib.rs          # Library root
│       │   ├── engine.rs       # Core simulation loop
│       │   ├── domains/        # 8 domain modules
│       │   ├── events.rs       # Event sourcing types
│       │   └── types.rs        # Shared types
│       └── Cargo.toml
├── packages/
│   └── schemas/                # @greyzone/schemas — shared Zod types
│       └── package.json
├── infra/
│   ├── dev/
│   │   ├── deploy.sh           # Deployment script
│   │   ├── greyzone-api.service    # systemd unit for API (:8010)
│   │   ├── greyzone-ai.service     # systemd unit for AI agent (:3100)
│   │   └── nginx-greyzone          # Nginx reverse proxy config
│   └── db/
│       ├── migrations/         # SQL migration files
│       └── seed/               # Scenario seed data (Baltic, Hormuz)
├── docs/                       # Architecture, specs, ADRs (15 files)
├── Makefile                    # Top-level build orchestration (20+ targets)
├── .github/
│   ├── workflows/              # CI/CD pipelines (ci.yml, deploy.yml)
│   ├── copilot-instructions.md # This file
│   ├── agents/                 # Agent role definitions
│   ├── prompts/                # Prompt templates
│   ├── skills/                 # Deployment & ops skills
│   └── ISSUE_TEMPLATE/         # Issue templates
└── playwright.config.ts        # E2E test configuration
```

## Coding Conventions

### General
- Use TypeScript strict mode in all TS projects — no `any` types
- Use Python type hints on all function signatures
- Rust: no `unwrap()` in library code — use `Result`/`Option` propagation
- Keep functions under 50 lines — extract helpers if longer
- Error messages must be user-friendly, not stack traces

### Naming
- React components: PascalCase (`MapView.tsx`)
- TypeScript hooks: `use` prefix (`useGameState.ts`)
- Python modules: snake_case (`game_service.py`)
- Rust modules: snake_case (`phase_transition.rs`)
- Test files: `*.test.ts` (TypeScript), `test_*.py` (Python), inline `#[cfg(test)]` (Rust)

### File Organisation
- One component per file in React
- Co-locate tests with source in TypeScript projects
- Python tests live in `app/tests/` directory
- Shared types go in `@greyzone/schemas` — never define API types inline

### Git
- Conventional commits: `feat|fix|docs|chore|refactor|test|ci: description`
- Branch naming: `type/issue-number-short-description` (e.g., `feat/42-fog-of-war`)
- Always squash merge to `main`

## Architecture Decisions

- **Rust engine as sole state authority**: All world-state mutations go through the Rust binary. No service bypasses it. This ensures deterministic, reproducible simulations with seeded RNG.
- **Event sourcing**: Every state change is an immutable event, enabling deterministic replay from any turn and full audit trails.
- **Bounded AI tools**: The AI agent can only inspect role-scoped state (no opponent fog-of-war) and submits actions through Zod-validated tool schemas. This prevents cheating and hallucinated actions.
- **FastAPI as control plane**: Orchestrates game flow, persists state to PostgreSQL, bridges between frontend/AI and the Rust engine via subprocess JSON protocol.
- **Monorepo with Makefile**: All services in one repo with top-level Makefile for consistent build/test/deploy across 4 languages.

## Deployment

- **URL**: https://greyzone.sandford.systems
- **Frontend**: Nginx serves `apps/web/dist/` with SPA fallback
- **API**: systemd `greyzone-api.service` → uvicorn on `127.0.0.1:8010`
- **AI Agent**: systemd `greyzone-ai.service` → Node.js on `127.0.0.1:3100`
- **Nginx**: Listens on port 8020, proxies `/api/` to `:8010` (with WebSocket upgrade)
- **Cloudflare Tunnel**: Configured in `~/.cloudflared/config.yml`

### Deployment Checklist
1. All tests pass: `make test`
2. Build succeeds: `make build`
3. Deploy: `bash infra/dev/deploy.sh`
4. Reload nginx: `sudo nginx -t && sudo systemctl reload nginx`
5. Health check: `curl -s https://greyzone.sandford.systems/api/v1/health`

## Testing Strategy

- **Rust engine**: `cargo test` — 51 unit/integration tests covering all 8 domains, phase transitions, and event replay
- **FastAPI API**: `pytest app/tests/ -v` — 34 tests covering endpoints, auth, game flow with mock engine
- **Frontend**: `npx vitest run` — component and hook tests with React Testing Library
- **AI Agent**: `npx vitest run` — tool validation, decision logic, mock AI mode
- **E2E**: `npx playwright test` — critical user flows (create game, join, play turn) on Chromium
- **Coverage target**: 80% for engine and API, 70% for frontend
- **CI**: All test suites run on every push/PR via GitHub Actions

### What to Test
- All simulation domain calculations and phase transitions (engine)
- API endpoint request/response contracts and auth flows (API)
- Component rendering and user interactions (frontend)
- AI tool validation and decision boundaries (AI agent)
- Critical user journeys end-to-end (Playwright)

### What NOT to Test
- CSS/styling details
- Third-party library internals
- Implementation details that may change — test behaviour, not code

## Common Pitfalls

- **Engine binary path**: The API expects `GREYZONE_ENGINE_BINARY` to point to the compiled Rust binary. Always `cargo build --release` before running the API.
- **Database migrations**: Always run `make db-migrate` after pulling — schema changes are frequent.
- **Port mapping**: Dev uses `:8000` (API) and `:5173` (frontend). Production uses `:8010` (API behind nginx on `:8020`). Don't confuse them.
- **Cross-domain coupling**: The simulation engine models 8 coupled domains. Changes to one domain's logic can cascade — always run the full engine test suite.
- **AI fog of war**: The AI agent must never receive opponent state. All state inspection goes through role-scoped endpoints. Violating this breaks game integrity.
- **Event sourcing**: Never mutate state directly — all changes must be events. Breaking this breaks replay determinism.

## Environment Variables

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `GREYZONE_DATABASE_URL` | PostgreSQL async connection string | systemd EnvironmentFile |
| `GREYZONE_ENGINE_BINARY` | Path to compiled Rust engine binary | systemd EnvironmentFile |
| `GREYZONE_AI_AGENT_URL` | AI agent service URL (default: `http://localhost:3100`) | systemd EnvironmentFile |
| `GREYZONE_CORS_ORIGINS` | Allowed CORS origins | systemd EnvironmentFile |
| `GREYZONE_JWT_SECRET_KEY` | JWT signing secret | systemd EnvironmentFile |
| `AI_AGENT_PORT` | AI agent listen port | systemd EnvironmentFile |
| `USE_MOCK_AI` | `true` for heuristic AI, `false` for LLM-backed | systemd EnvironmentFile |
| `COPILOT_API_KEY` | LLM API key for real AI mode | systemd EnvironmentFile |

> **Note**: Never hardcode secrets. Never commit `.env` files. Never log sensitive values.

## Related Repos

- **idealase.github.io**: Meta-repo with agentic SDLC docs and shared templates

## Agent-Specific Instructions

### Scope Control
- Stay within the files listed in the issue. Do not refactor unrelated code.
- If you discover a bug outside your scope, note it in the PR but don't fix it.
- Maximum diff size: 200 lines for size/S, 500 lines for size/M

### PR Format
- Title: conventional commit format (`feat: add fog-of-war rendering`)
- Body: reference the issue (`Closes #42`)
- Include a "Changes" section listing what was modified and why
- Include a "Testing" section showing test commands run and results

### What NOT to Do
- Do not modify CI/CD workflows unless the issue specifically asks for it
- Do not update dependencies unless the issue specifically asks for it
- Do not add new dev dependencies without explicit instruction
- Do not modify nginx configs, systemd units, or deployment scripts
- Do not read or modify `.env` files, credentials, or secrets
- Do not bypass the Rust engine — all state mutations go through it
