import { useState, useMemo } from "react";
import { AiMoveResult, ACTION_TYPE_LABELS } from "../../types/action";
import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS } from "../../types/domain";

interface AiMovePanelProps {
  moves: AiMoveResult[];
}

function getConfidenceLevel(confidence?: number): { label: string; color: string } {
  if (confidence == null) return { label: "N/A", color: "var(--text-muted)" };
  if (confidence >= 0.7) return { label: "High", color: "#22c55e" };
  if (confidence >= 0.4) return { label: "Medium", color: "#eab308" };
  return { label: "Low", color: "#ef4444" };
}

function narrativeFrame(action: AiMoveResult["action"]): string {
  const domain = DOMAIN_LABELS[action.target_domain] ?? action.target_domain;
  const aType = ACTION_TYPE_LABELS[action.action_type] ?? action.action_type;
  const intensity = action.intensity >= 0.7 ? "major" : action.intensity >= 0.4 ? "moderate" : "minor";
  return `SIGINT INTERCEPT: Red Commander executed ${intensity} ${aType} targeting ${domain} infrastructure`;
}

export default function AiMovePanel({ moves }: AiMovePanelProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showToolCalls, setShowToolCalls] = useState<number | null>(null);

  // Domain targeting frequency
  const domainFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const m of moves) {
      const d = m.action.target_domain;
      freq[d] = (freq[d] ?? 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1]);
  }, [moves]);

  const maxFreq = domainFreq.length > 0 ? domainFreq[0][1] : 1;

  if (moves.length === 0) return null;

  return (
    <div className="ai-panel card">
      <div className="card__title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-purple)", display: "inline-block", marginRight: "0.4rem" }} />
          Intelligence Report
        </span>
        <span className="ai-panel__count">{moves.length} intercept{moves.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Domain targeting heatmap */}
      {domainFreq.length > 1 && (
        <div className="ai-panel__heatmap">
          <div className="ai-panel__heatmap-title">AI Domain Focus</div>
          <div className="ai-panel__heatmap-bars">
            {domainFreq.map(([domain, count]) => (
              <div key={domain} className="ai-panel__heatmap-row">
                <span className="ai-panel__heatmap-label">{DOMAIN_LABELS[domain as DomainLayer] ?? domain}</span>
                <div className="ai-panel__heatmap-bar">
                  <div
                    className="ai-panel__heatmap-fill"
                    style={{
                      width: `${(count / maxFreq) * 100}%`,
                      background: DOMAIN_COLORS[domain as DomainLayer] ?? "var(--primary)",
                    }}
                  />
                </div>
                <span className="ai-panel__heatmap-val">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Move history */}
      <div className="ai-panel__history">
        {moves.map((move, idx) => {
          const { action, rationale, validation, tool_calls } = move;
          const conf = getConfidenceLevel((move as unknown as Record<string, unknown>).confidence as number | undefined);
          const isExpanded = expandedIdx === idx;
          const showTools = showToolCalls === idx;
          const aLabel = ACTION_TYPE_LABELS[action.action_type] ?? action.action_type;

          return (
            <div
              key={`${action.id}-${idx}`}
              className={`ai-move ${isExpanded ? "ai-move--expanded" : ""} ${idx === 0 ? "ai-move--latest" : ""}`}
            >
              <div
                className="ai-move__header"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedIdx(isExpanded ? null : idx); } }}
              >
                <span className="ai-move__turn">T{action.turn}</span>
                <span className="ai-move__type">{aLabel}</span>
                <span className="ai-move__domain">{DOMAIN_LABELS[action.target_domain]}</span>
                <span className="ai-move__intensity">@{action.intensity.toFixed(1)}</span>
                <span className="ai-move__conf" style={{ color: conf.color }}>{conf.label}</span>
                <span
                  className="ai-move__valid"
                  style={{ color: validation.is_valid ? "var(--accent-green)" : "var(--accent-red)" }}
                >
                  {validation.is_valid ? "✓" : "✗"}
                </span>
                <span className="ai-move__chevron">{isExpanded ? "▾" : "▸"}</span>
              </div>

              {/* Intel narrative */}
              {idx === 0 && (
                <div className="ai-move__narrative">{narrativeFrame(action)}</div>
              )}

              {isExpanded && (
                <div className="ai-move__detail" onClick={(e) => e.stopPropagation()}>
                  <div className="ai-move__rationale">
                    <strong>Rationale:</strong> {rationale}
                  </div>

                  <div className="ai-move__validation-msg" style={{ color: validation.is_valid ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {validation.message}
                  </div>

                  {tool_calls.length > 0 && (
                    <div className="ai-move__tools">
                      <button
                        className="btn btn--sm btn--ghost"
                        onClick={() => setShowToolCalls(showTools ? null : idx)}
                      >
                        {showTools ? "Hide" : "Show"} Tool Calls ({tool_calls.length})
                      </button>

                      {showTools && (
                        <div className="ai-move__tool-timeline">
                          {tool_calls.map((tc, ti) => (
                            <div key={ti} className="ai-tool-call">
                              <span className="ai-tool-call__name">{tc.tool_name}</span>
                              <span className="ai-tool-call__result">{tc.result.length > 80 ? tc.result.slice(0, 80) + "…" : tc.result}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
