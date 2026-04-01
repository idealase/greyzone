# greyzone

## Quick Reference
- **Setup all**: `make setup` (installs all service dependencies)
- **Test all**: `make test`
- **Frontend build**: `cd apps/web && npm run build` (`tsc -b && vite build`)
- **Frontend test**: `cd apps/web && npx vitest run`
- **Frontend lint**: `cd apps/web && npm run lint`
- **Frontend dev**: `cd apps/web && npm run dev` → http://localhost:5173
- **API test**: `cd apps/api && pytest app/tests/ -v`
- **API lint**: `cd apps/api && ruff check app/`
- **API typecheck**: `cd apps/api && mypy app/ --ignore-missing-imports`
- **API start**: `cd apps/api && uvicorn app.main:app --reload --port 8010`
- **Engine test**: `cd services/sim-engine && cargo test`
- **Engine lint**: `cd services/sim-engine && cargo clippy -- -D warnings`
- **AI agent dev**: `cd apps/ai-agent && npm run dev` (tsx watch)
- **AI agent test**: `cd apps/ai-agent && npx vitest run`
- **Deploy**: Push to `main` → CI runs all checks → self-hosted runner runs `infra/dev/deploy.sh`

## Architecture
Polycrisis geopolitical simulation — 8 domains, 6 escalation phases, multiplayer.

```
/apps/web/              → React 19 + Vite + TypeScript (Zustand, TanStack Query, Recharts)
/apps/api/              → FastAPI + SQLAlchemy + asyncpg + PostgreSQL + Alembic migrations
/apps/ai-agent/         → Node.js + Express + TypeScript (AI opponent service on port 3100)
/services/sim-engine/   → Rust (serde, rand, uuid, chrono) — deterministic simulation core
/packages/schemas/      → Shared Zod schemas (TypeScript, shared by web + ai-agent)
/infra/dev/             → deploy.sh, systemd services, nginx config
/docs/                  → Specs: product, API, simulation, data model, architecture, ADRs
/tests/                 → Contract tests, E2E (Playwright), fixtures
/Makefile               → Orchestrates all services
```

**No root package.json** — each app has its own. Use Makefile for cross-service operations.

## Key Conventions
- **Monorepo without a monorepo tool** — no Turborepo/Nx, just Makefile + independent package managers
- **API**: Python 3.11+, ruff for linting, mypy for type checking, pytest-asyncio
- **Web**: React 19, Zustand for state, TanStack Query for server state, Recharts for charts
- **Engine**: Rust 2021 edition, `cargo fmt` + `cargo clippy` enforced in CI
- **AI Agent**: Express server, structured logging via pino, mock AI mode available
- **Shared schemas**: `@greyzone/schemas` (Zod) — keep API and frontend types in sync

## Deployment
- **URL**: https://greyzone.sandford.systems
- **Nginx**: Listens on port 8020, serves frontend static files, proxies `/api/` to :8010
- **Services**: `greyzone-api.service` (uvicorn :8010), `greyzone-ai.service` (node :3100)
- **Database**: PostgreSQL (`greyzone` database, localhost:5432)
- **CI**: `ci.yml` — 4 parallel jobs (engine, api, web, ai-agent) + deploy + E2E
- **E2E**: Playwright (chromium) runs post-deploy against live site

## Common Pitfalls
- No root package.json — `cd` into the specific app directory first
- API venv at `apps/api/.venv/` — activate before running pytest locally
- Engine binary path is hardcoded in systemd service — rebuild with `cargo build --release`
- Alembic migrations: `cd apps/api && alembic upgrade head` after schema changes
- `USE_MOCK_AI=true` for development without real AI — set in env or systemd service

## Existing Agent Guidance
See `.github/copilot-instructions.md` for coding conventions, coverage targets, and agent scope rules.

## Sensitive Files
Do not read, log, or commit: any `.env` files, database credentials, API keys, secrets.
