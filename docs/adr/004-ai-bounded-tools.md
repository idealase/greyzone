# ADR 004: Bounded Tool Interface for AI Opponent

## Status
Accepted

## Context
The AI opponent must be competitive but constrained. It should not have unrestricted access to world state or the ability to bypass the simulation engine's validation.

## Decision
The AI agent interacts with the simulation exclusively through a fixed set of bounded tools, each calling the backend API.

## Tools
1. `getTurnBrief` — role-scoped strategic briefing
2. `getRoleVisibleState` — filtered world state for the AI's role
3. `listLegalActions` — enumeration of valid moves
4. `inspectAction` — description of what an action does
5. `estimateLocalEffects` — approximate impact prediction
6. `submitAction` — propose an action (validated by engine)
7. `endTurn` — signal turn completion

## Guardrails
- Maximum 10 tool calls per turn
- Maximum 2 action submission retries
- Loop detection (3 identical consecutive actions)
- All actions validated by the Rust engine before application
- No direct state mutation

## Rationale
- Prevents the AI from exploiting hidden state or circumventing game rules
- Creates an auditable chain of AI reasoning
- Enables the heuristic fallback client to operate with the same interface
- The state compiler transforms raw state into semantically meaningful briefings rather than raw data dumps

## Consequences
- AI capability is bounded by tool quality and state compiler fidelity
- Adding new AI capabilities requires adding new tools (explicit, auditable expansion)
- The heuristic client provides a reasonable baseline when no LLM API is available
