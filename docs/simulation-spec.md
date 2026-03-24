# Greyzone Simulation Specification

Version: 1.0
Status: Governing

## 1. Overview

The Greyzone simulation models a modern distributed battlespace as a multivariate dynamical system. The world state is a vector of continuous and discrete variables organized into 8 layers. State evolves through discrete ticks driven by player moves and autonomous dynamics. The simulation supports deterministic replay via seedable PRNG and fixed-order computation.

## 2. World State

The world state at tick `t` is defined as:

```
W(t) = { L_1(t), L_2(t), ..., L_8(t), P(t), A(t), G(t) }
```

Where:
- `L_i(t)` is the state of layer `i` at tick `t`
- `P(t)` is the current phase (integer 0-5)
- `A(t)` is the set of actor states
- `G(t)` is the global parameter set (alliance matrix, trade graph, etc.)

## 3. Actors

Each simulation run includes 2-6 actors (nation-states or blocs). Each actor has:

| Variable | Type | Range | Description |
|---|---|---|---|
| `id` | UUID | - | Unique identifier |
| `name` | string | - | Display name |
| `side` | enum | Blue, Red, Neutral | Alliance alignment |
| `resources` | ResourceVec | [0, 1] per dimension | Normalized resource pool |
| `readiness` | f64 | [0, 1] | Overall military readiness |
| `stability` | f64 | [0, 1] | Domestic political stability |
| `credibility` | f64 | [0, 1] | International credibility |

## 4. Simulation Layers

### 4.1 Layer 1: Kinetic

Models conventional and unconventional military operations.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `force_posture[actor]` | f64 | [0, 1] | Force deployment level (0=garrison, 1=full mobilization) |
| `force_readiness[actor]` | f64 | [0, 1] | Training/equipment/sustainment state |
| `attrition[actor]` | f64 | [0, 1] | Cumulative force attrition |
| `theater_control[region]` | f64 | [-1, 1] | Control gradient (-1=Red, +1=Blue) |
| `escalation_index` | f64 | [0, 1] | Intensity of kinetic operations |
| `wmd_threshold` | f64 | [0, 1] | Proximity to WMD employment |
| `proxy_activity[region]` | f64 | [0, 1] | Proxy/irregular force activity |

**Autonomous Dynamics**:
- Attrition increases proportional to `escalation_index` and inversely proportional to `force_readiness`.
- Force readiness decays under sustained high posture: `dr/dt = -alpha * posture * (1 - logistics_efficiency)`.
- Theater control shifts based on relative force posture, readiness, and attrition differential.

### 4.2 Layer 2: Maritime Logistics

Models sea lines of communication, port capacity, and naval force projection.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `sloc_throughput[route]` | f64 | [0, 1] | Shipping throughput on each SLOC |
| `port_capacity[port]` | f64 | [0, 1] | Operational capacity of each port |
| `naval_presence[region]` | f64 | [-1, 1] | Naval control gradient |
| `mine_density[chokepoint]` | f64 | [0, 1] | Mine threat level at chokepoints |
| `convoy_efficiency` | f64 | [0, 1] | Average convoy protection effectiveness |
| `blockade_effectiveness[actor]` | f64 | [0, 1] | Blockade imposition level |

**Autonomous Dynamics**:
- SLOC throughput degrades with mine density and opposing naval presence.
- Port capacity recovers slowly after damage: `dc/dt = recovery_rate * (1 - c) - damage_rate`.
- Blockade effectiveness decays without sustained naval commitment.

### 4.3 Layer 3: Energy

Models energy production, distribution, reserves, and price dynamics.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `production[actor][source]` | f64 | [0, 1] | Production level per energy source |
| `reserves[actor]` | f64 | [0, 1] | Strategic reserve level |
| `price_index` | f64 | [0.5, 5.0] | Global energy price multiplier |
| `infrastructure_integrity[actor]` | f64 | [0, 1] | Energy infrastructure health |
| `import_dependency[actor]` | f64 | [0, 1] | Fraction of energy imported |
| `grid_stability[actor]` | f64 | [0, 1] | Electrical grid stability |

**Autonomous Dynamics**:
- Price index responds to supply-demand imbalance: `dp/dt = beta * (demand - supply) / supply`.
- Reserves deplete when production is below demand: `dr/dt = production - demand` (clamped to [0, 1]).
- Infrastructure integrity degrades under cyber or kinetic attack and recovers slowly.

### 4.4 Layer 4: Geoeconomic-Industrial

Models trade flows, sanctions, industrial capacity, and financial warfare.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `trade_flow[actor_a][actor_b]` | f64 | [0, 1] | Bilateral trade volume |
| `sanctions_pressure[actor]` | f64 | [0, 1] | Cumulative sanctions impact |
| `industrial_output[actor]` | f64 | [0, 1] | Industrial production capacity |
| `financial_stability[actor]` | f64 | [0, 1] | Financial system health |
| `supply_chain_integrity[actor]` | f64 | [0, 1] | Critical supply chain robustness |
| `currency_strength[actor]` | f64 | [0.1, 2.0] | Relative currency value |

**Autonomous Dynamics**:
- Sanctions pressure accumulates over time and degrades industrial output with a lag.
- Trade flow reduction cascades through supply chains: `ds/dt = -gamma * max(0, dependency - trade_flow)`.
- Financial stability is coupled to energy price shocks, sanctions, and domestic political stability.

### 4.5 Layer 5: Cyber

Models offensive and defensive cyber operations, infrastructure vulnerabilities, and information advantage.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `cyber_posture[actor]` | enum | Defensive, Active, Offensive | Cyber force posture |
| `vulnerability[actor][sector]` | f64 | [0, 1] | Vulnerability of each sector to cyber attack |
| `attack_capacity[actor]` | f64 | [0, 1] | Offensive cyber capability |
| `defense_effectiveness[actor]` | f64 | [0, 1] | Defensive cyber capability |
| `information_advantage[actor]` | f64 | [-1, 1] | Net intelligence/SIGINT advantage |
| `attribution_clarity` | f64 | [0, 1] | How clearly cyber attacks are attributed |

**Autonomous Dynamics**:
- Vulnerability increases when defense investment is low: `dv/dt = delta * (1 - defense_effectiveness) - patching_rate`.
- Attack capacity regenerates slowly after employment.
- Attribution clarity increases over time after an attack, reducing ambiguity.

### 4.6 Layer 6: Space/PNT

Models space-based assets, positioning/navigation/timing services, and anti-satellite capabilities.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `satellite_health[actor][constellation]` | f64 | [0, 1] | Constellation operational percentage |
| `pnt_accuracy[actor]` | f64 | [0, 1] | PNT service quality |
| `space_domain_awareness[actor]` | f64 | [0, 1] | Ability to track objects in orbit |
| `asat_readiness[actor]` | f64 | [0, 1] | Anti-satellite weapon readiness |
| `debris_density` | f64 | [0, 1] | Orbital debris level (Kessler risk) |
| `launch_capacity[actor]` | f64 | [0, 1] | Ability to replace lost satellites |

**Autonomous Dynamics**:
- Debris density increases with ASAT employment and decays very slowly.
- Satellite health degrades probabilistically with debris density: `P(degradation) = epsilon * debris_density`.
- PNT accuracy is directly coupled to satellite constellation health.

### 4.7 Layer 7: Information/Cognitive

Models narrative control, public opinion, morale, and information operations.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `narrative_control[actor]` | f64 | [0, 1] | Dominance of preferred narrative |
| `public_opinion[actor]` | f64 | [-1, 1] | Domestic public support for government policy |
| `military_morale[actor]` | f64 | [0, 1] | Armed forces morale |
| `disinformation_saturation` | f64 | [0, 1] | Global information environment degradation |
| `media_freedom[actor]` | f64 | [0, 1] | Press freedom level |
| `psyop_effectiveness[actor]` | f64 | [0, 1] | Psychological operations impact |

**Autonomous Dynamics**:
- Public opinion drifts toward war-weariness under sustained escalation: `dp/dt = -zeta * escalation_index * time_at_war`.
- Narrative control decays without active reinforcement.
- Military morale is coupled to attrition, public opinion, and supply adequacy.

### 4.8 Layer 8: Domestic-Political/Fiscal

Models government stability, fiscal capacity, political will, and alliance cohesion.

**State Variables**:

| Variable | Type | Range | Description |
|---|---|---|---|
| `government_stability[actor]` | f64 | [0, 1] | Regime stability |
| `fiscal_reserves[actor]` | f64 | [0, 1] | Budget/debt capacity remaining |
| `political_will[actor]` | f64 | [0, 1] | Elite consensus for current policy |
| `alliance_cohesion[bloc]` | f64 | [0, 1] | Intra-alliance solidarity |
| `war_authorization[actor]` | bool | - | Formal war authorization status |
| `mobilization_level[actor]` | f64 | [0, 1] | Economic/social mobilization |
| `casualty_tolerance[actor]` | f64 | [0, 1] | Political tolerance for casualties |

**Autonomous Dynamics**:
- Fiscal reserves deplete proportional to mobilization level and escalation: `df/dt = base_revenue - military_spend * mobilization_level`.
- Government stability is coupled to public opinion, economic performance, and casualty rates.
- Alliance cohesion erodes when members bear unequal burden.

## 5. Cross-Layer Couplings

Layers are not independent. The engine evaluates a coupling matrix each tick that propagates effects between layers. Key couplings:

| Source Layer | Target Layer | Coupling | Description |
|---|---|---|---|
| Kinetic | Maritime | `sloc_throughput -= eta * escalation_index` | Conflict disrupts shipping |
| Kinetic | Information | `public_opinion -= theta * attrition` | Casualties erode support |
| Kinetic | Domestic | `fiscal_reserves -= kappa * force_posture` | Military ops cost money |
| Maritime | Energy | `production *= sloc_throughput` (for importers) | Blocked SLOCs cut energy imports |
| Energy | Geoeconomic | `industrial_output *= f(energy_availability)` | Energy shortages cut production |
| Cyber | Energy | `infrastructure_integrity -= lambda * attack_success` | Cyber attacks damage energy grid |
| Cyber | Space | `satellite_health -= mu * space_cyber_attack` | Cyber attacks on ground stations |
| Space | Kinetic | `force_readiness *= pnt_accuracy` | Degraded PNT reduces military effectiveness |
| Information | Domestic | `political_will += nu * narrative_control` | Narrative success bolsters will |
| Domestic | Kinetic | `mobilization gates force_posture increase` | Can't mobilize without political authorization |
| Geoeconomic | Domestic | `government_stability *= f(economic_health)` | Economic pain destabilizes government |
| Energy | Domestic | `public_opinion -= rho * energy_price_shock` | Energy price spikes anger public |

The full coupling matrix is defined in the engine configuration and can be adjusted per scenario.

## 6. Phase Transition Model

### 6.1 Composite Order Parameter

The phase of the simulation is determined by a composite order parameter `Phi(t)` computed as a weighted sum of escalation indicators across all layers:

```
Phi(t) = sum_i ( w_i * phi_i(t) )
```

Where `phi_i(t)` is the escalation indicator for layer `i` and `w_i` is its weight. Weights sum to 1.

**Per-layer escalation indicators**:

| Layer | Indicator `phi_i` | Formula |
|---|---|---|
| Kinetic | Escalation intensity | `escalation_index * (1 - min(attrition_blue, attrition_red))` |
| Maritime | SLOC disruption | `1 - mean(sloc_throughput)` |
| Energy | Energy crisis severity | `max(0, price_index - 1.0) / 4.0` |
| Geoeconomic | Economic warfare intensity | `mean(sanctions_pressure) * (1 - mean(trade_flow))` |
| Cyber | Cyber conflict intensity | `mean(attack_capacity * (1 - defense_effectiveness))` |
| Space | Space domain degradation | `debris_density * (1 - mean(satellite_health))` |
| Information | Information war intensity | `disinformation_saturation * (1 - mean(narrative_control))` |
| Domestic | Political crisis severity | `1 - mean(government_stability * political_will)` |

### 6.2 Phase Thresholds

| Phase | Name | Phi Range | Structural Changes |
|---|---|---|---|
| 0 | Competitive Normality | [0.0, 0.15) | Full diplomatic move set. Limited military moves. Trade flows normal. |
| 1 | Hybrid Coercion | [0.15, 0.30) | Cyber and information ops unlock. Sanctions available. Proxy operations enabled. |
| 2 | Acute Polycrisis | [0.30, 0.50) | Partial mobilization available. SLOC interdiction legal. Energy weaponization enabled. |
| 3 | War-Transition | [0.50, 0.70) | Full mobilization. War authorization votes. Alliance commitments activate. |
| 4 | Overt Interstate War | [0.70, 0.85) | Full kinetic operations. ASAT employment. Strategic cyber attacks. |
| 5 | Generalized/Bloc War | [0.85, 1.0] | WMD threshold approaches. Total economic mobilization. All constraints removed. |

### 6.3 Phase Transition Mechanics

- **Irreversibility**: Once `Phi(t)` crosses a threshold, the phase advances and does not revert even if `Phi` subsequently decreases. The phase is `P(t) = max(P(t-1), phase_for(Phi(t)))`.
- **Hysteresis**: A phase transition requires `Phi` to exceed the threshold for a configurable number of consecutive ticks (default: 3) to prevent oscillation.
- **Structural change**: On phase transition, the engine modifies the available move set, cost tables, and coupling weights according to the new phase's configuration.
- **Event emission**: A `PhaseTransition` event is emitted with the old phase, new phase, `Phi` value, and per-layer contributions.

## 7. Tick Progression

### 7.1 Tick Pipeline (Engine Internal)

Each tick executes the following steps in fixed order:

```
1. Receive (moves[], current_state, seed, tick_number)
2. Validate each move against current state and phase rules
3. Apply validated moves to produce intermediate state
4. Evaluate autonomous dynamics for each layer
5. Evaluate cross-layer couplings
6. Clamp all variables to valid ranges
7. Compute composite order parameter Phi
8. Evaluate phase transition (with hysteresis)
9. If phase transition: apply structural changes
10. Emit events for all state changes
11. Return (new_state, events[], phase_transition?)
```

### 7.2 Move Resolution Order

Within a single tick, moves are resolved in layer order (1 through 8), and within a layer, in actor order (sorted by actor ID for determinism). Simultaneous moves within the same layer interact through the coupling matrix rather than through sequential application.

### 7.3 Stochastic Elements

The engine supports stochastic modifiers on move effects and autonomous dynamics. All randomness uses a `ChaCha20Rng` seeded with:

```
tick_seed = PRNG(run_seed, tick_number)
```

Each stochastic element draws from the PRNG in a fixed, deterministic order, ensuring reproducibility.

## 8. Event Model

Every state change produces one or more events. Events are the atomic unit of the audit log and the basis for replay.

### 8.1 Event Schema

```json
{
  "event_id": "uuid",
  "run_id": "uuid",
  "tick": 42,
  "sequence": 3,
  "event_type": "StateChange | MoveApplied | MoveRejected | PhaseTransition | TickComplete",
  "layer": 1,
  "actor_id": "uuid | null",
  "payload": { ... },
  "timestamp": "2026-03-24T12:00:00Z"
}
```

### 8.2 Event Types

| Type | Trigger | Payload |
|---|---|---|
| `MoveSubmitted` | Player submits a move | Move details, player ID, role |
| `MoveValidated` | Engine accepts a move | Move ID, validation result |
| `MoveRejected` | Engine rejects a move | Move ID, rejection reason |
| `MoveApplied` | Engine applies a move | Move ID, state deltas |
| `StateChange` | Autonomous dynamics or coupling | Layer, variable, old value, new value |
| `PhaseTransition` | Phi crosses threshold | Old phase, new phase, Phi value, contributions |
| `TickComplete` | Tick pipeline finishes | Tick number, duration_ms |
| `RunStarted` | Run transitions to active | Run ID, participants, scenario ID |
| `RunPaused` | Run is paused | Run ID, reason |
| `RunTerminated` | Run ends | Run ID, final phase, final state hash |

## 9. Determinism Contract

The engine guarantees deterministic output under the following conditions:

1. **Same initial state**: Byte-identical scenario configuration.
2. **Same moves**: Identical move sets submitted at each tick.
3. **Same seed**: Identical run seed.
4. **Same engine version**: Identical compiled engine binary.

Under these conditions, the output world state and event sequence are bit-identical. This is verified by CI tests that run the same scenario twice and compare SHA-256 hashes of the output.

## 10. Scenario Format

Scenarios are JSON files that specify:

```json
{
  "scenario_id": "uuid",
  "name": "Baltic Flashpoint",
  "description": "...",
  "version": "1.0",
  "actors": [ ... ],
  "initial_state": {
    "layers": {
      "kinetic": { ... },
      "maritime": { ... },
      ...
    },
    "global": {
      "alliance_matrix": [ ... ],
      "trade_graph": [ ... ]
    }
  },
  "phase_config": {
    "thresholds": [0.15, 0.30, 0.50, 0.70, 0.85],
    "hysteresis_ticks": 3,
    "weights": [0.20, 0.10, 0.10, 0.10, 0.15, 0.05, 0.15, 0.15]
  },
  "tick_config": {
    "max_ticks": 500,
    "move_timeout_seconds": 120
  }
}
```

The engine validates scenario files for:
- All required fields present.
- All state variables within valid ranges.
- Alliance matrix symmetry.
- Phase threshold monotonicity.
- Weight sum equals 1.0 (within floating-point tolerance).
