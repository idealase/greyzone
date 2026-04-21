import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { submitAction } from "../api/actions";
import { advanceTurn } from "../api/runs";
import { useAuthStore } from "../stores/authStore";
import { useRunStore } from "../stores/runStore";
import { ActionSubmit, ACTION_TYPE_LABELS, AiMoveResult } from "../types/action";
import { DomainLayer, DOMAIN_LABELS, LayerState } from "../types/domain";
import { TurnEvent } from "../types/run";

function generateId(): string {
  return "evt-" + Math.random().toString(36).slice(2, 11);
}

export function useActions(runId: string | undefined) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const advanceAbortController = useRef<AbortController | null>(null);

  // Use getState() inside callbacks to avoid subscribing to every store change
  const storeRef = useRef(useRunStore.getState());
  useEffect(() => {
    storeRef.current = useRunStore.getState();
  });
  const store = () => storeRef.current;

  const submitActionMutation = useMutation({
    mutationFn: (data: ActionSubmit) => submitAction({ ...data, user_id: user?.id ?? "" }),
    onSuccess: (_result, variables) => {
      const syntheticEvent: TurnEvent = {
        id: generateId(),
        type: "action",
        description: `Executed ${ACTION_TYPE_LABELS[variables.action_type] ?? variables.action_type} on ${DOMAIN_LABELS[variables.target_domain as DomainLayer] ?? variables.target_domain} (intensity: ${variables.intensity.toFixed(1)})`,
        domain: (variables.target_domain as DomainLayer) || null,
        actor: null,
        turn: store().currentTurn,
        visibility: "all",
      };
      store().addEvents([syntheticEvent]);

      if (runId) {
        queryClient.invalidateQueries({ queryKey: ["actions", runId] });
        queryClient.invalidateQueries({ queryKey: ["run", runId] });
      }
    },
  });

  const advanceTurnMutation = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error("No run ID");
      advanceAbortController.current?.abort();
      advanceAbortController.current = new AbortController();
      store().setIsAdvancingTurn(true);
      return advanceTurn(runId, advanceAbortController.current.signal);
    },
    onSuccess: (result) => {
      store().setWorldState(result.world_state);
      store().addEvents(result.events);
      if (result.world_state?.layers) {
        store().addStressSnapshot(
          result.turn,
          result.world_state.layers as Record<DomainLayer, LayerState>
        );
      }
      store().addPsiSnapshot(
        result.turn,
        result.world_state?.order_parameter ?? store().orderParameter,
        result.world_state?.phase ?? store().currentPhase,
      );

      // Create synthetic events from narrative data
      const syntheticEvents: TurnEvent[] = [];

      if (result.narrative) {
        syntheticEvents.push({
          id: generateId(),
          type: "narrative",
          description: `📰 ${result.narrative.headline}`,
          domain: null,
          actor: null,
          turn: result.turn,
          visibility: "all",
        });

        if (result.narrative.threat_assessment) {
          syntheticEvents.push({
            id: generateId(),
            type: "threat",
            description: `⚠️ ${result.narrative.threat_assessment}`,
            domain: null,
            actor: null,
            turn: result.turn,
            visibility: "all",
          });
        }

        if (result.narrative.intelligence_note) {
          syntheticEvents.push({
            id: generateId(),
            type: "intel",
            description: `🔍 ${result.narrative.intelligence_note}`,
            domain: null,
            actor: null,
            turn: result.turn,
            visibility: "all",
          });
        }

        // Highlight significant domain changes
        for (const highlight of result.narrative.domain_highlights) {
          if (Math.abs(highlight.delta) >= 3) {
            const arrow = highlight.direction === "rising" ? "📈" : highlight.direction === "falling" ? "📉" : "➡️";
            syntheticEvents.push({
              id: generateId(),
              type: "stochastic",
              description: `${arrow} ${highlight.label}: ${highlight.note}`,
              domain: (highlight.domain as DomainLayer) || null,
              actor: null,
              turn: result.turn,
              visibility: "all",
            });
          }
        }
      }

      // Create events for AI actions
      if (result.ai_actions?.length) {
        for (const aiAction of result.ai_actions) {
          syntheticEvents.push({
            id: generateId(),
            type: "ai_action",
            description: `🤖 ${aiAction.description}`,
            domain: (aiAction.layer as DomainLayer) || null,
            actor: aiAction.role_id,
            turn: result.turn,
            visibility: "all",
          });

          const aiMove: AiMoveResult = {
            action: {
              id: generateId(),
              run_id: runId ?? "",
              user_id: "",
              username: aiAction.role_id ?? "AI",
              action_type: aiAction.action_type ?? aiAction.description,
              target_domain: (aiAction.layer as DomainLayer) ?? DomainLayer.Kinetic,
              target_actor: null,
              intensity: aiAction.intensity ?? 0.5,
              turn: result.turn,
              side: "red",
              submitted_at: new Date().toISOString(),
            },
            rationale: `${aiAction.role_id} selected ${aiAction.action_type ?? "action"} targeting ${aiAction.layer}`,
            tool_calls: [],
            validation: { is_valid: true, message: "Executed successfully" },
          };
          store().addAiMove(aiMove);
        }
      }

      if (syntheticEvents.length > 0) {
        store().addEvents(syntheticEvents);
      }

      if (runId) {
        queryClient.invalidateQueries({ queryKey: ["run", runId] });
        queryClient.invalidateQueries({ queryKey: ["legalActions", runId] });
      }
    },
    onError: (error) => {
      store().setIsAdvancingTurn(false);
      if ((error as Error)?.name === "CanceledError") {
        return;
      }
      const description =
        error instanceof Error ? error.message : "Failed to advance turn";
      store().addEvents([
        {
          id: generateId(),
          type: "stochastic",
          description: `Advance turn failed: ${description}`,
          domain: null,
          actor: null,
          turn: store().currentTurn,
          visibility: "all",
        },
      ]);
    },
    onSettled: () => {
      store().setIsAdvancingTurn(false);
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
    submitActionAsync: submitActionMutation.mutateAsync,
    isSubmitting: submitActionMutation.isPending,
    submitError: submitActionMutation.error,
    advanceTurn: advanceTurnMutation.mutate,
    isAdvancing: advanceTurnMutation.isPending,
    advanceError: advanceTurnMutation.error,
  };
}
