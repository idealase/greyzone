export interface DomainHighlight {
  domain: string;
  label: string;
  direction: "rising" | "falling" | "stable";
  delta: number;
  note: string;
}

export interface TurnNarrative {
  turn: number;
  headline: string;
  body: string;
  domain_highlights: DomainHighlight[];
  threat_assessment: string;
  intelligence_note: string | null;
  cached: boolean;
}
