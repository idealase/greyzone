import { useWebSocketStore } from "../../stores/websocketStore";

export default function ConnectionBanner() {
  const status = useWebSocketStore((s) => s.status);
  const errorMessage = useWebSocketStore((s) => s.errorMessage);
  const reconnectAttempt = useWebSocketStore((s) => s.reconnectAttempt);
  const nextRetryMs = useWebSocketStore((s) => s.nextRetryMs);
  const hasEverConnected = useWebSocketStore((s) => s.hasEverConnected);

  const shouldHide =
    status === "connected" ||
    (status === "disconnected" && !hasEverConnected) ||
    status === "connecting";

  if (shouldHide) {
    return null;
  }

  let message = "Realtime updates unavailable. Retrying...";

  if (status === "reconnecting") {
    const seconds = nextRetryMs ? Math.ceil(nextRetryMs / 1000) : null;
    const attemptText = reconnectAttempt ? ` (attempt ${reconnectAttempt})` : "";
    const delayText = seconds ? `, next retry in ${seconds}s` : "";
    message = `Connection lost — reconnecting${attemptText}${delayText}.`;
  } else if (status === "error") {
    message = errorMessage ?? "Realtime connection error. Retrying shortly.";
  } else if (status === "disconnected") {
    message = "Realtime connection lost. Attempting to reconnect...";
  }

  return (
    <div className={`connection-banner connection-banner--${status}`}>
      <span className="connection-banner__dot" />
      <div className="connection-banner__content">
        <div className="connection-banner__title">Realtime connection</div>
        <div className="connection-banner__message">{message}</div>
      </div>
    </div>
  );
}
