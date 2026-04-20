import { useState, useEffect, useCallback } from "react";
import { LegalAction } from "../../types/run";
import { ActionSubmit } from "../../types/action";
import ActionCard from "./ActionCard";

interface ActionPanelProps {
  legalActions: LegalAction[];
  onSubmit: (action: Omit<ActionSubmit, "run_id">) => void;
  isSubmitting: boolean;
  side: "blue" | "red";
}

export default function ActionPanel({
  legalActions,
  onSubmit,
  isSubmitting,
  side,
}: ActionPanelProps) {
  const [expandAll, setExpandAll] = useState(false);

  // Keyboard shortcut: 'e' toggles expand all
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.key === "e" &&
      !e.ctrlKey && !e.metaKey && !e.altKey &&
      !(e.target instanceof HTMLInputElement) &&
      !(e.target instanceof HTMLTextAreaElement) &&
      !(e.target instanceof HTMLSelectElement)
    ) {
      setExpandAll((v) => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="card">
      <div className="card__title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          Available Actions
          {legalActions.length > 0 && (
            <span
              className="badge badge--blue"
              style={{ marginLeft: "0.5rem" }}
            >
              {legalActions.length}
            </span>
          )}
        </span>
        {legalActions.length > 0 && (
          <button
            className="btn btn--xs btn--ghost"
            onClick={() => setExpandAll((v) => !v)}
            title="Toggle all details (E)"
            style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem" }}
          >
            {expandAll ? "▲ Collapse All" : "▼ Expand All"}
          </button>
        )}
      </div>
      <div className="mt-1" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {legalActions.length === 0 ? (
          <div className="card__body text-center">
            No actions available this turn.
          </div>
        ) : (
          legalActions.map((action, idx) => (
            <ActionCard
              key={`${action.action_type}-${action.actor_id ?? ""}-${idx}`}
              action={action}
              onSubmit={(intensity, selectedDomain) =>
                onSubmit({
                  user_id: "",
                  action_type: action.action_type,
                  target_domain: selectedDomain,
                  target_actor: action.actor_id ?? action.target_actor ?? null,
                  intensity,
                })
              }
              isSubmitting={isSubmitting}
              side={side}
              forceExpand={expandAll}
            />
          ))
        )}
      </div>
    </div>
  );
}
