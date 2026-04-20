import { Phase } from "../../types/phase";
import { formatPhase } from "../../utils/formatters";

interface ObjectivesPanelProps {
  side: "blue" | "red";
  orderParameter: number;
  currentTurn: number;
  currentPhase: Phase;
}

export default function ObjectivesPanel({
  side,
  orderParameter,
  currentTurn,
  currentPhase,
}: ObjectivesPanelProps) {
  const isBlue = side === "blue";

  // Blue: wants Ψ BELOW 0.50 — green when low
  // Red: wants Ψ ABOVE 0.70 — red when high
  const blueThreshold = 0.50;
  const redThreshold = 0.70;

  // Scale the bar across the 0–0.85 range (covers all phases)
  const psiPct = Math.min(orderParameter / 0.85, 1);

  const blueDanger = orderParameter >= 0.40;
  const redSuccess = orderParameter >= redThreshold;

  const barColor =
    orderParameter < 0.30 ? "#22c55e"
    : orderParameter < 0.50 ? "#eab308"
    : orderParameter < 0.70 ? "#f97316"
    : "#ef4444";

  return (
    <div className="objectives-panel card">
      <div className="objectives-panel__title">
        {isBlue ? "🔵 BLUFOR Objective" : "🔴 OPFOR Objective"}
      </div>

      <div className="objectives-panel__goal">
        {isBlue
          ? "Hold Ψ below 0.50 — keep the peace"
          : "Drive Ψ to 0.70+ — escalate to war"}
      </div>

      {/* Psi progress bar */}
      <div className="objectives-panel__psi-bar-wrap">
        <div className="objectives-panel__psi-labels">
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Ψ = {orderParameter.toFixed(3)}
          </span>
          <span style={{ fontSize: "0.7rem", color: isBlue ? "#22c55e" : "#ef4444" }}>
            {isBlue ? `Target: < ${blueThreshold}` : `Target: ≥ ${redThreshold}`}
          </span>
        </div>
        <div className="objectives-panel__psi-track">
          {/* Filled bar showing current Ψ */}
          <div
            className="objectives-panel__psi-fill"
            style={{ width: `${psiPct * 100}%`, backgroundColor: barColor }}
          />
          {/* Blue threshold line at 0.50 */}
          <div
            className="objectives-panel__threshold-line objectives-panel__threshold-line--blue"
            style={{ left: `${(blueThreshold / 0.85) * 100}%` }}
            title="Blue warning threshold (0.50)"
          />
          {/* Red target line at 0.70 */}
          <div
            className="objectives-panel__threshold-line objectives-panel__threshold-line--red"
            style={{ left: `${(redThreshold / 0.85) * 100}%` }}
            title="Red target threshold (0.70)"
          />
        </div>
        <div className="objectives-panel__phase-labels">
          <span>P0</span>
          <span>P1</span>
          <span>P2</span>
          <span>P3</span>
          <span>P4</span>
          <span>P5</span>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={`objectives-panel__status${
          isBlue
            ? blueDanger
              ? " objectives-panel__status--danger"
              : " objectives-panel__status--good"
            : redSuccess
            ? " objectives-panel__status--good"
            : " objectives-panel__status--danger"
        }`}
      >
        {isBlue
          ? blueDanger
            ? "⚠ Escalation risk — de-escalate urgently"
            : "✓ Holding — maintain pressure resistance"
          : redSuccess
          ? "✓ War threshold reached — maintain pressure"
          : "↑ Escalating — keep applying pressure"}
      </div>

      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
        Turn {currentTurn} | Phase: {formatPhase(currentPhase)}
      </div>
    </div>
  );
}
