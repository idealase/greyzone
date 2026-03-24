import { ReplayTurn } from "../../api/replay";
import { ALL_DOMAINS } from "../../types/domain";
import PhaseIndicator from "../simulation/PhaseIndicator";
import DomainPanel from "../simulation/DomainPanel";
import EventFeed from "../simulation/EventFeed";

interface ReplayViewProps {
  turnData: ReplayTurn | null;
}

export default function ReplayView({ turnData }: ReplayViewProps) {
  if (!turnData) {
    return (
      <div className="card">
        <div className="card__body text-center">
          No data for this turn.
        </div>
      </div>
    );
  }

  const { world_state, events } = turnData;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <PhaseIndicator
          phase={world_state.phase}
          orderParameter={world_state.order_parameter}
        />
      </div>

      <div className="grid grid--2">
        <div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {ALL_DOMAINS.map((domain) => (
              <DomainPanel
                key={domain}
                domain={domain}
                layerState={world_state.layers[domain] ?? null}
              />
            ))}
          </div>
        </div>

        <div>
          <EventFeed events={events} />
        </div>
      </div>
    </div>
  );
}
