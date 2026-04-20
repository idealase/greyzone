import { useState } from "react";
import Dialog from "../common/Dialog";
import ActionCard from "./ActionCard";
import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS } from "../../types/domain";
import { LegalAction } from "../../types/run";
import { ActionSubmit } from "../../types/action";

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  domain: DomainLayer;
  legalActions: LegalAction[];
  onSubmit: (action: Omit<ActionSubmit, "run_id">) => void;
  isSubmitting: boolean;
  side: "blue" | "red";
}

export default function ActionModal({
  open,
  onClose,
  domain,
  legalActions,
  onSubmit,
  isSubmitting,
  side,
}: ActionModalProps) {
  const [expandAll, setExpandAll] = useState(false);

  const filtered = legalActions.filter((a) =>
    (a.available_layers ?? []).includes(domain)
  );

  const color = DOMAIN_COLORS[domain];
  const label = DOMAIN_LABELS[domain];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title=""
      actions={
        <button className="btn btn--secondary btn--sm" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="action-modal__header">
        <span
          className="action-modal__domain-dot"
          style={{ backgroundColor: color }}
        />
        <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>{label} Actions</span>
        {filtered.length > 0 && (
          <button
            className="btn btn--xs btn--ghost"
            onClick={() => setExpandAll((v) => !v)}
            style={{ marginLeft: "auto", fontSize: "0.72rem" }}
          >
            {expandAll ? "▲ Collapse All" : "▼ Expand All"}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="action-modal__empty">
          No actions available targeting {label} this turn.
        </div>
      ) : (
        <>
          <p className="action-modal__count">
            {filtered.length} action{filtered.length !== 1 ? "s" : ""} available
          </p>
          <div className="action-modal__list">
            {filtered.map((action, idx) => (
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
                initialDomain={domain}
              />
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}
