import { Phase } from "../../types/phase";
import { WorldState } from "../../types/run";
import { ALL_DOMAINS, DomainLayer, DOMAIN_LABELS } from "../../types/domain";
import { formatPhase, formatPercent, formatOrderParameter } from "../../utils/formatters";

interface MetricsOverviewProps {
  orderParameter: number;
  phase: Phase;
  turn: number;
  eventCount: number;
  worldState: WorldState | null;
}

export default function MetricsOverview({
  orderParameter,
  phase,
  turn,
  eventCount,
  worldState,
}: MetricsOverviewProps) {
  let dominantDomain: DomainLayer | null = null;
  let maxStress = 0;
  let avgResilience = 0;

  if (worldState) {
    let resilienceSum = 0;
    let count = 0;
    for (const domain of ALL_DOMAINS) {
      const layer = worldState.layers[domain];
      if (layer) {
        if (layer.stress > maxStress) {
          maxStress = layer.stress;
          dominantDomain = domain;
        }
        resilienceSum += layer.resilience;
        count++;
      }
    }
    avgResilience = count > 0 ? resilienceSum / count : 0;
  }

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-card__label">Order Parameter</div>
        <div className="metric-card__value">
          {formatOrderParameter(orderParameter)}
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-card__label">Phase</div>
        <div className="metric-card__value" style={{ fontSize: "0.8rem" }}>
          {formatPhase(phase)}
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-card__label">Turn</div>
        <div className="metric-card__value">{turn}</div>
      </div>
      <div className="metric-card">
        <div className="metric-card__label">Events</div>
        <div className="metric-card__value">{eventCount}</div>
      </div>
      <div className="metric-card">
        <div className="metric-card__label">Dominant Domain</div>
        <div className="metric-card__value" style={{ fontSize: "0.78rem" }}>
          {dominantDomain ? DOMAIN_LABELS[dominantDomain] : "--"}
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-card__label">Avg Resilience</div>
        <div className="metric-card__value">{formatPercent(avgResilience)}</div>
      </div>
    </div>
  );
}
