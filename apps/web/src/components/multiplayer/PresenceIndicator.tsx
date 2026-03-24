interface PresenceIndicatorProps {
  isOnline: boolean;
}

export default function PresenceIndicator({ isOnline }: PresenceIndicatorProps) {
  return (
    <span
      className={`presence-dot ${
        isOnline ? "presence-dot--online" : "presence-dot--offline"
      }`}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
