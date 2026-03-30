import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS } from "../../types/domain";
import type { ScenarioLocale } from "../../types/scenario-locale";
import type { DomainDelta } from "./AfterActionReport";

interface DomainDeltaGridProps {
  deltas: DomainDelta[];
  locale: ScenarioLocale | null;
}

const STRESS_THRESHOLD = 0.005;

function StressDelta({ delta }: { delta: number }) {
  if (Math.abs(delta) < STRESS_THRESHOLD) {
    return (
      <span className="domain-delta-card__stress domain-delta-card__stress--stable">
        — stable
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="domain-delta-card__stress domain-delta-card__stress--up">
        ↑ +{delta.toFixed(3)}
      </span>
    );
  }
  return (
    <span className="domain-delta-card__stress domain-delta-card__stress--down">
      ↓ −{Math.abs(delta).toFixed(3)}
    </span>
  );
}

function resLabel(delta: number): string {
  if (Math.abs(delta) < STRESS_THRESHOLD) return "res stable";
  return delta > 0
    ? `res ↑ +${delta.toFixed(3)}`
    : `res ↓ −${Math.abs(delta).toFixed(3)}`;
}

export default function DomainDeltaGrid({ deltas, locale }: DomainDeltaGridProps) {
  const maxVolatile = deltas.reduce<DomainDelta | null>((max, d) => {
    if (!max || Math.abs(d.stressDelta) > Math.abs(max.stressDelta)) return d;
    return max;
  }, null);

  return (
    <div className="domain-delta-grid">
      {deltas.map((delta) => {
        const isVolatile =
          maxVolatile?.domain === delta.domain &&
          Math.abs(delta.stressDelta) >= STRESS_THRESHOLD;
        const color =
          DOMAIN_COLORS[delta.domain as DomainLayer] ?? "#888";
        const label =
          locale?.domains[delta.domain]?.label ??
          DOMAIN_LABELS[delta.domain as DomainLayer] ??
          delta.domain;

        return (
          <div
            key={delta.domain}
            className={`domain-delta-card${isVolatile ? " domain-delta-card--volatile" : ""}`}
          >
            <div className="domain-delta-card__header">
              <div
                className="domain-delta-card__dot"
                style={{ backgroundColor: color }}
              />
              <span className="domain-delta-card__name">{label}</span>
            </div>
            <StressDelta delta={delta.stressDelta} />
            <div className="domain-delta-card__resilience">
              {resLabel(delta.resilienceDelta)}
            </div>
            {isVolatile && (
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--accent-yellow)",
                  marginTop: "2px",
                }}
              >
                Most Volatile
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
