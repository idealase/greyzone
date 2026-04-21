import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRun, getLegalActions } from "../api/runs";
import { useRunStore } from "../stores/runStore";
import { useAuthStore } from "../stores/authStore";
import { DomainLayer, LayerState } from "../types/domain";
import { Role } from "../types/run";

export function useRunState(runId: string | undefined) {
  const { setRun, setLegalActions, addStressSnapshot, addPsiSnapshot, run } = useRunStore();
  const user = useAuthStore((s) => s.user);

  const runQuery = useQuery({
    queryKey: ["run", runId],
    queryFn: () => getRun(runId!),
    enabled: !!runId,
    refetchInterval: false,
  });

  useEffect(() => {
    if (runQuery.data) {
      setRun(runQuery.data);
      if (runQuery.data.world_state) {
        addStressSnapshot(
          runQuery.data.current_turn,
          runQuery.data.world_state.layers as Record<DomainLayer, LayerState>
        );
        addPsiSnapshot(
          runQuery.data.current_turn,
          runQuery.data.order_parameter ?? 0,
          runQuery.data.current_phase,
        );
      }
    }
  }, [runQuery.data, setRun, addStressSnapshot, addPsiSnapshot]);

  const myParticipant = run?.participants.find((p) => p.user_id === user?.id);
  // role_id is always present; .role may arrive as empty string — prefer role_id
  const myRole = myParticipant
    ? ((myParticipant.role_id || myParticipant.role) as Role)
    : undefined;
  const side = myRole === "red_commander" ? "red" : "blue";

  const legalActionsQuery = useQuery({
    queryKey: ["legalActions", runId, side],
    queryFn: () => getLegalActions(runId!, side as "blue" | "red"),
    enabled: !!runId && !!run && run.status === "in_progress" && myRole !== "observer",
    refetchInterval: false,
  });

  useEffect(() => {
    if (legalActionsQuery.data) {
      setLegalActions(legalActionsQuery.data);
    }
  }, [legalActionsQuery.data, setLegalActions]);

  return {
    runQuery,
    legalActionsQuery,
    myRole,
    side,
    refetchRun: runQuery.refetch,
    refetchLegalActions: legalActionsQuery.refetch,
  };
}
