import { useState } from "react";

interface DomainDetail {
  id: string;
  name: string;
  color: string;
  tagline: string;
  description: string;
  variables: string[];
  strategic: string;
}

const DOMAINS: DomainDetail[] = [
  {
    id: "kinetic",
    name: "Kinetic",
    color: "#ef4444",
    tagline: "Military forces & territorial control",
    description:
      "Models military forces, weapons systems, attrition rates, and territorial control across the Baltic theater. Tracks the posture and readiness of land, air, and missile forces on both sides.",
    variables: [
      "Force posture (0–1)",
      "Readiness (%)",
      "Attrition rate",
      "Theater control index",
      "Escalation index",
    ],
    strategic:
      "The primary lever for direct coercion; high kinetic activity rapidly drives Ψ upward and triggers cascading effects across nearly every other domain.",
  },
  {
    id: "maritime",
    name: "Maritime & Logistics",
    color: "#3b82f6",
    tagline: "Shipping lanes, ports & naval forces",
    description:
      "Models Baltic Sea shipping lanes (SLOCs), port throughput, naval force positioning, mine warfare, and blockade operations. Controls the flow of energy, goods, and military supplies.",
    variables: [
      "SLOC throughput (%)",
      "Port capacity",
      "Naval presence",
      "Mine density",
      "Blockade intensity",
    ],
    strategic:
      "Controls energy and goods flow; blocking SLOCs can strangle an economy without firing a single land-based shot.",
  },
  {
    id: "energy",
    name: "Energy",
    color: "#f59e0b",
    tagline: "Production, reserves & grid stability",
    description:
      "Models energy production levels, strategic reserves, distribution infrastructure, price volatility, and grid stability for both coalitions. Encompasses pipeline flows, LNG terminals, and power generation.",
    variables: [
      "Production level",
      "Reserve stocks",
      "Price index",
      "Infrastructure integrity",
      "Grid stability",
    ],
    strategic:
      "Energy weaponization is a key hybrid warfare tool; disruption cascades to economics and public stability with deniable plausibility.",
  },
  {
    id: "geoeconomic",
    name: "Geoeconomic & Industrial",
    color: "#10b981",
    tagline: "Trade, sanctions & industrial capacity",
    description:
      "Models bilateral and multilateral trade flows, sanction regimes, industrial capacity, financial system health, and supply chain resilience. Determines the long-run sustainability of the conflict.",
    variables: [
      "Trade flow volume",
      "Sanctions pressure",
      "Industrial output",
      "Financial stability",
      "Supply chain resilience",
    ],
    strategic:
      "Economic coercion can degrade an adversary's capacity to sustain operations over time — the slow strangulation of war.",
  },
  {
    id: "cyber",
    name: "Cyber",
    color: "#8b5cf6",
    tagline: "Offensive/defensive ops & info advantage",
    description:
      "Models offensive cyber campaigns, defensive cyber posture, system vulnerabilities, attack capacity, and information advantage gained through cyber espionage and disruption.",
    variables: [
      "Cyber posture",
      "Vulnerability index",
      "Attack capacity",
      "Defense capacity",
      "Information advantage",
    ],
    strategic:
      "Cyber attacks can degrade multiple domains simultaneously with plausible deniability, operating below the kinetic threshold where NATO Article 5 is ambiguous.",
  },
  {
    id: "space",
    name: "Space & PNT",
    color: "#6366f1",
    tagline: "Satellites, GPS accuracy & ASAT weapons",
    description:
      "Models satellite constellation health, GPS/PNT accuracy for military and civilian use, anti-satellite weapon readiness, space domain awareness, and cumulative orbital debris from ASAT tests.",
    variables: [
      "Satellite health (%)",
      "PNT accuracy",
      "Space domain awareness",
      "ASAT readiness",
      "Debris density",
    ],
    strategic:
      "Degrading GPS precision cripples precision-guided munitions and logistics; ASAT employment creates permanent debris fields affecting all spacefaring nations.",
  },
  {
    id: "information",
    name: "Information & Cognitive",
    color: "#ec4899",
    tagline: "Narratives, disinformation & public opinion",
    description:
      "Models narrative control, disinformation campaign intensity, public opinion trends in key democracies, military morale, and the relative freedom of the media environment.",
    variables: [
      "Narrative control index",
      "Public opinion (Blue/Red)",
      "Military morale",
      "Disinformation intensity",
      "Media freedom",
    ],
    strategic:
      "Shaping the information environment determines domestic political will and alliance cohesion — the will to fight is as important as the capacity to fight.",
  },
  {
    id: "domestic",
    name: "Domestic Political & Fiscal",
    color: "#78716c",
    tagline: "Government stability, fiscal reserves & will",
    description:
      "Models government stability, fiscal reserve levels, political will to prosecute the conflict, alliance cohesion among NATO/CSTO members, mobilization levels, and casualty tolerance thresholds.",
    variables: [
      "Government stability",
      "Fiscal reserves (%)",
      "Political will",
      "Alliance cohesion",
      "Mobilization level",
      "Casualty tolerance",
    ],
    strategic:
      "The ultimate constraint on all operations — when fiscal reserves deplete or political will collapses, the game ends regardless of military position.",
  },
];

export default function DomainsStep() {
  const [selected, setSelected] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  function handleSelect(id: string) {
    setSelected((prev) => (prev === id ? null : id));
    setVisited((prev) => new Set(prev).add(id));
  }

  const detail = DOMAINS.find((d) => d.id === selected);

  return (
    <div className="tutorial-step">
      <div className="tutorial-step__header">
        <h2 className="tutorial-step__title">The Battlespace: 8 Domains</h2>
        <p className="tutorial-step__subtitle">
          The world state is divided into 8 interconnected domains
        </p>
      </div>

      <p className="tutorial-intro">
        The world state is divided into 8 interconnected domains. Actions in one domain cause ripple
        effects across others — no domain exists in isolation. Click any domain to explore it in
        depth.
      </p>

      <div className="tutorial-progress-counter">
        <span style={{ color: visited.size === 8 ? "var(--accent-green)" : "var(--text-muted)" }}>
          {visited.size === 8 ? "✓ All " : ""}{visited.size} / 8 domains explored
        </span>
      </div>

      <div className="tutorial-domain-grid">
        {DOMAINS.map((d) => (
          <div
            key={d.id}
            className={[
              "tutorial-domain-card",
              selected === d.id ? "tutorial-domain-card--selected" : "",
              visited.has(d.id) ? "tutorial-domain-card--visited" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => handleSelect(d.id)}
          >
            <div className="tutorial-domain-card__name">
              <span
                className="tutorial-domain-card__dot"
                style={{ backgroundColor: d.color }}
              />
              {d.name}
            </div>
            <div className="tutorial-domain-card__tagline">{d.tagline}</div>
          </div>
        ))}
      </div>

      {detail && (
        <div className="tutorial-domain-detail">
          <div
            className="tutorial-domain-detail__name"
            style={{ color: detail.color }}
          >
            <span
              className="tutorial-domain-card__dot"
              style={{ backgroundColor: detail.color, width: 12, height: 12 }}
            />
            {detail.name}
          </div>

          <div className="tutorial-domain-detail__section">
            <div className="tutorial-domain-detail__label">What it models</div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {detail.description}
            </p>
          </div>

          <div className="tutorial-domain-detail__section">
            <div className="tutorial-domain-detail__label">Key variables</div>
            <ul className="tutorial-domain-detail__vars">
              {detail.variables.map((v) => (
                <li key={v} className="tutorial-domain-detail__var">
                  {v}
                </li>
              ))}
            </ul>
          </div>

          <div className="tutorial-domain-detail__section">
            <div className="tutorial-domain-detail__label">Strategic importance</div>
            <p style={{ fontSize: "0.83rem", color: "var(--accent-yellow)", lineHeight: 1.5, margin: 0 }}>
              {detail.strategic}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
