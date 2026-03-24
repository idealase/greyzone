import { useState } from "react";
import { LegalAction } from "../../types/run";
import { DOMAIN_LABELS } from "../../types/domain";
import { MIN_INTENSITY, MAX_INTENSITY, INTENSITY_STEP } from "../../utils/constants";

interface ActionCardProps {
  action: LegalAction;
  onSubmit: (intensity: number) => void;
  isSubmitting: boolean;
  side: "blue" | "red";
}

export default function ActionCard({
  action,
  onSubmit,
  isSubmitting,
  side,
}: ActionCardProps) {
  const [intensity, setIntensity] = useState(
    (action.min_intensity + action.max_intensity) / 2
  );

  return (
    <div className="action-card">
      <div className="action-card__header">
        <span className="action-card__type">{action.action_type}</span>
        <span className="action-card__domain">
          {DOMAIN_LABELS[action.target_domain]}
        </span>
      </div>
      <div className="action-card__description">{action.description}</div>
      <div className="action-card__controls">
        <div className="action-card__slider" style={{ flex: 1 }}>
          <input
            type="range"
            min={action.min_intensity || MIN_INTENSITY}
            max={action.max_intensity || MAX_INTENSITY}
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
            <span>{(action.min_intensity || MIN_INTENSITY).toFixed(1)}</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {intensity.toFixed(1)}
            </span>
            <span>{(action.max_intensity || MAX_INTENSITY).toFixed(1)}</span>
          </div>
        </div>
        <button
          className={`btn btn--sm ${
            side === "red" ? "btn--danger" : "btn--primary"
          }`}
          onClick={() => onSubmit(intensity)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "..." : "Execute"}
        </button>
      </div>
    </div>
  );
}
