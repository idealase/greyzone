interface TurnControlsProps {
  turn: number;
  isAdvancing: boolean;
  onAdvanceTurn: () => void;
  isObserver: boolean;
}

export default function TurnControls({
  turn,
  isAdvancing,
  onAdvanceTurn,
  isObserver,
}: TurnControlsProps) {
  return (
    <div className="turn-controls">
      <span className="turn-controls__counter">Turn {turn}</span>
      {!isObserver && (
        <button
          className="btn btn--primary"
          onClick={onAdvanceTurn}
          disabled={isAdvancing}
        >
          {isAdvancing ? "Advancing..." : "End Turn"}
        </button>
      )}
    </div>
  );
}
