import { RunParticipant } from "../../types/run";
import { ROLE_COLORS } from "../../utils/constants";
import { useWebSocketStore } from "../../stores/websocketStore";
import Badge from "../common/Badge";
import PresenceIndicator from "./PresenceIndicator";

interface PlayerListProps {
  participants: RunParticipant[];
}

export default function PlayerList({ participants }: PlayerListProps) {
  const status = useWebSocketStore((s) => s.status);
  const hasEverConnected = useWebSocketStore((s) => s.hasEverConnected);

  const isRealtimeHealthy =
    status === "connected" ||
    status === "connecting" ||
    (!hasEverConnected && status === "disconnected");

  if (participants.length === 0) {
    return (
      <div className="card__body text-center">
        No players have joined yet.
      </div>
    );
  }

  return (
    <div className="player-list">
      {participants.map((p) => (
        <div key={p.user_id} className="player-item">
          <PresenceIndicator
            state={
              isRealtimeHealthy
                ? (p.is_online ? "online" : "offline")
                : "unknown"
            }
          />
          <div style={{ flex: 1 }}>
            <div className="player-item__name">{p.username}</div>
            <div
              className="player-item__role"
              style={{ color: ROLE_COLORS[p.role] ?? "var(--text-secondary)" }}
            >
              {p.role.replace(/_/g, " ")}
            </div>
          </div>
          <Badge
            variant={p.is_human ? "blue" : "purple"}
            label={p.is_human ? "Human" : "AI"}
          />
        </div>
      ))}
    </div>
  );
}
