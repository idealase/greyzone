import { useEffect, useRef } from "react";
import { gameWebSocket } from "../api/websocket";
import { useRunStore } from "../stores/runStore";
import { useWebSocketStore } from "../stores/websocketStore";
import { useAuthStore } from "../stores/authStore";
import { TurnAdvancedMessage, PlayerJoinedMessage } from "../types/websocket";
import { RunParticipant, WorldState, TurnEvent } from "../types/run";
import { Phase } from "../types/phase";
import { DomainLayer, LayerState } from "../types/domain";
import { AiMoveResult } from "../types/action";

export function useWebSocket(runId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Use refs for store actions to avoid re-running the effect when unrelated state changes
  const runStoreRef = useRef(useRunStore.getState());
  const wsStoreRef = useRef(useWebSocketStore.getState());
  useEffect(() => {
    runStoreRef.current = useRunStore.getState();
    wsStoreRef.current = useWebSocketStore.getState();
  });

  useEffect(() => {
    if (!runId || !user || !accessToken) return;

    const rs = () => runStoreRef.current;
    const ws = () => wsStoreRef.current;

    ws().setStatus("connecting");
    gameWebSocket.connect(runId, user.id, accessToken);

    const unsubs: Array<() => void> = [];

    unsubs.push(
      gameWebSocket.on("connected", () => {
        ws().setStatus("connected");
        ws().setReconnectInfo(null, null);
      })
    );

    unsubs.push(
      gameWebSocket.on("disconnected", () => {
        ws().setStatus("disconnected");
      })
    );

    unsubs.push(
      gameWebSocket.on("reconnecting", (data) => {
        const info = data as { attempt: number; delayMs: number };
        ws().setReconnectInfo(info.attempt, info.delayMs);
        ws().setStatus("reconnecting");
      })
    );

    unsubs.push(
      gameWebSocket.on("connection_error", (data) => {
        const err = data as { message: string };
        ws().setError(err.message);
      })
    );

    unsubs.push(
      gameWebSocket.on("error", (data) => {
        const err = data as { message: string };
        ws().setError(err.message);
      })
    );

    unsubs.push(
      gameWebSocket.on("world_update", (data) => {
        const msg = data as { world_state: WorldState; turn: number; phase: Phase; order_parameter: number };
        rs().setWorldState(msg.world_state);
        rs().addStressSnapshot(
          msg.turn,
          msg.world_state.layers as Record<DomainLayer, LayerState>
        );
        rs().addPsiSnapshot(msg.turn, msg.order_parameter, msg.phase);
      })
    );

    unsubs.push(
      gameWebSocket.on("turn_advanced", (data) => {
        const msg = data as TurnAdvancedMessage["data"];
        rs().setWorldState(msg.world_state);
        rs().addEvents(msg.events);
        rs().addStressSnapshot(
          msg.turn,
          msg.world_state.layers as Record<DomainLayer, LayerState>
        );
        rs().addPsiSnapshot(
          msg.turn,
          msg.world_state.order_parameter ?? rs().orderParameter,
          msg.world_state.phase ?? rs().currentPhase,
        );
      })
    );

    unsubs.push(
      gameWebSocket.on("phase_change", (data) => {
        const msg = data as { previous_phase: Phase; new_phase: Phase; turn: number };
        rs().addEvents([
          {
            id: `phase-${msg.turn}`,
            type: "phase_transition",
            description: `Phase transitioned from ${msg.previous_phase} to ${msg.new_phase}`,
            domain: null,
            actor: null,
            turn: msg.turn,
            visibility: "all",
          },
        ]);
      })
    );

    unsubs.push(
      gameWebSocket.on("player_joined", (data) => {
        const msg = data as PlayerJoinedMessage["data"];
        rs().addParticipant(msg as RunParticipant);
      })
    );

    unsubs.push(
      gameWebSocket.on("player_left", (data) => {
        const msg = data as { user_id: string };
        rs().removeParticipant(msg.user_id);
      })
    );

    unsubs.push(
      gameWebSocket.on("player_online", (data) => {
        const msg = data as { user_id: string };
        rs().updateParticipant(msg.user_id, { is_online: true });
      })
    );

    unsubs.push(
      gameWebSocket.on("player_offline", (data) => {
        const msg = data as { user_id: string };
        rs().updateParticipant(msg.user_id, { is_online: false });
      })
    );

    unsubs.push(
      gameWebSocket.on("ai_move", (data) => {
        const msg = data as { turn: number; events: Array<{ description: string; layer: string; role_id: string; action_type?: string; intensity?: number }>; world_state: WorldState };
        if (msg.world_state) {
          rs().setWorldState(msg.world_state);
        }
        if (msg.events?.length) {
          const aiEvents: TurnEvent[] = msg.events.map((evt, i) => ({
            id: `ai-ws-${msg.turn}-${i}`,
            type: "ai_action" as const,
            description: `🤖 ${evt.description}`,
            domain: (evt.layer as DomainLayer) || null,
            actor: evt.role_id || null,
            turn: msg.turn,
            visibility: "all" as const,
          }));
          rs().addEvents(aiEvents);

          for (const evt of msg.events) {
            const aiMove: AiMoveResult = {
              action: {
                id: `ai-ws-${msg.turn}-${Math.random().toString(36).slice(2, 11)}`,
                run_id: "",
                user_id: "",
                username: evt.role_id ?? "AI",
                action_type: evt.action_type ?? evt.description,
                target_domain: (evt.layer as DomainLayer) ?? DomainLayer.Kinetic,
                target_actor: null,
                intensity: evt.intensity ?? 0.5,
                turn: msg.turn,
                side: "red",
                submitted_at: new Date().toISOString(),
              },
              rationale: `${evt.role_id} selected ${evt.action_type ?? "action"} targeting ${evt.layer}`,
              tool_calls: [],
              validation: { is_valid: true, message: "Executed successfully" },
            };
            rs().addAiMove(aiMove);
          }
        }
      })
    );

    return () => {
      unsubs.forEach((fn) => fn());
      gameWebSocket.disconnect();
      ws().setStatus("disconnected");
      ws().reset();
    };
  }, [runId, user, accessToken]);
}
