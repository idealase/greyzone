import { useState } from "react";

type Side = "blue" | "red";

interface ActionOption {
  id: string;
  label: string;
  domain: string;
  domainColor: string;
  description: string;
  costs: Array<{ label: string; base: number; unit: string }>;
  effects: Array<{ label: string; delta: number; unit: string }>;
}

const BLUE_ACTIONS: ActionOption[] = [
  {
    id: "force_posture",
    label: "Increase Force Posture",
    domain: "Kinetic",
    domainColor: "#ef4444",
    description:
      "Raise NATO forward-deployed force posture in the Baltic region. Increases deterrence pressure and readiness but risks misperception and escalation.",
    costs: [
      { label: "Political Capital", base: 10, unit: "PC" },
      { label: "Military Readiness", base: 8, unit: "MR" },
    ],
    effects: [
      { label: "Force posture", delta: 0.25, unit: "%" },
      { label: "Escalation index", delta: 0.08, unit: "Ψ" },
      { label: "Red threat perception", delta: 0.12, unit: "%" },
    ],
  },
  {
    id: "cyber_op",
    label: "Launch Cyber Operation",
    domain: "Cyber",
    domainColor: "#8b5cf6",
    description:
      "Deploy offensive cyber capabilities against adversary infrastructure. Targets selected systems for disruption or intelligence extraction.",
    costs: [
      { label: "Cyber Capacity", base: 15, unit: "CC" },
      { label: "Political Capital", base: 5, unit: "PC" },
    ],
    effects: [
      { label: "Adversary vulnerability", delta: 0.18, unit: "%" },
      { label: "Information advantage", delta: 0.1, unit: "%" },
      { label: "Escalation index", delta: 0.04, unit: "Ψ" },
    ],
  },
  {
    id: "sanctions",
    label: "Impose Economic Sanctions",
    domain: "Geoeconomic & Industrial",
    domainColor: "#10b981",
    description:
      "Coordinate NATO-wide sanctions targeting critical Russian economic sectors. Requires allied consensus to implement effectively.",
    costs: [
      { label: "Political Capital", base: 18, unit: "PC" },
      { label: "Alliance Cohesion", base: 6, unit: "AC" },
    ],
    effects: [
      { label: "Red trade flow", delta: -0.15, unit: "%" },
      { label: "Red fiscal reserves", delta: -0.07, unit: "%" },
      { label: "Blue industrial output", delta: -0.04, unit: "%" },
    ],
  },
  {
    id: "info_campaign",
    label: "Conduct Information Campaign",
    domain: "Information & Cognitive",
    domainColor: "#ec4899",
    description:
      "Launch coordinated strategic communications and counter-disinformation operations to shape domestic and international narratives.",
    costs: [
      { label: "Political Capital", base: 8, unit: "PC" },
      { label: "Fiscal Reserves", base: 4, unit: "FR" },
    ],
    effects: [
      { label: "Narrative control", delta: 0.14, unit: "%" },
      { label: "Alliance cohesion", delta: 0.06, unit: "%" },
      { label: "Adversary disinformation", delta: -0.09, unit: "%" },
    ],
  },
  {
    id: "naval_mobilize",
    label: "Mobilize Naval Forces",
    domain: "Maritime & Logistics",
    domainColor: "#3b82f6",
    description:
      "Deploy additional naval assets to the Baltic Sea to protect SLOCs and project maritime power.",
    costs: [
      { label: "Military Readiness", base: 12, unit: "MR" },
      { label: "Fiscal Reserves", base: 10, unit: "FR" },
    ],
    effects: [
      { label: "SLOC throughput protection", delta: 0.2, unit: "%" },
      { label: "Naval presence", delta: 0.25, unit: "%" },
      { label: "Escalation index", delta: 0.05, unit: "Ψ" },
    ],
  },
];

const RED_ACTIONS: ActionOption[] = [
  {
    id: "proxy_support",
    label: "Escalate Proxy Operations",
    domain: "Kinetic",
    domainColor: "#ef4444",
    description:
      "Expand support for proxy forces in contested regions. Deniable but effective at raising pressure and casualties.",
    costs: [
      { label: "Political Capital", base: 8, unit: "PC" },
      { label: "Military Readiness", base: 6, unit: "MR" },
    ],
    effects: [
      { label: "Adversary attrition rate", delta: 0.1, unit: "%" },
      { label: "Escalation index", delta: 0.06, unit: "Ψ" },
      { label: "Blue political will", delta: -0.08, unit: "%" },
    ],
  },
  {
    id: "energy_weapon",
    label: "Weaponize Energy Supply",
    domain: "Energy",
    domainColor: "#f59e0b",
    description:
      "Restrict energy exports to coerce European states. Triggers cascading economic and political effects.",
    costs: [
      { label: "Fiscal Reserves", base: 15, unit: "FR" },
      { label: "Political Capital", base: 10, unit: "PC" },
    ],
    effects: [
      { label: "Blue energy reserves", delta: -0.18, unit: "%" },
      { label: "Blue industrial output", delta: -0.1, unit: "%" },
      { label: "Red fiscal revenues", delta: -0.08, unit: "%" },
    ],
  },
  {
    id: "disinfo",
    label: "Deploy Disinformation Campaign",
    domain: "Information & Cognitive",
    domainColor: "#ec4899",
    description:
      "Launch coordinated disinformation operations targeting NATO public opinion and alliance solidarity.",
    costs: [
      { label: "Political Capital", base: 6, unit: "PC" },
      { label: "Cyber Capacity", base: 8, unit: "CC" },
    ],
    effects: [
      { label: "Blue public opinion", delta: -0.12, unit: "%" },
      { label: "Blue alliance cohesion", delta: -0.07, unit: "%" },
      { label: "Narrative advantage", delta: 0.1, unit: "%" },
    ],
  },
  {
    id: "cyber_energy",
    label: "Cyber Attack on Infrastructure",
    domain: "Cyber",
    domainColor: "#8b5cf6",
    description:
      "Target adversary energy and industrial infrastructure through cyber means. High impact, plausibly deniable.",
    costs: [
      { label: "Cyber Capacity", base: 20, unit: "CC" },
      { label: "Political Capital", base: 6, unit: "PC" },
    ],
    effects: [
      { label: "Blue energy grid stability", delta: -0.15, unit: "%" },
      { label: "Blue industrial output", delta: -0.08, unit: "%" },
      { label: "Escalation index", delta: 0.07, unit: "Ψ" },
    ],
  },
  {
    id: "mobilize",
    label: "Announce Partial Mobilization",
    domain: "Kinetic",
    domainColor: "#ef4444",
    description:
      "Begin partial reserve mobilization. Signals resolve but drives escalation and domestic political costs.",
    costs: [
      { label: "Political Will", base: 20, unit: "PW" },
      { label: "Fiscal Reserves", base: 18, unit: "FR" },
    ],
    effects: [
      { label: "Force posture", delta: 0.3, unit: "%" },
      { label: "Escalation index", delta: 0.15, unit: "Ψ" },
      { label: "Red domestic approval", delta: -0.1, unit: "%" },
    ],
  },
];

export default function ActionsStep() {
  const [side, setSide] = useState<Side>("blue");
  const [selectedActionId, setSelectedActionId] = useState<string>("force_posture");
  const [intensity, setIntensity] = useState(0.5);
  const [submitted, setSubmitted] = useState(false);

  const actions = side === "blue" ? BLUE_ACTIONS : RED_ACTIONS;
  const action = actions.find((a) => a.id === selectedActionId) ?? actions[0];

  function handleSideChange(newSide: Side) {
    setSide(newSide);
    setSelectedActionId((side === "blue" ? RED_ACTIONS : BLUE_ACTIONS)[0].id);
    setSubmitted(false);
  }

  function handleActionChange(id: string) {
    setSelectedActionId(id);
    setSubmitted(false);
  }

  function handleExecute() {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const scale = 0.3 + intensity * 1.4;

  return (
    <div className="tutorial-step">
      <div className="tutorial-step__header">
        <h2 className="tutorial-step__title">Taking Actions</h2>
        <p className="tutorial-step__subtitle">
          Actions are gated by role, phase, and resource availability
        </p>
      </div>

      <p className="tutorial-intro">
        Each turn, you choose from your available legal actions. Actions are gated by your role and
        the current phase. Each action has a cost, an intensity you can tune, and probabilistic
        effects that ripple across domains.
      </p>

      <div className="tutorial-turn-timer">
        <span>Turn 3 of 50</span>
        <span style={{ color: "var(--border)" }}>|</span>
        <span className="tutorial-turn-timer__warn">⏱ 45s remaining</span>
      </div>

      <div className="tutorial-side-toggle">
        <button
          className={`tutorial-side-btn tutorial-side-btn--blue${side === "blue" ? " active" : ""}`}
          onClick={() => handleSideChange("blue")}
        >
          🔵 Blue Commander
        </button>
        <button
          className={`tutorial-side-btn tutorial-side-btn--red${side === "red" ? " active" : ""}`}
          onClick={() => handleSideChange("red")}
        >
          🔴 Red Commander
        </button>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1", minWidth: "180px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Select Action
          </div>
          <select
            className="form-select"
            value={action.id}
            onChange={(e) => handleActionChange(e.target.value)}
            style={{ width: "100%", background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.5rem 0.625rem", fontSize: "0.85rem" }}
          >
            {actions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="tutorial-mock-action" style={{ flex: "2", minWidth: "280px" }}>
          <div className="tutorial-mock-action__header">
            <span
              className="tutorial-domain-card__dot"
              style={{ backgroundColor: action.domainColor, width: 10, height: 10 }}
            />
            <div>
              <div className="tutorial-mock-action__type">{action.label}</div>
              <div className="tutorial-mock-action__domain">{action.domain}</div>
            </div>
          </div>

          <div className="tutorial-mock-action__description">{action.description}</div>

          <div className="tutorial-mock-action__cost">
            {action.costs.map((c) => (
              <span key={c.label} className="tutorial-mock-action__cost-item">
                {c.label}: {Math.round(c.base * scale)} {c.unit}
              </span>
            ))}
          </div>

          <div className="tutorial-mock-action__slider-wrap">
            <div className="tutorial-mock-action__slider-label">
              <span>Intensity</span>
              <span style={{ color: intensity > 0.7 ? "var(--accent-red)" : "var(--text-primary)" }}>
                {(intensity * 100).toFixed(0)}%
                {intensity > 0.7 && " ⚠"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: side === "blue" ? "var(--accent-blue)" : "var(--accent-red)" }}
            />
          </div>

          <div className="tutorial-mock-action__effects">
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Expected effects at {(intensity * 100).toFixed(0)}% intensity:
            </div>
            {action.effects.map((ef) => {
              const val = ef.delta * scale;
              const isPositive = val > 0;
              return (
                <div
                  key={ef.label}
                  className={`tutorial-mock-action__effect-item ${isPositive ? "positive" : "negative"}`}
                >
                  {isPositive ? "▲" : "▼"} {ef.label}:{" "}
                  {isPositive ? "+" : ""}
                  {(val * 100).toFixed(1)}
                  {ef.unit === "Ψ" ? " Ψ" : "%"}
                </div>
              );
            })}
          </div>

          <button
            className={`tutorial-execute-btn tutorial-execute-btn--${side}`}
            onClick={handleExecute}
          >
            Execute Action ▶
          </button>

          {submitted && (
            <div className="tutorial-action-success">
              ✓ Action submitted for Turn 3
            </div>
          )}
        </div>
      </div>

      <div className="tutorial-callout">
        💡 <strong>Intensity above 0.7</strong> triggers escalation penalties — effects are amplified
        but so is the Ψ increase.
      </div>
      <div className="tutorial-callout" style={{ marginTop: "0.5rem" }}>
        💡 <strong>Cost is deducted immediately</strong> when submitted. Choose your intensity
        carefully — you cannot recall an action once committed.
      </div>
    </div>
  );
}
