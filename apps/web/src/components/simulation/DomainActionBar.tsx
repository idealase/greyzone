import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS, ALL_DOMAINS } from "../../types/domain";
import { LegalAction } from "../../types/run";

// Short labels for domain buttons
const DOMAIN_SHORT: Record<DomainLayer, string> = {
  [DomainLayer.Kinetic]: "KIN",
  [DomainLayer.MaritimeLogistics]: "MAR",
  [DomainLayer.Energy]: "NRG",
  [DomainLayer.GeoeconomicIndustrial]: "GEO",
  [DomainLayer.Cyber]: "CYB",
  [DomainLayer.SpacePnt]: "SPC",
  [DomainLayer.InformationCognitive]: "INF",
  [DomainLayer.DomesticPoliticalFiscal]: "POL",
};

interface DomainActionBarProps {
  legalActions: LegalAction[];
  onDomainClick: (domain: DomainLayer) => void;
  focusedDomain?: DomainLayer | null;
  onFocusDomain?: (domain: DomainLayer | null) => void;
}

export default function DomainActionBar({
  legalActions,
  onDomainClick,
  focusedDomain,
  onFocusDomain,
}: DomainActionBarProps) {
  return (
    <div className="domain-action-bar" role="toolbar" aria-label="Domain actions">
      {ALL_DOMAINS.map((domain) => {
        const count = legalActions.filter((a) =>
          (a.available_layers ?? []).includes(domain)
        ).length;
        const isEmpty = count === 0;
        const color = DOMAIN_COLORS[domain];

        return (
          <button
            key={domain}
            className={`domain-action-btn${isEmpty ? " domain-action-btn--empty" : ""}${focusedDomain === domain ? " domain-action-btn--focused" : ""}${focusedDomain && focusedDomain !== domain ? " domain-action-btn--dimmed" : ""}`}
            onClick={() => !isEmpty && onDomainClick(domain)}
            onDoubleClick={(e) => {
              e.preventDefault();
              onFocusDomain?.(focusedDomain === domain ? null : domain);
            }}
            title={`${DOMAIN_LABELS[domain]}${count > 0 ? ` — ${count} actions` : " — no actions"}`}
            aria-disabled={isEmpty}
          >
            <span
              className="domain-action-btn__dot"
              style={{ backgroundColor: color }}
            />
            <span>{DOMAIN_SHORT[domain]}</span>
            {count > 0 && (
              <span className="domain-action-btn__count">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
