import { useQuery } from "@tanstack/react-query";
import { getTurnNarrative } from "../../api/narrative";
import type { DomainHighlight } from "../../types/narrative";

interface TurnNarrativePanelProps {
  runId: string;
  turn: number;
}

function ThreatBadge({ level }: { level: string }) {
  const upper = level.toUpperCase();
  let cls = "narrative-threat--elevated";
  if (upper === "LOW") cls = "narrative-threat--low";
  else if (upper === "HIGH") cls = "narrative-threat--high";
  else if (upper === "CRITICAL" || upper === "EXTREME") cls = "narrative-threat--critical";
  return <div className={`narrative-threat ${cls}`}>THREAT: {upper}</div>;
}

function HighlightPill({ h }: { h: DomainHighlight }) {
  const arrow =
    h.direction === "rising" ? "↑" : h.direction === "falling" ? "↓" : "—";
  const cls =
    h.direction === "rising"
      ? "narrative-highlight-pill--rising"
      : h.direction === "falling"
        ? "narrative-highlight-pill--falling"
        : "";
  const deltaStr =
    Math.abs(h.delta) >= 0.005
      ? ` ${h.delta > 0 ? "+" : ""}${h.delta.toFixed(3)}`
      : "";
  return (
    <span className={`narrative-highlight-pill ${cls}`}>
      {arrow} {h.label}
      {deltaStr}
    </span>
  );
}

export default function TurnNarrativePanel({
  runId,
  turn,
}: TurnNarrativePanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["narrative", runId, turn],
    queryFn: () => getTurnNarrative(runId, turn),
    staleTime: Infinity,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="narrative-skeleton">
        <div className="skeleton-line skeleton-line--wide" />
        <div className="skeleton-line skeleton-line--medium" />
        <div className="skeleton-line skeleton-line--short" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="narrative-panel">
        <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
          Turn Complete
        </div>
        <div className="narrative-body">
          Narrative generation unavailable — review the event feed for details.
        </div>
      </div>
    );
  }

  return (
    <div className="narrative-panel">
      <div className="narrative-headline">{data.headline}</div>
      <div className="narrative-body">{data.body}</div>
      {data.domain_highlights.length > 0 && (
        <div className="narrative-highlights">
          {data.domain_highlights.map((h, i) => (
            <HighlightPill key={i} h={h} />
          ))}
        </div>
      )}
      <ThreatBadge level={data.threat_assessment} />
      {data.intelligence_note && (
        <div className="narrative-intel">
          <span className="narrative-intel__prefix">🔒 SIGINT/HUMINT: </span>
          {data.intelligence_note}
        </div>
      )}
    </div>
  );
}
