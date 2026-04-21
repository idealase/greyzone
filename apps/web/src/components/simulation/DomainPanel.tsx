import { useState } from "react";
import { TurnEvent } from "../../types/run";
import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS, LayerState } from "../../types/domain";
import { formatPercent } from "../../utils/formatters";
import { STRESS_THRESHOLDS } from "../../utils/constants";
import { DOMAIN_DESCRIPTIONS } from "../../data/glossary";
import InfoTooltip from "../common/InfoTooltip";

// Human-readable labels for domain variables
const VARIABLE_LABELS: Record<string, string> = {
  troop_readiness: "Troop Readiness",
  pipeline_integrity: "Pipeline Integrity",
  disinformation_level: "Disinfo Level",
  government_stability: "Gov. Stability",
  satellite_coverage: "Satellite Coverage",
  bandwidth_capacity: "Bandwidth Capacity",
  trade_flow: "Trade Flow",
  port_capacity: "Port Capacity",
  supply_chain_integrity: "Supply Chain",
  public_sentiment: "Public Sentiment",
  media_control: "Media Control",
  diplomatic_leverage: "Diplomatic Leverage",
  cyber_defense: "Cyber Defense",
  power_grid: "Power Grid",
  fiscal_reserves: "Fiscal Reserves",
};

interface DomainPanelProps {
  domain: DomainLayer;
  layerState: LayerState | null;
  previousLayerState?: LayerState | null;
  isMostChanged?: boolean;
  isFocused?: boolean;
  isDimmed?: boolean;
  couplingMatrix?: Record<string, Record<string, number>>;
  recentEvents?: TurnEvent[];
  onFocusDomain?: (domain: DomainLayer | null) => void;
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

function StressTrend({ current, previous }: { current: number; previous?: number }) {
  if (previous == null) return <span className="dp-trend dp-trend--stable">→</span>;
  const delta = current - previous;
  if (Math.abs(delta) < 0.005) return <span className="dp-trend dp-trend--stable">→</span>;
  if (delta > 0) return <span className="dp-trend dp-trend--rising">↑</span>;
  return <span className="dp-trend dp-trend--falling">↓</span>;
}

export default function DomainPanel({
  domain,
  layerState,
  previousLayerState,
  isMostChanged = false,
  isFocused = false,
  isDimmed = false,
  couplingMatrix,
  recentEvents,
  onFocusDomain,
}: DomainPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const label = DOMAIN_LABELS[domain];
  const color = DOMAIN_COLORS[domain];
  const stress = layerState?.stress ?? 0;
  const resilience = layerState?.resilience ?? 0;
  const activity = layerState?.activity_level ?? 0;
  const friction = layerState?.friction ?? 0;
  const variables = layerState?.variables ?? {};
  const stressLevel = getStressLevel(stress);
  const isCritical = stress * 100 >= STRESS_THRESHOLDS.CRITICAL;

  // Get coupled domains from the coupling matrix
  const coupledDomains = couplingMatrix?.[domain]
    ? Object.entries(couplingMatrix[domain])
        .filter(([, w]) => Math.abs(w) > 0.01)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    : [];

  // Recent events for this domain (last 3)
  const domainEvents = (recentEvents ?? [])
    .filter((e) => e.domain === domain)
    .slice(0, 3);

  const stressColor =
    stressLevel === "critical" ? "#ef4444"
    : stressLevel === "high" ? "#f97316"
    : stressLevel === "medium" ? "#eab308"
    : "#22c55e";

  const panelClass = [
    "domain-panel",
    isMostChanged ? "domain-panel--most-changed" : "",
    isCritical ? "domain-panel--critical" : "",
    expanded ? "domain-panel--expanded" : "",
    !expanded ? "domain-panel--compact" : "",
    isFocused ? "domain-panel--focused" : "",
    isDimmed ? "domain-panel--dimmed" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={panelClass}
      onClick={() => setExpanded((v) => !v)}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFocusDomain?.(isFocused ? null : domain);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
      style={{ cursor: "pointer" }}
    >
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
          <StressTrend current={stress} previous={previousLayerState?.stress} />
        </div>
        <div className="domain-panel__value">
          {formatPercent(stress)}
          {previousLayerState && (
            <DomainDelta current={stress} previous={previousLayerState.stress} />
          )}
          <span className="domain-panel__chevron">{expanded ? "▾" : "▸"}</span>
        </div>
      </div>

      {expanded ? (
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
      ) : (
        <div className="domain-panel__summary">
          <div className="domain-panel__mini-bar-wrap">
            <div
              className="domain-panel__mini-bar-fill"
              style={{ width: `${Math.min(stress * 100, 100)}%`, backgroundColor: stressColor }}
            />
          </div>
          <span className="domain-panel__summary-vals">
            <span style={{ color: stressColor }}>{(stress * 100).toFixed(0)}%</span>
            <span className="domain-panel__summary-sep">·</span>
            <span style={{ color: "var(--accent-blue)", fontSize: "0.7rem" }}>R {(resilience * 100).toFixed(0)}%</span>
          </span>
        </div>
      )}

      {expanded && (
        <div className="domain-panel__detail" onClick={(e) => e.stopPropagation()}>
          {/* Friction */}
          <div className="dp-detail-section">
            <div className="dp-detail-section__title">
              Friction
              <InfoTooltip
                label="About friction"
                content="Friction dampens how quickly stress changes in this domain. Higher friction = slower stress response."
              />
            </div>
            <div className="dp-detail-metric">
              <div className="dp-detail-metric__bar">
                <div className="dp-detail-metric__fill" style={{ width: `${friction * 100}%`, background: "#f59e0b" }} />
              </div>
              <span className="dp-detail-metric__value">{formatPercent(friction)}</span>
            </div>
          </div>

          {/* Domain variables */}
          {Object.keys(variables).length > 0 && (
            <div className="dp-detail-section">
              <div className="dp-detail-section__title">Domain Variables</div>
              <div className="dp-detail-vars">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="dp-detail-var">
                    <span className="dp-detail-var__label">{VARIABLE_LABELS[key] ?? key}</span>
                    <span className="dp-detail-var__value">{typeof value === "number" ? (value < 1 ? formatPercent(value) : value.toFixed(1)) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupled domains */}
          {coupledDomains.length > 0 && (
            <div className="dp-detail-section">
              <div className="dp-detail-section__title">Coupled Domains</div>
              <div className="dp-detail-couplings">
                {coupledDomains.slice(0, 5).map(([target, weight]) => (
                  <div key={target} className="dp-detail-coupling">
                    <span className="dp-detail-coupling__arrow">→</span>
                    <span className="dp-detail-coupling__name">{DOMAIN_LABELS[target as DomainLayer] ?? target}</span>
                    <span className={`dp-detail-coupling__weight ${weight > 0 ? "dp-detail-coupling__weight--pos" : "dp-detail-coupling__weight--neg"}`}>
                      {weight > 0 ? "+" : ""}{weight.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent events */}
          {domainEvents.length > 0 && (
            <div className="dp-detail-section">
              <div className="dp-detail-section__title">Recent Events</div>
              <div className="dp-detail-events">
                {domainEvents.map((e) => (
                  <div key={e.id} className="dp-detail-event">
                    <span className="dp-detail-event__turn">T{e.turn}</span>
                    <span className="dp-detail-event__desc">{e.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
