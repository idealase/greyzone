# Greyzone Repository Initialization Prompt

This document records the founding specification for the Greyzone distributed battlespace simulation.

## Product Goal
Multi-user simulation web application modeling a modern distributed battlespace as a multivariate dynamical system spanning 8 layers: kinetic, maritime-logistics, energy, geoeconomic-industrial, cyber, space/PNT, information/cognitive, and domestic-political/fiscal.

## Key Requirements
- Deterministic and stochastic simulation runs
- Phase transitions: competitive normality → hybrid coercion → acute polycrisis → war-transition → overt interstate war → generalized/bloc war
- Hidden state, fog of war, role-scoped visibility
- Multiple human players and/or observers in shared runs
- Human player vs AI opponent
- AI opponent via GitHub Copilot SDK with bounded tools
- Replay, audit, scenario management
- Robust test coverage

## Stack
- Frontend: React + TypeScript + Vite
- Simulation Engine: Rust
- Backend/Control Plane: FastAPI (Python)
- Database: PostgreSQL
- AI Agent Service: Node.js + TypeScript (GitHub Copilot SDK)

## Architecture
- Rust engine is sole authority over world-state mutation
- AI service is bounded planner, never mutates state directly
- FastAPI is control plane / BFF / orchestration
- PostgreSQL for durable persistence
- Frontend is operator console, not source of truth
- Append-only event logging for replayability
- Multi-user concurrency is first-class

## Simulation Layers
1. Kinetic
2. Maritime Logistics
3. Energy
4. Geoeconomic-Industrial
5. Cyber
6. Space/PNT
7. Information/Cognitive
8. Domestic-Political/Fiscal

## Phase Model
- Phase 0: Competitive Normality
- Phase 1: Hybrid Coercion
- Phase 2: Acute Polycrisis
- Phase 3: War-Transition
- Phase 4: Overt Interstate War
- Phase 5: Generalized/Bloc War

## Delivery Standard
Repository must build, run locally, pass tests, support multi-user gameplay, AI opponent, deterministic replay, and be fully documented.
