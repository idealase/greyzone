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
}

export default function DomainActionBar({
  legalActions,
  onDomainClick,
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
            className={`domain-action-btn${isEmpty ? " domain-action-btn--empty" : ""}`}
            onClick={() => !isEmpty && onDomainClick(domain)}
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
