import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReplayData, ReplayData } from "../api/replay";

export function useReplay(runId: string | undefined) {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const replayQuery = useQuery({
    queryKey: ["replay", runId],
    queryFn: () => getReplayData(runId!),
    enabled: !!runId,
  });

  const replayData: ReplayData | undefined = replayQuery.data;
  const turns = replayData?.turns ?? [];
  const totalTurns = replayData?.total_turns ?? turns.length;
  const missingTurns = replayData?.missing_turns ?? [];
  const currentTurnData =
    totalTurns > 0 && currentTurn < turns.length
      ? turns[currentTurn]
      : turns[turns.length - 1] ?? null;

  useEffect(() => {
    if (totalTurns === 0 && currentTurn !== 0) {
      setCurrentTurn(0);
    } else if (totalTurns > 0 && currentTurn > totalTurns - 1) {
      setCurrentTurn(Math.max(0, totalTurns - 1));
    }
  }, [currentTurn, totalTurns]);

  const stepForward = useCallback(() => {
    setCurrentTurn((prev) => Math.min(prev + 1, totalTurns - 1));
  }, [totalTurns]);

  const stepBackward = useCallback(() => {
    setCurrentTurn((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToTurn = useCallback(
    (turn: number) => {
      setCurrentTurn(Math.max(0, Math.min(turn, totalTurns - 1)));
    },
    [totalTurns]
  );

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const snapshotWarning =
    replayData && totalTurns === 0
      ? "No snapshots are available for this run, so replay cannot be shown."
      : missingTurns.length > 0
        ? `Replay data is incomplete. Missing turns: ${missingTurns.join(", ")}.`
        : null;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTurn((prev) => {
          if (prev >= totalTurns - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / playbackSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalTurns]);

  return {
    replayData,
    isLoading: replayQuery.isLoading,
    error: replayQuery.error,
    currentTurn,
    currentTurnData,
    totalTurns,
    missingTurns,
    isPlaying,
    playbackSpeed,
    snapshotWarning,
    stepForward,
    stepBackward,
    goToTurn,
    togglePlay,
    setPlaybackSpeed,
  };
}
