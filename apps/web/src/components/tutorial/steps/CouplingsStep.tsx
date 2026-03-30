import { useState, useRef } from "react";

interface ChainStep {
  domain: string;
  color: string;
  effect: string;
  note: string;
}

const CHAIN_STEPS: ChainStep[] = [
  { domain: "Cyber", color: "#8b5cf6", effect: "Attack executed — Energy grid targeted", note: "initial action" },
  { domain: "→ Energy", color: "#f59e0b", effect: "Infrastructure integrity -15%", note: "grid disruption" },
  { domain: "→ Geoeconomic", color: "#10b981", effect: "Industrial output -8%", note: "factories stalled" },
  { domain: "→ Domestic Fiscal", color: "#78716c", effect: "Reserves -3%", note: "emergency compensation" },
  { domain: "→ Domestic Political", color: "#78716c", effect: "Political will -5%", note: "public unrest" },
];

const COUPLINGS = [
  { from: "Kinetic", to: "Maritime", effect: "Conflict disrupts shipping lanes and port operations" },
  { from: "Kinetic", to: "Information", effect: "Casualties erode public support and military morale" },
  { from: "Maritime", to: "Energy", effect: "Blocked SLOCs cut energy imports and LNG deliveries" },
  { from: "Energy", to: "Geoeconomic", effect: "Energy shortages reduce industrial output" },
  { from: "Cyber", to: "Energy", effect: "Cyber attacks damage grid infrastructure" },
  { from: "Cyber", to: "Space", effect: "Cyber ops can blind satellite command systems" },
  { from: "Space", to: "Kinetic", effect: "Degraded GPS reduces precision-weapon effectiveness" },
  { from: "Information", to: "Domestic", effect: "Narrative success bolsters political will" },
  { from: "Geoeconomic", to: "Domestic", effect: "Economic pain destabilizes government and fiscal reserves" },
];

export default function CouplingsStep() {
  const [visibleSteps, setVisibleSteps] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function handleTrigger() {
    if (running) return;
    clearTimers();
    setVisibleSteps(-1);
    setRunning(true);
    CHAIN_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleSteps(i);
        if (i === CHAIN_STEPS.length - 1) setRunning(false);
      }, (i + 1) * 650);
      timersRef.current.push(t);
    });
  }

  function handleReset() {
    clearTimers();
    setVisibleSteps(-1);
    setRunning(false);
  }

  return (
    <div className="tutorial-step">
      <div className="tutorial-step__header">
        <h2 className="tutorial-step__title">The Butterfly Effect: Cross-Domain Couplings</h2>
        <p className="tutorial-step__subtitle">
          No domain exists in isolation — every action triggers ripple effects
        </p>
      </div>

      <p className="tutorial-intro">
        No domain exists in isolation. Every significant action triggers ripple effects across
        connected domains. This is what makes Greyzone complex — you must think several moves ahead.
        Click the button below to watch a coupling chain unfold in real time.
      </p>

      <div className="tutorial-coupling-chain">
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div
            className={`tutorial-chain-trigger${running ? " tutorial-chain-trigger--active" : ""}`}
            onClick={handleTrigger}
            style={{ flex: 1 }}
          >
            ⚡ Launch Cyber Attack on Energy Grid
          </div>
          {visibleSteps >= 0 && (
            <button
              onClick={handleReset}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              ↺ Reset
            </button>
          )}
        </div>

        {CHAIN_STEPS.map((step, i) => (
          <div
            key={i}
            className={`tutorial-chain-step${i <= visibleSteps ? " tutorial-chain-step--visible" : ""}`}
            style={{
              borderLeft: `3px solid ${step.color}`,
              background: i === 0 && i <= visibleSteps ? `${step.color}15` : undefined,
            }}
          >
            <span className="tutorial-chain-step__domain" style={{ color: step.color }}>
              {step.domain}
            </span>
            <span className="tutorial-chain-step__effect">{step.effect}</span>
            <span className="tutorial-chain-step__note">{step.note}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
          Cross-Domain Coupling Reference
        </div>
        <table className="tutorial-coupling-table">
          <thead>
            <tr>
              <th>From Domain</th>
              <th className="arrow-cell">→</th>
              <th>To Domain</th>
              <th>Effect</th>
            </tr>
          </thead>
          <tbody>
            {COUPLINGS.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.from}</td>
                <td className="arrow-cell">→</td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.to}</td>
                <td>{c.effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tutorial-insight">
        💡 <strong>Red's advantage:</strong> Cyber and Energy weaponization create cascading effects
        across Geoeconomic and Domestic domains — asymmetric tools that operate below the kinetic
        threshold.
        <br />
        <br />
        💡 <strong>Blue's advantage:</strong> Maritime and Space dominance can sever Red's supply
        chains and degrade the precision of their military operations — but require sustained resource
        investment.
      </div>
    </div>
  );
}
