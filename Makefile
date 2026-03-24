.PHONY: all build test lint clean dev setup db-setup db-migrate help

SHELL := /bin/bash

# ─── Setup ────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Install all dependencies
	$(MAKE) setup-engine
	$(MAKE) setup-api
	$(MAKE) setup-web
	$(MAKE) setup-ai-agent

setup-engine: ## Install Rust engine dependencies
	cd services/sim-engine && cargo build

setup-api: ## Install Python API dependencies
	cd apps/api && python3 -m venv .venv && \
		. .venv/bin/activate && \
		pip install -e ".[dev]"

setup-web: ## Install frontend dependencies
	cd apps/web && npm install

setup-ai-agent: ## Install AI agent dependencies
	cd apps/ai-agent && npm install

# ─── Database ─────────────────────────────────────────────────────────

db-setup: ## Create PostgreSQL database
	createdb greyzone 2>/dev/null || true
	createuser greyzone 2>/dev/null || true
	psql -c "ALTER USER greyzone WITH PASSWORD 'greyzone';" 2>/dev/null || true
	psql -c "GRANT ALL PRIVILEGES ON DATABASE greyzone TO greyzone;" 2>/dev/null || true

db-migrate: ## Run database migrations
	cd apps/api && . .venv/bin/activate && alembic upgrade head

db-seed: ## Seed database with default scenario
	cd apps/api && . .venv/bin/activate && python -m app.seed

# ─── Build ────────────────────────────────────────────────────────────

build: ## Build all services
	$(MAKE) build-engine
	$(MAKE) build-api
	$(MAKE) build-web
	$(MAKE) build-ai-agent

build-engine: ## Build Rust simulation engine
	cd services/sim-engine && cargo build --release

build-api: ## Check Python API
	cd apps/api && . .venv/bin/activate && python -m py_compile app/main.py

build-web: ## Build frontend
	cd apps/web && npm run build

build-ai-agent: ## Build AI agent
	cd apps/ai-agent && npm run build

# ─── Test ─────────────────────────────────────────────────────────────

test: ## Run all tests
	$(MAKE) test-engine
	$(MAKE) test-api
	$(MAKE) test-web
	$(MAKE) test-ai-agent

test-engine: ## Run Rust engine tests
	cd services/sim-engine && cargo test

test-api: ## Run Python API tests
	cd apps/api && . .venv/bin/activate && pytest app/tests/ -v

test-web: ## Run frontend tests
	cd apps/web && npx vitest run

test-ai-agent: ## Run AI agent tests
	cd apps/ai-agent && npx vitest run

# ─── Lint ─────────────────────────────────────────────────────────────

lint: ## Lint all services
	$(MAKE) lint-engine
	$(MAKE) lint-api
	$(MAKE) lint-web

lint-engine: ## Lint Rust code
	cd services/sim-engine && cargo clippy -- -D warnings

lint-api: ## Lint Python code
	cd apps/api && . .venv/bin/activate && ruff check app/

lint-web: ## Lint frontend code
	cd apps/web && npx tsc --noEmit

# ─── Dev ──────────────────────────────────────────────────────────────

dev-api: ## Start API server in dev mode
	cd apps/api && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-web: ## Start frontend dev server
	cd apps/web && npm run dev

dev-ai-agent: ## Start AI agent in dev mode
	cd apps/ai-agent && npm run dev

dev: ## Start all services (requires multiple terminals or use tmux)
	@echo "Start each service in a separate terminal:"
	@echo "  make dev-api"
	@echo "  make dev-web"
	@echo "  make dev-ai-agent"
	@echo ""
	@echo "Or use: make dev-tmux (requires tmux)"

dev-tmux: ## Start all services in tmux
	tmux new-session -d -s greyzone 'make dev-api'
	tmux split-window -h 'make dev-web'
	tmux split-window -v 'make dev-ai-agent'
	tmux attach -t greyzone

# ─── Clean ────────────────────────────────────────────────────────────

clean: ## Clean all build artifacts
	cd services/sim-engine && cargo clean
	rm -rf apps/web/dist apps/web/node_modules
	rm -rf apps/ai-agent/dist apps/ai-agent/node_modules
	rm -rf apps/api/.venv
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
