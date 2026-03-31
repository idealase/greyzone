import { create } from "zustand";
import { RunRead, WorldState, LegalAction, TurnEvent, RunParticipant } from "../types/run";
import { Phase } from "../types/phase";
import { DomainLayer, LayerState } from "../types/domain";
import { AiMoveResult } from "../types/action";

interface StressHistoryEntry {
  turn: number;
  values: Record<DomainLayer, number>;
}

interface RunState {
  run: RunRead | null;
  worldState: WorldState | null;
  currentPhase: Phase;
  orderParameter: number;
  currentTurn: number;
  events: TurnEvent[];
  legalActions: LegalAction[];
  participants: RunParticipant[];
  stressHistory: StressHistoryEntry[];
  aiMoves: AiMoveResult[];
  isAdvancingTurn: boolean;

  setRun: (run: RunRead) => void;
  setWorldState: (state: WorldState | null | undefined) => void;
  setPhase: (phase: Phase) => void;
  setOrderParameter: (psi: number) => void;
  setCurrentTurn: (turn: number) => void;
  addEvents: (events: TurnEvent[]) => void;
  clearEvents: () => void;
  setLegalActions: (actions: LegalAction[]) => void;
  setParticipants: (participants: RunParticipant[]) => void;
  updateParticipant: (userId: string, updates: Partial<RunParticipant>) => void;
  addParticipant: (participant: RunParticipant) => void;
  removeParticipant: (userId: string) => void;
  addStressSnapshot: (turn: number, layers: Record<DomainLayer, LayerState>) => void;
  addAiMove: (move: AiMoveResult) => void;
  setIsAdvancingTurn: (val: boolean) => void;
  reset: () => void;
}

const initialState = {
  run: null,
  worldState: null,
  currentPhase: Phase.CompetitiveNormality,
  orderParameter: 0,
  currentTurn: 0,
  events: [] as TurnEvent[],
  legalActions: [] as LegalAction[],
  participants: [] as RunParticipant[],
  stressHistory: [] as StressHistoryEntry[],
  aiMoves: [] as AiMoveResult[],
  isAdvancingTurn: false,
};

export const useRunStore = create<RunState>()((set) => ({
  ...initialState,

  setRun: (run) =>
    set({
      run,
      worldState: run.world_state ?? null,
      currentPhase: run.current_phase,
      orderParameter: run.order_parameter ?? 0,
      currentTurn: run.current_turn,
      participants: run.participants,
    }),

  setWorldState: (worldState) =>
    set((state) => {
      if (!worldState || typeof worldState !== "object") {
        return state;
      }

      const nextOrderParameter =
        typeof worldState.order_parameter === "number"
          ? worldState.order_parameter
          : state.orderParameter;
      const nextTurn =
        typeof worldState.turn === "number" ? worldState.turn : state.currentTurn;

      return {
        worldState,
        currentPhase: worldState.phase ?? state.currentPhase,
        orderParameter: nextOrderParameter,
        currentTurn: nextTurn,
      };
    }),

  setPhase: (currentPhase) => set({ currentPhase }),
  setOrderParameter: (orderParameter) => set({ orderParameter }),
  setCurrentTurn: (currentTurn) => set({ currentTurn }),

  addEvents: (newEvents) =>
    set((state) => ({
      events: [...newEvents, ...state.events].slice(0, 200),
    })),

  clearEvents: () => set({ events: [] }),

  setLegalActions: (legalActions) => set({ legalActions }),

  setParticipants: (participants) => set({ participants }),

  updateParticipant: (userId, updates) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.user_id === userId ? { ...p, ...updates } : p
      ),
    })),

  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants.filter((p) => p.user_id !== participant.user_id), participant],
    })),

  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.user_id !== userId),
    })),

  addStressSnapshot: (turn, layers) =>
    set((state) => {
      if (!layers) {
        return state;
      }

      const values = Object.fromEntries(
        Object.entries(layers).map(([k, v]) => [k, v.stress])
      ) as Record<DomainLayer, number>;
      return {
        stressHistory: [...state.stressHistory, { turn, values }].slice(-50),
      };
    }),

  addAiMove: (move) =>
    set((state) => ({
      aiMoves: [move, ...state.aiMoves].slice(0, 50),
    })),

  setIsAdvancingTurn: (isAdvancingTurn) => set({ isAdvancingTurn }),

  reset: () => set(initialState),
}));
