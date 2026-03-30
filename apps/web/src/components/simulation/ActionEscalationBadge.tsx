import { PHASE_ORDER } from "../../types/phase";
import { Phase } from "../../types/phase";
import InfoTooltip from "../common/InfoTooltip";

interface ActionEscalationBadgeProps {
  actionType: string;
  intensity: number;
  currentPhase: string;
}

type BadgeLevel = "low" | "medium" | "high" | "critical";

const LOW_ACTIONS = new Set([
  "DeEscalate",
  "Negotiate",
  "SanctionRelief",
  "Reinforce",
  "DomesticPolicyShift",
]);

const DESCRIPTIONS: Record<BadgeLevel, string> = {
  low: "Unlikely to trigger escalation",
  medium: "Moderate escalation risk",
  high: "Significant escalation risk",
  critical: "Severe escalation — may destabilize the phase",
};

const LABELS: Record<BadgeLevel, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

function getPhaseIndex(phaseName: string): number {
  const idx = PHASE_ORDER.indexOf(phaseName as Phase);
  return idx === -1 ? 0 : idx;
}

function getBadgeLevel(
  actionType: string,
  intensity: number,
  currentPhase: string
): BadgeLevel {
  // CRITICAL override: Phase 3+ at high intensity
  if (getPhaseIndex(currentPhase) >= 3 && intensity >= 0.7) {
    return "critical";
  }

  if (LOW_ACTIONS.has(actionType)) return "low";

  switch (actionType) {
    case "MilitaryDeploy":
      return "critical";
    case "CyberAttack":
      return intensity >= 0.7 ? "critical" : "high";
    case "NavalBlockade":
      return intensity >= 0.6 ? "critical" : "high";
    case "Escalate":
      return intensity >= 0.6 ? "high" : "medium";
    case "Disrupt":
      return "high";
    case "Mobilize":
    case "InformationOp":
    case "SanctionImpose":
    case "SpaceAssetDeploy":
      return intensity < 0.6 ? "medium" : "high";
    default:
      return "medium";
  }
}

export default function ActionEscalationBadge({
  actionType,
  intensity,
  currentPhase,
}: ActionEscalationBadgeProps) {
  const level = getBadgeLevel(actionType, intensity, currentPhase);

  return (
    <div className="escalation-badge-wrap">
      <span className={`escalation-badge escalation-badge--${level}`}>
        ⚡ {LABELS[level]}
      </span>
      <InfoTooltip
        label="What does this escalation badge mean?"
        content={
          <div>
            <div><strong>Low</strong>: unlikely to alter the current phase.</div>
            <div><strong>Medium</strong>: monitor Ψ; may combine with other actions.</div>
            <div><strong>High</strong>: significant risk of crossing to the next phase.</div>
            <div><strong>Critical</strong>: very high risk, especially in late phases.</div>
          </div>
        }
      />
      <span className="escalation-badge-desc">{DESCRIPTIONS[level]}</span>
    </div>
  );
}
