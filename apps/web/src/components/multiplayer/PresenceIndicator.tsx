type PresenceState = "online" | "offline" | "unknown";

interface PresenceIndicatorProps {
  state: PresenceState;
}

export default function PresenceIndicator({ state }: PresenceIndicatorProps) {
  const title =
    state === "unknown"
      ? "Status unknown (connection lost)"
      : state === "online"
      ? "Online"
      : "Offline";

  return (
    <span
      className={`presence-dot presence-dot--${state}`}
      title={title}
    />
  );
}
