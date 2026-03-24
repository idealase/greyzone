import { create } from "zustand";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface WebSocketStoreState {
  status: ConnectionStatus;
  errorMessage: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

export const useWebSocketStore = create<WebSocketStoreState>()((set) => ({
  status: "disconnected",
  errorMessage: null,
  setStatus: (status) => set({ status }),
  setError: (errorMessage) => set({ errorMessage, status: "error" }),
  reset: () => set({ status: "disconnected", errorMessage: null }),
}));
