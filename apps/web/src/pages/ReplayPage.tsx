import { useParams } from "react-router-dom";
import { useReplay } from "../hooks/useReplay";
import ReplayView from "../components/replay/ReplayView";
import ReplayControls from "../components/replay/ReplayControls";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ReplayPage() {
  const { runId } = useParams<{ runId: string }>();
  const replay = useReplay(runId);

  if (replay.isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
        <span>Loading replay data...</span>
      </div>
    );
  }

  if (replay.error) {
    return (
      <div className="error-container">
        <div className="error-container__title">Failed to load replay</div>
        <div className="error-container__message">
          {replay.error instanceof Error
            ? replay.error.message
            : "Unknown error"}
        </div>
      </div>
    );
  }

  if (!replay.replayData) {
    return (
      <div className="error-container">
        <div className="error-container__message">No replay data available</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">
          Replay: {replay.replayData.scenario_name}
        </h1>
        <p className="page-header__subtitle">
          {replay.replayData.total_turns} turns recorded
        </p>
      </div>

      <ReplayControls
        currentTurn={replay.currentTurn}
        totalTurns={replay.totalTurns}
        isPlaying={replay.isPlaying}
        playbackSpeed={replay.playbackSpeed}
        onStepForward={replay.stepForward}
        onStepBackward={replay.stepBackward}
        onGoToTurn={replay.goToTurn}
        onTogglePlay={replay.togglePlay}
        onSetSpeed={replay.setPlaybackSpeed}
      />

      <div className="mt-2">
        <ReplayView turnData={replay.currentTurnData} />
      </div>
    </div>
  );
}
