# Greyzone Multi-User Specification

Version: 1.0
Status: Governing

## 1. Overview

Greyzone is designed as a multi-user-first application. Multiple human players and AI agents participate concurrently in shared simulation runs. This specification defines the user model, role system, session management, concurrency model, and real-time communication architecture.

## 2. User Model

### 2.1 User Account

Every participant has a user account:

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | Unique identifier |
| `username` | string | Unique display name (3-32 chars, alphanumeric + underscore) |
| `email` | string | Unique email address |
| `password_hash` | string | bcrypt hash |
| `created_at` | timestamp | Account creation time |
| `is_admin` | boolean | System administrator flag |
| `is_active` | boolean | Account enabled/disabled |

### 2.2 Authentication

- **Login**: Username/password via `POST /api/auth/login`. Returns JWT access token (15 min) and refresh token (7 days).
- **Refresh**: `POST /api/auth/refresh` with valid refresh token. Returns new access token.
- **Logout**: `POST /api/auth/logout`. Revokes refresh token.
- **Registration**: `POST /api/auth/register`. Requires username, email, password. Optionally requires admin approval if `REGISTRATION_REQUIRES_APPROVAL=true`.

### 2.3 Sessions

Sessions are tracked server-side for WebSocket management:

| Field | Type | Description |
|---|---|---|
| `session_id` | UUID | Unique session identifier |
| `user_id` | UUID | Owning user |
| `created_at` | timestamp | Session creation time |
| `last_active` | timestamp | Last activity timestamp |
| `ws_connection_id` | string | Current WebSocket connection (null if disconnected) |
| `active_run_id` | UUID | Run the user is currently viewing (null if none) |
| `active_role` | string | Current role in the active run (null if observer/none) |

## 3. Role System

### 3.1 Role Definitions

Each run has a set of role slots defined by the scenario. Roles are grouped by side:

**Blue Side**:
- `blue_commander` — Military authority for Blue forces.
- `blue_diplomat` — Economic, political, and diplomatic authority for Blue.

**Red Side**:
- `red_commander` — Military authority for Red forces.
- `red_diplomat` — Economic, political, and diplomatic authority for Red.

**Neutral**:
- `observer` — Read-only participant. Can be fog-of-war (sees one side) or omniscient (sees all).
- `analyst` — Post-run read-only access with replay controls.

**System**:
- `admin` — Run administration. Can pause, resume, terminate, modify configuration.

### 3.2 Role Capabilities

| Capability | Commander | Diplomat | Observer | Analyst | Admin |
|---|---|---|---|---|---|
| Submit kinetic moves | Yes | No | No | No | No |
| Submit cyber/space moves | Yes | No | No | No | No |
| Submit economic moves | No | Yes | No | No | No |
| Submit political moves | No | Yes | No | No | No |
| Submit information moves | Yes | Yes | No | No | No |
| View own-side military state | Full | Summary | Configurable | Full (post-run) | Full |
| View own-side economic state | Summary | Full | Configurable | Full (post-run) | Full |
| View opponent state | Via ISR | Via intelligence | Configurable | Full (post-run) | Full |
| View event log | Own actions | Own actions | Visible events | Full | Full |
| Pause run | No | No | No | No | Yes |
| Terminate run | No | No | No | No | Yes |
| Modify agent config | No | No | No | No | Yes |
| Replay controls | No | No | No | Yes | Yes |

### 3.3 Role Assignment

- When a run is created, the creator specifies which role slots are open for humans, which are AI-controlled, and which are closed.
- Players join a run by requesting a specific open role slot.
- The run creator (or any admin) can approve/reject role requests or reassign roles.
- A role slot can be transferred between human and AI during a paused run.
- One user may hold at most one role per run (no dual-hatting).

### 3.4 Minimum Viable Run

A run requires at minimum:
- One Blue role filled (human or AI).
- One Red role filled (human or AI).

Observers and analysts are optional. A run can proceed with a single human and all other roles filled by AI.

## 4. Run Lifecycle (Multi-User Perspective)

### 4.1 States

```
DRAFT → LOBBY → ACTIVE → PAUSED → ACTIVE → ... → TERMINATED
                                      ↑               ↓
                                      └───────────────┘
                                       (resume)
```

| State | Description | Allowed Actions |
|---|---|---|
| `DRAFT` | Run created, scenario selected, roles being configured | Edit config, assign AI roles |
| `LOBBY` | Run open for players to join | Join, leave, chat, ready up |
| `ACTIVE` | Simulation running, ticks advancing | Submit moves, observe |
| `PAUSED` | Simulation halted, state frozen | Chat, review state, admin actions |
| `TERMINATED` | Run complete | Replay, export, analyze |

### 4.2 Lobby

The lobby is a waiting room where players gather before a run starts:

- Players can see who else is in the lobby and which roles are filled.
- Players can send text chat messages visible to all lobby participants.
- Players can mark themselves as "ready."
- The run starts when all required roles are filled and all human players are ready (or the admin forces start).
- AI agents are always ready.

### 4.3 Run Start

When the run transitions from LOBBY to ACTIVE:

1. All role assignments are locked.
2. The scenario's initial state is loaded into the engine.
3. A `RunStarted` event is emitted.
4. The first tick begins with a move collection window.
5. All connected clients receive the initial state filtered by their role.

### 4.4 Mid-Run Join

Players can join an active run as an observer at any time. To join as a player role:

- The slot must be open (previous player left and slot was marked as re-assignable).
- The joining player receives a full state snapshot for their role's visibility.
- A `PlayerJoined` event is emitted.

### 4.5 Disconnection and Reconnection

- When a player's WebSocket disconnects, their session enters a `disconnected` state with a grace period (default: 60 seconds, configurable per run).
- During the grace period, the player's pending moves (if any) remain queued, and the tick pipeline proceeds normally. If the player has not yet submitted moves for the current tick and the move window closes, they are treated as passing.
- On reconnection within the grace period, the player receives a full state snapshot and resumes normally.
- If the grace period expires, the player's slot can be:
  - Held open indefinitely (waiting for reconnection).
  - Opened for reassignment.
  - Assigned to an AI agent as a substitute.
  The behavior is configurable per run.

## 5. Concurrency Model

### 5.1 Move Collection

Each tick has a move collection window. The window closes when either:

1. All active players have submitted their moves, OR
2. The move timeout expires (configurable, default: 120 seconds).

Players who have not submitted by timeout are treated as passing.

### 5.2 Simultaneous Resolution

All moves collected during a tick window are applied simultaneously by the engine. There is no advantage to submitting earlier or later within the window (except that failing to submit before timeout results in a pass).

### 5.3 Optimistic Concurrency

Players compose moves against the current visible state. If the state changes between when a player starts composing a move and when they submit it (because a new tick completed), the move is validated against the state at the time of the next tick resolution, not the state at the time of composition. The UI warns the player if the state has changed since they started composing.

### 5.4 Chat

In-run chat is available alongside the simulation:

| Channel | Participants | Purpose |
|---|---|---|
| `lobby` | All lobby members | Pre-game coordination |
| `blue_team` | Blue Commander + Blue Diplomat | Blue-side coordination |
| `red_team` | Red Commander + Red Diplomat | Red-side coordination |
| `all_players` | All player roles | Cross-team communication (if enabled by scenario) |
| `observers` | All observers | Observer discussion |
| `admin` | Admins only | Administration |

Chat messages are persisted and included in the audit log.

## 6. Real-Time Communication

### 6.1 WebSocket Protocol

Each connected client maintains a single WebSocket connection to the control plane. The connection carries:

**Server-to-client messages**:

| Message Type | Payload | Trigger |
|---|---|---|
| `state_update` | Role-filtered world state delta | Each tick completion |
| `full_state` | Complete role-filtered world state | Connection, reconnection |
| `phase_transition` | Phase change details | Phase transition event |
| `move_ack` | Move acceptance confirmation | Move validated |
| `move_reject` | Move rejection with reason | Move validation failure |
| `player_joined` | Player info and role | Player joins run |
| `player_left` | Player info | Player leaves run |
| `chat_message` | Message content and channel | Chat received |
| `run_state_change` | New run state | Run paused/resumed/terminated |
| `tick_start` | Tick number, deadline | New tick begins |
| `error` | Error details | Any error condition |

**Client-to-server messages**:

| Message Type | Payload | Purpose |
|---|---|---|
| `submit_moves` | Array of moves | Submit moves for current tick |
| `chat` | Message content, channel | Send chat message |
| `ready` | Boolean | Toggle ready state in lobby |
| `ping` | Timestamp | Keep-alive |

### 6.2 Connection Lifecycle

```
1. Client connects: wss://host/ws?token=JWT
2. Server validates JWT, creates/resumes session
3. Server sends full_state for current role
4. Steady state: server pushes updates, client sends moves/chat
5. Client disconnects: grace period starts
6. Client reconnects: server sends full_state, grace period cancelled
```

### 6.3 Bandwidth Optimization

- State updates are sent as deltas (only changed variables) except on initial connect and reconnect.
- Delta format: `{ "layer": "kinetic", "changes": { "force_posture.actor_1": 0.6 } }`.
- Full state is compressed with gzip when size exceeds 4KB.
- Chat messages are delivered immediately, not batched with tick updates.

## 7. Permissions Matrix

### 7.1 API Endpoint Authorization

| Endpoint | Auth Required | Roles Allowed |
|---|---|---|
| `POST /api/auth/*` | No (login/register) | Any |
| `GET /api/scenarios` | Yes | Any |
| `POST /api/scenarios` | Yes | Admin |
| `POST /api/runs` | Yes | Any authenticated user |
| `POST /api/runs/{id}/join` | Yes | Any authenticated user |
| `POST /api/runs/{id}/start` | Yes | Run creator, Admin |
| `POST /api/runs/{id}/moves` | Yes | Active player in run |
| `POST /api/runs/{id}/pause` | Yes | Admin |
| `GET /api/runs/{id}/state` | Yes | Participant in run |
| `GET /api/runs/{id}/replay` | Yes | Analyst, Admin |
| `GET /api/runs/{id}/events` | Yes | Participant (filtered), Admin (full) |
| `WS /ws` | Yes (JWT in query) | Any authenticated user |

### 7.2 Data Visibility

Visibility filtering is enforced at the control plane layer. The general rules:

1. A player sees full state for variables they own (their side, their domain).
2. A player sees partial state for opponent variables, modulated by ISR/intelligence level.
3. A player sees no state for variables entirely outside their role scope.
4. An observer's visibility is configured at run creation (fog-of-war or omniscient).
5. An analyst sees full state but only for terminated runs.
6. An admin sees full state always.

Partial visibility adds Gaussian noise to true values: `visible_value = true_value + N(0, sigma)` where `sigma = base_noise * (1 - intelligence_level)`.

## 8. Scalability Considerations

### 8.1 Target Scale

- 2-10 concurrent users per run.
- 1-5 concurrent runs per server instance.
- Up to 50 concurrent WebSocket connections per instance.

### 8.2 Bottlenecks

- **Engine computation**: Tick computation is CPU-bound. With in-process PyO3 integration, a tick should complete in under 500ms. Multiple concurrent runs each get their own engine invocation; they do not share state.
- **WebSocket fan-out**: With 50 connections and per-role filtering, fan-out is negligible.
- **Database writes**: Event log writes are the primary I/O bottleneck. Batched inserts (all events from one tick in a single transaction) keep this manageable.

### 8.3 No Horizontal Scaling (v1)

v1 is single-server. WebSocket state is in-process memory. If horizontal scaling is needed in the future, WebSocket state would move to Redis and a load balancer with sticky sessions would be introduced.
