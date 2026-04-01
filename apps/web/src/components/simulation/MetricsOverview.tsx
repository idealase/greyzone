import { Phase } from "../../types/phase";
import { WorldState } from "../../types/run";
import { ALL_DOMAINS, DomainLayer, DOMAIN_LABELS } from "../../types/domain";
import { formatPhase, formatPercent, formatOrderParameter } from "../../utils/formatters";
import InfoTooltip from "../common/InfoTooltip";

interface MetricsOverviewProps {
  orderParameter: number;
  phase: Phase;
  turn: number;
  eventCount: number;
  worldState: WorldState | null;
  side?: "blue" | "red";
}

function findPlayerResources(
  worldState: WorldState | null,
  side?: "blue" | "red"
): number | null {
  if (!worldState?.actors || !worldState?.roles || !side) return null;

  const roleId = side === "blue" ? "blue_commander" : "red_commander";
  const role = worldState.roles.find((r) => r.id === roleId);
  if (!role || role.controlled_actor_ids.length === 0) return null;

  const controlledId = role.controlled_actor_ids[0];
  const actor = worldState.actors.find((a) => a.id === controlledId);
  return actor?.resources ?? null;
}

export default function MetricsOverview({
  orderParameter,
  phase,
  turn,
  eventCount,
  worldState,
  side,
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

  const resources = findPlayerResources(worldState, side);

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-card__label">
          Order Parameter
          <InfoTooltip
            label="What is the order parameter?"
            content="Ψ measures how coordinated and intense the conflict system is. 0 = dispersed, 1 = fully synchronized escalation. Higher Ψ makes phase shifts more likely."
          />
        </div>
        <div className="metric-card__value">
          {formatOrderParameter(orderParameter)}
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-card__label">
          Phase
          <InfoTooltip
            label="What do phases mean?"
            content="The current escalation band of the scenario. Each phase unlocks different actions and risk levels. Watch Ψ to see when you are nearing the next phase."
          />
        </div>
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
      {resources !== null && (
        <div className="metric-card">
          <div className="metric-card__label">
            Resources
            <InfoTooltip
              label="What are resources?"
              content="Resource points (RP) are spent when executing actions. Each action has a cost. Resources recover slowly each turn (+2 RP). Running out limits your options."
            />
          </div>
          <div className="metric-card__value">{Math.round(resources)} RP</div>
        </div>
      )}
      <div className="metric-card">
        <div className="metric-card__label">Dominant Domain</div>
        <div className="metric-card__value" style={{ fontSize: "0.78rem" }}>
          {dominantDomain ? DOMAIN_LABELS[dominantDomain] : "--"}
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-card__label">
          Avg Resilience
          <InfoTooltip
            label="What is resilience?"
            content="Average defensive posture across all domains. Higher resilience dampens stress growth and spillover. Keep it high to absorb shocks."
          />
        </div>
        <div className="metric-card__value">{formatPercent(avgResilience)}</div>
      </div>
    </div>
  );
}
