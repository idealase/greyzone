-- Greyzone Initial Schema Migration
-- Creates all core tables for the simulation platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    is_ai       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_username ON users (username);

-- ─── Scenarios ───────────────────────────────────────────────────────

CREATE TABLE scenarios (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    config      JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Simulation Runs ─────────────────────────────────────────────────

CREATE TYPE run_status AS ENUM (
    'created', 'lobby', 'running', 'paused', 'completed', 'aborted'
);

CREATE TABLE runs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id   UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    status        run_status NOT NULL DEFAULT 'created',
    seed          BIGINT NOT NULL,
    current_turn  INTEGER NOT NULL DEFAULT 0,
    current_phase VARCHAR(50) NOT NULL DEFAULT 'CompetitiveNormality',
    config        JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_runs_scenario ON runs (scenario_id);
CREATE INDEX idx_runs_status ON runs (status);

-- ─── Run Participants ────────────────────────────────────────────────

CREATE TABLE run_participants (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id    UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id   VARCHAR(100) NOT NULL,
    is_ai     BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (run_id, role_id)
);

CREATE INDEX idx_participants_run ON run_participants (run_id);
CREATE INDEX idx_participants_user ON run_participants (user_id);

-- ─── Run Events (append-only event log) ──────────────────────────────

CREATE TABLE run_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id      UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    turn        INTEGER NOT NULL,
    event_type  VARCHAR(100) NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    visibility  VARCHAR(50) NOT NULL DEFAULT 'public',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_run ON run_events (run_id);
CREATE INDEX idx_events_run_turn ON run_events (run_id, turn);
CREATE INDEX idx_events_type ON run_events (event_type);

-- ─── Run Snapshots ───────────────────────────────────────────────────

CREATE TABLE run_snapshots (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id     UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    turn       INTEGER NOT NULL,
    state      JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (run_id, turn)
);

CREATE INDEX idx_snapshots_run ON run_snapshots (run_id);

-- ─── AI Action Logs ──────────────────────────────────────────────────

CREATE TABLE ai_action_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id            UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    turn              INTEGER NOT NULL,
    role_id           VARCHAR(100) NOT NULL,
    prompt_summary    TEXT NOT NULL DEFAULT '',
    tool_calls        JSONB NOT NULL DEFAULT '[]',
    selected_action   JSONB NOT NULL DEFAULT '{}',
    rationale         TEXT NOT NULL DEFAULT '',
    validation_result VARCHAR(50) NOT NULL,
    applied_effects   JSONB NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_logs_run ON ai_action_logs (run_id);
CREATE INDEX idx_ai_logs_run_turn ON ai_action_logs (run_id, turn);

-- ─── User Action Logs ────────────────────────────────────────────────

CREATE TABLE user_action_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id            UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id),
    turn              INTEGER NOT NULL,
    role_id           VARCHAR(100) NOT NULL,
    action_type       VARCHAR(100) NOT NULL,
    action_payload    JSONB NOT NULL DEFAULT '{}',
    validation_result VARCHAR(50) NOT NULL,
    applied_effects   JSONB NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_logs_run ON user_action_logs (run_id);
CREATE INDEX idx_user_logs_run_turn ON user_action_logs (run_id, turn);

-- ─── Updated-at trigger ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scenarios_updated_at
    BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_runs_updated_at
    BEFORE UPDATE ON runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
