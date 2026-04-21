import { useMemo } from "react";
import { ALL_DOMAINS, DomainLayer, DOMAIN_LABELS } from "../../types/domain";
import { Phase, PHASE_LABELS } from "../../types/phase";
import { WorldState, TurnEvent } from "../../types/run";

interface TurnChangeSummaryProps {
  currentTurn: number;
  orderParameter: number;
  previousOrderParameter: number;
  currentPhase: Phase;
  worldState: WorldState | null;
  previousWorldState: WorldState | null;
  events: TurnEvent[];
}

export default function TurnChangeSummary({
  currentTurn,
  orderParameter,
  previousOrderParameter,
  currentPhase,
  worldState,
  previousWorldState,
  events,
}: TurnChangeSummaryProps) {
  const psiDelta = orderParameter - previousOrderParameter;

  const mostChanged = useMemo<DomainLayer | null>(() => {
    if (!worldState || !previousWorldState) return null;
    let maxDelta = 0;
    let result: DomainLayer | null = null;
    for (const domain of ALL_DOMAINS) {
      const curr = worldState.layers[domain]?.stress ?? 0;
      const prev = previousWorldState.layers[domain]?.stress ?? 0;
      const delta = Math.abs(curr - prev);
      if (delta > maxDelta) {
        maxDelta = delta;
        result = domain;
      }
    }
    return maxDelta > 0.005 ? result : null;
  }, [worldState, previousWorldState]);

  const phaseChanged = useMemo(() => {
    if (!previousWorldState) return false;
    return previousWorldState.phase !== currentPhase;
  }, [previousWorldState, currentPhase]);

  const turnEventCount = useMemo(() => {
    return events.filter((e) => e.turn === currentTurn).length;
  }, [events, currentTurn]);

  // Don't render on turn 0 or if no previous state
  if (currentTurn < 1 || !previousWorldState) return null;

  const sign = psiDelta >= 0 ? "+" : "";
  const psiClass =
    Math.abs(psiDelta) < 0.005
      ? ""
      : psiDelta > 0
        ? " turn-summary__delta--up"
        : " turn-summary__delta--down";

  return (
    <div className="turn-summary">
      <span className="turn-summary__label">Last turn:</span>
      <span className={`turn-summary__delta${psiClass}`}>
        Ψ {sign}{psiDelta.toFixed(2)}
      </span>
      {phaseChanged && (
        <span className="turn-summary__phase-change">
          → {PHASE_LABELS[currentPhase]}
        </span>
      )}
      {mostChanged && (
        <span className="turn-summary__domain">
          ▲ {DOMAIN_LABELS[mostChanged]}
        </span>
      )}
      {turnEventCount > 0 && (
        <span className="turn-summary__events">
          {turnEventCount} event{turnEventCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
