import { useState, useRef } from "react";

interface Phase {
  num: number;
  name: string;
  min: number;
  max: number | null;
  color: string;
  description: string;
  unlocks: string[];
}

const PHASES: Phase[] = [
  {
    num: 0,
    name: "Competitive Normality",
    min: 0,
    max: 0.15,
    color: "#22c55e",
    description: "Full diplomatic channels active. Military options highly constrained. Normal trade and economic relations continue.",
    unlocks: [
      "Diplomatic negotiations",
      "Trade agreements",
      "Intelligence gathering",
      "Limited cyber reconnaissance",
    ],
  },
  {
    num: 1,
    name: "Hybrid Coercion",
    min: 0.15,
    max: 0.30,
    color: "#84cc16",
    description: "Covert pressure mounts. Economic tools and proxy actors become viable. Alliance solidarity tested.",
    unlocks: [
      "Economic sanctions",
      "Proxy force support",
      "Offensive cyber operations",
      "Information campaigns",
      "Covert military exercises",
    ],
  },
  {
    num: 2,
    name: "Acute Polycrisis",
    min: 0.30,
    max: 0.50,
    color: "#eab308",
    description: "Multiple crises converge. Partial mobilization begins. Energy and maritime domains become active battlefields.",
    unlocks: [
      "Partial mobilization",
      "SLOC interdiction",
      "Energy supply manipulation",
      "Hybrid proxy warfare",
      "Strategic cyber attacks",
    ],
  },
  {
    num: 3,
    name: "War Transition",
    min: 0.50,
    max: 0.70,
    color: "#f97316",
    description: "Open conflict is imminent. Parliaments vote on war authorization. Alliance commitments are called. Full mobilization ordered.",
    unlocks: [
      "Full mobilization",
      "War authorization votes",
      "Alliance commitment activation",
      "Open kinetic engagement",
    ],
  },
  {
    num: 4,
    name: "Overt Interstate War",
    min: 0.70,
    max: 0.85,
    color: "#ef4444",
    description: "Unrestricted conventional warfare. Space and strategic infrastructure under attack. Nuclear signaling begins.",
    unlocks: [
      "Unrestricted kinetic operations",
      "ASAT employment",
      "Strategic infrastructure attacks",
      "Nuclear signaling",
    ],
  },
  {
    num: 5,
    name: "Generalized Bloc War",
    min: 0.85,
    max: null,
    color: "#7f1d1d",
    description: "Total war. WMD employment threshold crossed. All civilian and military constraints removed.",
    unlocks: [
      "All constraints removed",
      "WMD employment threshold",
      "Total war economy",
    ],
  },
];

function getPhase(psi: number): Phase {
  return (
    PHASES.find((p) => psi >= p.min && (p.max === null || psi < p.max)) ??
    PHASES[PHASES.length - 1]
  );
}

export default function EscalationStep() {
  const [psi, setPsi] = useState(0.22);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const prevPhase = useRef(getPhase(0.22));
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePsiChange(val: number) {
    const newPhase = getPhase(val);
    if (newPhase.num !== prevPhase.current.num) {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setFlashMsg(`⚡ Phase Transition → Phase ${newPhase.num}: ${newPhase.name}`);
      flashTimer.current = setTimeout(() => setFlashMsg(null), 2500);
      prevPhase.current = newPhase;
    }
    setPsi(val);
  }

  const currentPhase = getPhase(psi);

  return (
    <div className="tutorial-step">
      <div className="tutorial-step__header">
        <h2 className="tutorial-step__title">Escalation: The Ψ System</h2>
        <p className="tutorial-step__subtitle">
          The composite Order Parameter that governs the rules of engagement
        </p>
      </div>

      <p className="tutorial-intro">
        Every action you take affects the composite Order Parameter <strong>Ψ (psi)</strong>. When Ψ
        crosses a threshold, the world permanently escalates to a new phase, unlocking new actions
        and changing the rules of engagement. Drag the slider below to explore how the phase ladder
        works.
      </p>

      <div className="tutorial-phase-ladder">
        {PHASES.map((phase) => {
          const isActive = currentPhase.num === phase.num;
          return (
            <div
              key={phase.num}
              className={`tutorial-phase-rung${isActive ? " tutorial-phase-rung--active" : ""}`}
              style={{ borderLeftColor: phase.color, opacity: isActive ? 1 : 0.6 }}
            >
              <div className="tutorial-phase-rung__num">P{phase.num}</div>
              <div style={{ flex: 1 }}>
                <div className="tutorial-phase-rung__name" style={{ color: isActive ? phase.color : "var(--text-primary)" }}>
                  {phase.name}
                </div>
                {isActive && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.4 }}>
                    {phase.description}
                  </div>
                )}
                <div className="tutorial-phase-rung__unlocks">
                  {isActive ? (
                    <ul style={{ margin: "4px 0 0", paddingLeft: "1rem" }}>
                      {phase.unlocks.map((u) => (
                        <li key={u} style={{ marginBottom: 2 }}>{u}</li>
                      ))}
                    </ul>
                  ) : (
                    phase.unlocks.slice(0, 2).join(" · ") + (phase.unlocks.length > 2 ? " ···" : "")
                  )}
                </div>
              </div>
              <div className="tutorial-phase-rung__range">
                {phase.max !== null
                  ? `${phase.min.toFixed(2)} – ${phase.max.toFixed(2)}`
                  : `≥ ${phase.min.toFixed(2)}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="tutorial-psi-slider-wrap">
        <div className="tutorial-psi-slider-label">
          <span>Ψ = 0.0 (Peace)</span>
          <span>Ψ = 1.0 (Total War)</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={psi}
          onChange={(e) => handlePsiChange(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: currentPhase.color }}
        />
        <div className="tutorial-psi-current" style={{ color: currentPhase.color }}>
          Ψ = {psi.toFixed(2)} — Phase {currentPhase.num}: {currentPhase.name}
        </div>
        {flashMsg && (
          <div
            className="tutorial-phase-flash"
            style={{ background: `${currentPhase.color}22`, color: currentPhase.color, border: `1px solid ${currentPhase.color}55` }}
          >
            {flashMsg}
          </div>
        )}
      </div>

      <div className="tutorial-warning-note">
        ⚠ <strong>Phase transitions are irreversible.</strong> Ψ must exceed the threshold for 3
        consecutive turns to trigger a transition — but once triggered, it cannot be undone.
        De-escalation is possible within a phase, but crossing back below a threshold is not.
      </div>
    </div>
  );
}
