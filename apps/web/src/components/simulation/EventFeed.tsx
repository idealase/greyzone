import { useState, useMemo, useEffect } from "react";
import { TurnEvent } from "../../types/run";
import { DomainLayer, DOMAIN_LABELS, ALL_DOMAINS } from "../../types/domain";
import { EVENT_TYPE_DESCRIPTIONS } from "../../data/glossary";
import InfoTooltip from "../common/InfoTooltip";

interface EventFeedProps {
  events: TurnEvent[];
  couplingMatrix?: Record<string, Record<string, number>>;
  focusedDomain?: DomainLayer | null;
}

const EVENT_TYPES: TurnEvent["type"][] = [
  "action", "stochastic", "phase_transition", "coupling_effect",
  "ai_action", "narrative", "intel", "threat",
];

type TurnRange = "current" | "last3" | "all";

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
  const fromTo = description.match(/from\s+(\w+)\s+to\s+(\w+)/i)
    ?? description.match(/(\w+)\s+(?:stress\s+)?spill(?:ed)?\s+(?:over\s+)?to\s+(\w+)/i)
    ?? description.match(/(\w+)\s*→\s*(\w+)/);

  if (fromTo) {
    const source = getDomainLabel(fromTo[1]) ?? fromTo[1];
    const target = getDomainLabel(fromTo[2]) ?? fromTo[2];
    const w = couplingMatrix?.[fromTo[1]]?.[fromTo[2]] ?? couplingMatrix?.[fromTo[2]]?.[fromTo[1]];
    return { source, target, weight: w != null ? w.toFixed(2) : "?" };
  }

  if (domain) {
    const target = getDomainLabel(domain) ?? domain;
    return { source: "?", target, weight: "?" };
  }
  return null;
}

function extractEventDetail(event: TurnEvent): Record<string, string> | null {
  const details: Record<string, string> = {};
  const desc = event.description;

  if (event.type === "action" || event.type === "ai_action") {
    if (event.actor) details["Actor"] = event.actor;
    if (event.domain) details["Domain"] = getDomainLabel(event.domain) ?? event.domain;
    const intMatch = desc.match(/intensity\s*[=:]\s*([\d.]+)/i);
    if (intMatch) details["Intensity"] = intMatch[1];
    const costMatch = desc.match(/(\d+)\s*RP/i);
    if (costMatch) details["Cost"] = `${costMatch[1]} RP`;
  } else if (event.type === "phase_transition") {
    const phaseMatch = desc.match(/(\w[\w\s]+?)\s*(?:→|->|to)\s*(\w[\w\s]+)/i);
    if (phaseMatch) {
      details["From"] = phaseMatch[1].trim();
      details["To"] = phaseMatch[2].trim();
    }
    const psiMatch = desc.match(/[Ψψ]\s*[=:]\s*([\d.]+)/);
    if (psiMatch) details["Ψ Value"] = psiMatch[1];
  } else if (event.type === "coupling_effect") {
    if (event.domain) details["Target Domain"] = getDomainLabel(event.domain) ?? event.domain;
    const deltaMatch = desc.match(/([+-]?[\d.]+)%?\s*stress/i);
    if (deltaMatch) details["Stress Delta"] = deltaMatch[1];
  } else if (event.type === "stochastic") {
    details["Full Report"] = desc;
  }

  if (event.turn != null) details["Turn"] = String(event.turn);
  return Object.keys(details).length > 0 ? details : null;
}

const PINNED_TYPES: Set<TurnEvent["type"]> = new Set([
  "phase_transition", "intel", "threat",
]);

export default function EventFeed({ events, couplingMatrix, focusedDomain }: EventFeedProps) {
  const [activeTypes, setActiveTypes] = useState<Set<TurnEvent["type"]>>(new Set());
  const [activeDomain, setActiveDomain] = useState<DomainLayer | "">("");
  const [searchText, setSearchText] = useState("");

  // Sync external focus with local domain filter
  useEffect(() => {
    if (focusedDomain !== undefined) {
      setActiveDomain(focusedDomain ?? "");
    }
  }, [focusedDomain]);
  const [turnRange, setTurnRange] = useState<TurnRange>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const maxTurn = useMemo(() => Math.max(0, ...events.map((e) => e.turn)), [events]);

  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      if (activeTypes.size > 0 && !activeTypes.has(event.type)) return false;
      if (activeDomain && event.domain !== activeDomain) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        if (!event.description.toLowerCase().includes(q)) return false;
      }
      if (turnRange === "current" && event.turn !== maxTurn) return false;
      if (turnRange === "last3" && event.turn < maxTurn - 2) return false;
      return true;
    });

    const pinned = filtered.filter((e) => PINNED_TYPES.has(e.type));
    const rest = filtered.filter((e) => !PINNED_TYPES.has(e.type));
    return [...pinned, ...rest];
  }, [events, activeTypes, activeDomain, searchText, turnRange, maxTurn]);

  const hasFilters = activeTypes.size > 0 || activeDomain !== "" || searchText !== "" || turnRange !== "all";

  const toggleType = (t: TurnEvent["type"]) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveTypes(new Set());
    setActiveDomain("");
    setSearchText("");
    setTurnRange("all");
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="card">
      <div className="card__title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Event Feed</span>
        {hasFilters && (
          <span className="ef-filter-count">
            {filteredEvents.length} of {events.length}
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div className="ef-filters">
        <input
          type="text"
          className="ef-filters__search"
          placeholder="Search events…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <div className="ef-filters__types">
          {EVENT_TYPES.map((t) => {
            const badge = getTypeBadge(t);
            return (
              <button
                key={t}
                className={`ef-type-pill ${activeTypes.has(t) ? "ef-type-pill--active" : ""}`}
                onClick={() => toggleType(t)}
                title={EVENT_TYPE_DESCRIPTIONS[t] ?? t}
              >
                {badge.label}
              </button>
            );
          })}
        </div>

        <div className="ef-filters__row">
          <select
            className="ef-filters__domain-select"
            value={activeDomain}
            onChange={(e) => setActiveDomain(e.target.value as DomainLayer | "")}
          >
            <option value="">All domains</option>
            {ALL_DOMAINS.map((d) => (
              <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>
            ))}
          </select>

          <select
            className="ef-filters__turn-select"
            value={turnRange}
            onChange={(e) => setTurnRange(e.target.value as TurnRange)}
          >
            <option value="all">All turns</option>
            <option value="current">Current turn</option>
            <option value="last3">Last 3 turns</option>
          </select>

          {hasFilters && (
            <button className="btn btn--sm btn--ghost" onClick={clearFilters}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Event list */}
      <div className="event-feed mt-1">
        {filteredEvents.length === 0 ? (
          <div className="card__body text-center" style={{ padding: "1.5rem 0" }}>
            {events.length === 0 ? "No events yet." : "No events match filters."}
          </div>
        ) : (
          filteredEvents.map((event, idx) => {
            const badge = getTypeBadge(event.type);
            const domainLabel = getDomainLabel(event.domain);
            const isNew = idx < 3;
            const isPinned = PINNED_TYPES.has(event.type);
            const isExpanded = expandedIds.has(event.id);
            const detail = isExpanded ? extractEventDetail(event) : null;

            const couplingInfo = event.type === "coupling_effect"
              ? parseCouplingInfo(event.description, event.domain, couplingMatrix)
              : null;

            return (
              <div
                key={event.id}
                className={`event-item ${getEventClass(event.type)}${isNew ? " event-item--new" : ""}${isPinned ? " event-item--pinned" : ""}${event.type === "action" && event.description.startsWith("Executed") ? " event-item--user-action" : ""}${isExpanded ? " event-item--expanded" : ""}`}
                onClick={() => toggleExpand(event.id)}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(event.id); } }}
              >
                <div className="event-item__row">
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
                  <span className="event-item__chevron">{isExpanded ? "▾" : "▸"}</span>
                </div>

                {isExpanded && detail && (
                  <div className="event-item__detail" onClick={(e) => e.stopPropagation()}>
                    {Object.entries(detail).map(([key, value]) => (
                      <div key={key} className="event-item__detail-row">
                        <span className="event-item__detail-key">{key}</span>
                        <span className="event-item__detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
