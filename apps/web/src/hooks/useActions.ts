import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { submitAction } from "../api/actions";
import { advanceTurn } from "../api/runs";
import { useRunStore } from "../stores/runStore";
import { ActionSubmit } from "../types/action";
import { DomainLayer, LayerState } from "../types/domain";
import { TurnEvent } from "../types/run";

function generateId(): string {
  return "evt-" + Math.random().toString(36).slice(2, 11);
}

export function useActions(runId: string | undefined) {
  const queryClient = useQueryClient();
  const { setWorldState, addEvents, addStressSnapshot, setIsAdvancingTurn, currentTurn } =
    useRunStore();
  const advanceAbortController = useRef<AbortController | null>(null);

  const submitActionMutation = useMutation({
    mutationFn: (data: ActionSubmit) => submitAction(data),
    onSuccess: (_result, variables) => {
      // Add a synthetic event for instant feedback
      const syntheticEvent: TurnEvent = {
        id: generateId(),
        type: "action",
        description: `You executed ${variables.action_type} on ${variables.target_domain} (intensity: ${variables.intensity.toFixed(1)})`,
        domain: (variables.target_domain as DomainLayer) || null,
        actor: null,
        turn: currentTurn,
        visibility: "all",
      };
      addEvents([syntheticEvent]);

      if (runId) {
        queryClient.invalidateQueries({ queryKey: ["actions", runId] });
      }
    },
  });

  const advanceTurnMutation = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error("No run ID");
      advanceAbortController.current?.abort();
      advanceAbortController.current = new AbortController();
      setIsAdvancingTurn(true);
      return advanceTurn(runId, advanceAbortController.current.signal);
    },
    onSuccess: (result) => {
      setWorldState(result.world_state);
      addEvents(result.events);
      if (result.world_state?.layers) {
        addStressSnapshot(
          result.turn,
          result.world_state.layers as Record<DomainLayer, LayerState>
        );
      }
      if (runId) {
        queryClient.invalidateQueries({ queryKey: ["run", runId] });
        queryClient.invalidateQueries({ queryKey: ["legalActions", runId] });
      }
    },
    onError: (error) => {
      setIsAdvancingTurn(false);
      if ((error as Error)?.name === "CanceledError") {
        return;
      }
      const description =
        error instanceof Error ? error.message : "Failed to advance turn";
      addEvents([
        {
          id: generateId(),
          type: "stochastic",
          description: `Advance turn failed: ${description}`,
          domain: null,
          actor: null,
          turn: currentTurn,
          visibility: "all",
        },
      ]);
    },
    onSettled: () => {
      setIsAdvancingTurn(false);
      advanceAbortController.current = null;
    },
  });

  useEffect(() => {
    return () => {
      advanceAbortController.current?.abort();
    };
  }, []);

  return {
    submitAction: submitActionMutation.mutate,
    isSubmitting: submitActionMutation.isPending,
    submitError: submitActionMutation.error,
    advanceTurn: advanceTurnMutation.mutate,
    isAdvancing: advanceTurnMutation.isPending,
    advanceError: advanceTurnMutation.error,
  };
}
