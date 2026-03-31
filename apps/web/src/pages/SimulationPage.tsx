import { useParams } from "react-router-dom";
import { useRunState } from "../hooks/useRunState";
import { useWebSocket } from "../hooks/useWebSocket";
import SimulationDashboard from "../components/simulation/SimulationDashboard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConnectionBanner from "../components/common/ConnectionBanner";

export default function SimulationPage() {
  const { runId } = useParams<{ runId: string }>();
  const { runQuery, myRole, side } = useRunState(runId);
  useWebSocket(runId);

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
    <>
      <ConnectionBanner />
      <SimulationDashboard
        runId={runId!}
        myRole={myRole}
        side={side as "blue" | "red"}
      />
    </>
  );
}
