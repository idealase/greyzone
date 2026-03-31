import { useEffect, useRef } from "react";
import { gameWebSocket } from "../api/websocket";
import { useRunStore } from "../stores/runStore";
import { useWebSocketStore } from "../stores/websocketStore";
import { useAuthStore } from "../stores/authStore";
import { TurnAdvancedMessage, PlayerJoinedMessage, AiMoveMessage } from "../types/websocket";
import { RunParticipant, WorldState, TurnEvent } from "../types/run";
import { Phase } from "../types/phase";
import { DomainLayer, LayerState } from "../types/domain";

export function useWebSocket(runId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const {
    setWorldState,
    addEvents,
    addParticipant,
    removeParticipant,
    updateParticipant,
    addStressSnapshot,
    addAiMove,
  } = useRunStore();
  const { setStatus, setError, setReconnectInfo, reset } = useWebSocketStore();
  const cleanupRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!runId || !user) return;

    setStatus("connecting");
    gameWebSocket.connect(runId, user.id);

    const unsubs: Array<() => void> = [];

    unsubs.push(
      gameWebSocket.on("connected", () => {
        setStatus("connected");
        setReconnectInfo(null, null);
      })
    );

    unsubs.push(
      gameWebSocket.on("disconnected", () => {
        setStatus("disconnected");
      })
    );

    unsubs.push(
      gameWebSocket.on("reconnecting", (data) => {
        const info = data as { attempt: number; delayMs: number };
        setReconnectInfo(info.attempt, info.delayMs);
        setStatus("reconnecting");
      })
    );

    unsubs.push(
      gameWebSocket.on("connection_error", (data) => {
        const err = data as { message: string };
        setError(err.message);
      })
    );

    unsubs.push(
      gameWebSocket.on("error", (data) => {
        const err = data as { message: string };
        setError(err.message);
      })
    );

    unsubs.push(
      gameWebSocket.on("world_update", (data) => {
        const msg = data as { world_state: WorldState; turn: number; phase: Phase; order_parameter: number };
        setWorldState(msg.world_state);
        addStressSnapshot(
          msg.turn,
          msg.world_state.layers as Record<DomainLayer, LayerState>
        );
      })
    );

    unsubs.push(
      gameWebSocket.on("turn_advanced", (data) => {
        const msg = data as TurnAdvancedMessage["data"];
        setWorldState(msg.world_state);
        addEvents(msg.events);
        addStressSnapshot(
          msg.turn,
          msg.world_state.layers as Record<DomainLayer, LayerState>
        );
      })
    );

    unsubs.push(
      gameWebSocket.on("phase_change", (data) => {
        const msg = data as { previous_phase: Phase; new_phase: Phase; turn: number };
        addEvents([
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
        addParticipant(msg as RunParticipant);
      })
    );

    unsubs.push(
      gameWebSocket.on("player_left", (data) => {
        const msg = data as { user_id: string };
        removeParticipant(msg.user_id);
      })
    );

    unsubs.push(
      gameWebSocket.on("player_online", (data) => {
        const msg = data as { user_id: string };
        updateParticipant(msg.user_id, { is_online: true });
      })
    );

    unsubs.push(
      gameWebSocket.on("player_offline", (data) => {
        const msg = data as { user_id: string };
        updateParticipant(msg.user_id, { is_online: false });
      })
    );

    unsubs.push(
      gameWebSocket.on("ai_move", (data) => {
        const msg = data as AiMoveMessage["data"];
        addAiMove(msg);
      })
    );

    cleanupRef.current = unsubs;

    return () => {
      unsubs.forEach((fn) => fn());
      gameWebSocket.disconnect();
      setStatus("disconnected");
      reset();
    };
  }, [
    runId,
    user,
    setWorldState,
    addEvents,
    addParticipant,
    removeParticipant,
    updateParticipant,
    addStressSnapshot,
    addAiMove,
    setStatus,
    setError,
    setReconnectInfo,
    reset,
  ]);
}
