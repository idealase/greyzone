-- Add run ownership to enforce per-user access

ALTER TABLE runs
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_runs_owner ON runs(owner_id);
