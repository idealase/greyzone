import { useWebSocketStore } from "../../stores/websocketStore";

export default function ConnectionBanner() {
  const { status, errorMessage, reconnectAttempt, nextRetryMs, hasEverConnected } =
    useWebSocketStore((s) => ({
      status: s.status,
      errorMessage: s.errorMessage,
      reconnectAttempt: s.reconnectAttempt,
      nextRetryMs: s.nextRetryMs,
      hasEverConnected: s.hasEverConnected,
    }));

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
