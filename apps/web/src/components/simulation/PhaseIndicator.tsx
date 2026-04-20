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

interface PhaseTransition {
  turn: number;
  phase: Phase;
}

interface PhaseIndicatorProps {
  phase: Phase;
  orderParameter: number;
  phaseHistory?: PhaseTransition[];
}

// Phase Ψ range boundaries (start of each phase)
const PHASE_STARTS: Record<Phase, number> = {
  [Phase.CompetitiveNormality]: 0,
  [Phase.HybridCoercion]: 0.15,
  [Phase.AcutePolycrisis]: 0.30,
  [Phase.WarTransition]: 0.50,
  [Phase.OvertInterstateWar]: 0.70,
  [Phase.GeneralizedBlocWar]: 0.85,
};

const SHORT_LABELS: Record<Phase, string> = {
  [Phase.CompetitiveNormality]: "P0",
  [Phase.HybridCoercion]: "P1",
  [Phase.AcutePolycrisis]: "P2",
  [Phase.WarTransition]: "P3",
  [Phase.OvertInterstateWar]: "P4",
  [Phase.GeneralizedBlocWar]: "P5",
};

export default function PhaseIndicator({
  phase,
  orderParameter,
  phaseHistory,
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

  // Next threshold info
  const nextPhase = PHASE_ORDER[phaseIndex + 1];
  const nextThreshold = currentThreshold;
  const distToNext = nextThreshold !== undefined ? nextThreshold - orderParameter : null;

  // Ψ position on the 0–1 bar (clamped)
  const psiPct = Math.min(Math.max(orderParameter, 0), 1) * 100;

  return (
    <div className="phase-indicator" style={{ borderColor: color }}>
      <div
        className={`phase-indicator__dot${
          isNearTransition ? " phase-indicator__dot--pulse" : ""
        }`}
        style={{ backgroundColor: color }}
      />
      <div style={{ flex: 1 }}>
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
          {distToNext !== null && distToNext > 0.05 && nextPhase && (
            <span className="phase-indicator__dist">
              {distToNext.toFixed(2)} to {SHORT_LABELS[nextPhase]}
            </span>
          )}
        </div>

        {/* Escalation timeline bar */}
        <div className="esc-timeline">
          {PHASE_ORDER.map((p, i) => {
            const start = PHASE_STARTS[p];
            const end = i < PHASE_ORDER.length - 1 ? PHASE_STARTS[PHASE_ORDER[i + 1]] : 1;
            const widthPct = (end - start) * 100;
            const isCurrent = p === phase;
            const isPast = PHASE_ORDER.indexOf(p) < phaseIndex;

            // Find transition marker for this phase
            const transition = phaseHistory?.find((h) => h.phase === p && PHASE_ORDER.indexOf(p) > 0);

            return (
              <div
                key={p}
                className={`esc-timeline__seg ${isCurrent ? "esc-timeline__seg--active" : ""} ${isPast ? "esc-timeline__seg--past" : ""}`}
                style={{ width: `${widthPct}%`, background: isPast || isCurrent ? PHASE_COLORS[p] : undefined }}
                title={`${PHASE_LABELS[p]} (Ψ ${start.toFixed(2)}–${end.toFixed(2)})`}
              >
                <span className="esc-timeline__label">{SHORT_LABELS[p]}</span>
                {transition && (
                  <span className="esc-timeline__marker" title={`Transitioned T${transition.turn}`}>
                    T{transition.turn}
                  </span>
                )}
              </div>
            );
          })}
          {/* Ψ position marker */}
          <div
            className="esc-timeline__cursor"
            style={{ left: `${psiPct}%` }}
            title={`Ψ = ${orderParameter.toFixed(3)}`}
          />
        </div>
      </div>
    </div>
  );
}
