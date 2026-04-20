import { useEffect, useCallback } from "react";
import {
  Phase,
  PHASE_COLORS,
  PHASE_LABELS,
  PHASE_ORDER,
  PHASE_THRESHOLDS,
} from "../../types/phase";
import { WorldState } from "../../types/run";
import { ALL_DOMAINS } from "../../types/domain";
import { useScenarioLocale } from "../../hooks/useScenarioLocale";
import DomainDeltaGrid from "./DomainDeltaGrid";
import TurnNarrativePanel from "./TurnNarrativePanel";

export interface DomainDelta {
  domain: string;
  stressDelta: number;
  resilienceDelta: number;
  activityDelta: number;
}

interface AfterActionReportProps {
  runId: string;
  completedTurn: number;
  currentPhase: Phase;
  orderParameter: number;
  previousOrderParameter?: number;
  domainDeltas: DomainDelta[];
  phaseChanged: boolean;
  aiActionCount?: number;
  onDismiss: () => void;
}

function getNextPhase(phase: Phase): Phase | null {
  const idx = PHASE_ORDER.indexOf(phase);
  if (idx < 0 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

export function computeDomainDeltas(
  prev: WorldState,
  current: WorldState
): DomainDelta[] {
  return ALL_DOMAINS.map((domain) => {
    const p = prev.layers[domain];
    const c = current.layers[domain];
    if (!p || !c) {
      return { domain, stressDelta: 0, resilienceDelta: 0, activityDelta: 0 };
    }
    return {
      domain,
      stressDelta: c.stress - p.stress,
      resilienceDelta: c.resilience - p.resilience,
      activityDelta: c.activity_level - p.activity_level,
    };
  });
}

export default function AfterActionReport({
  runId,
  completedTurn,
  currentPhase,
  orderParameter,
  previousOrderParameter,
  domainDeltas,
  phaseChanged,
  aiActionCount,
  onDismiss,
}: AfterActionReportProps) {
  const locale = useScenarioLocale();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);
  const phaseColor = PHASE_COLORS[currentPhase];
  const phaseLabel = PHASE_LABELS[currentPhase];

  const nextPhase = getNextPhase(currentPhase);
  const threshold = nextPhase ? PHASE_THRESHOLDS[currentPhase] : undefined;
  const showEscalationWarning =
    !phaseChanged &&
    threshold !== undefined &&
    nextPhase !== null &&
    orderParameter >= threshold - 0.05;
  const psiDelta =
    previousOrderParameter !== undefined
      ? orderParameter - previousOrderParameter
      : null;
  const docsBase = "https://github.com/idealase/greyzone/blob/main/docs";

  return (
    <div className="aar-overlay" onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}>
      <div className="aar-modal" role="dialog" aria-modal="true" aria-label={`Turn ${completedTurn} After Action Report`}>
        {/* Header */}
        <div className="aar-header">
          <span className="aar-header__title">
            Turn {completedTurn} Complete
          </span>
          <span
            className="aar-header__phase"
            style={{
              backgroundColor: `${phaseColor}22`,
              color: phaseColor,
              border: `1px solid ${phaseColor}55`,
            }}
          >
            {phaseLabel}
          </span>
        </div>

        {/* Narrative section */}
        <div className="aar-section">
          <div className="aar-section__label">Intelligence Summary</div>
          <TurnNarrativePanel runId={runId} turn={completedTurn} />
        </div>

        {/* Domain deltas section */}
        <div className="aar-section">
          <div className="aar-section__label">Domain Changes This Turn</div>
          <DomainDeltaGrid deltas={domainDeltas} locale={locale} />
        </div>

        {/* Turn summary: Ψ delta + AI actions */}
        {(psiDelta !== null || (aiActionCount !== undefined && aiActionCount > 0)) && (
          <div className="aar-section">
            <div className="aar-section__label">Turn Summary</div>
            <div className="aar-turn-summary">
              {psiDelta !== null && (
                <div
                  className="aar-psi-delta"
                  style={{
                    color: psiDelta > 0 ? "#ff6b6b" : psiDelta < 0 ? "#69db7c" : "var(--text-secondary)",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                  }}
                >
                  Δ Ψ: {psiDelta >= 0 ? "+" : ""}
                  {psiDelta.toFixed(3)}
                </div>
              )}
              {aiActionCount !== undefined && aiActionCount > 0 && (
                <div className="aar-ai-actions" style={{ color: "var(--text-secondary)" }}>
                  🤖 AI opponent executed {aiActionCount} action{aiActionCount !== 1 ? "s" : ""} this turn
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banners section (only if there's something to show) */}
        {(phaseChanged || showEscalationWarning) && (
          <div className="aar-section">
            {phaseChanged && (
              <div className="aar-phase-banner aar-phase-banner--transition">
                ⚡ PHASE TRANSITION: {phaseLabel}
              </div>
            )}
            {showEscalationWarning && nextPhase && threshold !== undefined && (
              <div className="aar-phase-banner aar-phase-banner--warning">
                ⚠ ESCALATION WARNING: Ψ = {orderParameter.toFixed(3)} —{" "}
                {PHASE_LABELS[nextPhase]} threshold at {threshold.toFixed(2)}
              </div>
            )}
          </div>
        )}
        <div className="aar-help">
          <a href="/tutorial">↩ Return to tutorial</a>
          <a
            href={`${docsBase}/simulation-spec.md#escalation`}
            target="_blank"
            rel="noreferrer"
          >
            What does this mean?
          </a>
          <a href="/help">Help & docs</a>
        </div>

        {/* Footer */}
        <div className="aar-footer">
          <button className="btn btn--primary" onClick={onDismiss}>
            Got it →
          </button>
        </div>
      </div>
    </div>
  );
}
