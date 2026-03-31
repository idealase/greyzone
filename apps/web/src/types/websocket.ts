import { WorldState, TurnEvent, RunParticipant } from "./run";
import { Phase } from "./phase";
import { AiMoveResult } from "./action";

export type WebSocketMessageType =
  | "world_update"
  | "turn_advanced"
  | "phase_change"
  | "player_joined"
  | "player_left"
  | "player_online"
  | "player_offline"
  | "action_submitted"
  | "ai_move"
  | "game_started"
  | "game_ended"
  | "error"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "connection_error";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: unknown;
}

export interface WorldUpdateMessage {
  type: "world_update";
  data: {
    world_state: WorldState;
    turn: number;
    phase: Phase;
    order_parameter: number;
  };
}

export interface TurnAdvancedMessage {
  type: "turn_advanced";
  data: {
    turn: number;
    events: TurnEvent[];
    world_state: WorldState;
    phase: Phase;
    order_parameter: number;
    phase_changed: boolean;
  };
}

export interface PhaseChangeMessage {
  type: "phase_change";
  data: {
    previous_phase: Phase;
    new_phase: Phase;
    order_parameter: number;
    turn: number;
  };
}

export interface PlayerJoinedMessage {
  type: "player_joined";
  data: RunParticipant;
}

export interface PlayerLeftMessage {
  type: "player_left";
  data: { user_id: string; username: string };
}

export interface AiMoveMessage {
  type: "ai_move";
  data: AiMoveResult;
}

export interface GameStartedMessage {
  type: "game_started";
  data: { run_id: string; turn: number };
}

export interface GameEndedMessage {
  type: "game_ended";
  data: { run_id: string; reason: string };
}

export interface ErrorMessage {
  type: "error";
  data: { message: string; code: string };
}

export interface ReconnectingMessage {
  type: "reconnecting";
  data: { attempt: number; delayMs: number };
}

export interface DisconnectedMessage {
  type: "disconnected";
  data: { code?: number; reason?: string };
}

export interface ConnectionErrorMessage {
  type: "connection_error";
  data: { message: string };
}
