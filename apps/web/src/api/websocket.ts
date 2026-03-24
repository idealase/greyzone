import { WebSocketMessage, WebSocketMessageType } from "../types/websocket";

type MessageHandler = (data: unknown) => void;

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private runId: string | null = null;
  private userId: string | null = null;
  private intentionalClose = false;

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  connect(runId: string, userId: string): void {
    this.runId = runId;
    this.userId = userId;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`;
    const url = `${host}/ws/runs/${runId}?user_id=${userId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit("connected" as WebSocketMessageType, {});
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.ws.onclose = () => {
      if (!this.intentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          if (this.runId && this.userId) {
            this.connect(this.runId, this.userId);
          }
        }, this.reconnectDelay * this.reconnectAttempts);
      }
      this.emit("disconnected" as WebSocketMessageType, {});
    };

    this.ws.onerror = () => {
      this.emit("error" as WebSocketMessageType, { message: "WebSocket error" });
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.runId = null;
    this.userId = null;
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
