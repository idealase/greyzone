import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameWebSocket } from "./websocket";

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(): void {
    // no-op for tests
  }

  close(): void {
    this.triggerClose();
  }

  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  triggerClose(code = 1006, reason = "close"): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason } as CloseEvent);
  }
}

// @ts-expect-error – Node global in vitest
const realWebSocket = global.WebSocket;

describe("GameWebSocket reconnect logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    // @ts-expect-error override for tests
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    // @ts-expect-error restore
    global.WebSocket = realWebSocket;
  });

  it("retries with exponential backoff capped at 30s and resets after reconnect", () => {
    const socket = new GameWebSocket();
    const reconnectEvents: Array<{ attempt: number; delayMs: number }> = [];
    socket.on("reconnecting", (data) => reconnectEvents.push(data as { attempt: number; delayMs: number }));

    socket.connect("run-1", "user-1");
    expect(MockWebSocket.instances.length).toBe(1);

    // attempt 1 -> 1s
    MockWebSocket.instances[0].triggerClose();
    expect(reconnectEvents[0]).toEqual({ attempt: 1, delayMs: 1000 });
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances.length).toBe(2);

    // attempt 2 -> 2s
    MockWebSocket.instances[1].triggerClose();
    expect(reconnectEvents[1]).toEqual({ attempt: 2, delayMs: 2000 });
    vi.advanceTimersByTime(2000);
    expect(MockWebSocket.instances.length).toBe(3);

    // successful reconnect resets attempts
    MockWebSocket.instances[2].triggerOpen();
    MockWebSocket.instances[2].triggerClose();
    expect(reconnectEvents[2]).toEqual({ attempt: 1, delayMs: 1000 });
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances.length).toBe(4);

    // continue until capped delay
    MockWebSocket.instances[3].triggerClose();
    vi.advanceTimersByTime(2000); // attempt 2
    expect(reconnectEvents[3]).toEqual({ attempt: 2, delayMs: 2000 });
    expect(MockWebSocket.instances.length).toBe(5);

    MockWebSocket.instances[4].triggerClose();
    vi.advanceTimersByTime(4000); // attempt 3
    expect(reconnectEvents[4]).toEqual({ attempt: 3, delayMs: 4000 });
    expect(MockWebSocket.instances.length).toBe(6);

    MockWebSocket.instances[5].triggerClose();
    vi.advanceTimersByTime(8000); // attempt 4
    expect(reconnectEvents[5]).toEqual({ attempt: 4, delayMs: 8000 });
    expect(MockWebSocket.instances.length).toBe(7);

    MockWebSocket.instances[6].triggerClose();
    vi.advanceTimersByTime(16000); // attempt 5
    expect(reconnectEvents[6]).toEqual({ attempt: 5, delayMs: 16000 });
    expect(MockWebSocket.instances.length).toBe(8);

    MockWebSocket.instances[7].triggerClose();
    expect(reconnectEvents[7]).toEqual({ attempt: 6, delayMs: 30000 });

    socket.disconnect();
  });
});
