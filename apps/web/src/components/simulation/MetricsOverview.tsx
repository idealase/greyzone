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
  previousOrderParameter?: number;
  previousWorldState?: WorldState | null;
  compact?: boolean;
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

function DeltaBadge({ delta, invert = false }: { delta: number; invert?: boolean }) {
  if (Math.abs(delta) < 0.001) return null;
  const isPositive = delta > 0;
  // For stress/Ψ, positive = worsening (red). For resilience/resources, positive = good (green).
  const isGood = invert ? isPositive : !isPositive;
  const arrow = isPositive ? "↑" : "↓";
  const cls = isGood ? "delta-badge--good" : "delta-badge--bad";
  const formatted = Math.abs(delta) < 1
    ? Math.abs(delta).toFixed(2)
    : Math.round(Math.abs(delta)).toString();
  return (
    <span className={`delta-badge ${cls}`}>
      {arrow}{formatted}
    </span>
  );
}

export default function MetricsOverview({
  orderParameter,
  phase,
  turn,
  eventCount,
  worldState,
  side,
  previousOrderParameter,
  previousWorldState,
  compact,
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

  // Compute previous avg resilience for delta
  let prevAvgResilience = 0;
  if (previousWorldState) {
    let resSum = 0;
    let cnt = 0;
    for (const domain of ALL_DOMAINS) {
      const layer = previousWorldState.layers[domain];
      if (layer) {
        resSum += layer.resilience;
        cnt++;
      }
    }
    prevAvgResilience = cnt > 0 ? resSum / cnt : 0;
  }

  const resources = findPlayerResources(worldState, side);
  const prevResources = findPlayerResources(previousWorldState ?? null, side);

  const psiDelta = previousOrderParameter !== undefined
    ? orderParameter - previousOrderParameter
    : null;
  const resDelta = resources !== null && prevResources !== null
    ? resources - prevResources
    : null;
  const resilienceDelta = previousWorldState
    ? avgResilience - prevAvgResilience
    : null;

  return (
    <div className="metrics-overview">
      {/* Primary: decision-driving metrics */}
      <div className="metrics-grid metrics-grid--primary">
        <div className="metric-card metric-card--primary">
          <div className="metric-card__label">
            Order Parameter
            <InfoTooltip
              label="What is the order parameter?"
              content="Ψ measures how coordinated and intense the conflict system is. 0 = dispersed, 1 = fully synchronized escalation. Higher Ψ makes phase shifts more likely."
            />
          </div>
          <div className="metric-card__value">
            {formatOrderParameter(orderParameter)}
            {psiDelta !== null && <DeltaBadge delta={psiDelta} />}
          </div>
        </div>
        <div className="metric-card metric-card--primary">
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
        {resources !== null && (
          <div className="metric-card metric-card--primary">
            <div className="metric-card__label">
              Resources
              <InfoTooltip
                label="What are resources?"
                content={
                  <div>
                    <div>Resource points (RP) are spent when executing actions. Each action has a cost.</div>
                    <div style={{ marginTop: "0.3rem", fontWeight: 600, color: "var(--color-success)" }}>♻️ Regeneration: +2 RP per turn</div>
                    <div style={{ marginTop: "0.2rem" }}>Running out of RP limits your available actions. Plan resource expenditure carefully.</div>
                  </div>
                }
              />
            </div>
            <div className="metric-card__value">
              {Math.round(resources)} RP
              {resDelta !== null && <DeltaBadge delta={resDelta} invert />}
            </div>
          </div>
        )}
      </div>
      {/* Secondary: supporting telemetry (hidden in compact mode) */}
      {!compact && (
      <div className="metrics-grid metrics-grid--secondary">
        <div className="metric-card metric-card--secondary">
          <div className="metric-card__label">Turn</div>
          <div className="metric-card__value">{turn}</div>
        </div>
        <div className="metric-card metric-card--secondary">
          <div className="metric-card__label">Events</div>
          <div className="metric-card__value">{eventCount}</div>
        </div>
        <div className="metric-card metric-card--secondary">
          <div className="metric-card__label">Dominant Domain</div>
          <div className="metric-card__value" style={{ fontSize: "0.78rem" }}>
            {dominantDomain ? DOMAIN_LABELS[dominantDomain] : "--"}
          </div>
        </div>
        <div className="metric-card metric-card--secondary">
          <div className="metric-card__label">
            Avg Resilience
            <InfoTooltip
              label="What is resilience?"
              content="Average defensive posture across all domains. Higher resilience dampens stress growth and spillover. Keep it high to absorb shocks."
            />
          </div>
          <div className="metric-card__value">
            {formatPercent(avgResilience)}
            {resilienceDelta !== null && <DeltaBadge delta={resilienceDelta} invert />}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
