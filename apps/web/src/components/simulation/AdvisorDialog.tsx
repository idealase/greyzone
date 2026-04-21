import { useState } from "react";
import { requestAdvisorGuidance } from "../../api/advisor";
import { ACTION_TYPE_LABELS } from "../../types/action";
import { AdvisorResponse, AdvisorSuggestedAction, AdvisorSuggestion } from "../../types/advisor";
import { DomainLayer, DOMAIN_LABELS } from "../../types/domain";
import Dialog from "../common/Dialog";
import LoadingSpinner from "../common/LoadingSpinner";

interface AdvisorDialogProps {
  runId: string;
  roleId: string;
  canApply: boolean;
  onApplySuggestion?: (action: AdvisorSuggestedAction) => Promise<void>;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to get advisor guidance right now.";
}

function formatActionLabel(actionType: string): string {
  return ACTION_TYPE_LABELS[actionType] ?? actionType;
}

function formatDomainLabel(domain: AdvisorSuggestedAction["target_domain"]): string {
  return DOMAIN_LABELS[domain as DomainLayer] ?? String(domain);
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}% confidence`;
}

export default function AdvisorDialog({
  runId,
  roleId,
  canApply,
  onApplySuggestion,
}: AdvisorDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingRank, setIsApplyingRank] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [advisorResponse, setAdvisorResponse] = useState<AdvisorResponse | null>(null);

  async function loadAdvisorGuidance() {
    setIsLoading(true);
    setErrorMessage(null);
    setAdvisorResponse(null);
    try {
      const response = await requestAdvisorGuidance({
        run_id: runId,
        role_id: roleId,
      });
      setAdvisorResponse(response);
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenDialog() {
    setOpen(true);
    await loadAdvisorGuidance();
  }

  async function handleApplySuggestion(suggestion: AdvisorSuggestion) {
    if (!canApply || !onApplySuggestion) return;
    setErrorMessage(null);
    setIsApplyingRank(suggestion.rank);
    try {
      await onApplySuggestion(suggestion.action);
      setOpen(false);
    } catch (error) {
      setErrorMessage(`Failed to apply suggestion: ${normalizeErrorMessage(error)}`);
    } finally {
      setIsApplyingRank(null);
    }
  }

  return (
    <>
      <button className="btn btn--ghost btn--sm" type="button" onClick={handleOpenDialog}>
        AI Advisor
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="AI Advisor"
        actions={
          <div className="advisor-dialog__actions">
            <button className="btn btn--sm" type="button" onClick={() => setOpen(false)}>
              Close
            </button>
            <button
              className="btn btn--primary btn--sm"
              type="button"
              onClick={() => void loadAdvisorGuidance()}
              disabled={isLoading}
            >
              {isLoading ? "Requesting..." : "Refresh Guidance"}
            </button>
          </div>
        }
      >
        {isLoading && (
          <div className="advisor-dialog__loading">
            <LoadingSpinner size="sm" />
            <span>Requesting advisor guidance...</span>
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="advisor-dialog__error" role="alert">
            {errorMessage}
          </div>
        )}

        {advisorResponse && !isLoading && (
          <div className="advisor-dialog__content">
            <section className="advisor-dialog__section">
              <h4 className="advisor-dialog__heading">State Summary</h4>
              <p className="advisor-dialog__text">{advisorResponse.state_summary}</p>
            </section>

            <section className="advisor-dialog__section">
              <h4 className="advisor-dialog__heading">Strategic Outlook</h4>
              <p className="advisor-dialog__text">{advisorResponse.strategic_outlook}</p>
            </section>

            <section className="advisor-dialog__section">
              <h4 className="advisor-dialog__heading">Recommended Actions</h4>
              <ol className="advisor-dialog__suggestions">
                {advisorResponse.suggestions.map((suggestion) => (
                  <li key={`${suggestion.rank}-${suggestion.action.action_type}`} className="advisor-dialog__suggestion">
                    <div className="advisor-dialog__suggestion-header">
                      <span className="advisor-dialog__rank">#{suggestion.rank}</span>
                      <strong>{formatActionLabel(suggestion.action.action_type)}</strong>
                      <span className="advisor-dialog__domain">
                        {formatDomainLabel(suggestion.action.target_domain)}
                      </span>
                      <span className="advisor-dialog__confidence">
                        {formatConfidence(suggestion.confidence)}
                      </span>
                    </div>
                    <div className="advisor-dialog__meta">
                      Intensity: {suggestion.action.intensity.toFixed(1)}
                      {suggestion.action.target_actor
                        ? ` • Target: ${suggestion.action.target_actor}`
                        : ""}
                    </div>
                    <p className="advisor-dialog__rationale">{suggestion.rationale}</p>
                    {suggestion.expected_local_effects && (
                      <div className="advisor-dialog__effects">
                        {suggestion.expected_local_effects.summary && (
                          <div>{suggestion.expected_local_effects.summary}</div>
                        )}
                        {typeof suggestion.expected_local_effects.stress_delta === "number" && (
                          <div>Stress Δ: {suggestion.expected_local_effects.stress_delta.toFixed(2)}</div>
                        )}
                        {typeof suggestion.expected_local_effects.resilience_delta === "number" && (
                          <div>
                            Resilience Δ: {suggestion.expected_local_effects.resilience_delta.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                    {canApply && onApplySuggestion && (
                      <button
                        className="btn btn--primary btn--sm"
                        type="button"
                        onClick={() => void handleApplySuggestion(suggestion)}
                        disabled={isApplyingRank !== null}
                      >
                        {isApplyingRank === suggestion.rank ? "Applying..." : "Apply suggestion"}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </Dialog>
    </>
  );
}
