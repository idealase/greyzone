import { WebSocketMessage, WebSocketMessageType } from "../types/websocket";

type MessageHandler = (data: unknown) => void;

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: number | null = null;
  private runId: string | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  private intentionalClose = false;

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  connect(runId: string, userId: string, token?: string): void {
    if (this.ws && this.runId === runId && this.userId === userId && this.isConnected) {
      return;
    }

    if (this.ws) {
      this.intentionalClose = true;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }

    this.runId = runId;
    this.userId = userId;
    this.token = token ?? null;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();

    this.openSocket();
  }

  private openSocket(): void {
    if (!this.runId || !this.userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`;
    const params = new URLSearchParams({ user_id: this.userId });
    if (this.token) params.set("token", this.token);
    const url = `${host}/api/v1/runs/${this.runId}/ws?${params}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.clearReconnectTimer();
      this.reconnectAttempts = 0;
      this.emit("connected" as WebSocketMessageType, {});
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.ws = null;
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
      this.emit("disconnected" as WebSocketMessageType, { code: event.code, reason: event.reason });
    };

    this.ws.onerror = () => {
      this.emit("connection_error" as WebSocketMessageType, { message: "WebSocket error" });
      if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
        this.ws.close();
      }
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.runId = null;
    this.userId = null;
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  on(event: WebSocketMessageType | string, callback: MessageHandler): () => void {
    const key = event as WebSocketMessageType;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private emit(type: WebSocketMessageType, data: unknown): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private scheduleReconnect(): void {
    if (!this.runId || !this.userId || this.intentionalClose) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(this.baseReconnectDelay * 2 ** (this.reconnectAttempts - 1), this.maxReconnectDelay);
    this.emit("reconnecting" as WebSocketMessageType, { attempt: this.reconnectAttempts, delayMs: delay });

    this.clearReconnectTimer();
    this.reconnectTimer = window.setTimeout(() => {
      if (this.intentionalClose) return;
      this.openSocket();
    }, delay);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      this.emit(message.type, message.data);
    } catch {
      console.error("Failed to parse WebSocket message:", event.data);
    }
  }

  send(type: string, data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

export const gameWebSocket = new GameWebSocket();
