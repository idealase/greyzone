import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS, LayerState } from "../../types/domain";
import { formatPercent } from "../../utils/formatters";
import { STRESS_THRESHOLDS } from "../../utils/constants";

interface DomainPanelProps {
  domain: DomainLayer;
  layerState: LayerState | null;
}

function getStressLevel(stress: number): string {
  const pct = stress * 100;
  if (pct >= STRESS_THRESHOLDS.CRITICAL) return "critical";
  if (pct >= STRESS_THRESHOLDS.HIGH) return "high";
  if (pct >= STRESS_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export default function DomainPanel({ domain, layerState }: DomainPanelProps) {
  const label = DOMAIN_LABELS[domain];
  const color = DOMAIN_COLORS[domain];
  const stress = layerState?.stress ?? 0;
  const resilience = layerState?.resilience ?? 0;
  const activity = layerState?.activity_level ?? 0;
  const stressLevel = getStressLevel(stress);

  return (
    <div className="domain-panel">
      <div className="domain-panel__header">
        <div className="domain-panel__name">
          <span
            className="domain-panel__color-dot"
            style={{ backgroundColor: color }}
          />
          {label}
        </div>
        <div className="domain-panel__value">{formatPercent(stress)}</div>
      </div>

      <div className="domain-panel__bars">
        <div>
          <div className="domain-panel__bar-label">Stress</div>
          <div className="stress-bar">
            <div
              className={`stress-bar__fill stress-bar__fill--${stressLevel}`}
              style={{ width: `${stress * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="domain-panel__bar-label">Resilience</div>
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
