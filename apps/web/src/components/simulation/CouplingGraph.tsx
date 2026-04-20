import { useMemo } from "react";
import { ALL_DOMAINS, DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS } from "../../types/domain";
import { LayerState } from "../../types/domain";

interface CouplingGraphProps {
  couplingMatrix: Record<string, Record<string, number>>;
  layers?: Record<DomainLayer, LayerState>;
  activeCouplings?: Array<{ source: string; target: string }>;
}

interface NodePosition {
  x: number;
  y: number;
  domain: DomainLayer;
}

function edgeColor(weight: number): string {
  if (weight >= 0.5) return "#ef4444";
  if (weight >= 0.25) return "#eab308";
  return "#22c55e";
}

export default function CouplingGraph({ couplingMatrix, layers, activeCouplings = [] }: CouplingGraphProps) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 120;

  const nodes: NodePosition[] = useMemo(() => {
    return ALL_DOMAINS.map((domain, i) => {
      const angle = (2 * Math.PI * i) / ALL_DOMAINS.length - Math.PI / 2;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        domain,
      };
    });
  }, [cx, cy]);

  const activeSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of activeCouplings) {
      s.add(`${c.source}|${c.target}`);
      s.add(`${c.target}|${c.source}`);
    }
    return s;
  }, [activeCouplings]);

  const edges = useMemo(() => {
    const result: {
      from: NodePosition;
      to: NodePosition;
      weight: number;
      active: boolean;
    }[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const from = nodes[i];
        const to = nodes[j];
        const w1 = couplingMatrix[from.domain]?.[to.domain] ?? 0;
        const w2 = couplingMatrix[to.domain]?.[from.domain] ?? 0;
        const weight = Math.max(Math.abs(w1), Math.abs(w2));
        if (weight > 0.01) {
          const active = activeSet.has(`${from.domain}|${to.domain}`);
          result.push({ from, to, weight, active });
        }
      }
    }
    // Sort so active edges draw on top
    result.sort((a, b) => (a.active === b.active ? 0 : a.active ? 1 : -1));
    return result;
  }, [nodes, couplingMatrix, activeSet]);

  return (
    <div className="coupling-graph">
      <div className="card__title" style={{ padding: "0.5rem 0.5rem 0" }}>
        Domain Coupling Map
      </div>
      <div className="coupling-graph__legend">
        <span className="coupling-legend-item"><span className="coupling-dot" style={{ background: "#22c55e" }} /> Weak</span>
        <span className="coupling-legend-item"><span className="coupling-dot" style={{ background: "#eab308" }} /> Medium</span>
        <span className="coupling-legend-item"><span className="coupling-dot" style={{ background: "#ef4444" }} /> Strong</span>
        {activeCouplings.length > 0 && (
          <span className="coupling-legend-item"><span className="coupling-dot coupling-dot--pulse" /> Active</span>
        )}
      </div>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="auto">
        {edges.map((edge, i) => {
          const midX = (edge.from.x + edge.to.x) / 2;
          const midY = (edge.from.y + edge.to.y) / 2;
          return (
            <g key={i}>
              <line
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke={edge.active ? "#60a5fa" : edgeColor(edge.weight)}
                strokeWidth={Math.max(1, edge.weight * 5)}
                strokeOpacity={edge.active ? 0.9 : 0.3 + edge.weight * 0.4}
                className={edge.active ? "coupling-edge--active" : ""}
              />
              {edge.weight >= 0.1 && (
                <text
                  x={midX}
                  y={midY - 4}
                  textAnchor="middle"
                  fill={edge.active ? "#93c5fd" : "#94a3b8"}
                  fontSize={7}
                  fontFamily="sans-serif"
                  fontWeight={edge.active ? 700 : 400}
                >
                  {edge.weight.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((node) => {
          const stress = layers?.[node.domain]?.stress ?? 0.5;
          const nodeRadius = 10 + stress * 8;
          return (
            <g key={node.domain}>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={DOMAIN_COLORS[node.domain]}
                fillOpacity={0.8}
                stroke={DOMAIN_COLORS[node.domain]}
                strokeWidth={1.5}
              />
              <text
                x={node.x}
                y={node.y + nodeRadius + 10}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize={7}
                fontFamily="sans-serif"
              >
                {DOMAIN_LABELS[node.domain].length > 12
                  ? DOMAIN_LABELS[node.domain].slice(0, 12) + "..."
                  : DOMAIN_LABELS[node.domain]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
