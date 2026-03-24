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
  return (
    <div className="card">
      <div className="card__title">
        Available Actions
        {legalActions.length > 0 && (
          <span
            className="badge badge--blue"
            style={{ marginLeft: "0.5rem" }}
          >
            {legalActions.length}
          </span>
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
              key={`${action.action_type}-${action.target_domain}-${idx}`}
              action={action}
              onSubmit={(intensity) =>
                onSubmit({
                  user_id: "",
                  action_type: action.action_type,
                  target_domain: action.target_domain,
                  target_actor: action.target_actor,
                  intensity,
                })
              }
              isSubmitting={isSubmitting}
              side={side}
            />
          ))
        )}
      </div>
    </div>
  );
}
