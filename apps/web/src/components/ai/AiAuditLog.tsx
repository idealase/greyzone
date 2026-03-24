import { AiMoveResult } from "../../types/action";
import { DOMAIN_LABELS } from "../../types/domain";

interface AiAuditLogProps {
  moves: AiMoveResult[];
}

export default function AiAuditLog({ moves }: AiAuditLogProps) {
  if (moves.length === 0) {
    return (
      <div className="card">
        <div className="card__title">AI Audit Log</div>
        <div className="card__body text-center">No AI moves recorded.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__title">AI Audit Log</div>
      <div className="mt-1" style={{ maxHeight: 400, overflowY: "auto" }}>
        {moves.map((move, idx) => (
          <div key={idx} className="ai-audit-entry">
            <div className="ai-audit-entry__turn">
              Turn {move.action.turn} -- {move.action.side.toUpperCase()}
            </div>
            <div className="ai-audit-entry__action">
              {move.action.action_type} --{" "}
              {DOMAIN_LABELS[move.action.target_domain]} @{" "}
              {move.action.intensity.toFixed(1)}
            </div>
            <div className="ai-audit-entry__rationale">{move.rationale}</div>
            {move.tool_calls.length > 0 && (
              <div style={{ marginTop: "0.35rem" }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Tool calls:
                </span>
                {move.tool_calls.map((tc, tIdx) => (
                  <div
                    key={tIdx}
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    {tc.tool_name}({JSON.stringify(tc.arguments)}) --{" "}
                    {tc.result.slice(0, 80)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
