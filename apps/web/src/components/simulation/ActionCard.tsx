import { useState, useEffect } from "react";
import { LegalAction } from "../../types/run";
import { DomainLayer, DOMAIN_LABELS } from "../../types/domain";
import { MIN_INTENSITY, MAX_INTENSITY, INTENSITY_STEP } from "../../utils/constants";
import { useRunStore } from "../../stores/runStore";
import { useLocaleAction } from "../../hooks/useScenarioLocale";
import ActionEffectPreview from "./ActionEffectPreview";
import ActionEscalationBadge from "./ActionEscalationBadge";
import InfoTooltip from "../common/InfoTooltip";

interface ActionCardProps {
  action: LegalAction;
  onSubmit: (intensity: number, selectedDomain: string) => void;
  isSubmitting: boolean;
  side: "blue" | "red";
}

const SPILLOVER_DOMAINS: Record<string, string> = {
  InformationOp: "DomesticPoliticalFiscal",
  SanctionImpose: "DomesticPoliticalFiscal",
  NavalBlockade: "Energy",
};

function getIntensityTier(intensity: number): { label: string; cls: string } {
  if (intensity < 0.30) return { label: "Probe", cls: "probe" };
  if (intensity < 0.60) return { label: "Assert", cls: "assert" };
  if (intensity < 0.80) return { label: "Coerce", cls: "coerce" };
  return { label: "Maximum Pressure", cls: "maximum" };
}

export default function ActionCard({
  action,
  onSubmit,
  isSubmitting,
  side,
}: ActionCardProps) {
  // Derive intensity bounds from parameter_ranges or legacy fields
  const minIntensity =
    action.parameter_ranges?.intensity?.[0] ??
    action.min_intensity ??
    MIN_INTENSITY;
  const maxIntensity =
    action.parameter_ranges?.intensity?.[1] ??
    action.max_intensity ??
    MAX_INTENSITY;

  const [intensity, setIntensity] = useState((minIntensity + maxIntensity) / 2);

  // Domain picker state: default to first available layer or legacy target_domain
  const layers = action.available_layers ?? [];
  const defaultDomain =
    layers[0] ?? action.target_domain ?? DomainLayer.Cyber;
  const [selectedDomain, setSelectedDomain] = useState<string>(defaultDomain);

  // Per-card executed state
  const [executed, setExecuted] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (executed) {
      const timer = setTimeout(() => setExecuted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [executed]);

  // Store state
  const worldState = useRunStore((state) => state.worldState);
  const currentPhase = useRunStore((state) => state.currentPhase ?? "CompetitiveNormality");

  // Locale
  const localeAction = useLocaleAction(action.actor_id ?? "", action.action_type);

  const targetKey = selectedDomain ?? action.target_domain ?? action.available_layers?.[0];
  const targetDomainState = worldState?.layers?.[targetKey as DomainLayer];

  const handleExecute = () => {
    onSubmit(intensity, selectedDomain);
    setExecuted(true);
  };

  const domainLabel = (d: string) =>
    DOMAIN_LABELS[d as DomainLayer] ?? d;

  const tier = getIntensityTier(intensity);
  const spilloverDomain = SPILLOVER_DOMAINS[action.action_type];

  return (
    <div className={`action-card${executed ? " action-card--executed" : ""}`}>
      <div className="action-card__header">
        <span className="action-card__type">
          {localeAction?.label ?? action.action_type}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {action.resource_cost != null && (
            <span className="action-card__cost">
              {action.resource_cost} RP
            </span>
          )}
          <span className="action-card__domain">
            {domainLabel(selectedDomain)}
          </span>
          <button
            className="action-card__detail-toggle"
            onClick={() => setShowDetail((v) => !v)}
            aria-label="Toggle detail panel"
          >
            {showDetail ? "▲ Details" : "▼ Details"}
          </button>
        </div>
      </div>

      {localeAction?.flavour && (
        <div className="action-card__flavour">{localeAction.flavour}</div>
      )}

      <div className="action-card__description">{action.description}</div>

      {/* Domain picker when multiple layers available */}
      {layers.length > 1 && (
        <div className="action-card__layers">
          <label className="form-label" style={{ marginBottom: "0.2rem", fontSize: "0.72rem" }}>
            Target Domain
          </label>
          <select
            className="form-select"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem" }}
          >
            {layers.map((layer) => (
              <option key={layer} value={layer}>
                {domainLabel(layer)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="action-card__slider">
        <div className="action-card__intensity-header">
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            Intensity
            <InfoTooltip
              label="How intensity tiers work"
              content={
                <div>
                  <div><strong>Probe</strong> – light pressure to sense responses.</div>
                  <div><strong>Assert</strong> – firmer push with contained risk.</div>
                  <div><strong>Coerce</strong> – compels behavior; raises spillover risk.</div>
                  <div><strong>Maximum Pressure</strong> – near-total effort; can trigger escalation.</div>
                </div>
              }
            />
          </span>
          <span className={`action-card__intensity-tier action-card__intensity-tier--${tier.cls}`}>
            {tier.label}
          </span>
        </div>
        <input
          type="range"
          min={minIntensity}
          max={maxIntensity}
          step={INTENSITY_STEP}
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
          }}
        >
          <span>{minIntensity.toFixed(1)}</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {intensity.toFixed(2)}
          </span>
          <span>{maxIntensity.toFixed(1)}</span>
        </div>
      </div>

      {showDetail && (
        <div className="action-card__detail-panel">
          <div className="detail-row">
            <ActionEffectPreview
              actionType={action.action_type}
              targetDomain={selectedDomain}
              intensity={intensity}
              domainStress={targetDomainState?.stress ?? 0.5}
              domainResilience={targetDomainState?.resilience ?? 0.5}
              side={side}
            />
          </div>
          <div className="detail-row">
            <ActionEscalationBadge
              actionType={action.action_type}
              intensity={intensity}
              currentPhase={currentPhase}
            />
          </div>
          {action.resource_cost != null && (
            <div className="detail-row">
              <span>💰 Costs {action.resource_cost} resources</span>
            </div>
          )}
          {spilloverDomain && (
            <div className="action-card__spillover">
              ⚠ Spillover: affects {domainLabel(spilloverDomain)} domain
              {" "}
              <InfoTooltip
                label="Why spillover happens"
                content="This action is coupled to another domain. High intensity increases cross-domain stress, which can accelerate phase shifts if resilience is low."
                className="action-card__help"
              />
            </div>
          )}
        </div>
      )}

      <div className="action-card__controls" style={{ marginTop: "0.5rem" }}>
        <button
          className={`btn btn--sm ${
            executed
              ? "btn--success"
              : side === "red"
              ? "btn--danger"
              : "btn--primary"
          }`}
          onClick={handleExecute}
          disabled={isSubmitting || executed}
          style={{ width: "100%" }}
        >
          {executed ? "Executed!" : isSubmitting ? "..." : "Execute"}
        </button>
      </div>
    </div>
  );
}
