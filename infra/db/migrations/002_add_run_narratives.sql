-- Migration: Add run_narratives table
-- Stores AI-generated turn narrative summaries for simulation runs

CREATE TABLE run_narratives (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id              UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    turn                INTEGER NOT NULL,
    headline            VARCHAR NOT NULL,
    body                TEXT NOT NULL,
    domain_highlights   JSONB NOT NULL DEFAULT '[]',
    threat_assessment   VARCHAR NOT NULL,
    intelligence_note   VARCHAR,
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_run_narratives_run_turn UNIQUE (run_id, turn)
);

CREATE INDEX idx_run_narratives_run_id ON run_narratives (run_id);
CREATE INDEX idx_run_narratives_run_turn ON run_narratives (run_id, turn);
