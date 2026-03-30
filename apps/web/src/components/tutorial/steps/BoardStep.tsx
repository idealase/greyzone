import { useState } from "react";

interface Hotspot {
  id: number;
  title: string;
  explanation: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 1,
    title: "Phase Indicator",
    explanation:
      "Shows the current escalation phase and Ψ value. Pulses when near a transition threshold. The color changes with each phase — green means stable, red means war.",
  },
  {
    id: 2,
    title: "Metrics Overview",
    explanation:
      "Key game-state metrics at a glance. Watch Order Parameter closely — when it approaches 0.50 you are heading toward War Transition. Dominant Domain shows where the conflict is most active.",
  },
  {
    id: 3,
    title: "Domain Panels",
    explanation:
      "Each of the 8 domains shows its Stress level (how strained it currently is) and Resilience (remaining capacity to absorb further shocks). A domain at 100% stress is on the verge of collapse.",
  },
  {
    id: 4,
    title: "Event Feed",
    explanation:
      "Chronological log of all events: your submitted actions, AI opponent moves, stochastic random events, and cross-domain coupling effects. Color-coded: blue = action, yellow = stochastic, purple = coupling, red = phase transition.",
  },
  {
    id: 5,
    title: "Action Panel",
    explanation:
      "Your available legal actions appear in the right panel. Grayed-out actions are unavailable in the current phase or because you lack sufficient resources. Red-bordered actions carry escalation risk.",
  },
];

const MOCK_EVENTS = [
  { turn: "T7", text: "Blue submitted: Cyber Operation (Intensity 0.62) against Red infrastructure", type: "action" },
  { turn: "T7", text: "Coupling: Cyber → Energy — Red grid stability -9% (infrastructure integrity breach)", type: "coupling" },
  { turn: "T6", text: "Stochastic event: Baltic storm disrupts SLOC throughput -12% for 2 turns", type: "stochastic" },
  { turn: "T6", text: "Red submitted: Energy Weaponization (Intensity 0.55) — Blue gas reserves -14%", type: "action" },
  { turn: "T5", text: "Phase remains stable — Ψ = 0.22, threshold at 0.30 (Δ = 0.08)", type: "stochastic" },
];

export default function BoardStep() {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  const activeCallout = HOTSPOTS.find((h) => h.id === activeHotspot);

  function toggle(id: number) {
    setActiveHotspot((prev) => (prev === id ? null : id));
  }

  return (
    <div className="tutorial-step">
      <div className="tutorial-step__header">
        <h2 className="tutorial-step__title">Reading the Board</h2>
        <p className="tutorial-step__subtitle">
          The simulation dashboard gives you a real-time view of the world state
        </p>
      </div>

      <p className="tutorial-intro">
        Click the numbered callout bubbles <span style={{ background: "var(--accent-yellow)", color: "#000", borderRadius: "50%", padding: "0 5px", fontSize: "0.78rem", fontWeight: 700 }}>①</span>{" "}
        to learn what each part of the board does.
      </p>

      <div className="tutorial-board-layout">
        {/* Phase Indicator */}
        <div
          className={`tutorial-board-section${activeHotspot === 1 ? " tutorial-board-section--highlighted" : ""}`}
          onClick={() => toggle(1)}
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="tutorial-hotspot" onClick={(e) => { e.stopPropagation(); toggle(1); }}>1</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Phase Indicator
          </div>
          <div className="tutorial-mock-phase">
            <span className="tutorial-mock-phase__dot" style={{ backgroundColor: "#84cc16" }} />
            <span className="tutorial-mock-phase__name" style={{ color: "#84cc16" }}>
              Phase 1 – Hybrid Coercion
            </span>
            <span className="tutorial-mock-phase__psi">Ψ = 0.22</span>
            <span style={{ marginLeft: "0.75rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Next threshold: 0.30
            </span>
          </div>
        </div>

        {/* Metrics Overview */}
        <div
          className={`tutorial-board-section${activeHotspot === 2 ? " tutorial-board-section--highlighted" : ""}`}
          onClick={() => toggle(2)}
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="tutorial-hotspot" onClick={(e) => { e.stopPropagation(); toggle(2); }}>2</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Metrics Overview
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.5rem" }}>
            {[
              { value: "7", label: "Turn" },
              { value: "Phase 1", label: "Phase" },
              { value: "0.22", label: "Order Param Ψ" },
              { value: "34", label: "Events" },
              { value: "Cyber", label: "Dominant Domain" },
              { value: "71%", label: "Avg Resilience" },
            ].map((m) => (
              <div key={m.label} className="tutorial-mock-metric">
                <div className="tutorial-mock-metric__value">{m.value}</div>
                <div className="tutorial-mock-metric__label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Panels */}
        <div
          className={`tutorial-board-section${activeHotspot === 3 ? " tutorial-board-section--highlighted" : ""}`}
          onClick={() => toggle(3)}
        >
          <div className="tutorial-hotspot" onClick={(e) => { e.stopPropagation(); toggle(3); }}>3</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            Domain Panels
          </div>
          {[
            { name: "Kinetic", pct: 34, color: "#ef4444" },
            { name: "Cyber", pct: 61, color: "#8b5cf6" },
            { name: "Energy", pct: 47, color: "#f59e0b" },
            { name: "Domestic", pct: 28, color: "#78716c" },
          ].map((d) => {
            const level =
              d.pct < 30 ? "low" : d.pct < 50 ? "medium" : d.pct < 70 ? "high" : "critical";
            return (
              <div key={d.name} className="tutorial-mock-domain-row">
                <span className="tutorial-mock-domain-row__name">{d.name}</span>
                <div className="tutorial-mock-stress-bar">
                  <div
                    className={`tutorial-mock-stress-fill tutorial-mock-stress-fill--${level}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="tutorial-mock-stress-pct">{d.pct}%</span>
              </div>
            );
          })}
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Stress bars — green {"<"} 30% · yellow 30–50% · orange 50–70% · red 70%+
          </div>
        </div>

        {/* Event Feed */}
        <div
          className={`tutorial-board-section${activeHotspot === 4 ? " tutorial-board-section--highlighted" : ""}`}
          onClick={() => toggle(4)}
        >
          <div className="tutorial-hotspot" onClick={(e) => { e.stopPropagation(); toggle(4); }}>4</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            Event Feed
          </div>
          {MOCK_EVENTS.map((ev, i) => (
            <div key={i} className={`tutorial-mock-event tutorial-mock-event--${ev.type}`}>
              <span className="tutorial-mock-event__turn">{ev.turn}</span>
              <span className="tutorial-mock-event__text">{ev.text}</span>
            </div>
          ))}
        </div>

        {/* Action Panel hotspot */}
        <div
          className={`tutorial-board-section${activeHotspot === 5 ? " tutorial-board-section--highlighted" : ""}`}
          onClick={() => toggle(5)}
          style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "1rem" }}
        >
          <div className="tutorial-hotspot" onClick={(e) => { e.stopPropagation(); toggle(5); }}>5</div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
              Action Panel (right panel in game)
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["Cyber Operation ✓", "Force Posture ✓", "Economic Sanctions ✓", "Information Campaign ✓", "SLOC Interdiction ✗", "Full Mobilization ✗"].map((a) => (
                <span
                  key={a}
                  style={{
                    background: a.endsWith("✓") ? "var(--bg-tertiary)" : "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    color: a.endsWith("✓") ? "var(--text-secondary)" : "var(--text-muted)",
                    opacity: a.endsWith("✗") ? 0.5 : 1,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeCallout && (
        <div className="tutorial-callout-box">
          <div className="tutorial-callout-box__title">
            {activeCallout.id}. {activeCallout.title}
          </div>
          {activeCallout.explanation}
        </div>
      )}
    </div>
  );
}
