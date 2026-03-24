# Greyzone Data Model

Version: 1.0
Status: Governing

## 1. Overview

The Greyzone data model uses PostgreSQL as the sole persistent store. The schema is designed around three principles:

1. **Append-only events**: The event log is immutable once written. It is the source of truth for what happened in a run.
2. **Snapshots for performance**: Periodic state snapshots allow fast replay initialization without replaying all events from tick 0.
3. **Normalized references**: Users, scenarios, and runs are normalized entities with foreign key relationships.

All timestamps are stored as `TIMESTAMPTZ` (UTC). All UUIDs are v4. JSON columns use the `JSONB` type for indexability.

## 2. Entity-Relationship Overview

```
users ──┬── runs (creator)
        ├── run_participants
        └── scenarios (author)

scenarios ── runs (scenario)

runs ──┬── run_participants
       ├── events
       ├── state_snapshots
       ├── moves
       └── agent_configs

run_participants ── users
                 ── runs
```

## 3. Tables

### 3.1 `users`

Stores user accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `username` | `VARCHAR(32)` | UNIQUE, NOT NULL | Display name |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Email address |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt hash |
| `is_admin` | `BOOLEAN` | NOT NULL, DEFAULT false | Admin flag |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT true | Account status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Last update |

**Indexes**:
- `idx_users_username` — UNIQUE on `username`
- `idx_users_email` — UNIQUE on `email`

### 3.2 `refresh_tokens`

Stores active refresh tokens for session management.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `token_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Token identifier |
| `user_id` | `UUID` | FK → users, NOT NULL | Owning user |
| `token_hash` | `VARCHAR(255)` | NOT NULL | SHA-256 hash of the token |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Expiration timestamp |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Creation timestamp |
| `revoked` | `BOOLEAN` | NOT NULL, DEFAULT false | Revocation flag |

**Indexes**:
- `idx_refresh_tokens_hash` — on `token_hash` (for lookup)
- `idx_refresh_tokens_user` — on `user_id`
- `idx_refresh_tokens_expires` — on `expires_at` (for cleanup)

### 3.3 `scenarios`

Stores simulation scenario definitions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `scenario_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | `VARCHAR(255)` | NOT NULL | Display name |
| `description` | `TEXT` | | Long description |
| `version` | `VARCHAR(32)` | NOT NULL, DEFAULT '1.0' | Schema version |
| `author_id` | `UUID` | FK → users, NOT NULL | Creating user |
| `actors` | `JSONB` | NOT NULL | Actor definitions |
| `initial_state` | `JSONB` | NOT NULL | Full initial state across all layers |
| `phase_config` | `JSONB` | NOT NULL | Thresholds, weights, hysteresis |
| `tick_config` | `JSONB` | NOT NULL | Max ticks, move timeout |
| `is_validated` | `BOOLEAN` | NOT NULL, DEFAULT false | Engine validation passed |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Last update |

**Indexes**:
- `idx_scenarios_author` — on `author_id`
- `idx_scenarios_name` — on `name` (for search)

### 3.4 `runs`

Stores simulation run instances.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `run_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `scenario_id` | `UUID` | FK → scenarios, NOT NULL | Source scenario |
| `name` | `VARCHAR(255)` | NOT NULL | Display name |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'draft' | Current state (draft/lobby/active/paused/terminated) |
| `creator_id` | `UUID` | FK → users, NOT NULL | Creating user |
| `seed` | `BIGINT` | NOT NULL | PRNG seed for determinism |
| `current_tick` | `INTEGER` | NOT NULL, DEFAULT 0 | Current tick number |
| `current_phase` | `SMALLINT` | NOT NULL, DEFAULT 0 | Current phase (0-5) |
| `config` | `JSONB` | NOT NULL | Run configuration (timeouts, policies) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Creation timestamp |
| `started_at` | `TIMESTAMPTZ` | | When run transitioned to active |
| `terminated_at` | `TIMESTAMPTZ` | | When run terminated |
| `termination_reason` | `TEXT` | | Reason for termination |

**Indexes**:
- `idx_runs_status` — on `status`
- `idx_runs_creator` — on `creator_id`
- `idx_runs_scenario` — on `scenario_id`

**Check constraints**:
- `chk_runs_status` — `status IN ('draft', 'lobby', 'active', 'paused', 'terminated')`
- `chk_runs_phase` — `current_phase BETWEEN 0 AND 5`

### 3.5 `run_participants`

Associates users and AI agents with roles in a run.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `participant_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `run_id` | `UUID` | FK → runs, NOT NULL | Parent run |
| `user_id` | `UUID` | FK → users, NULL | Human user (null for AI) |
| `role` | `VARCHAR(32)` | NOT NULL | Role name |
| `participant_type` | `VARCHAR(10)` | NOT NULL | 'human', 'ai', 'open', 'closed' |
| `is_ready` | `BOOLEAN` | NOT NULL, DEFAULT false | Ready status in lobby |
| `is_connected` | `BOOLEAN` | NOT NULL, DEFAULT false | WebSocket connected |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Join timestamp |
| `left_at` | `TIMESTAMPTZ` | | Leave timestamp |

**Indexes**:
- `idx_participants_run` — on `run_id`
- `idx_participants_user` — on `user_id`
- `idx_participants_run_role` — UNIQUE on (`run_id`, `role`)
- `idx_participants_run_user` — UNIQUE on (`run_id`, `user_id`) WHERE `user_id IS NOT NULL`

### 3.6 `agent_configs`

Stores AI agent configuration per role per run.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `config_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `run_id` | `UUID` | FK → runs, NOT NULL | Parent run |
| `role` | `VARCHAR(32)` | NOT NULL | Role this agent fills |
| `difficulty` | `VARCHAR(16)` | NOT NULL, DEFAULT 'medium' | Difficulty level |
| `persona` | `VARCHAR(32)` | NOT NULL, DEFAULT 'the_strategist' | Persona name |
| `tool_budget` | `INTEGER` | NOT NULL, DEFAULT 10 | Max tool calls per tick |
| `max_input_tokens` | `INTEGER` | NOT NULL, DEFAULT 8000 | Max prompt tokens |
| `max_output_tokens` | `INTEGER` | NOT NULL, DEFAULT 2000 | Max response tokens |
| `timeout_seconds` | `INTEGER` | NOT NULL, DEFAULT 10 | Invocation timeout |
| `max_moves_per_tick` | `INTEGER` | NOT NULL, DEFAULT 3 | Max moves per tick |
| `llm_model` | `VARCHAR(64)` | NOT NULL, DEFAULT 'gpt-4' | LLM model identifier |
| `llm_temperature` | `REAL` | NOT NULL, DEFAULT 0.3 | LLM temperature |

**Indexes**:
- `idx_agent_configs_run_role` — UNIQUE on (`run_id`, `role`)

### 3.7 `moves`

Stores all submitted moves.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `move_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `run_id` | `UUID` | FK → runs, NOT NULL | Parent run |
| `tick` | `INTEGER` | NOT NULL | Tick this move was submitted for |
| `participant_id` | `UUID` | FK → run_participants, NOT NULL | Submitting participant |
| `move_type` | `VARCHAR(64)` | NOT NULL | Move type identifier |
| `parameters` | `JSONB` | NOT NULL | Move parameters |
| `status` | `VARCHAR(16)` | NOT NULL, DEFAULT 'pending' | pending/validated/rejected/applied |
| `rejection_reason` | `TEXT` | | Reason if rejected |
| `submitted_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Submission timestamp |

**Indexes**:
- `idx_moves_run_tick` — on (`run_id`, `tick`)
- `idx_moves_participant` — on `participant_id`
- `idx_moves_status` — on `status`

### 3.8 `events`

Append-only event log. This is the primary audit trail and the basis for replay.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `event_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `run_id` | `UUID` | FK → runs, NOT NULL | Parent run |
| `tick` | `INTEGER` | NOT NULL | Tick this event occurred in |
| `sequence` | `INTEGER` | NOT NULL | Ordering within a tick |
| `event_type` | `VARCHAR(32)` | NOT NULL | Event type |
| `layer` | `SMALLINT` | | Layer index (1-8, null for non-layer events) |
| `actor_id` | `UUID` | | Related actor (null for global events) |
| `payload` | `JSONB` | NOT NULL | Event-specific data |
| `timestamp` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Wall-clock time |

**Indexes**:
- `idx_events_run_tick_seq` — on (`run_id`, `tick`, `sequence`) — primary query path
- `idx_events_run_type` — on (`run_id`, `event_type`)
- `idx_events_run_layer` — on (`run_id`, `layer`) WHERE `layer IS NOT NULL`
- `idx_events_run_actor` — on (`run_id`, `actor_id`) WHERE `actor_id IS NOT NULL`

**Table properties**:
- No UPDATE or DELETE triggers allowed. An application-level policy enforces append-only semantics.
- Consider partitioning by `run_id` if event volume per run exceeds 100k rows.

### 3.9 `state_snapshots`

Periodic full-state snapshots for fast replay initialization.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `snapshot_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `run_id` | `UUID` | FK → runs, NOT NULL | Parent run |
| `tick` | `INTEGER` | NOT NULL | Tick this snapshot captures |
| `state` | `JSONB` | NOT NULL | Full unfiltered world state |
| `checksum` | `VARCHAR(64)` | NOT NULL | SHA-256 of serialized state |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes**:
- `idx_snapshots_run_tick` — UNIQUE on (`run_id`, `tick`)

Snapshots are taken every N ticks (configurable, default: 10) and at phase transitions.

### 3.10 `chat_messages`

In-run chat messages.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `message_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `run_id` | `UUID` | FK → runs, NOT NULL | Parent run |
| `participant_id` | `UUID` | FK → run_participants, NOT NULL | Sending participant |
| `channel` | `VARCHAR(32)` | NOT NULL | Chat channel |
| `content` | `TEXT` | NOT NULL | Message text |
| `tick` | `INTEGER` | | Current tick when sent (null if pre-game) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Send timestamp |

**Indexes**:
- `idx_chat_run_channel` — on (`run_id`, `channel`, `created_at`)

### 3.11 `agent_invocation_logs`

Audit log for AI agent invocations.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `invocation_id` | `UUID` | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `run_id` | `UUID` | FK → runs, NOT NULL | Parent run |
| `tick` | `INTEGER` | NOT NULL | Tick of invocation |
| `role` | `VARCHAR(32)` | NOT NULL | Agent role |
| `prompt_tokens` | `INTEGER` | NOT NULL | Input token count |
| `completion_tokens` | `INTEGER` | NOT NULL | Output token count |
| `tool_calls` | `JSONB` | NOT NULL | Tool call log |
| `moves_submitted` | `JSONB` | NOT NULL | Moves produced |
| `duration_ms` | `INTEGER` | NOT NULL | Total invocation time |
| `outcome` | `VARCHAR(16)` | NOT NULL | success/timeout/error |
| `error_message` | `TEXT` | | Error details if failed |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | Timestamp |

**Indexes**:
- `idx_agent_logs_run_tick` — on (`run_id`, `tick`)
- `idx_agent_logs_outcome` — on `outcome`

## 4. Migration Strategy

Migrations are managed by Alembic (SQLAlchemy's migration tool).

### 4.1 Migration Files

```
backend/migrations/
├── env.py
├── script.py.mako
└── versions/
    ├── 001_initial_schema.py
    ├── 002_add_agent_configs.py
    └── ...
```

### 4.2 Migration Commands

```bash
# Create a new migration
cd backend && alembic revision --autogenerate -m "description"

# Apply all pending migrations
cd backend && alembic upgrade head

# Roll back one migration
cd backend && alembic downgrade -1

# Show current migration state
cd backend && alembic current
```

### 4.3 Migration Principles

- Every schema change requires a migration. No manual DDL.
- Migrations must be reversible (implement both `upgrade()` and `downgrade()`).
- Migrations must not lose data in production (prefer ADD COLUMN with DEFAULT over DROP/RECREATE).
- The events table is append-only; migrations may add columns but never remove or rename them.

## 5. Data Retention

| Data | Retention | Reason |
|---|---|---|
| User accounts | Indefinite | Required for auth |
| Scenarios | Indefinite | Referenced by runs |
| Runs (active) | Indefinite | In progress |
| Runs (terminated) | 90 days default (configurable) | Replay and analysis |
| Events | Same as parent run | Audit trail |
| State snapshots | Same as parent run | Replay support |
| Chat messages | Same as parent run | Audit trail |
| Agent invocation logs | Same as parent run | Debugging |
| Refresh tokens (expired) | 7 days after expiry | Cleanup |

A periodic cleanup job (configurable cron) removes expired data.

## 6. Backup Considerations

- The events table is the most critical data. It is append-only and can be backed up incrementally.
- State snapshots are derivable from events + initial state but are expensive to recompute.
- Full `pg_dump` is recommended for routine backups.
- Point-in-time recovery (PITR) via WAL archiving is recommended for production use.

## 7. Performance Considerations

### 7.1 Query Patterns

| Query | Frequency | Optimization |
|---|---|---|
| Get events for a tick range | Every replay request | Composite index on (`run_id`, `tick`, `sequence`) |
| Get latest snapshot before tick N | Every replay request | Index on (`run_id`, `tick`) with descending scan |
| Get moves for current tick | Every tick | Index on (`run_id`, `tick`) |
| Get run participants | Every state distribution | Index on `run_id` |
| Insert events batch | Every tick | Bulk insert in single transaction |

### 7.2 Estimated Volumes

For a typical 500-tick run with 4 players:
- Events: ~5,000-15,000 rows (10-30 events per tick)
- State snapshots: ~50 rows (every 10 ticks)
- Moves: ~2,000 rows (4 players * 500 ticks, not all ticks have moves)
- Chat messages: ~200-1,000 rows

These volumes are well within PostgreSQL's capabilities without partitioning.
