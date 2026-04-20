# Greyzone Product Specification

Version: 1.1
Last Updated: April 2026
Status: Governing

## 1. Overview

Greyzone is a multi-user, web-based simulation application that models a modern distributed battlespace as a multivariate dynamical system. The simulation spans eight interconnected layers representing the full spectrum of great-power competition, from kinetic military operations through economic warfare to domestic political stability.

The system supports deterministic and stochastic simulation runs, multiple concurrent human players with role-scoped visibility, AI opponents operating under bounded tool constraints, full replay capability, and append-only audit logging.

## 2. Users and Roles

### 2.1 Player Roles

| Role | Description | Visibility Scope |
|---|---|---|
| **Blue Commander** | Controls Blue-side kinetic, cyber, space, and information assets | Full Blue state, partial Red via intelligence layer |
| **Blue Diplomat** | Controls Blue-side geoeconomic, political, and information levers | Blue diplomatic/economic state, limited kinetic awareness |
| **Red Commander** | Controls Red-side kinetic, cyber, space, and information assets | Full Red state, partial Blue via intelligence layer |
| **Red Diplomat** | Controls Red-side geoeconomic, political, and information levers | Red diplomatic/economic state, limited kinetic awareness |
| **Observer** | Read-only spectator with configurable visibility | Configurable: fog-of-war or omniscient |
| **Analyst** | Post-run access to full state for review and replay | Full state, read-only, replay controls |
| **Admin** | System administration, scenario management | Full state, system configuration |

### 2.2 AI Opponent

An AI agent can fill any player role. The AI operates through a bounded tool interface and never directly mutates simulation state. It receives a compiled state view matching its role's visibility scope and submits moves through the same validation pipeline as human players.

## 3. Core Features

### 3.1 Scenario Management

- **Create Scenario**: Define initial conditions across all 8 layers, including actor positions, resource levels, alliance structures, and environmental parameters.
- **Scenario Library**: Browse, clone, and modify existing scenarios.
- **Scenario Validation**: Engine validates scenario consistency before allowing run creation.
- **Scenario Export/Import**: JSON-based scenario format for sharing and version control.

### 3.2 Run Lifecycle

- **Create Run**: Instantiate a run from a scenario with specified participants and configuration (deterministic seed, tick rate, phase thresholds).
- **Join Run**: Players join an active run and are assigned (or choose) a role.
- **Start Run**: Run transitions from lobby to active when all required roles are filled.
- **Tutorial Mode**: New players receive an interactive 8-step tutorial overlay guiding them through UI elements and core mechanics on their first run.
- **Pause/Resume**: Any admin or by consensus of active players.
- **Terminate**: Explicit end or triggered by terminal phase condition.

### 3.3 Gameplay Loop

Each simulation tick proceeds through a fixed pipeline:

1. **Move Collection**: All active players (human and AI) submit moves for the current tick within a configurable time window.
2. **Move Validation**: The Rust engine validates each move against the current state, the submitting player's role permissions, and layer-specific legality rules.
3. **State Advance**: The engine applies all validated moves simultaneously, resolves interactions and couplings between layers, evaluates phase transition conditions, and produces the new world state.
4. **Event Emission**: All state changes are emitted as append-only events.
5. **State Distribution**: Each player receives a state update filtered to their role's visibility scope.
6. **Phase Check**: If the composite order parameter crosses a threshold, a phase transition occurs and all players are notified.

### 3.4 Move System

Moves are typed actions scoped to a specific layer and actor. Each move type has:

- **Preconditions**: State predicates that must be true for the move to be legal.
- **Cost**: Resource expenditure (political capital, military readiness, economic reserves, etc.) deducted from a per-turn move budget.
- **Effects**: Deterministic state mutations applied by the engine, with effect previews shown to the player before submission.
- **Stochastic Modifiers**: Optional probability distributions applied to effect magnitudes (seeded for determinism).
- **Cross-Layer Couplings**: Secondary effects propagated to other layers, visualized in the coupling graph.

Players compose moves via the action panel, which shows available actions filtered by role and phase. An effect preview displays estimated stress deltas before submission. A turn confirmation dialog allows reviewing all queued actions before committing.

### 3.5 Fog of War

Players never see raw world state. Each role has a visibility function that:

- Fully reveals state owned by the player's side within their role's domain.
- Partially reveals opponent state based on intelligence, surveillance, and reconnaissance (ISR) asset levels.
- Injects calibrated noise into partially visible state to model imperfect intelligence.
- Completely hides state outside the role's awareness scope.

### 3.6 Phase Transitions

The simulation models six phases of escalation. Transitions are driven by a composite order parameter computed from weighted contributions of all 8 layers. Phase transitions are:

- Irreversible (no de-escalation to a prior phase, though intensity within a phase can vary).
- Trigger structural changes to game mechanics (e.g., new move types become available, costs change, alliance commitments activate).
- Visible to all players with appropriate narrative framing.

### 3.7 Replay

- Full deterministic replay from event log.
- Scrub forward/backward to any tick.
- Alternate visibility: replay from any role's perspective or omniscient view.
- Branch points: identify ticks where different moves would have changed outcomes (requires re-simulation).

### 3.8 Audit Log

- Append-only event log capturing every state mutation, move submission, validation result, and phase transition.
- Immutable once written.
- Queryable by tick, actor, layer, event type.
- Exportable for external analysis.

### 3.9 Dashboard and Visualization

The operator console provides real-time situational awareness through several integrated panels:

- **Phase Indicator & Escalation Timeline**: Shows current escalation phase, Ψ (composite order parameter) value, distance to next threshold, and a visual timeline of all phase transitions with Ψ cursor.
- **Domain Stress Panels**: Eight domain panels (military, cyber, economic, diplomatic, information, space, social, infrastructure) showing stress/resilience bars, delta indicators, and click-to-expand detail popovers with variable breakdowns, coupled domains, and recent events.
- **Battlespace Canvas**: 2D strategic visualization of actors, domain stress rings, and coupling lines. Hover tooltips show actor details; click to inspect. Toggle-able legend and coupling line highlights.
- **Coupling Graph**: Node-link diagram showing how the 8 domains influence each other, with edge weights representing coupling strength.
- **Event Feed**: Chronological feed of simulation events with type filtering (action/phase/stochastic/system), domain dropdown, turn range selector, text search, and click-to-expand detail view.
- **Action Panel**: Move composition UI with legal action list, effect previews showing estimated stress deltas, and a turn confirmation dialog.
- **AI Intelligence Report**: When playing against AI, shows the opponent's reasoning, move history with domain targeting heatmap, expandable rationale, tool call timeline, and confidence indicators.
- **Domain Stress Chart**: Time-series chart of all domain stress levels with Ψ trend line and phase threshold reference lines.
- **After-Action Review (AAR)**: Post-game summary with performance metrics, event timeline, and outcome analysis.

### 3.10 Scenarios

Two built-in scenarios ship with the platform:

- **Baltic Flashpoint**: NATO vs Russia confrontation in the Baltic region with 6 actors (NATO forces, Baltic states, Russia, EU, CSTO, civilian infrastructure). Tests conventional deterrence, cyber operations, and alliance dynamics.
- **Hormuz Flashpoint**: Strait of Hormuz maritime escalation with regional power competition, energy security dynamics, and naval operations. Tests economic warfare, maritime domain, and multilateral diplomacy.

Additional scenarios can be authored using the JSON scenario format (see [Scenario Authoring Guide](scenario-authoring-guide.md)).

## 4. User Stories

### 4.1 Scenario Author

- As a scenario author, I want to define initial conditions for all 8 layers so that I can create interesting starting positions.
- As a scenario author, I want the engine to validate my scenario so that I know it is internally consistent before anyone plays it.
- As a scenario author, I want to export my scenario as JSON so that I can share it or version-control it.

### 4.2 Human Player

- As a player, I want to browse available runs and join one with an open role so that I can participate in a simulation.
- As a player, I want to see only the state my role should see so that fog of war is meaningful.
- As a player, I want to submit moves and see their effects reflected in the next tick so that my decisions matter.
- As a player, I want to preview action effects before committing so that I can make informed decisions.
- As a player, I want to confirm my turn before submission so that I don't accidentally commit incomplete plans.
- As a player, I want to see phase transitions announced with context so that I understand the escalation trajectory.
- As a player, I want real-time updates when other players' moves affect state I can see so that I can react.
- As a new player, I want an interactive tutorial that walks me through the UI so that I can learn without reading documentation.
- As a player, I want to filter and search the event feed so that I can find relevant events quickly.
- As a player, I want to see AI opponent reasoning and move history so that I can adapt my strategy.

### 4.3 AI Opponent

- As an AI agent, I want to receive a compiled state view matching my role so that I can reason about the situation.
- As an AI agent, I want a bounded set of tools to inspect state and submit moves so that I operate within defined constraints.
- As an AI agent, I want my tool budget to be enforced so that I cannot consume unbounded resources.

### 4.4 Observer

- As an observer, I want to watch a run in real-time with configurable visibility so that I can follow the action.
- As an observer, I want to see a timeline of events so that I understand what happened and when.

### 4.5 Analyst

- As an analyst, I want to replay a completed run from any role's perspective so that I can study decision-making.
- As an analyst, I want to export the full event log so that I can perform external analysis.

### 4.6 Admin

- As an admin, I want to manage scenarios, runs, and users so that the system stays organized.
- As an admin, I want to configure AI opponent parameters so that difficulty can be tuned.

## 5. Constraints

### 5.1 Performance

- Tick computation must complete within 500ms for a standard scenario (up to 200 state variables, 8 layers, 6 actors).
- WebSocket state distribution must deliver filtered updates within 100ms of tick completion.
- UI must render state updates within one animation frame (16ms) of receipt.

### 5.2 Determinism

- Given identical initial state, identical moves, and identical seed, the engine must produce bit-identical output across runs and platforms.
- All floating-point operations in the engine must use deterministic ordering.
- Random number generation must use a seedable PRNG with documented algorithm.

### 5.3 Security

- Players must never receive state outside their visibility scope, even in error conditions.
- The AI agent service must be unable to bypass move validation.
- Event log integrity must be protected against tampering.

### 5.4 Availability

- The system is designed for local and small-group deployment, not global scale.
- Target: 2-10 concurrent users per instance.
- No hard uptime SLA, but graceful degradation on service failure.

## 6. Out of Scope (v1)

- Mobile-native clients (responsive web only).
- Real-time voice/video communication (use external tools).
- Automated tournament/matchmaking.
- Public multi-tenant hosting.
- Internationalization/localization.
