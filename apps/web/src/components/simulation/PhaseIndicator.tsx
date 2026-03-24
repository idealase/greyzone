import { Phase, PHASE_LABELS, PHASE_COLORS, PHASE_ORDER } from "../../types/phase";
import { PHASE_TRANSITION_THRESHOLD } from "../../utils/constants";
import { formatOrderParameter } from "../../utils/formatters";

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
  const isNearTransition = orderParameter >= PHASE_TRANSITION_THRESHOLD;

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
          {PHASE_LABELS[phase]}
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
