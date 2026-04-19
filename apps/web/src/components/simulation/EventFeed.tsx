import { TurnEvent } from "../../types/run";
import { DomainLayer, DOMAIN_LABELS } from "../../types/domain";

interface EventFeedProps {
  events: TurnEvent[];
}

function getEventClass(type: TurnEvent["type"]): string {
  switch (type) {
    case "action":
      return "event-item--action";
    case "stochastic":
      return "event-item--stochastic";
    case "phase_transition":
      return "event-item--phase_transition";
    case "coupling_effect":
      return "event-item--coupling_effect";
    case "ai_action":
      return "event-item--ai_action";
    case "narrative":
      return "event-item--narrative";
    case "intel":
      return "event-item--intel";
    case "threat":
      return "event-item--threat";
    default:
      return "event-item--turn";
  }
}

function getTypeBadge(type: TurnEvent["type"]): { label: string; className: string } {
  switch (type) {
    case "action":
      return { label: "ACTION", className: "badge badge--blue" };
    case "stochastic":
      return { label: "EVENT", className: "badge badge--yellow" };
    case "phase_transition":
      return { label: "PHASE", className: "badge badge--red" };
    case "coupling_effect":
      return { label: "EFFECT", className: "badge badge--purple" };
    case "ai_action":
      return { label: "OPPONENT", className: "badge badge--orange" };
    case "narrative":
      return { label: "SITREP", className: "badge badge--teal" };
    case "intel":
      return { label: "INTEL", className: "badge badge--green" };
    case "threat":
      return { label: "THREAT", className: "badge badge--red" };
    default:
      return { label: "INFO", className: "badge badge--gray" };
  }
}

function getDomainLabel(domain: string | null): string | null {
  if (!domain) return null;
  return DOMAIN_LABELS[domain as DomainLayer] ?? domain;
}

export default function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="card">
      <div className="card__title">Event Feed</div>
      <div className="event-feed mt-1">
        {events.length === 0 ? (
          <div
            className="card__body text-center"
            style={{ padding: "1.5rem 0" }}
          >
            No events yet.
          </div>
        ) : (
          events.map((event, idx) => {
            const badge = getTypeBadge(event.type);
            const domainLabel = getDomainLabel(event.domain);
            // First few events get "new" animation class
            const isNew = idx < 3;

            return (
              <div
                key={event.id}
                className={`event-item ${getEventClass(event.type)}${isNew ? " event-item--new" : ""}${event.type === "action" && event.description.startsWith("Executed") ? " event-item--user-action" : ""}`}
              >
                <span className="event-item__turn">T{event.turn}</span>
                <span className={`event-item__type-badge ${badge.className}`}>
                  {badge.label}
                </span>
                {domainLabel && (
                  <span className="event-item__domain">{domainLabel}</span>
                )}
                <span className="event-item__text">{event.description}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
