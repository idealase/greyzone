# Greyzone API Specification

Version: 1.0
Status: Governing

## 1. Overview

The Greyzone API is served by the FastAPI control plane. It provides RESTful endpoints for resource management and a WebSocket endpoint for real-time communication. All endpoints except authentication require a valid JWT bearer token.

**Base URL**: `http://localhost:8000/api`

**Content Type**: `application/json` for all request and response bodies.

**Authentication**: `Authorization: Bearer <token>` header on all authenticated requests.

## 2. Authentication

### 2.1 Register

```
POST /api/auth/register
```

**Request**:
```json
{
  "username": "string (3-32 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (8-128 chars)"
}
```

**Response** `201 Created`:
```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "iso8601"
}
```

**Errors**:
- `409 Conflict` — Username or email already exists.
- `422 Unprocessable Entity` — Validation failure.

### 2.2 Login

```
POST /api/auth/login
```

**Request**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** `200 OK`:
```json
{
  "access_token": "string (JWT, 15 min TTL)",
  "refresh_token": "string (opaque, 7 day TTL)",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Errors**:
- `401 Unauthorized` — Invalid credentials.

### 2.3 Refresh Token

```
POST /api/auth/refresh
```

**Request**:
```json
{
  "refresh_token": "string"
}
```

**Response** `200 OK`:
```json
{
  "access_token": "string (JWT, 15 min TTL)",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Errors**:
- `401 Unauthorized` — Invalid or expired refresh token.

### 2.4 Logout

```
POST /api/auth/logout
```

**Request**:
```json
{
  "refresh_token": "string"
}
```

**Response** `204 No Content`

## 3. Users

### 3.1 Get Current User

```
GET /api/users/me
```

**Response** `200 OK`:
```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "is_admin": false,
  "created_at": "iso8601"
}
```

### 3.2 List Users (Admin)

```
GET /api/users?page=1&per_page=20
```

**Response** `200 OK`:
```json
{
  "items": [
    {
      "user_id": "uuid",
      "username": "string",
      "email": "string",
      "is_admin": false,
      "is_active": true,
      "created_at": "iso8601"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

**Errors**:
- `403 Forbidden` — Non-admin user.

## 4. Scenarios

### 4.1 List Scenarios

```
GET /api/scenarios?page=1&per_page=20
```

**Response** `200 OK`:
```json
{
  "items": [
    {
      "scenario_id": "uuid",
      "name": "string",
      "description": "string",
      "version": "string",
      "author_id": "uuid",
      "actor_count": 4,
      "created_at": "iso8601",
      "updated_at": "iso8601"
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 20
}
```

### 4.2 Get Scenario

```
GET /api/scenarios/{scenario_id}
```

**Response** `200 OK`:
```json
{
  "scenario_id": "uuid",
  "name": "string",
  "description": "string",
  "version": "string",
  "author_id": "uuid",
  "actors": [
    {
      "id": "uuid",
      "name": "string",
      "side": "blue | red | neutral"
    }
  ],
  "initial_state": { "...": "full layer state" },
  "phase_config": {
    "thresholds": [0.15, 0.30, 0.50, 0.70, 0.85],
    "hysteresis_ticks": 3,
    "weights": [0.20, 0.10, 0.10, 0.10, 0.15, 0.05, 0.15, 0.15]
  },
  "tick_config": {
    "max_ticks": 500,
    "move_timeout_seconds": 120
  },
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

**Errors**:
- `404 Not Found` — Scenario does not exist.

### 4.3 Create Scenario

```
POST /api/scenarios
```

**Request**: Full scenario JSON (same structure as GET response body, minus `scenario_id`, `author_id`, timestamps).

**Response** `201 Created`: Full scenario JSON with generated fields.

**Errors**:
- `403 Forbidden` — Non-admin user.
- `422 Unprocessable Entity` — Scenario validation failure (details in response body).

### 4.4 Update Scenario

```
PUT /api/scenarios/{scenario_id}
```

**Request**: Full scenario JSON (partial updates not supported; send the complete object).

**Response** `200 OK`: Updated scenario JSON.

**Errors**:
- `403 Forbidden` — Not the author or admin.
- `404 Not Found` — Scenario does not exist.
- `409 Conflict` — Scenario is in use by an active run.
- `422 Unprocessable Entity` — Validation failure.

### 4.5 Delete Scenario

```
DELETE /api/scenarios/{scenario_id}
```

**Response** `204 No Content`

**Errors**:
- `403 Forbidden` — Not the author or admin.
- `404 Not Found` — Scenario does not exist.
- `409 Conflict` — Scenario is in use by an active or terminated run.

### 4.6 Validate Scenario

```
POST /api/scenarios/validate
```

Validates a scenario without persisting it.

**Request**: Full scenario JSON.

**Response** `200 OK`:
```json
{
  "valid": true,
  "warnings": ["Phase weight for space layer (0.05) is unusually low"]
}
```

or

```json
{
  "valid": false,
  "errors": [
    "Phase thresholds must be monotonically increasing",
    "Actor 'bravo' has force_readiness of 1.5, which exceeds maximum of 1.0"
  ],
  "warnings": []
}
```

## 5. Runs

### 5.1 List Runs

```
GET /api/runs?page=1&per_page=20&status=active
```

**Query Parameters**:
- `status` (optional): Filter by run state (`draft`, `lobby`, `active`, `paused`, `terminated`).
- `participant` (optional): Filter to runs where the specified user_id is a participant.

**Response** `200 OK`:
```json
{
  "items": [
    {
      "run_id": "uuid",
      "scenario_id": "uuid",
      "scenario_name": "string",
      "status": "active",
      "current_tick": 42,
      "current_phase": 2,
      "creator_id": "uuid",
      "participant_count": 5,
      "created_at": "iso8601",
      "started_at": "iso8601 | null"
    }
  ],
  "total": 3,
  "page": 1,
  "per_page": 20
}
```

### 5.2 Get Run

```
GET /api/runs/{run_id}
```

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "scenario_id": "uuid",
  "scenario_name": "string",
  "status": "active",
  "current_tick": 42,
  "current_phase": 2,
  "phase_name": "Acute Polycrisis",
  "creator_id": "uuid",
  "seed": 12345,
  "config": {
    "move_timeout_seconds": 120,
    "max_ticks": 500,
    "reconnection_grace_seconds": 60,
    "disconnection_policy": "hold | open | ai_substitute",
    "cross_team_chat": false
  },
  "roles": [
    {
      "role": "blue_commander",
      "user_id": "uuid | null",
      "username": "string | null",
      "type": "human | ai | open | closed",
      "agent_config": { "...": "if type=ai" }
    }
  ],
  "created_at": "iso8601",
  "started_at": "iso8601 | null",
  "terminated_at": "iso8601 | null"
}
```

### 5.3 Create Run

```
POST /api/runs
```

**Request**:
```json
{
  "scenario_id": "uuid",
  "name": "string (optional, defaults to scenario name + timestamp)",
  "seed": 12345,
  "config": {
    "move_timeout_seconds": 120,
    "max_ticks": 500,
    "reconnection_grace_seconds": 60,
    "disconnection_policy": "hold",
    "cross_team_chat": false
  },
  "roles": [
    {
      "role": "blue_commander",
      "type": "human"
    },
    {
      "role": "red_commander",
      "type": "ai",
      "agent_config": {
        "difficulty": "medium",
        "persona": "the_hawk"
      }
    },
    {
      "role": "blue_diplomat",
      "type": "open"
    },
    {
      "role": "red_diplomat",
      "type": "closed"
    }
  ]
}
```

**Response** `201 Created`: Full run JSON. The creator is automatically assigned to the first `human` role listed.

**Errors**:
- `404 Not Found` — Scenario does not exist.
- `422 Unprocessable Entity` — Invalid configuration.

### 5.4 Join Run

```
POST /api/runs/{run_id}/join
```

**Request**:
```json
{
  "role": "blue_diplomat"
}
```

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "role": "blue_diplomat",
  "status": "joined"
}
```

**Errors**:
- `404 Not Found` — Run does not exist.
- `409 Conflict` — Role is not open, or user already has a role in this run.
- `400 Bad Request` — Run is not in `lobby` state (or `active` with open slots).

### 5.5 Leave Run

```
POST /api/runs/{run_id}/leave
```

**Response** `204 No Content`

**Errors**:
- `404 Not Found` — Run does not exist or user is not a participant.
- `409 Conflict` — Run is active and disconnection policy does not allow voluntary departure.

### 5.6 Start Run

```
POST /api/runs/{run_id}/start
```

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "status": "active",
  "current_tick": 0
}
```

**Errors**:
- `403 Forbidden` — Not the run creator or admin.
- `409 Conflict` — Not all required roles are filled, or not all human players are ready.

### 5.7 Pause Run

```
POST /api/runs/{run_id}/pause
```

**Request**:
```json
{
  "reason": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "status": "paused"
}
```

**Errors**:
- `403 Forbidden` — Not an admin.
- `409 Conflict` — Run is not active.

### 5.8 Resume Run

```
POST /api/runs/{run_id}/resume
```

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "status": "active",
  "current_tick": 42
}
```

### 5.9 Terminate Run

```
POST /api/runs/{run_id}/terminate
```

**Request**:
```json
{
  "reason": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "status": "terminated",
  "final_tick": 42,
  "final_phase": 3
}
```

## 6. Moves

### 6.1 Submit Moves

```
POST /api/runs/{run_id}/moves
```

**Request**:
```json
{
  "tick": 42,
  "moves": [
    {
      "move_type": "increase_force_posture",
      "parameters": {
        "region": "baltic",
        "amount": 0.1
      }
    },
    {
      "move_type": "launch_cyber_attack",
      "parameters": {
        "target_actor": "blue",
        "sector": "energy"
      }
    }
  ]
}
```

The `tick` field must match the current tick. If the run has already advanced past this tick, the submission is rejected.

**Response** `202 Accepted`:
```json
{
  "run_id": "uuid",
  "tick": 42,
  "moves_accepted": 2,
  "move_ids": ["uuid", "uuid"]
}
```

**Errors**:
- `400 Bad Request` — Tick mismatch, or move window closed.
- `403 Forbidden` — User does not hold a role that permits these move types.
- `409 Conflict` — User has already submitted moves for this tick.
- `422 Unprocessable Entity` — Move validation failure (details per move).

### 6.2 Get Available Moves

```
GET /api/runs/{run_id}/available-moves
```

Returns the set of legal move types for the requesting user's role in the current state.

**Response** `200 OK`:
```json
{
  "tick": 42,
  "phase": 2,
  "role": "red_commander",
  "moves": [
    {
      "move_type": "increase_force_posture",
      "description": "Increase military force posture in a region",
      "parameters": {
        "region": {
          "type": "string",
          "enum": ["baltic", "black_sea", "pacific", "arctic"]
        },
        "amount": {
          "type": "number",
          "min": 0.05,
          "max": 0.3,
          "step": 0.05
        }
      },
      "cost": {
        "readiness": "-0.05 per 0.1 amount",
        "fiscal_reserves": "-0.03 per 0.1 amount"
      },
      "preconditions": [
        "force_posture in target region < 1.0",
        "mobilization_level >= amount * 0.5"
      ]
    }
  ]
}
```

## 7. State

### 7.1 Get Current State

```
GET /api/runs/{run_id}/state
```

Returns the current world state filtered by the requesting user's role visibility.

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "tick": 42,
  "phase": 2,
  "phase_name": "Acute Polycrisis",
  "state": {
    "kinetic": {
      "force_posture": {
        "actor_1": 0.6,
        "actor_2": "unknown"
      },
      "theater_control": {
        "baltic": 0.3,
        "black_sea": -0.1
      }
    },
    "maritime": { "..." : "..." },
    "energy": { "..." : "..." },
    "geoeconomic": { "..." : "..." },
    "cyber": { "..." : "..." },
    "space": { "..." : "..." },
    "information": { "..." : "..." },
    "domestic": { "..." : "..." }
  },
  "actors": [
    {
      "id": "uuid",
      "name": "string",
      "side": "blue",
      "resources": { "..." : "..." }
    }
  ]
}
```

Values the user cannot see are represented as `"unknown"` (string) or omitted entirely depending on the layer configuration.

## 8. Events

### 8.1 List Events

```
GET /api/runs/{run_id}/events?from_tick=0&to_tick=42&type=PhaseTransition&page=1&per_page=100
```

**Query Parameters**:
- `from_tick` (optional): Start tick (inclusive). Default: 0.
- `to_tick` (optional): End tick (inclusive). Default: current tick.
- `type` (optional): Filter by event type.
- `layer` (optional): Filter by layer.
- `actor_id` (optional): Filter by actor.

Events are filtered by the requesting user's visibility. Admins and analysts (for terminated runs) see all events.

**Response** `200 OK`:
```json
{
  "items": [
    {
      "event_id": "uuid",
      "run_id": "uuid",
      "tick": 40,
      "sequence": 1,
      "event_type": "PhaseTransition",
      "layer": null,
      "actor_id": null,
      "payload": {
        "old_phase": 1,
        "new_phase": 2,
        "phi": 0.32,
        "contributions": {
          "kinetic": 0.05,
          "maritime": 0.03,
          "energy": 0.08,
          "geoeconomic": 0.06,
          "cyber": 0.04,
          "space": 0.01,
          "information": 0.03,
          "domestic": 0.02
        }
      },
      "timestamp": "iso8601"
    }
  ],
  "total": 1250,
  "page": 1,
  "per_page": 100
}
```

## 9. Replay

### 9.1 Get Replay Data

```
GET /api/runs/{run_id}/replay?from_tick=0&to_tick=100&perspective=blue_commander
```

**Query Parameters**:
- `from_tick`: Start tick. Default: 0.
- `to_tick`: End tick. Default: final tick.
- `perspective`: Role perspective to apply visibility filter. `omniscient` for full visibility (admin/analyst only).

Only available for terminated runs (analysts) or by admins.

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "scenario_id": "uuid",
  "perspective": "blue_commander",
  "from_tick": 0,
  "to_tick": 100,
  "initial_snapshot": { "...": "state at from_tick, visibility-filtered" },
  "events": [
    { "...": "visibility-filtered events in order" }
  ],
  "phase_transitions": [
    { "tick": 40, "old_phase": 1, "new_phase": 2 }
  ]
}
```

### 9.2 Get State Snapshot at Tick

```
GET /api/runs/{run_id}/replay/snapshot?tick=42&perspective=blue_commander
```

Returns the full state at a specific tick, filtered by perspective.

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "tick": 42,
  "perspective": "blue_commander",
  "state": { "...": "same format as GET /state" }
}
```

## 10. AI Agent

### 10.1 Get Agent Configuration

```
GET /api/runs/{run_id}/agents/{role}
```

**Response** `200 OK`:
```json
{
  "run_id": "uuid",
  "role": "red_commander",
  "enabled": true,
  "difficulty": "medium",
  "persona": "the_hawk",
  "tool_budget": 10,
  "max_input_tokens": 8000,
  "max_output_tokens": 2000,
  "timeout_seconds": 10,
  "max_moves_per_tick": 3
}
```

**Errors**:
- `403 Forbidden` — Not an admin.
- `404 Not Found` — No AI agent configured for this role.

### 10.2 Update Agent Configuration

```
PUT /api/runs/{run_id}/agents/{role}
```

**Request**: Same structure as GET response (minus `run_id` and `role`).

**Response** `200 OK`: Updated configuration.

**Errors**:
- `403 Forbidden` — Not an admin.
- `409 Conflict` — Run is active (can only modify agent config when paused or in lobby).

### 10.3 Agent Invocation (Internal)

This endpoint is called by the control plane's tick handler, not by external clients.

```
POST /internal/agent/invoke
```

**Request**:
```json
{
  "run_id": "uuid",
  "tick": 42,
  "role": "red_commander",
  "state_view": { "..." },
  "available_moves": [ "..." ],
  "phase": 2,
  "recent_events": [ "..." ],
  "agent_config": { "..." }
}
```

**Response** `200 OK`:
```json
{
  "moves": [
    {
      "move_type": "string",
      "parameters": { "..." }
    }
  ],
  "reasoning_log": "string (redacted for storage)",
  "tool_calls_used": 5,
  "tokens_used": { "input": 6500, "output": 1200 },
  "duration_ms": 3200
}
```

## 11. Health

### 11.1 Control Plane Health

```
GET /api/health
```

**Response** `200 OK`:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "services": {
    "database": "connected",
    "engine": "loaded",
    "ai_agent": "reachable"
  }
}
```

### 11.2 AI Agent Health

```
GET /internal/agent/health
```

**Response** `200 OK`:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "llm_provider": "reachable"
}
```

## 12. WebSocket

### 12.1 Connection

```
WS /ws?token=<JWT>
```

The token is passed as a query parameter because the WebSocket API does not support custom headers in the browser.

### 12.2 Message Format

All WebSocket messages are JSON with a `type` field:

```json
{
  "type": "string",
  "payload": { "..." }
}
```

See the Multi-User Specification (Section 6.1) for the complete message type catalog.

## 13. Error Response Format

All error responses follow a consistent format:

```json
{
  "detail": "Human-readable error description",
  "error_code": "MACHINE_READABLE_CODE",
  "field_errors": [
    {
      "field": "moves[0].parameters.amount",
      "message": "Must be between 0.05 and 0.3"
    }
  ]
}
```

Standard error codes:
- `AUTH_REQUIRED` — Missing or invalid authentication.
- `FORBIDDEN` — Insufficient permissions.
- `NOT_FOUND` — Resource does not exist.
- `CONFLICT` — State conflict (e.g., role already taken).
- `VALIDATION_ERROR` — Request body validation failure.
- `TICK_MISMATCH` — Move submitted for wrong tick.
- `MOVE_WINDOW_CLOSED` — Move submission deadline passed.
- `RUN_NOT_ACTIVE` — Operation requires an active run.
- `INTERNAL_ERROR` — Unexpected server error.

## 14. Pagination

All list endpoints support pagination:

- `page` (integer, default: 1): Page number (1-indexed).
- `per_page` (integer, default: 20, max: 100): Items per page.

Response includes:
- `items`: Array of results.
- `total`: Total item count.
- `page`: Current page.
- `per_page`: Items per page.

## 15. Rate Limiting

- Authentication endpoints: 10 requests per minute per IP.
- Move submission: 1 request per tick per user per run (enforced by game logic, not rate limiter).
- All other endpoints: 60 requests per minute per user.
- WebSocket messages: 30 messages per minute per connection.

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
