# ADR 005: Multi-User First Architecture

## Status
Accepted

## Context
The system must support multiple human players and/or observers participating in shared simulation runs with assigned roles and concurrent state access.

## Decision
Design all APIs, state management, and UI flows for multi-user concurrency from the start, rather than retrofitting single-user patterns.

## Design
- **Runs have a lobby phase**: Players join a run and select roles before the simulation starts
- **Role-scoped visibility**: Each participant sees only what their role permits (fog of war)
- **Turn ownership**: Actions are submitted against a specific role; the engine validates role authority
- **Participant tracking**: `run_participants` table tracks who is in each run with what role
- **WebSocket streaming**: Real-time updates pushed to connected clients per-run
- **AI fills empty roles**: Unfilled roles can be assigned to the AI opponent

## Rationale
- Retrofitting multi-user into a single-user architecture is significantly harder than building it in from the start
- The simulation model inherently has multiple actors with different information sets
- Role-scoped visibility is a core gameplay mechanic, not an afterthought

## Consequences
- Slightly more complex initial implementation than single-user
- All endpoints require role_id or user_id context
- WebSocket management adds operational complexity
- Conflict-safe action submission is required (handled by engine's turn-based validation)
