# Greyzone Player Guide

Welcome to Greyzone — a geopolitical simulation where you command a nation through escalating grey-zone conflict. This guide will help you understand the interface, make strategic decisions, and navigate the escalation ladder.

---

## Getting Started

### Creating an Account

Visit **https://greyzone.sandford.systems**, register with a username and password, and log in. You'll land on the home page where you can browse scenarios, create runs, or join existing ones.

### Starting a Game

1. **Pick a Scenario** — Choose from available flashpoints (Baltic, Hormuz). Each scenario defines the actors, starting conditions, stochastic events, and turn limit.
2. **Create or Join a Run** — Create a new run from a scenario, or join one that's waiting in the lobby.
3. **Choose Your Role**:
   - **Blue Commander** — Lead the defending coalition (typically NATO). Your objective is to maintain stability and contain escalation.
   - **Red Commander** — Lead the revisionist power. Your objective is to achieve strategic gains through escalation pressure.
   - **Observer** — Watch the game unfold without taking actions.
4. **Ready Up** — Once both commanders have joined, the game can begin.

### The Tutorial

If it's your first time, visit the **Tutorial** page from the navigation bar. It walks through:
- **Welcome** — What Greyzone is and how it works
- **Domains** — The 8 interconnected systems you'll be operating in
- **Couplings** — How actions in one domain affect others
- **Escalation** — The 6-phase escalation model and the order parameter Ψ
- **Actions** — The types of moves you can make
- **Roles** — Blue vs Red objectives and fog of war
- **The Board** — Reading the simulation dashboard
- **Ready** — You're prepared to play

---

## Understanding the Interface

### The Simulation Dashboard

When a game is active, you'll see the simulation dashboard — your command center. Here's what each component shows:

#### Phase Indicator & Escalation Timeline (top)
- Shows your current **escalation phase** (e.g., "Phase 1: Hybrid Coercion")
- The **escalation timeline bar** visualizes all 6 phases proportional to their Ψ ranges
- A **glowing cursor** shows where the current Ψ value sits
- **Transition markers** (T3, T7, etc.) show when past phase transitions occurred
- Distance to the next threshold is displayed (e.g., "0.12 to P2")
- A **TRANSITION WARNING** appears when Ψ is within 0.05 of the next threshold

#### Metrics Overview
Quick-reference cards showing:
- **Order Parameter (Ψ)** — The composite conflict intensity measure (0 = peace, 1 = total war), with turn-over-turn delta arrows
- **Phase** — Current escalation band
- **Turn** — Current turn number
- **Events** — Count of events this game
- **Resources** — Your remaining resource points (RP), with delta
- **Dominant Domain** — Which domain has the highest stress
- **Avg Resilience** — Your average defensive posture, with delta

The colored **delta badges** (↑↓) show change since last turn: green means improving, red means worsening.

#### Domain Panels (left sidebar on desktop, tab on mobile)
Eight panels, one per domain. Each shows:
- **Stress level** — How destabilized this domain is (0–100%)
- **Trend arrow** — Rising, falling, or stable since last turn
- **Click to expand** for detail:
  - Resilience, friction, activity, mobilization values
  - Coupled domains and their coupling weights
  - Recent events affecting this domain
  - Critical pulse animation when stress ≥ 95%

#### Battlespace Canvas (center)
A heat-mapped grid visualization of all 8 domains:
- **Color intensity** reflects stress level (green → yellow → red)
- **Hover** any domain zone to see a tooltip with stress, resilience, activity, friction, and trend
- **Coupling lines** highlight when you hover, showing which domains are connected
- Toggle the **legend** (📊 button) to see what each visual encoding means

#### Event Feed (right sidebar)
A chronological log of everything happening in the simulation:
- **Filter by type** — Click type pills to filter (action, stochastic, phase_transition, narrative, etc.)
- **Filter by domain** — Dropdown to show only events in a specific domain
- **Filter by turn range** — Current turn, last 3 turns, or all
- **Search** — Free-text search across event descriptions
- **Click any event** to expand and see detail (actor, intensity, cost, phase info)

#### Action Panel
Where you make your moves:
- Browse available actions filtered by what the engine allows this turn
- Each action card shows: type, target domain, intensity slider, and resource cost
- **Hover an action** to see effect preview badges (projected stress/resilience changes)
- **Submit** to queue the action for this turn
- Use the **Turn Controls** to advance the turn when ready

#### Turn Confirmation Dialog
Before advancing, a confirmation dialog shows:
- Summary of all actions you've submitted this turn
- Total resource cost
- Current phase and Ψ value
- Confirm or cancel

#### AI Intelligence Report
When playing against the AI, this panel shows:
- **Domain targeting heatmap** — Which domains the AI has been focusing on
- **Move history** — Scrollable list of all AI moves with turn, action type, domain, intensity
- **Click any move** to expand: rationale, validation status, and tool calls
- **SIGINT narrative** for the latest move ("SIGINT INTERCEPT: Red Commander executed major Escalate targeting Energy infrastructure")
- Confidence and validation badges per move

#### Domain Stress Chart
Line chart tracking stress levels over time:
- One line per domain (color-coded)
- A purple dashed **Ψ line** shows the order parameter trajectory
- Phase threshold reference lines mark escalation boundaries
- Hover for exact values at any turn

#### After-Action Report
Appears after each turn advances:
- Narrative headline summarizing what happened
- Domain deltas showing which domains changed most
- Phase transition alerts if a boundary was crossed

---

## Strategy Tips

### For Blue Commanders (Defenders)

- **Prioritize resilience** — Reinforce and de-escalate to keep domain resilience high. High resilience dampens stress growth and reduces coupling spillover.
- **Watch the coupling matrix** — A cyber attack on infrastructure can cascade into energy and economic stress. Defend coupled domains proactively.
- **Manage resources carefully** — You regenerate +2 RP per turn. Don't overspend early; save resources for responding to Red's escalation.
- **De-escalate when near thresholds** — Phase transitions unlock more aggressive Red actions. Keep Ψ below transition points when possible.
- **Monitor the AI's patterns** — Use the Intelligence Report to see which domains Red is targeting, then reinforce those.

### For Red Commanders (Aggressors)

- **Exploit domain couplings** — Target domains that have high coupling weights to others. A well-placed disruption can cascade across multiple systems.
- **Time your escalation** — Don't escalate too fast early. Build pressure across multiple domains simultaneously, then push through phase transitions when ready.
- **Use hybrid actions first** — Cyber attacks, information operations, and sanctions are lower-cost and harder to attribute. Save military actions for later phases.
- **Watch Blue's resilience** — Target domains where resilience is already low. That's where stress grows fastest.
- **Don't overextend** — Running out of resources leaves you unable to respond to Blue's counter-moves.

### General Tips

- **Ψ is king** — Everything ultimately feeds into the order parameter. Think about how your actions affect the overall system, not just one domain.
- **Domains are coupled** — There's no such thing as an isolated action. Maritime disruption affects energy, which affects economics, which affects domestic politics.
- **Stochastic events happen** — Random events (cyberattacks, protests, accidents) will occur. Build resilience to absorb them.
- **Phase transitions are sticky** — Thanks to hysteresis, once you escalate to a new phase, it's harder to de-escalate back. Be deliberate.
- **Check the stress chart** — The Ψ trend line tells you whether the situation is improving or deteriorating. React to trends, not just snapshots.

---

## The 8 Domains

| # | Domain | What It Represents | Key Variables |
|---|--------|-------------------|---------------|
| 1 | **Kinetic** | Military forces, weapons, combat operations | Stress, resilience, mobilization, activity |
| 2 | **Maritime & Logistics** | Shipping lanes, ports, supply chains | Stress, resilience, friction, activity |
| 3 | **Energy** | Energy supply, infrastructure, prices | Stress, resilience, friction, activity |
| 4 | **Geoeconomic & Industrial** | Trade, sanctions, industrial capacity | Stress, resilience, friction, activity |
| 5 | **Cyber** | Network attacks, defense, digital infrastructure | Stress, resilience, friction, activity |
| 6 | **Space & PNT** | Satellites, GPS, positioning, navigation | Stress, resilience, friction, activity |
| 7 | **Information & Cognitive** | Narratives, disinformation, public trust | Stress, resilience, friction, activity |
| 8 | **Domestic Political & Fiscal** | Political cohesion, fiscal capacity, public support | Stress, resilience, friction, activity |

Each domain has **autonomous dynamics** — stress naturally evolves based on current levels, resilience, and coupling effects from other domains — plus **action effects** from player and AI moves.

---

## Action Types

| Action | Effect | Typical Cost |
|--------|--------|-------------|
| **Escalate** | Increases stress in target domain | Medium |
| **De-escalate** | Decreases stress in target domain | Low |
| **Reinforce** | Increases resilience in target domain | Medium |
| **Disrupt** | Increases friction and reduces activity | Medium |
| **Mobilize** | Increases military readiness and mobilization | High |
| **Negotiate** | Reduces stress through diplomatic channels | Low |
| **Cyber Attack** | Targeted digital disruption | Medium |
| **Information Op** | Narrative warfare, disinformation | Low |
| **Sanction Impose** | Economic pressure | Medium |
| **Sanction Relief** | Eases economic pressure | Low |
| **Military Deploy** | Conventional force projection | High |
| **Naval Blockade** | Maritime chokepoint control | High |
| **Space Asset Deploy** | Satellite/PNT operations | High |
| **Domestic Policy Shift** | Internal political adjustment | Low |

Action availability depends on the current **phase** — more aggressive actions unlock at higher escalation levels. Each action has a **resource cost** based on its type and intensity. You start with a pool of RP and regenerate +2 per turn.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Toggle keyboard shortcuts help |
| `C` | Toggle coupling graph overlay |
| `G` | Toggle glossary |
| `E` | Focus event feed |
| `Escape` | Close any open dialog or overlay |

---

## Glossary

- **Ψ (Order Parameter)** — Composite measure of conflict system intensity. 0 = dispersed, 1 = fully synchronized escalation. Computed from domain stresses, coupling effects, and mobilization indicators.
- **Phase** — The current escalation band (0–5). Higher phases unlock more aggressive actions and increase risk.
- **Stress** — How destabilized a domain is (0–1). Higher stress contributes to higher Ψ.
- **Resilience** — A domain's ability to absorb shocks (0–1). Higher resilience dampens stress growth.
- **Friction** — Operational difficulty within a domain (0–1). Higher friction slows activity.
- **Coupling** — How much stress in one domain spills over into another. Defined by the scenario's coupling matrix.
- **Hysteresis** — Phase transitions require sustained pressure to trigger, and are harder to reverse once crossed.
- **Fog of War** — Each commander sees a noisy version of the opponent's domain states. The AI also respects fog of war.
- **Stochastic Events** — Random scenario events (cyberattacks, protests, equipment failures) that inject stress and uncertainty.
- **After-Action Report (AAR)** — End-of-turn summary showing what changed and why.
