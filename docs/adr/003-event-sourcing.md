# ADR 003: Event Sourcing for Replay and Audit

## Status
Accepted

## Context
The system requires deterministic replay, full audit trails for AI actions, and the ability to inspect any past state of a simulation run.

## Decision
Use append-only event logging supplemented by periodic state snapshots.

## Rationale
- **Replayability**: Every state change is recorded as an event (ActionApplied, StochasticEvent, PhaseTransition, TurnAdvanced). Replay reconstructs state by replaying events from a snapshot.
- **Audit trail**: AI action logs capture prompt context, tool calls, selected actions, rationale, and validation results.
- **Debugging**: Full event history enables post-mortem analysis of any simulation run.
- **Performance**: Periodic snapshots (every turn) allow fast random-access to any turn without replaying from the beginning.

## Consequences
- Storage grows linearly with simulation length (mitigated by snapshot-based access)
- Event schema must be versioned if format changes
- The Rust engine is the source of truth for events; the Python backend persists them to PostgreSQL
