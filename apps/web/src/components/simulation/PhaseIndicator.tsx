import {
  Phase,
  PHASE_LABELS,
  PHASE_COLORS,
  PHASE_ORDER,
  PHASE_THRESHOLDS,
} from "../../types/phase";
import { formatOrderParameter } from "../../utils/formatters";
import { PHASE_DESCRIPTIONS } from "../../data/glossary";
import InfoTooltip from "../common/InfoTooltip";

interface PhaseIndicatorProps {
  phase: Phase;
  orderParameter: number;
}

export default function PhaseIndicator({
  phase,
  orderParameter,
}: PhaseIndicatorProps) {
  const color = PHASE_COLORS[phase];
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const currentThreshold = PHASE_THRESHOLDS[phase];
  const isNearTransition =
    currentThreshold !== undefined && orderParameter >= currentThreshold - 0.05;
  const phaseLadder = PHASE_ORDER.map((p) => {
    const threshold = PHASE_THRESHOLDS[p];
    const next = PHASE_ORDER[PHASE_ORDER.indexOf(p) + 1];
    return threshold !== undefined && next
      ? `${PHASE_LABELS[p]} → ${PHASE_LABELS[next]} at Ψ ≥ ${threshold.toFixed(2)}`
      : `${PHASE_LABELS[p]} (final phase)`;
  });

  return (
    <div className="phase-indicator" style={{ borderColor: color }}>
      <div
        className={`phase-indicator__dot${
          isNearTransition ? " phase-indicator__dot--pulse" : ""
        }`}
        style={{ backgroundColor: color }}
      />
      <div>
        <div className="phase-indicator__name" style={{ color }}>
          <span className="phase-indicator__label">
            {PHASE_LABELS[phase]}
            <InfoTooltip
              label="Phase thresholds"
              content={
                <div>
                  {PHASE_DESCRIPTIONS[phase] && (
                    <div style={{ marginBottom: "0.4rem" }}>
                      <div>{PHASE_DESCRIPTIONS[phase].description}</div>
                      <div style={{ marginTop: "0.2rem", color: "#22c55e" }}>🔓 {PHASE_DESCRIPTIONS[phase].unlocks}</div>
                    </div>
                  )}
                  <strong>Phase ladder</strong>
                  <div style={{ marginTop: "0.35rem" }}>
                    {phaseLadder.map((line) => (
                      <div key={line} style={{ marginBottom: "0.2rem" }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </span>
        </div>
        <div className="phase-indicator__psi">
          {formatOrderParameter(orderParameter)}
          {isNearTransition && phaseIndex < PHASE_ORDER.length - 1 && (
            <span style={{ color: "#ef4444", marginLeft: "0.5rem" }}>
              -- TRANSITION WARNING
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
