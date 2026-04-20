import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRunState } from "../hooks/useRunState";
import { useWebSocket } from "../hooks/useWebSocket";
import { useRunStore } from "../stores/runStore";
import SimulationDashboard from "../components/simulation/SimulationDashboard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConnectionBanner from "../components/common/ConnectionBanner";
import ErrorBoundary from "../components/common/ErrorBoundary";

export default function SimulationPage() {
  const { runId } = useParams<{ runId: string }>();
  const { runQuery, myRole, side } = useRunState(runId);
  useWebSocket(runId);

  const reset = useRunStore((s) => s.reset);
  useEffect(() => {
    reset();
    return () => reset(); // also reset on unmount
  }, [runId, reset]);

  if (runQuery.isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
        <span>Loading simulation...</span>
      </div>
    );
  }

  if (runQuery.error) {
    return (
      <div className="error-container">
        <div className="error-container__title">Failed to load simulation</div>
        <div className="error-container__message">
          {runQuery.error instanceof Error
            ? runQuery.error.message
            : "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="error-container">
          <div className="error-container__title">Simulation crashed</div>
          <div className="error-container__message">
            Please try reloading the page or rejoining the run.
          </div>
        </div>
      }
    >
      <ConnectionBanner />
      <SimulationDashboard
        runId={runId!}
        myRole={myRole}
        side={side as "blue" | "red"}
      />
    </ErrorBoundary>
  );
}
