import { useMemo } from "react";
import { ALL_DOMAINS, DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS } from "../../types/domain";

interface CouplingGraphProps {
  couplingMatrix: Record<string, Record<string, number>>;
}

interface NodePosition {
  x: number;
  y: number;
  domain: DomainLayer;
}

export default function CouplingGraph({ couplingMatrix }: CouplingGraphProps) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;

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

  const edges = useMemo(() => {
    const result: {
      from: NodePosition;
      to: NodePosition;
      weight: number;
    }[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const from = nodes[i];
        const to = nodes[j];
        const w1 = couplingMatrix[from.domain]?.[to.domain] ?? 0;
        const w2 = couplingMatrix[to.domain]?.[from.domain] ?? 0;
        const weight = Math.max(Math.abs(w1), Math.abs(w2));
        if (weight > 0.01) {
          result.push({ from, to, weight });
        }
      }
    }
    return result;
  }, [nodes, couplingMatrix]);

  return (
    <div className="coupling-graph">
      <div className="card__title" style={{ padding: "0.5rem 0.5rem 0" }}>
        Domain Coupling
      </div>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="auto">
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke="#4a4e69"
            strokeWidth={Math.max(0.5, edge.weight * 4)}
            strokeOpacity={0.3 + edge.weight * 0.5}
          />
        ))}
        {nodes.map((node) => (
          <g key={node.domain}>
            <circle
              cx={node.x}
              cy={node.y}
              r={12}
              fill={DOMAIN_COLORS[node.domain]}
              fillOpacity={0.8}
              stroke={DOMAIN_COLORS[node.domain]}
              strokeWidth={1.5}
            />
            <text
              x={node.x}
              y={node.y + 22}
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
        ))}
      </svg>
    </div>
  );
}
