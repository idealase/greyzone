interface ReplayControlsProps {
  currentTurn: number;
  totalTurns: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onStepForward: () => void;
  onStepBackward: () => void;
  onGoToTurn: (turn: number) => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
}

export default function ReplayControls({
  currentTurn,
  totalTurns,
  isPlaying,
  playbackSpeed,
  onStepForward,
  onStepBackward,
  onGoToTurn,
  onTogglePlay,
  onSetSpeed,
}: ReplayControlsProps) {
  return (
    <div className="replay-controls">
      <button
        className="btn btn--sm"
        onClick={onStepBackward}
        disabled={currentTurn <= 0}
        title="Step back"
      >
        &laquo; Prev
      </button>

      <button className="btn btn--sm btn--primary" onClick={onTogglePlay}>
        {isPlaying ? "Pause" : "Play"}
      </button>

      <button
        className="btn btn--sm"
        onClick={onStepForward}
        disabled={currentTurn >= totalTurns - 1}
        title="Step forward"
      >
        Next &raquo;
      </button>

      <div className="replay-controls__slider">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalTurns - 1)}
          value={currentTurn}
          onChange={(e) => onGoToTurn(parseInt(e.target.value, 10))}
          style={{ width: "100%" }}
        />
      </div>

      <span
        className="turn-controls__counter"
        style={{ minWidth: "80px", textAlign: "center" }}
      >
        Turn {currentTurn} / {totalTurns - 1}
      </span>

      <div className="replay-controls__speed">
        <span>Speed:</span>
        {[0.5, 1, 2, 4].map((speed) => (
          <button
            key={speed}
            className={`btn btn--sm${
              playbackSpeed === speed ? " btn--primary" : ""
            }`}
            onClick={() => onSetSpeed(speed)}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}
