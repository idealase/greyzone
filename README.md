# Greyzone

A multi-user distributed battlespace simulation modeling a modern polycrisis-to-war transition across 8 interconnected domains. Human players compete against an AI opponent in a turn-based strategic environment with fog of war, phase transitions, and deterministic replay.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  React UI   │◄───►│  FastAPI     │◄───►│ Rust Engine  │
│  (Vite/TS)  │     │  (Python)   │     │ (sim-engine) │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ PostgreSQL  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  AI Agent   │
                    │  (Node/TS)  │
                    └─────────────┘
```

| Service | Stack | Port | Purpose |
|---------|-------|------|---------|
| `apps/web` | React + TypeScript + Vite | 5173 | Operator console / player interface |
| `apps/api` | FastAPI (Python) | 8000 | Control plane, orchestration, persistence |
| `services/sim-engine` | Rust | stdin/stdout | Simulation engine (sole state authority) |
| `apps/ai-agent` | Node.js + TypeScript | 3100 | Bounded AI opponent planner |
| PostgreSQL | - | 5432 | Durable persistence |

## Simulation Domains

1. **Kinetic** — military forces and weapons
2. **Maritime & Logistics** — shipping, ports, supply chains
3. **Energy** — energy supply, infrastructure, prices
4. **Geoeconomic & Industrial** — trade, sanctions, industrial capacity
5. **Cyber** — network attacks, defense, incidents
6. **Space & PNT** — satellites, GPS, positioning
7. **Information & Cognitive** — narratives, disinformation, public trust
8. **Domestic Political & Fiscal** — political cohesion, fiscal capacity

## Phase Model

| Phase | Name | Ψ Threshold |
|-------|------|-------------|
| 0 | Competitive Normality | Ψ < 0.15 |
| 1 | Hybrid Coercion | 0.15 ≤ Ψ < 0.30 |
| 2 | Acute Polycrisis | 0.30 ≤ Ψ < 0.50 |
| 3 | War Transition | 0.50 ≤ Ψ < 0.70 |
| 4 | Overt Interstate War | 0.70 ≤ Ψ < 0.85 |
| 5 | Generalized / Bloc War | Ψ ≥ 0.85 |

Transitions use a composite order parameter with hysteresis to prevent flickering.

## Quick Start

### Prerequisites

- Rust (stable, 1.75+)
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

### Setup

```bash
# 1. Build the simulation engine
cd services/sim-engine && cargo build --release && cd ../..

# 2. Set up the Python API
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cd ../..

# 3. Set up the frontend
cd apps/web && npm install && cd ../..

# 4. Set up the AI agent
cd apps/ai-agent && npm install && cd ../..

# 5. Set up the database
createdb greyzone
psql greyzone < infra/db/migrations/001_initial.sql
psql greyzone < infra/db/seed/001_baltic_flashpoint.sql

# 6. Start services (in separate terminals)
cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
cd apps/web && npm run dev
cd apps/ai-agent && npm run dev
```

Or use the Makefile:

```bash
make setup       # Install all dependencies
make db-setup    # Create database
make db-migrate  # Run migrations
make test        # Run all tests
make dev         # Print instructions for starting services
```

### Running Tests

```bash
make test                    # All tests
make test-engine             # Rust engine (51 tests)
make test-api                # FastAPI (34 tests)
make test-web                # React frontend
make test-ai-agent           # AI agent
```

## Project Structure

```
greyzone/
├── apps/
│   ├── web/                 # React + TypeScript frontend
│   ├── api/                 # FastAPI control plane
│   └── ai-agent/            # AI opponent service (Node/TS)
├── services/
│   └── sim-engine/          # Rust simulation engine
├── packages/
│   └── schemas/             # Shared TypeScript schemas (Zod)
├── infra/
│   └── db/
│       ├── migrations/      # SQL migrations
│       └── seed/            # Seed data (Baltic Flashpoint)
├── docs/
│   ├── bootstrap/
│   │   ├── init-repo-prompt.md      # Founding specification
│   │   └── acceptance-checklist.md  # Delivery acceptance criteria
│   ├── architecture.md
│   ├── simulation-spec.md
│   ├── ai-agent-spec.md
│   ├── multi-user-spec.md
│   ├── product-spec.md
│   ├── api-spec.md
│   ├── data-model.md
│   ├── testing-strategy.md
│   └── adr/                 # Architectural Decision Records
├── tests/
│   ├── e2e/
│   └── contract/
├── .github/workflows/ci.yml
├── Makefile
└── README.md
```

## Key Design Decisions

- **Rust engine is sole state authority** — all world-state mutation goes through the engine; no service bypasses it
- **AI is a bounded planner** — the AI agent can only inspect role-scoped state and submit actions through validated tools
- **Event sourcing** — all state changes are logged as events for deterministic replay
- **Multi-user first** — role assignment, player identity, turn ownership, and concurrent participation are first-class concerns
- **Phase transitions use composite order parameter** — not single-threshold triggers; includes cross-domain coupling, mobilization indicators, and resilience damping with hysteresis

## Default Scenario: Baltic Flashpoint

NATO (Blue Coalition) and Russia (Red Federation) compete across all 8 domains around the Baltic region. Includes:
- 5 actors (Blue Coalition, Red Federation, Neutral States, Separatist Movement, European Energy Grid)
- 2 player roles (blue_commander, red_commander) + observer
- 15 stochastic events
- 50-turn maximum
- Full domain coupling matrix

## Documentation

- [Founding Specification](docs/bootstrap/init-repo-prompt.md)
- [Acceptance Checklist](docs/bootstrap/acceptance-checklist.md)
- [Architecture](docs/architecture.md)
- [Simulation Model](docs/simulation-spec.md)
- [AI Agent](docs/ai-agent-spec.md)
- [Multi-User Model](docs/multi-user-spec.md)
- [API Contracts](docs/api-spec.md)
- [Data Model](docs/data-model.md)
- [Testing Strategy](docs/testing-strategy.md)

## License

Proprietary. All rights reserved.
