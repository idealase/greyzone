import { useState, useEffect, useCallback, useRef } from "react";
import { TurnEvent } from "../../types/run";
import { ACTION_TYPE_LABELS } from "../../types/action";
import { DomainLayer, DOMAIN_LABELS } from "../../types/domain";
import Dialog from "../common/Dialog";

interface TurnControlsProps {
  turn: number;
  isAdvancing: boolean;
  onAdvanceTurn: () => void;
  isObserver: boolean;
  /** Events for the current turn to display in the confirmation dialog */
  currentTurnEvents?: TurnEvent[];
  /** Remaining resource points, if available */
  resources?: number | null;
}

const STORAGE_KEY = "greyzone-skip-turn-confirm";

function getIntensityTier(intensity: number): string {
  if (intensity < 0.3) return "Probe";
  if (intensity < 0.6) return "Assert";
  if (intensity < 0.8) return "Coerce";
  return "Maximum Pressure";
}

function parseActionEvent(desc: string): {
  actionType: string;
  domain: string;
  intensity: string;
} | null {
  const match = desc.match(
    /^Executed (.+?) on (.+?) \(intensity: (.+?)\)$/
  );
  if (!match) return null;
  return { actionType: match[1], domain: match[2], intensity: match[3] };
}

export default function TurnControls({
  turn,
  isAdvancing,
  onAdvanceTurn,
  isObserver,
  currentTurnEvents = [],
  resources = null,
}: TurnControlsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const confirmRef = useRef<HTMLButtonElement>(null);

  const submittedActions = currentTurnEvents.filter(
    (e) => e.type === "action" && e.turn === turn
  );

  const handleEndTurnClick = useCallback(() => {
    if (skipConfirm) {
      onAdvanceTurn();
    } else {
      setShowDialog(true);
    }
  }, [skipConfirm, onAdvanceTurn]);

  const handleConfirm = useCallback(() => {
    setShowDialog(false);
    onAdvanceTurn();
  }, [onAdvanceTurn]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  const handleSkipChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setSkipConfirm(checked);
      try {
        if (checked) {
          localStorage.setItem(STORAGE_KEY, "true");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // localStorage unavailable
      }
    },
    []
  );

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (showDialog) {
      requestAnimationFrame(() => confirmRef.current?.focus());
    }
  }, [showDialog]);

  // Compute affected domains
  const affectedDomains = new Set<string>();
  let totalCost = 0;
  for (const evt of submittedActions) {
    if (evt.domain) affectedDomains.add(DOMAIN_LABELS[evt.domain as DomainLayer] ?? evt.domain);
    const costMatch = evt.description.match(/(\d+)\s*RP/i);
    if (costMatch) totalCost += parseInt(costMatch[1], 10);
  }

  return (
    <div className="turn-controls">
      <span className="turn-controls__counter">Turn {turn}</span>
      {!isObserver && (
        <>
          <div className="turn-preflight">
            {submittedActions.length === 0 ? (
              <span className="turn-preflight__empty">No actions queued</span>
            ) : (
              <span className="turn-preflight__summary">
                {submittedActions.length} action{submittedActions.length !== 1 ? "s" : ""}
                {affectedDomains.size > 0 && (
                  <span className="turn-preflight__domains">
                    {" · "}{[...affectedDomains].join(", ")}
                  </span>
                )}
                {totalCost > 0 && (
                  <span className="turn-preflight__cost"> · {totalCost} RP</span>
                )}
              </span>
            )}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleEndTurnClick}
            disabled={isAdvancing}
          >
            {isAdvancing ? "Advancing..." : "End Turn"}
          </button>
        </>
      )}

      <Dialog
        open={showDialog}
        onClose={handleCancel}
        title={`End Turn ${turn}?`}
        actions={
          <div className="turn-confirm__actions">
            <label className="turn-confirm__skip">
              <input
                type="checkbox"
                checked={skipConfirm}
                onChange={handleSkipChange}
              />
              Don&apos;t show again
            </label>
            <div className="turn-confirm__buttons">
              <button
                className="btn btn--sm"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                className="btn btn--primary btn--sm"
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        }
      >
        {submittedActions.length === 0 ? (
          <div className="turn-confirm__warning">
            ⚠ You haven&apos;t submitted any actions this turn. Are you sure?
          </div>
        ) : (
          <div className="turn-confirm__section">
            <div className="turn-confirm__heading">
              Actions submitted ({submittedActions.length})
            </div>
            <ul className="turn-confirm__list">
              {submittedActions.map((evt) => {
                const parsed = parseActionEvent(evt.description);
                const domainLabel = evt.domain
                  ? DOMAIN_LABELS[evt.domain as DomainLayer] ?? evt.domain
                  : null;
                return (
                  <li key={evt.id} className="turn-confirm__item">
                    <span className="turn-confirm__action-type">
                      {parsed?.actionType ?? evt.description}
                    </span>
                    {domainLabel && (
                      <span className="turn-confirm__domain">
                        {domainLabel}
                      </span>
                    )}
                    {parsed?.intensity && (
                      <span className="turn-confirm__tier">
                        {getIntensityTier(parseFloat(parsed.intensity))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {resources !== null && (
          <div className="turn-confirm__resources">
            Remaining resources: <strong>{Math.round(resources)} RP</strong>
          </div>
        )}
      </Dialog>
    </div>
  );
}
