interface ActionEffectPreviewProps {
  actionType: string;
  targetDomain: string;
  intensity: number;
  domainStress: number;
  domainResilience: number;
  side: "blue" | "red";
}

interface EffectResult {
  primaryStressDelta: number;
  resilienceDelta: number;
  activityDelta: number;
  spilloverNote: string | null;
}

function computeEffects(
  actionType: string,
  intensity: number,
  resilience: number
): EffectResult {
  let primaryStressDelta = 0;
  let resilienceDelta = 0;
  let activityDelta = 0;
  let spilloverNote: string | null = null;

  switch (actionType) {
    case "Escalate":
      primaryStressDelta = intensity * (1 - resilience) * 0.10;
      break;
    case "DeEscalate":
      primaryStressDelta = -(intensity * 0.05);
      break;
    case "Reinforce":
      resilienceDelta = intensity * 0.05;
      break;
    case "Disrupt":
      resilienceDelta = -(intensity * 0.08);
      break;
    case "Mobilize":
      activityDelta = intensity * 0.10;
      primaryStressDelta = intensity * 0.03;
      break;
    case "Negotiate":
      primaryStressDelta = -(intensity * 0.07);
      spilloverNote = "secondary domain −0.03";
      break;
    case "CyberAttack":
      primaryStressDelta = intensity * (1 - resilience) * 0.12;
      resilienceDelta = -0.04;
      break;
    case "InformationOp":
      primaryStressDelta = intensity * 0.09;
      spilloverNote = "DomesticPoliticalFiscal spillover +0.04";
      break;
    case "SanctionImpose":
      primaryStressDelta = intensity * 0.10;
      spilloverNote = "DomesticPoliticalFiscal blowback +0.02";
      break;
    case "SanctionRelief":
      primaryStressDelta = -(intensity * 0.08);
      resilienceDelta = 0.03;
      break;
    case "MilitaryDeploy":
      primaryStressDelta = intensity * 0.15;
      activityDelta = intensity * 0.20;
      break;
    case "NavalBlockade":
      primaryStressDelta = intensity * 0.14;
      spilloverNote = "Energy spillover +0.06";
      break;
    case "SpaceAssetDeploy":
      primaryStressDelta = intensity * 0.08;
      activityDelta = intensity * 0.15;
      resilienceDelta = 0.04;
      break;
    case "DomesticPolicyShift":
      primaryStressDelta = intensity * 0.06;
      break;
  }

  return { primaryStressDelta, resilienceDelta, activityDelta, spilloverNote };
}

function formatDelta(val: number): string {
  const sign = val >= 0 ? "+" : "−";
  return `${sign}${Math.abs(val).toFixed(3)}`;
}

interface PillProps {
  label: string;
  value: number;
  positiveClass: string;
  negativeClass: string;
  threshold?: number;
}

function DeltaPill({ label, value, positiveClass, negativeClass, threshold = 0.005 }: PillProps) {
  const cls =
    value > threshold
      ? positiveClass
      : value < -threshold
      ? negativeClass
      : "effect-pill--neutral";
  const display = Math.abs(value) < threshold ? `${label} ~0` : `${label} ${formatDelta(value)}`;
  return <span className={`effect-pill ${cls}`}>{display}</span>;
}

export default function ActionEffectPreview({
  actionType,
  intensity,
  domainResilience,
}: ActionEffectPreviewProps) {
  const { primaryStressDelta, resilienceDelta, activityDelta, spilloverNote } =
    computeEffects(actionType, intensity, domainResilience);

  const psiImpact = primaryStressDelta / 8;

  return (
    <div>
      <div className="effect-preview">
        <DeltaPill
          label="stress"
          value={primaryStressDelta}
          positiveClass="effect-pill--stress-up"
          negativeClass="effect-pill--stress-down"
        />
        {Math.abs(resilienceDelta) > 0.001 && (
          <DeltaPill
            label="resilience"
            value={resilienceDelta}
            positiveClass="effect-pill--resilience-up"
            negativeClass="effect-pill--resilience-down"
          />
        )}
        {Math.abs(activityDelta) > 0.001 && (
          <span className="effect-pill effect-pill--activity">
            activity {formatDelta(activityDelta)}
          </span>
        )}
        <DeltaPill
          label="Ψ"
          value={psiImpact}
          positiveClass="effect-pill--psi-up"
          negativeClass="effect-pill--psi-down"
        />
      </div>
      {spilloverNote && (
        <div className="effect-spillover-note">↳ {spilloverNote}</div>
      )}
    </div>
  );
}
