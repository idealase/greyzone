# Scenario Authoring Guide

This guide explains how to create new scenarios for Greyzone. A scenario defines the starting conditions, actors, domain states, stochastic events, and roles for a simulation run.

---

## Overview

A scenario is a JSON configuration stored in the `scenarios` table (via the `config` column). It defines everything the simulation engine needs to initialize a game:

- **Roles** — Who can play (Blue Commander, Red Commander, Observer)
- **Actors** — The entities in the simulation (nations, alliances, proxies, infrastructure operators)
- **Initial Layer States** — Starting stress, resilience, friction, and activity for each of the 8 domains
- **Stochastic Events** — Random events that may trigger each turn
- **Turn Limit** — Maximum number of turns

Scenarios are seeded into the database via SQL files in `infra/db/seed/`.

---

## Scenario Config Schema

```jsonc
{
  "max_turns": 50,                    // Maximum turns before game ends

  "roles": [                          // Player roles (minimum: blue + red)
    {
      "id": "blue_commander",         // Role identifier
      "name": "Blue Coalition Commander",
      "description": "Commands Blue forces",
      "controlled_actors": ["blue_coalition", "neutral_states"]  // Actor IDs this role controls
    },
    {
      "id": "red_commander",
      "name": "Red Federation Commander",
      "description": "Commands Red forces",
      "controlled_actors": ["red_federation", "separatist_movement"]
    },
    {
      "id": "observer",
      "name": "Observer",
      "description": "Read-only observer",
      "controlled_actors": []         // Observers control no actors
    }
  ],

  "actors": [ /* see Actor Schema below */ ],
  "initial_layers": { /* see Layer Schema below */ },
  "stochastic_events": [ /* see Event Schema below */ ]
}
```

---

## Actor Schema

Each actor represents an entity in the simulation — a nation, alliance, proxy group, or infrastructure operator.

```jsonc
{
  "id": "00000000-0000-0000-0001-000000000001",  // UUID
  "name": "Blue Coalition",
  "kind": "State",              // Actor type (see below)
  "capabilities": {             // Per-domain capability scores (0.0 – 1.0)
    "Kinetic": 0.8,
    "MaritimeLogistics": 0.7,
    "Energy": 0.5,
    "GeoeconomicIndustrial": 0.7,
    "Cyber": 0.7,
    "SpacePnt": 0.8,
    "InformationCognitive": 0.6,
    "DomesticPoliticalFiscal": 0.5
  },
  "resources": 100.0,           // Starting resource points
  "morale": 0.7,                // Starting morale (0.0 – 1.0)
  "visibility": "Public"        // Who can see this actor (see below)
}
```

### Actor Kinds

| Kind | Description | Typical Use |
|------|-------------|-------------|
| `State` | A sovereign nation or major power | Blue Coalition, Red Federation |
| `Alliance` | A group of aligned states | Neutral bloc, regional coalition |
| `ProxyNonState` | Non-state proxy actor | Separatist movement, militia |
| `InfrastructureOperator` | Critical infrastructure entity | Energy grid operator, telecom provider |

### Visibility Options

- `"Public"` — Visible to all players and observers
- `{"RoleScoped": ["red_commander"]}` — Only visible to specified roles (fog of war)

### Capability Design Guidelines

Capabilities are 0.0–1.0 scores representing an actor's strength in each domain. They affect action effectiveness:

| Range | Meaning | Example |
|-------|---------|---------|
| 0.0 – 0.2 | Negligible | Separatist movement's Space capability |
| 0.3 – 0.5 | Limited | Mid-tier nation's Cyber capability |
| 0.6 – 0.7 | Competent | NATO's Economic capability |
| 0.8 – 0.9 | Strong | Major power's Military capability |
| 1.0 | Dominant | Rare — would imply total domain control |

**Balance tip**: Ensure no single actor dominates all domains. Create asymmetry — give Red an advantage in some domains (e.g., Cyber, Information) and Blue in others (e.g., Kinetic, Space). This forces strategic trade-offs.

---

## Initial Layer States

Define the starting condition of each of the 8 simulation domains:

```jsonc
{
  "initial_layers": {
    "Kinetic": {
      "stress": 0.10,           // Initial destabilization (0.0 – 1.0)
      "resilience": 0.80,       // Defensive capacity (0.0 – 1.0)
      "friction": 0.20,         // Operational difficulty (0.0 – 1.0)
      "activity_level": 0.15,   // Current operational tempo (0.0 – 1.0)
      "variables": {            // Domain-specific variables (optional)
        "troop_readiness": 0.7,
        "weapons_stockpile": 0.8
      }
    }
    // ... repeat for all 8 domains
  }
}
```

### Domain Identifiers

Use these exact keys for all 8 domains:

| Key | Domain |
|-----|--------|
| `Kinetic` | Military / Kinetic |
| `MaritimeLogistics` | Maritime & Logistics |
| `Energy` | Energy |
| `GeoeconomicIndustrial` | Geoeconomic & Industrial |
| `Cyber` | Cyber |
| `SpacePnt` | Space & PNT |
| `InformationCognitive` | Information & Cognitive |
| `DomesticPoliticalFiscal` | Domestic Political & Fiscal |

### Starting State Guidelines

Design starting states to match the scenario's narrative:

| Scenario Type | Stress | Resilience | Notes |
|--------------|--------|------------|-------|
| **Calm start** (slow burn) | 0.05 – 0.15 | 0.70 – 0.85 | Long game, gradual escalation |
| **Tense start** (crisis) | 0.15 – 0.30 | 0.50 – 0.70 | Already in Hybrid Coercion |
| **Hot start** (near war) | 0.30 – 0.50 | 0.40 – 0.60 | Acute Polycrisis from turn 1 |

**Balance tip**: If starting stress is high in many domains, the initial Ψ will be high and the game may escalate very quickly. Start most domains calm and have 1–2 "hotspot" domains with elevated stress for narrative focus.

---

## Stochastic Events

Random events that may trigger each turn, injecting uncertainty and narrative interest:

```jsonc
{
  "name": "Cyber Intrusion Detected",
  "description": "A significant cyber intrusion is detected in critical infrastructure",
  "affected_layer": "Cyber",           // Which domain is affected
  "stress_delta": 0.08,               // Change to stress (positive = increase)
  "resilience_delta": -0.03,          // Change to resilience (negative = decrease)
  "probability": 0.12,                // Chance of triggering per turn (0.0 – 1.0)
  "visibility": "Public"              // Who sees this event
}
```

### Event Design Guidelines

- **Probability**: Keep individual event probabilities between 0.04 and 0.15. With 10–15 events, this means roughly 1–3 random events per turn.
- **Stress delta**: Typically ±0.03 to ±0.12. Larger deltas create dramatic swings; smaller ones add texture.
- **Balance**: Include both positive events (alliances, breakthroughs) and negative events (attacks, crises). A 60/40 negative/positive ratio creates tension without despair.
- **Visibility**: Use `{"RoleScoped": ["blue_commander"]}` for events that only one side would know about (intelligence coups, secret deals).
- **Domain coverage**: Spread events across multiple domains. Having too many events in one domain makes it disproportionately volatile.

### Example Event Mix

A well-balanced scenario should include events that:

| Category | Examples | Count |
|----------|----------|-------|
| **Domain crises** | Cyber intrusion, energy disruption, naval incident | 4–5 |
| **Political events** | Political crisis, alliance statement, protests | 2–3 |
| **Positive developments** | Defense breakthrough, energy deal, confidence boost | 3–4 |
| **Proxy/information** | Disinformation campaign, proxy provocation, intelligence leak | 2–3 |
| **Technical** | Satellite anomaly, infrastructure hardening | 1–2 |

---

## Creating a New Scenario

### Step 1: Design the Narrative

Before writing JSON, answer these questions:

1. **Setting**: Where and when does this conflict take place?
2. **Actors**: Who are the key players? What are their strengths and weaknesses?
3. **Starting conditions**: Is the world calm, tense, or on the brink?
4. **Asymmetry**: What advantages does each side have?
5. **Stochastic flavor**: What kinds of random events fit this scenario?
6. **Pace**: How quickly should escalation happen? (affects turn limit and starting stress)

### Step 2: Create the SQL Seed File

Create a new file in `infra/db/seed/` following the naming convention:

```
infra/db/seed/003_your_scenario_name.sql
```

Use the Baltic Flashpoint (`001_baltic_flashpoint.sql`) as a template:

```sql
-- Seed: Your Scenario Name
INSERT INTO scenarios (id, name, description, config) VALUES (
    'your-uuid-here',
    'Your Scenario Name',
    'Description of the scenario for the scenario selection screen.',
    '{ ... your JSON config ... }'
) ON CONFLICT (name) DO NOTHING;
```

### Step 3: Validate

1. **JSON validity**: Ensure the config JSON is valid (use `jq` or a JSON validator)
2. **All 8 domains**: Every domain must have an initial layer state
3. **Actor references**: `controlled_actors` in roles must reference valid actor IDs
4. **Capabilities sum**: Each actor should have capabilities defined for all 8 domains
5. **Probability sanity**: Stochastic event probabilities should sum to a reasonable per-turn event rate (1–3 events expected per turn)

### Step 4: Seed the Database

```bash
psql greyzone < infra/db/seed/003_your_scenario_name.sql
# or
make db-seed  # Re-runs all seed files
```

### Step 5: Playtest

Run through the scenario several times, checking:
- Does escalation progress at a reasonable pace?
- Are both sides competitive?
- Do stochastic events add variety without dominating the game?
- Is the turn limit appropriate for the starting conditions?

---

## Existing Scenarios

### Baltic Flashpoint (`001_baltic_flashpoint.sql`)
- **Setting**: NATO vs Russia, Baltic region
- **Actors**: 5 (Blue Coalition, Red Federation, Neutral States, Separatist Movement, European Energy Grid)
- **Starting Ψ**: ~0.12 (calm, just below Phase 1)
- **Turn limit**: 50
- **Events**: 15 (mix of crises, breakthroughs, and political events)
- **Character**: Slow-burn escalation with energy and cyber as early hotspots

### Hormuz Flashpoint (`002_hormuz_flashpoint.sql`)
- **Setting**: Naval and energy focused, Strait of Hormuz
- **Turn limit**: 50
- **Character**: Maritime chokepoint control, energy supply disruption, regional power projection

---

## Tips for Balanced Scenarios

1. **Asymmetric capabilities** create interesting decisions — avoid making actors identical
2. **Start stress low** (< 0.15 total) for a slow-burn game, or higher (0.25–0.35) for a crisis scenario
3. **High resilience dampens escalation** — if you want fast games, reduce starting resilience
4. **Coupling matrix is defined by the engine**, not by scenarios — your starting states interact with the engine's built-in domain coupling weights
5. **Resource asymmetry matters** — giving one side more resources compensates for weaker capabilities
6. **Proxy actors add depth** — including non-state actors with `RoleScoped` visibility creates fog-of-war interest
7. **15–20 stochastic events** is a good target — enough variety without analysis paralysis
8. **Test with the AI opponent** first — the heuristic AI will help you identify if the scenario is biased toward one side
