import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS, LayerState } from "../../types/domain";
import { formatPercent } from "../../utils/formatters";
import { STRESS_THRESHOLDS } from "../../utils/constants";
import { DOMAIN_DESCRIPTIONS } from "../../data/glossary";
import InfoTooltip from "../common/InfoTooltip";

interface DomainPanelProps {
  domain: DomainLayer;
  layerState: LayerState | null;
  previousLayerState?: LayerState | null;
  isMostChanged?: boolean;
}

function getStressLevel(stress: number): string {
  const pct = stress * 100;
  if (pct >= STRESS_THRESHOLDS.CRITICAL) return "critical";
  if (pct >= STRESS_THRESHOLDS.HIGH) return "high";
  if (pct >= STRESS_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

function DomainDelta({ current, previous, invert = false }: {
  current: number;
  previous: number;
  invert?: boolean;
}) {
  const delta = current - previous;
  if (Math.abs(delta) < 0.001) return null;
  const isPositive = delta > 0;
  const isGood = invert ? isPositive : !isPositive;
  const arrow = isPositive ? "↑" : "↓";
  const pctDelta = Math.abs(delta * 100).toFixed(1);
  const cls = isGood ? "domain-delta--good" : "domain-delta--bad";
  return (
    <span className={`domain-delta ${cls}`}>
      {arrow}{pctDelta}%
    </span>
  );
}

export default function DomainPanel({
  domain,
  layerState,
  previousLayerState,
  isMostChanged = false,
}: DomainPanelProps) {
  const label = DOMAIN_LABELS[domain];
  const color = DOMAIN_COLORS[domain];
  const stress = layerState?.stress ?? 0;
  const resilience = layerState?.resilience ?? 0;
  const activity = layerState?.activity_level ?? 0;
  const stressLevel = getStressLevel(stress);

  const panelClass = [
    "domain-panel",
    isMostChanged ? "domain-panel--most-changed" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={panelClass}>
      <div className="domain-panel__header">
        <div className="domain-panel__name">
          <span
            className="domain-panel__color-dot"
            style={{ backgroundColor: color }}
          />
          {label}
          <InfoTooltip
            label={`About ${label}`}
            content={
              <div>
                <div>{DOMAIN_DESCRIPTIONS[domain].summary}</div>
                <div style={{ marginTop: "0.3rem" }}>📈 {DOMAIN_DESCRIPTIONS[domain].highStress}</div>
                <div style={{ marginTop: "0.2rem" }}>🛡️ {DOMAIN_DESCRIPTIONS[domain].resilience}</div>
              </div>
            }
          />
          {isMostChanged && <span className="domain-panel__volatile" title="Most changed this turn">⚡</span>}
        </div>
        <div className="domain-panel__value">
          {formatPercent(stress)}
          {previousLayerState && (
            <DomainDelta current={stress} previous={previousLayerState.stress} />
          )}
        </div>
      </div>

      <div className="domain-panel__bars">
        <div>
          <div className="domain-panel__bar-label">
            Stress
            {previousLayerState && (
              <DomainDelta current={stress} previous={previousLayerState.stress} />
            )}
          </div>
          <div className="stress-bar">
            <div
              className={`stress-bar__fill stress-bar__fill--${stressLevel}`}
              style={{ width: `${stress * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="domain-panel__bar-label">
            Resilience
            {previousLayerState && (
              <DomainDelta
                current={resilience}
                previous={previousLayerState.resilience}
                invert
              />
            )}
          </div>
          <div className="resilience-bar">
            <div
              className="resilience-bar__fill"
              style={{ width: `${resilience * 100}%` }}
            />
          </div>
        </div>
        {activity > 0 && (
          <div
            className="domain-panel__bar-label"
            style={{ color: "var(--accent-yellow)", fontSize: "0.68rem" }}
          >
            Activity: {formatPercent(activity)}
          </div>
        )}
      </div>
    </div>
  );
}
