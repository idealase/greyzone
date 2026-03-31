import { create } from "zustand";

type ConnectionStatus = "disconnected" | "connecting" | "reconnecting" | "connected" | "error";

interface WebSocketStoreState {
  status: ConnectionStatus;
  errorMessage: string | null;
  hasEverConnected: boolean;
  reconnectAttempt: number | null;
  nextRetryMs: number | null;
  setStatus: (status: ConnectionStatus) => void;
  setError: (message: string | null) => void;
  setReconnectInfo: (attempt: number | null, delayMs: number | null) => void;
  reset: () => void;
}

export const useWebSocketStore = create<WebSocketStoreState>()((set) => ({
  status: "disconnected",
  errorMessage: null,
  hasEverConnected: false,
  reconnectAttempt: null,
  nextRetryMs: null,
  setStatus: (status) =>
    set((state) => ({
      status,
      hasEverConnected: state.hasEverConnected || status === "connected",
      errorMessage: status === "connected" ? null : state.errorMessage,
      reconnectAttempt: status === "connected" ? null : state.reconnectAttempt,
      nextRetryMs: status === "connected" ? null : state.nextRetryMs,
    })),
  setError: (errorMessage) =>
    set((state) => ({
      errorMessage,
      status: "error",
      hasEverConnected: state.hasEverConnected,
    })),
  setReconnectInfo: (attempt, delayMs) =>
    set((state) => ({
      reconnectAttempt: attempt,
      nextRetryMs: delayMs,
      status: state.status,
    })),
  reset: () => ({
    status: "disconnected",
    errorMessage: null,
    hasEverConnected: false,
    reconnectAttempt: null,
    nextRetryMs: null,
  }),
}));
