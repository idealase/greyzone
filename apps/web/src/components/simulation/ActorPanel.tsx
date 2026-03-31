import { RunParticipant } from "../../types/run";
import { ROLE_COLORS } from "../../utils/constants";
import Badge from "../common/Badge";
import PresenceIndicator from "../multiplayer/PresenceIndicator";

interface ActorPanelProps {
  participants: RunParticipant[];
}

export default function ActorPanel({ participants }: ActorPanelProps) {
  return (
    <div className="card">
      <div className="card__title">Actors</div>
      <div className="player-list mt-1">
        {participants.map((p) => (
          <div key={p.user_id} className="player-item">
            <PresenceIndicator state={p.is_online ? "online" : "offline"} />
            <div style={{ flex: 1 }}>
              <div className="player-item__name">{p.username}</div>
              <div className="player-item__role">
                <span style={{ color: ROLE_COLORS[p.role] ?? "#a1a1aa" }}>
                  {p.role.replace("_", " ")}
                </span>
              </div>
            </div>
            <Badge
              variant={p.is_human ? "blue" : "purple"}
              label={p.is_human ? "Human" : "AI"}
            />
          </div>
        ))}
        {participants.length === 0 && (
          <div className="card__body text-center">No actors</div>
        )}
      </div>
    </div>
  );
}
