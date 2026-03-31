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
  domainDeltas: DomainDelta[];
  phaseChanged: boolean;
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
  domainDeltas,
  phaseChanged,
  onDismiss,
}: AfterActionReportProps) {
  const locale = useScenarioLocale();
  const phaseColor = PHASE_COLORS[currentPhase];
  const phaseLabel = PHASE_LABELS[currentPhase];

  const nextPhase = getNextPhase(currentPhase);
  const threshold = nextPhase ? PHASE_THRESHOLDS[currentPhase] : undefined;
  const showEscalationWarning =
    !phaseChanged &&
    threshold !== undefined &&
    nextPhase !== null &&
    orderParameter >= threshold - 0.05;
  const docsBase = "https://github.com/idealase/greyzone/blob/main/docs";

  return (
    <div className="aar-overlay">
      <div className="aar-modal" role="dialog" aria-modal="true">
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
            Continue to Turn {completedTurn + 1} →
          </button>
        </div>
      </div>
    </div>
  );
}
