import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitAction } from "../api/actions";
import { advanceTurn } from "../api/runs";
import { useRunStore } from "../stores/runStore";
import { ActionSubmit } from "../types/action";
import { DomainLayer, LayerState } from "../types/domain";

export function useActions(runId: string | undefined) {
  const queryClient = useQueryClient();
  const { setWorldState, addEvents, addStressSnapshot, setIsAdvancingTurn } =
    useRunStore();

  const submitActionMutation = useMutation({
    mutationFn: (data: ActionSubmit) => submitAction(data),
    onSuccess: () => {
      if (runId) {
        queryClient.invalidateQueries({ queryKey: ["actions", runId] });
      }
    },
  });

  const advanceTurnMutation = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error("No run ID");
      setIsAdvancingTurn(true);
      return advanceTurn(runId);
    },
    onSuccess: (result) => {
      setWorldState(result.world_state);
      addEvents(result.events);
      addStressSnapshot(
        result.turn,
        result.world_state.layers as Record<DomainLayer, LayerState>
      );
      if (runId) {
        queryClient.invalidateQueries({ queryKey: ["run", runId] });
        queryClient.invalidateQueries({ queryKey: ["legalActions", runId] });
      }
    },
    onSettled: () => {
      setIsAdvancingTurn(false);
    },
  });

  return {
    submitAction: submitActionMutation.mutate,
    isSubmitting: submitActionMutation.isPending,
    submitError: submitActionMutation.error,
    advanceTurn: advanceTurnMutation.mutate,
    isAdvancing: advanceTurnMutation.isPending,
    advanceError: advanceTurnMutation.error,
  };
}
