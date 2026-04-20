import { TurnEvent } from "../../types/run";
import { DomainLayer, DOMAIN_LABELS } from "../../types/domain";
import { EVENT_TYPE_DESCRIPTIONS } from "../../data/glossary";
import InfoTooltip from "../common/InfoTooltip";

interface EventFeedProps {
  events: TurnEvent[];
  couplingMatrix?: Record<string, Record<string, number>>;
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
      return { label: "COUPLING", className: "badge badge--purple" };
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

function parseCouplingInfo(
  description: string,
  domain: DomainLayer | null,
  couplingMatrix?: Record<string, Record<string, number>>
): { source: string; target: string; weight: string } | null {
  // Try to extract source→target from description patterns like:
  // "Coupling effect from Cyber to Energy" or "Cyber stress spilled over to Energy"
  const fromTo = description.match(/from\s+(\w+)\s+to\s+(\w+)/i)
    ?? description.match(/(\w+)\s+(?:stress\s+)?spill(?:ed)?\s+(?:over\s+)?to\s+(\w+)/i)
    ?? description.match(/(\w+)\s*→\s*(\w+)/);

  if (fromTo) {
    const source = getDomainLabel(fromTo[1]) ?? fromTo[1];
    const target = getDomainLabel(fromTo[2]) ?? fromTo[2];
    const w = couplingMatrix?.[fromTo[1]]?.[fromTo[2]] ?? couplingMatrix?.[fromTo[2]]?.[fromTo[1]];
    return { source, target, weight: w != null ? w.toFixed(2) : "?" };
  }

  // Fallback: if domain is set, use it as target
  if (domain) {
    const target = getDomainLabel(domain) ?? domain;
    return { source: "?", target, weight: "?" };
  }
  return null;
}

export default function EventFeed({ events, couplingMatrix }: EventFeedProps) {
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
            const isNew = idx < 3;

            // Coupling callout
            const couplingInfo = event.type === "coupling_effect"
              ? parseCouplingInfo(event.description, event.domain, couplingMatrix)
              : null;

            return (
              <div
                key={event.id}
                className={`event-item ${getEventClass(event.type)}${isNew ? " event-item--new" : ""}${event.type === "action" && event.description.startsWith("Executed") ? " event-item--user-action" : ""}`}
              >
                <span className="event-item__turn">T{event.turn}</span>
                <span className={`event-item__type-badge ${badge.className}`}>
                  {badge.label}
                  {EVENT_TYPE_DESCRIPTIONS[event.type] && (
                    <InfoTooltip
                      label={`${badge.label} event type`}
                      content={EVENT_TYPE_DESCRIPTIONS[event.type]}
                    />
                  )}
                </span>
                {domainLabel && event.type !== "coupling_effect" && (
                  <span className="event-item__domain">{domainLabel}</span>
                )}
                {couplingInfo ? (
                  <span className="event-item__text">
                    <span className="coupling-callout">
                      <span className="coupling-callout__source">{couplingInfo.source}</span>
                      <span className="coupling-callout__arrow"> → </span>
                      <span className="coupling-callout__target">{couplingInfo.target}</span>
                      <span className="coupling-callout__weight">(w: {couplingInfo.weight})</span>
                    </span>
                    {" "}{event.description}
                  </span>
                ) : (
                  <span className="event-item__text">{event.description}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
