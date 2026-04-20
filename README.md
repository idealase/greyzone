# Greyzone

**A geopolitical simulation of grey-zone conflict escalation.**

Command a nation through an escalating polycrisis — from diplomatic friction to open warfare — across 8 interconnected domains. Outmaneuver an AI opponent (or another player) in a turn-based strategic environment where every decision ripples across military, cyber, economic, diplomatic, information, space, social, and infrastructure systems.

> *"The space between peace and war is where modern conflict lives."*

---

## What Is Greyzone?

Greyzone is a multiplayer strategy simulation that models how modern conflicts escalate through grey-zone tactics — cyber operations, economic coercion, information warfare, and proxy actions — before crossing into open hostilities. Players take command of opposing nations, making strategic decisions each turn while the simulation engine tracks cascading effects across 8 tightly coupled domains.

### Key Features

- **8 Cross-Coupled Domains** — Military, maritime, energy, economic, cyber, space, information, and domestic political systems that influence each other through a coupling matrix
- **6 Escalation Phases** — From Competitive Normality through Hybrid Coercion, Acute Polycrisis, War Transition, and Overt Interstate War to Generalized Bloc War
- **Deterministic Simulation Engine** — A Rust-powered engine ensures every game is fully reproducible and replayable
- **AI Opponent** — A bounded AI planner with strategic personality that adapts its approach based on the current phase and domain pressures
- **Real-Time Multiplayer** — WebSocket-driven live updates, role-based fog of war, and simultaneous move resolution
- **Interactive Tutorial** — Step-by-step walkthrough covering domains, couplings, actions, escalation phases, and the battlespace board
- **Full Replay System** — Scrub through any completed game turn by turn, with perspective switching

---

## How It Plays

1. **Choose a Scenario** — Select from pre-built flashpoints (Baltic, Hormuz) or create your own
2. **Pick a Side** — Play as **Blue Commander** (NATO/defending coalition) or **Red Commander** (revisionist power), or observe
3. **Take Actions** — Each turn, choose from available actions: escalate, de-escalate, reinforce, disrupt, impose sanctions, launch cyber operations, deploy military assets, and more
4. **Watch the World React** — The simulation engine computes cascading effects across all 8 domains, updates stress levels, resilience, and the global order parameter (Ψ)
5. **Navigate Phase Transitions** — As Ψ rises, the conflict escalates through phases, unlocking more aggressive actions but increasing risk of catastrophic outcomes
6. **Win or Survive** — Achieve your strategic objectives before the scenario timer runs out or the situation spirals beyond control

### The Escalation Model

| Phase | Name | Ψ Range | Character |
|-------|------|---------|-----------|
| 0 | Competitive Normality | < 0.15 | Diplomatic friction, posturing |
| 1 | Hybrid Coercion | 0.15 – 0.30 | Proxy actions, cyber probes, sanctions |
| 2 | Acute Polycrisis | 0.30 – 0.50 | Multiple simultaneous crises |
| 3 | War Transition | 0.50 – 0.70 | Mobilization, ultimatums |
| 4 | Overt Interstate War | 0.70 – 0.85 | Direct military engagement |
| 5 | Generalized / Bloc War | ≥ 0.85 | Full-spectrum conflict |

The **order parameter Ψ** is a composite measure of how synchronized and intense the conflict system has become. It's computed from domain stress levels, cross-domain coupling effects, and mobilization indicators — with hysteresis to prevent phase flickering.

---

## Scenarios

### Baltic Flashpoint
NATO (Blue Coalition) versus Russia (Red Federation) across the Baltic region. Five actors including neutral states, a separatist movement, and the European energy grid. Features 15 stochastic events and a 50-turn maximum.

### Hormuz Flashpoint
A naval and energy-focused scenario centered on the Strait of Hormuz. Maritime chokepoint control, energy supply disruption, and regional power projection in a more constrained geographic setting.

---

## The Simulation Dashboard

The player interface provides real-time situational awareness:

- **Phase Indicator & Escalation Timeline** — Visual progress bar showing all 6 phases, your current Ψ position, past transition points, and distance to the next threshold
- **Domain Panels** — Click-to-expand panels for each domain showing stress, resilience, friction, activity, coupled domains, and recent events
- **Battlespace Canvas** — Heat-mapped visualization of domain states with hover tooltips, coupling line highlights, and a toggleable legend
- **Event Feed** — Filterable, searchable log of all game events with type/domain/turn filters and expandable detail views
- **Action Panel** — Submit strategic actions with effect previews showing projected domain impacts before committing
- **AI Intelligence Report** — View the AI opponent's move history, domain targeting heatmap, tool call timeline, and strategic rationale (intel framing)
- **Domain Stress Chart** — Line chart tracking all 8 domain stress values plus the Ψ order parameter over time, with phase threshold reference lines
- **Metrics Overview** — At-a-glance cards for Ψ, phase, turn, resources, dominant domain, and resilience — all with delta indicators showing turn-over-turn changes
- **After-Action Report** — End-of-turn summary with domain deltas, narrative headline, and phase transition alerts
- **Coupling Graph** — Interactive force-directed graph visualizing how domains influence each other

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React 19 UI   │◄───►│   FastAPI API     │◄───►│  Rust Sim Engine │
│  Vite + TS 5.6  │ WS  │  Python 3.12     │     │  (sole state     │
│  Zustand/TQuery │     │  SQLAlchemy async │     │   authority)     │
└─────────────────┘     └────────┬─────────┘     └──────────────────┘
                                 │
                          ┌──────┴──────┐
                          │ PostgreSQL  │
                          │    16       │
                          └──────┬──────┘
                                 │
                          ┌──────┴──────┐
                          │  AI Agent   │
                          │ Node.js/TS  │
                          └─────────────┘
```

| Service | Stack | Port | Purpose |
|---------|-------|------|---------|
| **Frontend** (`apps/web`) | React 19 · Vite 6 · TypeScript · Zustand · TanStack Query · Recharts | 5173 (dev) | Player interface and simulation dashboard |
| **API** (`apps/api`) | FastAPI · SQLAlchemy (async) · Alembic · asyncpg | 8000 (dev) / 8010 (prod) | Orchestration, persistence, WebSocket streaming |
| **Sim Engine** (`services/sim-engine`) | Rust · serde · deterministic RNG | subprocess | Sole state authority — all world mutations go through here |
| **AI Agent** (`apps/ai-agent`) | Node.js · Express · TypeScript · Pino | 3100 | Bounded AI opponent with heuristic + LLM modes |
| **Database** | PostgreSQL 16 · asyncpg | 5432 | Event-sourced state, user accounts, game history |
| **Schemas** (`packages/schemas`) | Zod · TypeScript | — | Shared type definitions between frontend and AI agent |

### Key Design Principles

- **Rust engine as sole state authority** — All world-state mutations go through the engine. No service bypasses it. This ensures deterministic, reproducible simulations.
- **Event sourcing** — Every state change is an immutable event, enabling deterministic replay from any turn and full audit trails.
- **Bounded AI** — The AI agent can only inspect role-scoped state (no cheating via fog-of-war bypass) and submits actions through validated tool schemas.
- **Multi-user first** — Role assignment, fog of war, turn ownership, and concurrent participation are first-class concerns.

---

## Getting Started

### For Players

Greyzone is deployed at **https://greyzone.sandford.systems**. Create an account, pick a scenario, and start playing.

### For Developers

#### Prerequisites

- Rust 1.75+ (stable)
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

#### Quick Setup

```bash
make setup       # Install all dependencies across all services
make db-setup    # Create database and user
make db-migrate  # Run Alembic migrations
make db-seed     # Seed Baltic & Hormuz scenarios
```

#### Start Development Servers

```bash
# Terminal 1 — API
cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd apps/web && npm run dev

# Terminal 3 — AI Agent
cd apps/ai-agent && npm run dev
```

Or run `make dev` for instructions.

#### Manual Setup (step by step)

```bash
# 1. Build the simulation engine
cd services/sim-engine && cargo build --release && cd ../..

# 2. Set up the Python API
cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cd ../..

# 3. Set up the frontend
cd apps/web && npm ci && cd ../..

# 4. Set up the AI agent
cd apps/ai-agent && npm ci && cd ../..

# 5. Set up the database
make db-setup && make db-migrate && make db-seed
```

---

## Running Tests

```bash
make test                    # All tests across all services
make test-engine             # Rust engine tests
make test-api                # FastAPI endpoint + service tests
make test-web                # React component + store tests (Vitest)
make test-ai-agent           # AI agent tests (Vitest)
npx playwright test          # E2E tests (requires running services)
```

---

## Project Structure

```
greyzone/
├── apps/
│   ├── web/                    # React 19 frontend
│   │   ├── src/
│   │   │   ├── components/     # UI components (simulation/, ai/, common/, tutorial/)
│   │   │   ├── hooks/          # Custom React hooks (useActions, useRunState, useWebSocket)
│   │   │   ├── pages/          # Route-level pages (Home, Login, Simulation, Tutorial, etc.)
│   │   │   ├── stores/         # Zustand state (runStore, authStore, wsStore)
│   │   │   ├── api/            # API client + WebSocket manager
│   │   │   └── types/          # TypeScript interfaces (domain, phase, action, run)
│   │   └── package.json
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── routers/        # API route modules
│   │   │   ├── models/         # SQLAlchemy ORM models
│   │   │   ├── schemas/        # Pydantic request/response schemas
│   │   │   ├── services/       # Business logic (engine bridge, game flow, narrative)
│   │   │   └── main.py         # FastAPI app entry point
│   │   ├── alembic/            # Database migrations
│   │   └── pyproject.toml
│   └── ai-agent/               # Node.js AI opponent
│       ├── src/
│       │   ├── services/       # AI decision logic (heuristic + LLM)
│       │   └── index.ts        # Express server
│       └── package.json
├── services/
│   └── sim-engine/             # Rust simulation engine
│       ├── src/
│       │   ├── engine.rs       # Core simulation loop
│       │   ├── domains/        # 8 domain modules
│       │   ├── events.rs       # Event sourcing types
│       │   └── types.rs        # Shared types
│       └── Cargo.toml
├── packages/
│   └── schemas/                # @greyzone/schemas (Zod types)
├── infra/
│   ├── dev/                    # Deployment (nginx, systemd, deploy.sh)
│   └── db/
│       ├── migrations/         # SQL migration files
│       └── seed/               # Scenario seeds (Baltic, Hormuz)
├── docs/                       # Specifications and ADRs
├── tests/                      # Contract tests + E2E (Playwright)
├── .github/
│   └── workflows/              # CI/CD (ci.yml, deploy.yml)
├── Makefile                    # Top-level orchestration
└── playwright.config.ts
```

---

## Documentation

### For Players
- **[Player Guide](docs/player-guide.md)** — Gameplay walkthrough, UI guide, and strategy tips

### Design & Specifications
- **[Product Specification](docs/product-spec.md)** — Features, user stories, and constraints
- **[Simulation Model](docs/simulation-spec.md)** — Domain mechanics, coupling matrix, phase transitions
- **[Architecture](docs/architecture.md)** — System design, service topology, deployment
- **[API Contracts](docs/api-spec.md)** — REST + WebSocket endpoint reference
- **[Data Model](docs/data-model.md)** — PostgreSQL schema and migration strategy
- **[AI Agent](docs/ai-agent-spec.md)** — Heuristic scoring, LLM integration, bounded tools
- **[Multi-User Model](docs/multi-user-spec.md)** — Roles, permissions, real-time sync
- **[Testing Strategy](docs/testing-strategy.md)** — Test pyramid, coverage targets, CI pipeline

### For Scenario Authors
- **[Scenario Authoring Guide](docs/scenario-authoring-guide.md)** — How to create and balance new scenarios

### Architecture Decision Records
- **[ADR 001](docs/adr/001-rust-simulation-engine.md)** — Rust for Simulation Engine
- **[ADR 002](docs/adr/002-fastapi-control-plane.md)** — FastAPI as Control Plane
- **[ADR 003](docs/adr/003-event-sourcing.md)** — Event Sourcing for Replay and Audit
- **[ADR 004](docs/adr/004-ai-bounded-tools.md)** — Bounded Tool Interface for AI
- **[ADR 005](docs/adr/005-multi-user-first.md)** — Multi-User First Architecture

### Bootstrap
- **[Founding Specification](docs/bootstrap/init-repo-prompt.md)** — Original project requirements
- **[Acceptance Checklist](docs/bootstrap/acceptance-checklist.md)** — Delivery criteria

---

## Deployment

Greyzone is deployed at **https://greyzone.sandford.systems** via:

- **Nginx** reverse proxy on port 8020, serving frontend static files and proxying `/api/` to the API
- **systemd** services for the API (`greyzone-api.service` on :8010) and AI agent (`greyzone-ai.service` on :3100)
- **Cloudflare Tunnel** for public HTTPS access
- **GitHub Actions** CI/CD on a self-hosted runner

```bash
make build                        # Build all services
bash infra/dev/deploy.sh          # Deploy (copies configs, restarts services)
sudo nginx -t && sudo systemctl reload nginx
curl -s https://greyzone.sandford.systems/api/v1/health
```

---

## Contributing

- Follow [conventional commits](https://www.conventionalcommits.org/): `feat|fix|docs|chore|refactor|test|ci: description`
- Branch naming: `type/issue-number-short-description`
- All PRs squash-merged to `main`
- All tests must pass before merge
- See `.github/copilot-instructions.md` for detailed coding conventions

---

## License

Proprietary. All rights reserved.
