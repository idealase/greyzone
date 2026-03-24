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
  const totalTurns = replayData?.total_turns ?? 0;
  const currentTurnData = replayData?.turns[currentTurn] ?? null;

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
    isPlaying,
    playbackSpeed,
    stepForward,
    stepBackward,
    goToTurn,
    togglePlay,
    setPlaybackSpeed,
  };
}
