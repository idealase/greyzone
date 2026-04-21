import { useRef, useState } from "react";

// ── Data ────────────────────────────────────────────────────────────────────

interface LayerSpec {
  id: string;
  code: string;
  name: string;
  color: string;
  tagline: string;
  dynamics: string;
  variables: { name: string; range: string; description: string }[];
  indicator: string;
}

const LAYERS: LayerSpec[] = [
  {
    id: "kinetic",
    code: "KIN",
    name: "Kinetic",
    color: "#ef4444",
    tagline: "Conventional & unconventional military operations",
    dynamics:
      "Attrition increases proportional to escalation_index and inversely proportional to force_readiness. Readiness decays under sustained high posture. Theater control shifts based on relative force posture, readiness, and attrition differential.",
    variables: [
      { name: "force_posture[actor]", range: "[0, 1]", description: "Force deployment level (0=garrison, 1=full mobilisation)" },
      { name: "force_readiness[actor]", range: "[0, 1]", description: "Training / equipment / sustainment state" },
      { name: "attrition[actor]", range: "[0, 1]", description: "Cumulative force attrition" },
      { name: "theater_control[region]", range: "[-1, 1]", description: "Control gradient (−1=Red, +1=Blue)" },
      { name: "escalation_index", range: "[0, 1]", description: "Intensity of kinetic operations" },
      { name: "wmd_threshold", range: "[0, 1]", description: "Proximity to WMD employment" },
      { name: "proxy_activity[region]", range: "[0, 1]", description: "Proxy / irregular force activity" },
    ],
    indicator: "escalation_index × (1 − min(attrition_blue, attrition_red))",
  },
  {
    id: "maritime",
    code: "MAR",
    name: "Maritime",
    color: "#3b82f6",
    tagline: "Sea lines of communication, ports & naval projection",
    dynamics:
      "SLOC throughput degrades with mine density and opposing naval presence. Port capacity recovers slowly after damage. Blockade effectiveness decays without sustained naval commitment.",
    variables: [
      { name: "sloc_throughput[route]", range: "[0, 1]", description: "Shipping throughput on each SLOC" },
      { name: "port_capacity[port]", range: "[0, 1]", description: "Operational capacity of each port" },
      { name: "naval_presence[region]", range: "[-1, 1]", description: "Naval control gradient" },
      { name: "mine_density[chokepoint]", range: "[0, 1]", description: "Mine threat at chokepoints" },
      { name: "convoy_efficiency", range: "[0, 1]", description: "Average convoy protection effectiveness" },
      { name: "blockade_effectiveness[actor]", range: "[0, 1]", description: "Blockade imposition level" },
    ],
    indicator: "1 − mean(sloc_throughput)",
  },
  {
    id: "energy",
    code: "NRG",
    name: "Energy",
    color: "#f59e0b",
    tagline: "Production, distribution, reserves & price dynamics",
    dynamics:
      "Price index responds to supply-demand imbalance. Reserves deplete when production is below demand. Infrastructure integrity degrades under cyber or kinetic attack and recovers slowly.",
    variables: [
      { name: "production[actor][source]", range: "[0, 1]", description: "Production level per energy source" },
      { name: "reserves[actor]", range: "[0, 1]", description: "Strategic reserve level" },
      { name: "price_index", range: "[0.5, 5.0]", description: "Global energy price multiplier" },
      { name: "infrastructure_integrity[actor]", range: "[0, 1]", description: "Energy infrastructure health" },
      { name: "import_dependency[actor]", range: "[0, 1]", description: "Fraction of energy imported" },
      { name: "grid_stability[actor]", range: "[0, 1]", description: "Electrical grid stability" },
    ],
    indicator: "max(0, price_index − 1.0) / 4.0",
  },
  {
    id: "geoeconomic",
    code: "GEO",
    name: "Geoeconomic",
    color: "#10b981",
    tagline: "Trade flows, sanctions, industrial capacity & financial warfare",
    dynamics:
      "Sanctions pressure accumulates and degrades industrial output with a lag. Trade flow reduction cascades through supply chains. Financial stability is coupled to energy price shocks, sanctions, and domestic political stability.",
    variables: [
      { name: "trade_flow[a][b]", range: "[0, 1]", description: "Bilateral trade volume" },
      { name: "sanctions_pressure[actor]", range: "[0, 1]", description: "Cumulative sanctions impact" },
      { name: "industrial_output[actor]", range: "[0, 1]", description: "Industrial production capacity" },
      { name: "financial_stability[actor]", range: "[0, 1]", description: "Financial system health" },
      { name: "supply_chain_integrity[actor]", range: "[0, 1]", description: "Critical supply chain robustness" },
      { name: "currency_strength[actor]", range: "[0.1, 2.0]", description: "Relative currency value" },
    ],
    indicator: "mean(sanctions_pressure) × (1 − mean(trade_flow))",
  },
  {
    id: "cyber",
    code: "CYB",
    name: "Cyber",
    color: "#8b5cf6",
    tagline: "Offensive/defensive cyber ops & information advantage",
    dynamics:
      "Vulnerability increases when defence investment is low. Attack capacity regenerates slowly after employment. Attribution clarity increases over time after an attack, reducing ambiguity.",
    variables: [
      { name: "cyber_posture[actor]", range: "enum", description: "Defensive | Active | Offensive" },
      { name: "vulnerability[actor][sector]", range: "[0, 1]", description: "Vulnerability of each sector" },
      { name: "attack_capacity[actor]", range: "[0, 1]", description: "Offensive cyber capability" },
      { name: "defense_effectiveness[actor]", range: "[0, 1]", description: "Defensive cyber capability" },
      { name: "information_advantage[actor]", range: "[-1, 1]", description: "Net intelligence / SIGINT advantage" },
      { name: "attribution_clarity", range: "[0, 1]", description: "How clearly attacks are attributed" },
    ],
    indicator: "mean(attack_capacity × (1 − defense_effectiveness))",
  },
  {
    id: "space",
    code: "SPC",
    name: "Space & PNT",
    color: "#6366f1",
    tagline: "Satellites, GPS/PNT accuracy & ASAT capabilities",
    dynamics:
      "Debris density increases with ASAT employment and decays very slowly. Satellite health degrades probabilistically with debris density. PNT accuracy is directly coupled to constellation health.",
    variables: [
      { name: "satellite_health[actor][constellation]", range: "[0, 1]", description: "Constellation operational percentage" },
      { name: "pnt_accuracy[actor]", range: "[0, 1]", description: "PNT service quality" },
      { name: "space_domain_awareness[actor]", range: "[0, 1]", description: "Ability to track objects in orbit" },
      { name: "asat_readiness[actor]", range: "[0, 1]", description: "Anti-satellite weapon readiness" },
      { name: "debris_density", range: "[0, 1]", description: "Orbital debris level (Kessler risk)" },
      { name: "launch_capacity[actor]", range: "[0, 1]", description: "Ability to replace lost satellites" },
    ],
    indicator: "debris_density × (1 − mean(satellite_health))",
  },
  {
    id: "information",
    code: "INF",
    name: "Information",
    color: "#ec4899",
    tagline: "Narrative control, public opinion & information operations",
    dynamics:
      "Public opinion drifts toward war-weariness under sustained escalation. Narrative control decays without active reinforcement. Military morale is coupled to attrition, public opinion, and supply adequacy.",
    variables: [
      { name: "narrative_control[actor]", range: "[0, 1]", description: "Dominance of preferred narrative" },
      { name: "public_opinion[actor]", range: "[-1, 1]", description: "Domestic public support for policy" },
      { name: "military_morale[actor]", range: "[0, 1]", description: "Armed forces morale" },
      { name: "disinformation_saturation", range: "[0, 1]", description: "Global information environment degradation" },
      { name: "media_freedom[actor]", range: "[0, 1]", description: "Press freedom level" },
      { name: "psyop_effectiveness[actor]", range: "[0, 1]", description: "Psychological operations impact" },
    ],
    indicator: "disinformation_saturation × (1 − mean(narrative_control))",
  },
  {
    id: "domestic",
    code: "POL",
    name: "Domestic & Fiscal",
    color: "#78716c",
    tagline: "Government stability, fiscal capacity & political will",
    dynamics:
      "Fiscal reserves deplete proportional to mobilisation level and escalation. Government stability is coupled to public opinion, economic performance, and casualty rates. Alliance cohesion erodes when members bear unequal burden.",
    variables: [
      { name: "government_stability[actor]", range: "[0, 1]", description: "Regime stability" },
      { name: "fiscal_reserves[actor]", range: "[0, 1]", description: "Budget / debt capacity remaining" },
      { name: "political_will[actor]", range: "[0, 1]", description: "Elite consensus for current policy" },
      { name: "alliance_cohesion[bloc]", range: "[0, 1]", description: "Intra-alliance solidarity" },
      { name: "war_authorization[actor]", range: "bool", description: "Formal war authorisation status" },
      { name: "mobilization_level[actor]", range: "[0, 1]", description: "Economic / social mobilisation" },
      { name: "casualty_tolerance[actor]", range: "[0, 1]", description: "Political tolerance for casualties" },
    ],
    indicator: "1 − mean(government_stability × political_will)",
  },
];

interface Coupling {
  source: string;
  sourceCode: string;
  sourceColor: string;
  target: string;
  targetCode: string;
  targetColor: string;
  formula: string;
  description: string;
}

const COUPLINGS: Coupling[] = [
  { source: "Kinetic", sourceCode: "KIN", sourceColor: "#ef4444", target: "Maritime", targetCode: "MAR", targetColor: "#3b82f6", formula: "sloc_throughput -= η × escalation_index", description: "Conflict disrupts shipping lanes" },
  { source: "Kinetic", sourceCode: "KIN", sourceColor: "#ef4444", target: "Information", targetCode: "INF", targetColor: "#ec4899", formula: "public_opinion -= θ × attrition", description: "Casualties erode domestic support" },
  { source: "Kinetic", sourceCode: "KIN", sourceColor: "#ef4444", target: "Domestic", targetCode: "POL", targetColor: "#78716c", formula: "fiscal_reserves -= κ × force_posture", description: "Military operations drain the treasury" },
  { source: "Maritime", sourceCode: "MAR", sourceColor: "#3b82f6", target: "Energy", targetCode: "NRG", targetColor: "#f59e0b", formula: "production *= sloc_throughput (importers)", description: "Blocked SLOCs cut energy imports" },
  { source: "Energy", sourceCode: "NRG", sourceColor: "#f59e0b", target: "Geoeconomic", targetCode: "GEO", targetColor: "#10b981", formula: "industrial_output *= f(energy_availability)", description: "Energy shortages cut industrial production" },
  { source: "Cyber", sourceCode: "CYB", sourceColor: "#8b5cf6", target: "Energy", targetCode: "NRG", targetColor: "#f59e0b", formula: "infrastructure_integrity -= λ × attack_success", description: "Cyber attacks damage the energy grid" },
  { source: "Cyber", sourceCode: "CYB", sourceColor: "#8b5cf6", target: "Space", targetCode: "SPC", targetColor: "#6366f1", formula: "satellite_health -= μ × space_cyber_attack", description: "Cyber attacks on ground stations degrade constellations" },
  { source: "Space", sourceCode: "SPC", sourceColor: "#6366f1", target: "Kinetic", targetCode: "KIN", targetColor: "#ef4444", formula: "force_readiness *= pnt_accuracy", description: "Degraded GPS reduces military effectiveness" },
  { source: "Information", sourceCode: "INF", sourceColor: "#ec4899", target: "Domestic", targetCode: "POL", targetColor: "#78716c", formula: "political_will += ν × narrative_control", description: "Narrative success bolsters political will" },
  { source: "Domestic", sourceCode: "POL", sourceColor: "#78716c", target: "Kinetic", targetCode: "KIN", targetColor: "#ef4444", formula: "mobilization gates force_posture increase", description: "Cannot mobilise without political authorisation" },
  { source: "Geoeconomic", sourceCode: "GEO", sourceColor: "#10b981", target: "Domestic", targetCode: "POL", targetColor: "#78716c", formula: "government_stability *= f(economic_health)", description: "Economic pain destabilises government" },
  { source: "Energy", sourceCode: "NRG", sourceColor: "#f59e0b", target: "Domestic", targetCode: "POL", targetColor: "#78716c", formula: "public_opinion -= ρ × energy_price_shock", description: "Energy price spikes anger the public" },
];

interface PhaseSpec {
  num: number;
  name: string;
  range: string;
  color: string;
  structural: string;
}

const PHASES: PhaseSpec[] = [
  { num: 0, name: "Competitive Normality", range: "[0.0, 0.15)", color: "#22c55e", structural: "Full diplomatic move set. Limited military moves. Trade flows normal." },
  { num: 1, name: "Hybrid Coercion", range: "[0.15, 0.30)", color: "#84cc16", structural: "Cyber and information ops unlock. Sanctions available. Proxy operations enabled." },
  { num: 2, name: "Acute Polycrisis", range: "[0.30, 0.50)", color: "#eab308", structural: "Partial mobilisation available. SLOC interdiction legal. Energy weaponisation enabled." },
  { num: 3, name: "War Transition", range: "[0.50, 0.70)", color: "#f97316", structural: "Full mobilisation. War authorisation votes. Alliance commitments activate." },
  { num: 4, name: "Overt Interstate War", range: "[0.70, 0.85)", color: "#ef4444", structural: "Full kinetic operations. ASAT employment. Strategic cyber attacks." },
  { num: 5, name: "Generalized Bloc War", range: "[0.85, 1.0]", color: "#7f1d1d", structural: "WMD threshold approaches. Total economic mobilisation. All constraints removed." },
];

const TICK_STEPS = [
  { n: 1, label: "Receive", detail: "moves[], current_state, seed, tick_number" },
  { n: 2, label: "Validate", detail: "Each move checked against current state and phase rules" },
  { n: 3, label: "Apply moves", detail: "Validated moves applied to produce intermediate state" },
  { n: 4, label: "Autonomous dynamics", detail: "Each layer's self-evolving equations evaluated" },
  { n: 5, label: "Cross-layer couplings", detail: "Coupling matrix propagates effects between layers" },
  { n: 6, label: "Clamp", detail: "All variables clamped to valid ranges" },
  { n: 7, label: "Compute Φ", detail: "Composite order parameter computed from per-layer indicators" },
  { n: 8, label: "Phase transition check", detail: "Hysteresis evaluated; transition triggered if threshold held for 3 ticks" },
  { n: 9, label: "Structural changes", detail: "If transition: move set, cost tables, and coupling weights updated" },
  { n: 10, label: "Emit events", detail: "All state changes emitted as typed events; new_state returned" },
];

const EVENT_TYPES = [
  { type: "MoveSubmitted", trigger: "Player submits a move", payload: "Move details, player ID, role" },
  { type: "MoveValidated", trigger: "Engine accepts a move", payload: "Move ID, validation result" },
  { type: "MoveRejected", trigger: "Engine rejects a move", payload: "Move ID, rejection reason" },
  { type: "MoveApplied", trigger: "Engine applies a move", payload: "Move ID, state deltas" },
  { type: "StateChange", trigger: "Autonomous dynamics or coupling", payload: "Layer, variable, old value, new value" },
  { type: "PhaseTransition", trigger: "Φ crosses threshold", payload: "Old phase, new phase, Φ value, contributions" },
  { type: "TickComplete", trigger: "Tick pipeline finishes", payload: "Tick number, duration_ms" },
  { type: "RunStarted", trigger: "Run transitions to active", payload: "Run ID, participants, scenario ID" },
  { type: "RunPaused", trigger: "Run is paused", payload: "Run ID, reason" },
  { type: "RunTerminated", trigger: "Run ends", payload: "Run ID, final phase, final state hash" },
];

// ── Sections config ──────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "world-state", label: "World State" },
  { id: "layers", label: "8 Layers" },
  { id: "couplings", label: "Couplings" },
  { id: "phases", label: "Phases" },
  { id: "tick", label: "Tick Pipeline" },
  { id: "events", label: "Events" },
  { id: "determinism", label: "Determinism" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function SimSpecPage() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  const sectionRefs: Record<string, React.RefObject<HTMLElement | null>> = {};
  for (const s of SECTIONS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sectionRefs[s.id] = useRef<HTMLElement | null>(null);
  }

  function scrollTo(id: string) {
    setActiveSection(id);
    sectionRefs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sim-spec-page">
      <title>Simulation Spec | GREYZONE</title>

      {/* ── Page header ── */}
      <div className="sim-spec-header">
        <div>
          <h1 className="sim-spec-header__title">Simulation Specification</h1>
          <p className="sim-spec-header__subtitle">
            Governing document for the Greyzone engine · Version 1.0 · Status: Governing
          </p>
        </div>
        <span className="badge badge--blue" style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}>
          v1.0
        </span>
      </div>

      {/* ── TOC chips ── */}
      <nav className="sim-spec-toc" aria-label="Table of contents">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`sim-spec-toc__chip${activeSection === s.id ? " sim-spec-toc__chip--active" : ""}`}
            onClick={() => scrollTo(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="sim-spec-body">

        {/* 1. Overview */}
        <section ref={sectionRefs["overview"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="overview">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">1</span>
            Overview
          </h2>
          <p className="sim-spec-prose">
            The Greyzone simulation models a modern distributed battlespace as a multivariate
            dynamical system. The world state is a vector of continuous and discrete variables
            organised into 8 layers that evolve through discrete ticks driven by player moves
            and autonomous dynamics. Deterministic replay is guaranteed via a seedable
            ChaCha20 PRNG and a fixed-order computation pipeline.
          </p>
          <div className="sim-spec-callout">
            The engine is implemented in Rust (2021 edition) and exposes a JSON RPC interface
            consumed by the FastAPI backend. Each tick is self-contained — given the same
            inputs and seed, the output is bit-identical.
          </div>
        </section>

        {/* 2. World State */}
        <section ref={sectionRefs["world-state"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="world-state">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">2</span>
            World State
          </h2>
          <p className="sim-spec-prose">
            The world state at tick <code>t</code> is defined as{" "}
            <code>W(t) = &#123; L₁(t), …, L₈(t), P(t), A(t), G(t) &#125;</code>
          </p>
          <table className="sim-spec-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Symbol</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Simulation Layers</td>
                <td><code>L_i(t)</code></td>
                <td>State of layer i at tick t — 8 layers total</td>
              </tr>
              <tr>
                <td>Actors</td>
                <td><code>A(t)</code></td>
                <td>Set of 2–6 nation-state / bloc actor states (id, side, resources, readiness, stability, credibility)</td>
              </tr>
              <tr>
                <td>Global Parameters</td>
                <td><code>G(t)</code></td>
                <td>Alliance matrix, trade graph, and scenario-level configuration</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. Layers */}
        <section ref={sectionRefs["layers"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="layers">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">3</span>
            The 8 Simulation Layers
          </h2>
          <p className="sim-spec-prose">
            Click any domain card to expand its state variables and autonomous dynamics.
          </p>
          <div className="sim-spec-layer-grid">
            {LAYERS.map((layer) => {
              const isOpen = expandedLayer === layer.id;
              return (
                <div key={layer.id} className="sim-spec-layer-card">
                  <button
                    className="sim-spec-layer-card__header"
                    onClick={() => setExpandedLayer(isOpen ? null : layer.id)}
                    aria-expanded={isOpen}
                  >
                    <span
                      className="sim-spec-layer-card__dot"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="sim-spec-layer-card__code" style={{ color: layer.color }}>
                      {layer.code}
                    </span>
                    <span className="sim-spec-layer-card__name">{layer.name}</span>
                    <span className="sim-spec-layer-card__chevron">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  <div className="sim-spec-layer-card__tagline">{layer.tagline}</div>

                  {isOpen && (
                    <div className="sim-spec-layer-card__body">
                      <div className="sim-spec-layer-card__section-label">State Variables</div>
                      <table className="sim-spec-table sim-spec-table--compact">
                        <thead>
                          <tr>
                            <th>Variable</th>
                            <th>Range</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {layer.variables.map((v) => (
                            <tr key={v.name}>
                              <td><code>{v.name}</code></td>
                              <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)" }}>{v.range}</td>
                              <td style={{ color: "var(--text-secondary)" }}>{v.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="sim-spec-layer-card__section-label" style={{ marginTop: "0.875rem" }}>
                        Autonomous Dynamics
                      </div>
                      <p className="sim-spec-layer-card__dynamics">{layer.dynamics}</p>
                      <div className="sim-spec-layer-card__section-label" style={{ marginTop: "0.875rem" }}>
                        Escalation Indicator φ<sub>i</sub>
                      </div>
                      <code className="sim-spec-indicator">{layer.indicator}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Cross-Layer Couplings */}
        <section ref={sectionRefs["couplings"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="couplings">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">4</span>
            Cross-Layer Couplings
          </h2>
          <p className="sim-spec-prose">
            The engine evaluates a coupling matrix each tick that propagates effects between
            layers. The full matrix is defined in engine configuration and can be adjusted
            per scenario. The 12 documented couplings are shown below.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="sim-spec-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th></th>
                  <th>Target</th>
                  <th>Formula</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {COUPLINGS.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <span className="sim-spec-coupling-badge" style={{ borderColor: c.sourceColor, color: c.sourceColor }}>
                        <span className="sim-spec-coupling-dot" style={{ backgroundColor: c.sourceColor }} />
                        {c.sourceCode}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", padding: "0 0.25rem" }}>→</td>
                    <td>
                      <span className="sim-spec-coupling-badge" style={{ borderColor: c.targetColor, color: c.targetColor }}>
                        <span className="sim-spec-coupling-dot" style={{ backgroundColor: c.targetColor }} />
                        {c.targetCode}
                      </span>
                    </td>
                    <td><code className="sim-spec-formula">{c.formula}</code></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Phase Transitions */}
        <section ref={sectionRefs["phases"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="phases">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">5</span>
            Phase Transition Model
          </h2>
          <p className="sim-spec-prose">
            The phase is determined by the composite order parameter{" "}
            <strong>Φ(t) = Σᵢ (wᵢ × φᵢ(t))</strong> — a weighted sum of per-layer
            escalation indicators. Default weights sum to 1.0:{" "}
            <code>[0.20, 0.10, 0.10, 0.10, 0.15, 0.05, 0.15, 0.15]</code>.
          </p>

          <div className="sim-spec-phase-grid">
            {PHASES.map((phase) => (
              <div
                key={phase.num}
                className="sim-spec-phase-card"
                style={{ borderTopColor: phase.color }}
              >
                <div className="sim-spec-phase-card__header">
                  <span className="sim-spec-phase-card__num" style={{ color: phase.color }}>
                    P{phase.num}
                  </span>
                  <span className="sim-spec-phase-card__range">{phase.range}</span>
                </div>
                <div className="sim-spec-phase-card__name" style={{ color: phase.color }}>
                  {phase.name}
                </div>
                <p className="sim-spec-phase-card__structural">{phase.structural}</p>
              </div>
            ))}
          </div>

          <div className="sim-spec-callout sim-spec-callout--warn">
            <strong>Irreversibility:</strong> Phase is{" "}
            <code>P(t) = max(P(t−1), phase_for(Φ(t)))</code>. A transition requires
            Φ to exceed the threshold for 3 consecutive ticks (configurable). Once a phase
            is reached it cannot be reversed, even if Φ subsequently decreases.
          </div>
        </section>

        {/* 6. Tick Pipeline */}
        <section ref={sectionRefs["tick"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="tick">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">6</span>
            Tick Pipeline
          </h2>
          <p className="sim-spec-prose">
            Each tick executes the following 10 steps in fixed order. Within a tick,
            moves are resolved in layer order (1–8) and within a layer in actor ID
            order for determinism. Simultaneous moves interact through the coupling
            matrix rather than sequential application.
          </p>
          <div className="sim-spec-pipeline">
            {TICK_STEPS.map((step, i) => (
              <div key={step.n} className="sim-spec-pipeline__step">
                <div className="sim-spec-pipeline__connector">
                  <div className="sim-spec-pipeline__node">
                    <span>{step.n}</span>
                  </div>
                  {i < TICK_STEPS.length - 1 && <div className="sim-spec-pipeline__line" />}
                </div>
                <div className="sim-spec-pipeline__content">
                  <div className="sim-spec-pipeline__label">{step.label}</div>
                  <div className="sim-spec-pipeline__detail">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="sim-spec-callout" style={{ marginTop: "1.25rem" }}>
            <strong>Stochastic elements</strong> use a <code>ChaCha20Rng</code> seeded
            with <code>tick_seed = PRNG(run_seed, tick_number)</code>. Each element
            draws in fixed order, ensuring full reproducibility.
          </div>
        </section>

        {/* 7. Events */}
        <section ref={sectionRefs["events"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="events">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">7</span>
            Event Model
          </h2>
          <p className="sim-spec-prose">
            Every state change produces one or more typed events. Events are the atomic
            unit of the audit log and the basis for deterministic replay. Each event
            carries <code>event_id</code>, <code>run_id</code>, <code>tick</code>,{" "}
            <code>sequence</code>, <code>event_type</code>, <code>layer</code>,{" "}
            <code>actor_id</code>, <code>payload</code>, and <code>timestamp</code>.
          </p>
          <table className="sim-spec-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Trigger</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {EVENT_TYPES.map((e) => (
                <tr key={e.type}>
                  <td><code>{e.type}</code></td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{e.trigger}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{e.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 8. Determinism */}
        <section ref={sectionRefs["determinism"] as React.RefObject<HTMLElement>} className="sim-spec-section" id="determinism">
          <h2 className="sim-spec-section__title">
            <span className="sim-spec-section__num">8</span>
            Determinism Contract
          </h2>
          <p className="sim-spec-prose">
            The engine guarantees bit-identical output given the four conditions below.
            This is verified by CI tests that run the same scenario twice and compare
            SHA-256 hashes of the output state and event sequence.
          </p>
          <div className="sim-spec-determinism-grid">
            {[
              { icon: "≡", label: "Same initial state", detail: "Byte-identical scenario configuration JSON" },
              { icon: "⇒", label: "Same moves", detail: "Identical move sets submitted at each tick" },
              { icon: "⊕", label: "Same seed", detail: "Identical run seed passed to ChaCha20Rng" },
              { icon: "⚙", label: "Same engine version", detail: "Identical compiled Rust binary" },
            ].map((c) => (
              <div key={c.label} className="sim-spec-det-card">
                <div className="sim-spec-det-card__icon">{c.icon}</div>
                <div className="sim-spec-det-card__label">{c.label}</div>
                <div className="sim-spec-det-card__detail">{c.detail}</div>
              </div>
            ))}
          </div>
          <div className="sim-spec-callout" style={{ marginTop: "1.25rem" }}>
            Scenario files are validated on load: required fields, variable ranges,
            alliance matrix symmetry, phase threshold monotonicity, and weight sum
            = 1.0 (within floating-point tolerance).
          </div>
        </section>

      </div>
    </div>
  );
}
