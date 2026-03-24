# ADR 002: FastAPI as Control Plane

## Status
Accepted

## Context
Need an orchestration layer between the React frontend, Rust engine, PostgreSQL database, and AI agent service that handles HTTP/WebSocket communication, CRUD operations, and service composition.

## Decision
Use FastAPI (Python) with async SQLAlchemy.

## Rationale
- **Async-first**: FastAPI's native async support handles concurrent WebSocket connections and engine subprocess I/O efficiently.
- **Auto-documentation**: OpenAPI spec generated automatically from Pydantic models.
- **Type safety**: Pydantic v2 provides runtime validation of all request/response data.
- **Ecosystem**: Rich Python ecosystem for database management (SQLAlchemy, Alembic), testing (pytest-asyncio), and integration.
- **Developer velocity**: Python is well-suited for orchestration logic that glues services together.

## Consequences
- Python is slower than Rust for computation, but the control plane is I/O-bound not CPU-bound
- Requires managing async SQLAlchemy session lifecycle carefully (eager loading for relationships)
