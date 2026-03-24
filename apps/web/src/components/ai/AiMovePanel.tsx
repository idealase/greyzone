import { AiMoveResult } from "../../types/action";
import { DOMAIN_LABELS } from "../../types/domain";

interface AiMovePanelProps {
  latestMove: AiMoveResult;
}

export default function AiMovePanel({ latestMove }: AiMovePanelProps) {
  const { action, rationale, validation } = latestMove;

  return (
    <div className="ai-move-panel">
      <div className="ai-move-panel__title">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent-purple)",
            display: "inline-block",
          }}
        />
        AI Move
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {action.action_type}
        </span>
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            marginLeft: "0.5rem",
          }}
        >
          {DOMAIN_LABELS[action.target_domain]} @ {action.intensity.toFixed(1)}
        </span>
      </div>

      <div className="ai-move-panel__rationale">{rationale}</div>

      <div
        className="ai-move-panel__validation"
        style={{
          color: validation.is_valid
            ? "var(--accent-green)"
            : "var(--accent-red)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: validation.is_valid
              ? "var(--accent-green)"
              : "var(--accent-red)",
            display: "inline-block",
          }}
        />
        {validation.message}
      </div>
    </div>
  );
}
