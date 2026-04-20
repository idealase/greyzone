# Greyzone Architecture Overview

Version: 1.1
Last Updated: April 2026
Status: Governing

## 1. System Context

Greyzone is composed of four primary services, a shared database, and a message-passing layer. Each service has a single responsibility and communicates through well-defined interfaces.

```
                                  ┌──────────────────┐
                                  │     Browser      │
                                  │  (React 19 UI)   │
                                  └────────┬─────────┘
                                           │ HTTPS / WSS
                                           ▼
                               ┌──────────────────────┐
                               │   Nginx (port 8020)  │
                               │   Reverse Proxy      │
                               └────┬────────────┬────┘
                                    │            │
                        ┌───────────┘            └──────────┐
                        ▼                                   ▼
                 ┌─────────────┐                    ┌──────────────┐
                 │   FastAPI   │                    │ Static Files │
                 │ Control Plane│                    │  (dist/)     │
                 │ (port 8010) │                    └──────────────┘
                 └──┬───┬───┬──┘
                    │   │   │
       ┌────────────┘   │   └────────────┐
       ▼                ▼                 ▼
┌─────────────┐  ┌──────────┐   ┌──────────────┐
│ Rust Engine  │  │ PostgreSQL│   │  AI Agent    │
│ (subprocess) │  │   (5432) │   │  Service     │
└─────────────┘  └──────────┘   │ (port 3100)  │
                                 └──────────────┘
```

## 2. Service Responsibilities

### 2.1 Frontend (React 19 + TypeScript 5.6 + Vite 6)

**Role**: Operator console and visualization layer.

**Responsibilities**:
- Render role-scoped world state received from the control plane.
- Provide move composition UI with client-side pre-validation and effect previews.
- Display phase transition notifications, escalation timeline, and event feed with filtering.
- Support replay controls (scrub, perspective switching).
- Manage WebSocket connection lifecycle with auto-reconnect and exponential backoff.
- Provide interactive domain panels, battlespace canvas, coupling graph, and AI intelligence report.
- Interactive tutorial system (8-step walkthrough for new players).
- Never derive or compute game state; always trust server-provided state.

**Technology**: React 19, TypeScript 5.6, Vite 6, Zustand (state management), TanStack Query (server state), Recharts (charts), vanilla CSS with BEM naming.

**Build artifact**: Static bundle in `apps/web/dist/`, served by Nginx in production.

### 2.2 Simulation Engine (Rust)

**Role**: Sole authority over world-state mutation.

**Responsibilities**:
- Accept validated move sets and current world state as input.
- Compute the next world state deterministically.
- Evaluate phase transition conditions via the composite order parameter.
- Emit structured events for every state mutation.
- Enforce move legality as a final validation gate.
- Provide scenario validation (initial state consistency checks).
- Expose functionality via a C-compatible FFI boundary consumed by FastAPI through PyO3 bindings, or as a standalone binary invoked via subprocess with JSON stdio.

**Determinism guarantee**: Given identical inputs and seed, output is bit-identical. The engine uses no global mutable state, no non-deterministic system calls, and a seedable PRNG (ChaCha20).

**Technology**: Rust (stable), serde for serialization, no async runtime (pure computation).

**Integration mode**: Compiled as a standalone binary. FastAPI invokes the engine as a subprocess, passing JSON over stdin/stdout. The API serializes the world state and move set as JSON, invokes the binary, and deserializes the result.

### 2.3 Control Plane (FastAPI / Python)

**Role**: Backend-for-frontend, orchestration, authentication, authorization, persistence.

**Responsibilities**:
- Serve the frontend static bundle.
- Authenticate users and manage sessions (JWT-based).
- Authorize moves against role permissions before forwarding to the engine.
- Orchestrate the tick pipeline: collect moves, invoke engine, persist events, distribute state.
- Manage WebSocket connections and fan out role-scoped state updates.
- Provide REST API for scenario CRUD, run lifecycle, user management, replay queries.
- Persist events and state snapshots to PostgreSQL.
- Invoke the AI agent service when an AI player's turn arrives.

**Technology**: Python 3.12+, FastAPI, Uvicorn, SQLAlchemy (async), Alembic (migrations), Pydantic (validation), python-jose (JWT).

### 2.4 AI Agent Service (Node.js + TypeScript)

**Role**: Bounded planner for AI-controlled players.

**Responsibilities**:
- Receive a compiled state view (matching the AI's assigned role visibility) from the control plane.
- Assemble a prompt with the state view, available moves, and strategic context.
- Invoke the GitHub Copilot SDK to generate a plan.
- Translate the plan into one or more legal moves.
- Submit moves back to the control plane through the standard move submission API.
- Enforce tool call budget (max calls per tick) and timeout.
- Never read or write simulation state directly.

**Technology**: Node.js 20+, TypeScript, Express 4, Pino (structured logging). Two AI modes: heuristic (deterministic scoring with phase-aware strategy) and LLM (GitHub Copilot SDK with graceful fallback to heuristic).

### 2.5 PostgreSQL

**Role**: Durable persistence layer.

**Responsibilities**:
- Store user accounts, scenarios, run configurations, and role assignments.
- Store append-only event log.
- Store periodic state snapshots for fast replay initialization.
- Provide transactional guarantees for event persistence.

**Technology**: PostgreSQL 16+.

## 3. Data Flow

### 3.1 Tick Pipeline (Steady State)

```
1. Timer fires (or all moves received) → FastAPI tick handler
2. FastAPI collects pending moves from all active players
3. FastAPI invokes AI agent service for AI players (if moves not yet submitted)
4. AI agent service returns moves via REST
5. FastAPI performs authorization check on all moves
6. FastAPI serializes (moves + current_state + seed) → Rust engine
7. Rust engine validates moves, computes next state, emits events
8. Rust engine returns (new_state, events[], phase_transition?)
9. FastAPI persists events to PostgreSQL (append-only)
10. FastAPI persists state snapshot (periodic, e.g., every 10 ticks)
11. FastAPI computes per-role visibility filters
12. FastAPI pushes filtered state via WebSocket to each connected client
13. Frontend renders new state
```

### 3.2 Move Submission

```
Player/AI → POST /api/runs/{run_id}/moves
  → FastAPI validates auth + role permissions
  → Move queued for current tick
  → 202 Accepted (move will be processed at next tick)
```

### 3.3 Replay

```
Analyst → GET /api/runs/{run_id}/replay?from_tick=0&to_tick=N&perspective=blue_commander
  → FastAPI loads snapshot nearest to from_tick
  → FastAPI streams events from from_tick to to_tick
  → Client replays locally with visibility filter applied
```

## 4. Inter-Service Communication

| From | To | Protocol | Format | Pattern |
|---|---|---|---|---|
| Browser | Nginx | HTTPS, WSS | JSON | Request-response, server push |
| Nginx | FastAPI | HTTP, WS | JSON | Reverse proxy |
| FastAPI | Rust Engine | Subprocess | JSON (stdin/stdout) | Synchronous invocation |
| FastAPI | PostgreSQL | TCP | SQL (SQLAlchemy async) | Async query |
| FastAPI | AI Agent | HTTP | JSON | Request-response |
| AI Agent | FastAPI | HTTP | JSON | Request-response (move submission) |

## 5. Deployment Topology

### 5.1 Local Development

All services run on a single machine:

```
Terminal 1: cd services/sim-engine && cargo build --release
Terminal 2: cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
Terminal 3: cd apps/ai-agent && npm run dev
Terminal 4: cd apps/web && npm run dev
PostgreSQL: localhost:5432
```

Or use the Makefile: `make setup` to install all dependencies, then `make dev` for start instructions.

### 5.2 Single-Server Deployment (Current)

All services run on one server at **greyzone.sandford.systems**:

- **Nginx** reverse proxy on port 8020 with TLS via Cloudflare Tunnel.
  - Serves frontend static files from `apps/web/dist/` with SPA fallback.
  - Proxies `/api/` to the API service on `127.0.0.1:8010`.
  - WebSocket upgrade support for `/api/v1/ws/`.
  - Sets `X-Real-IP` and `X-Forwarded-For` headers.
- **FastAPI** runs as a systemd service (`greyzone-api.service`) via uvicorn on port 8010.
- **AI Agent** runs as a systemd service (`greyzone-ai.service`) on port 3100.
- **Rust engine** invoked as a subprocess by the API; binary at `services/sim-engine/target/release/greyzone-engine`.
- **PostgreSQL** on localhost:5432 (`greyzone` database).
- **Cloudflare Tunnel** provides HTTPS access at `greyzone.sandford.systems`.
- **CI/CD**: GitHub Actions on a self-hosted runner. Push to `main` triggers build, test, and deploy.

Deployment is managed by `infra/dev/deploy.sh`, which copies nginx and systemd configs and restarts services. **Note**: The deploy script does NOT build the frontend or engine — these must be built manually before deploying:

```bash
cd apps/web && npm run build        # Build frontend → dist/
cd services/sim-engine && cargo build --release  # Build engine binary
bash infra/dev/deploy.sh            # Deploy configs and restart services
```

### 5.3 Future: Distributed

Not in scope for v1, but the architecture supports splitting services across hosts by replacing in-process engine calls with gRPC and introducing a message broker for event distribution.

## 6. Security Architecture

### 6.1 Authentication

- JWT tokens issued on login, short-lived (15 min) with refresh tokens (7 days).
- WebSocket connections authenticated via token in the initial handshake.
- AI agent service authenticates to FastAPI with a service-to-service API key.

### 6.2 Authorization

- Role-based access control (RBAC) enforced at the FastAPI layer.
- Move validation checks that the submitting user holds a role permitted to make that move type in that layer.
- Visibility filtering is applied server-side; the client never receives data outside its scope.

### 6.3 Data Integrity

- Event log is append-only; no UPDATE or DELETE operations on event tables.
- State snapshots are checksummed (SHA-256) and the checksum is stored alongside.
- Engine output is validated by FastAPI before persistence (schema check, range check).

## 7. Error Handling and Resilience

### 7.1 Engine Failure

If the Rust engine panics or returns an error, the tick is aborted. The run enters a paused state, the error is logged, and an admin notification is emitted. The previous valid state remains authoritative.

### 7.2 AI Agent Timeout

If the AI agent service does not return moves within the configured timeout (default: 10 seconds), the AI player's moves for that tick are treated as a no-op (pass). The tick proceeds with human moves only.

### 7.3 WebSocket Disconnection

Clients that disconnect are given a grace period (configurable, default: 60 seconds) to reconnect. On reconnection, the client receives a full state snapshot for its role. If the grace period expires, the player's slot may be opened for reassignment (configurable per run).

### 7.4 Database Failure

If PostgreSQL is unreachable, the tick pipeline halts. The run pauses automatically and resumes when the database recovers. No state is lost because events are only acknowledged after successful persistence.

## 8. Observability

- **Structured logging**: All services emit JSON-formatted logs with correlation IDs (run_id, tick_number, user_id).
- **Metrics**: FastAPI exposes Prometheus metrics (tick latency, active connections, move throughput).
- **Health checks**: Each service exposes a `/health` endpoint.
- **Event log**: The append-only event log itself serves as a detailed audit trail.

## 9. Directory Structure

```
greyzone/
├── apps/
│   ├── web/                # React 19 + TypeScript + Vite frontend
│   │   ├── src/
│   │   │   ├── components/ # UI components (Map, Dashboard, Controls)
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── pages/      # Route-level pages
│   │   │   ├── services/   # API client
│   │   │   ├── stores/     # Zustand state stores
│   │   │   └── types/      # TypeScript interfaces
│   │   ├── dist/           # Production build output
│   │   └── package.json
│   ├── api/                # FastAPI control plane
│   │   ├── app/
│   │   │   ├── routers/    # API route modules
│   │   │   ├── models/     # SQLAlchemy ORM models
│   │   │   ├── schemas/    # Pydantic schemas
│   │   │   ├── services/   # Business logic
│   │   │   └── main.py     # App entry
│   │   ├── alembic/        # Database migrations
│   │   └── pyproject.toml
│   └── ai-agent/           # Node.js AI opponent
│       ├── src/
│       └── package.json
├── services/
│   └── sim-engine/         # Rust simulation engine
│       ├── src/
│       │   ├── lib.rs
│       │   ├── engine.rs   # Core simulation loop
│       │   ├── domains/    # 8 domain modules
│       │   ├── events.rs   # Event sourcing types
│       │   └── types.rs
│       └── Cargo.toml
├── packages/
│   └── schemas/            # @greyzone/schemas (Zod)
├── infra/
│   ├── dev/
│   │   ├── deploy.sh       # Deployment script
│   │   ├── greyzone-api.service
│   │   ├── greyzone-ai.service
│   │   └── nginx-greyzone  # Nginx config
│   └── db/
│       ├── migrations/     # SQL migrations
│       └── seed/           # Scenario seed data
├── docs/                   # Specs, guides, ADRs
├── tests/                  # Contract + E2E tests
├── Makefile                # Top-level orchestration
└── README.md
```
