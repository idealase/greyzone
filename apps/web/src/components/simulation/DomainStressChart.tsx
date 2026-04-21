import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS, ALL_DOMAINS } from "../../types/domain";
import { Phase, PHASE_THRESHOLDS, PHASE_LABELS, PHASE_ORDER } from "../../types/phase";

interface StressHistoryEntry {
  turn: number;
  values: Record<DomainLayer, number>;
}

interface PsiHistoryEntry {
  turn: number;
  psi: number;
  phase: Phase;
}

interface DomainStressChartProps {
  stressHistory: StressHistoryEntry[];
  psiHistory?: PsiHistoryEntry[];
}

export default function DomainStressChart({
  stressHistory,
  psiHistory,
}: DomainStressChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [focusDomain, setFocusDomain] = useState<DomainLayer | null>(null);

  const toggleSeries = (key: string) => {
    if (focusDomain) return; // toggles disabled in focus mode
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleFocus = (domain: DomainLayer) => {
    if (focusDomain === domain) {
      setFocusDomain(null);
      setHiddenSeries(new Set());
    } else {
      setFocusDomain(domain);
    }
  };

  const clearFocus = () => {
    setFocusDomain(null);
    setHiddenSeries(new Set());
  };

  const isDomainVisible = (domain: DomainLayer) => {
    if (focusDomain) return domain === focusDomain;
    return !hiddenSeries.has(domain);
  };

  if (stressHistory.length === 0) {
    return (
      <div className="card">
        <div className="card__title">Domain Stress Over Time</div>
        <div className="card__body text-center" style={{ padding: "2rem 0" }}>
          No stress data yet. Advance turns to see trends.
        </div>
      </div>
    );
  }

  // Merge stress and Ψ data by turn
  const psiByTurn = new Map<number, number>();
  if (psiHistory) {
    for (const entry of psiHistory) {
      psiByTurn.set(entry.turn, entry.psi);
    }
  }

  const chartData = stressHistory.map((entry) => ({
    turn: entry.turn,
    ...entry.values,
    psi: psiByTurn.get(entry.turn) ?? null,
  }));

  return (
    <div className="card">
      <div className="card__title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          {focusDomain
            ? `${DOMAIN_LABELS[focusDomain]} Stress & Ψ`
            : "Domain Stress & Ψ Over Time"}
        </span>
        {focusDomain && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={clearFocus}>
            Show All
          </button>
        )}
      </div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3044" />
            <XAxis
              dataKey="turn"
              stroke="#71717a"
              tick={{ fontSize: 11 }}
              label={{ value: "Turn", position: "insideBottom", offset: -2, fill: "#71717a", fontSize: 11 }}
            />
            <YAxis
              domain={[0, 1]}
              stroke="#71717a"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1d27",
                border: "1px solid #2e3044",
                borderRadius: 6,
                fontSize: "0.78rem",
              }}
              labelFormatter={(label) => `Turn ${label}`}
              formatter={(value: number, name: string) => {
                if (name === "psi") return [`Ψ ${value.toFixed(3)}`, "Order Parameter"];
                return [
                  `${(value * 100).toFixed(1)}%`,
                  DOMAIN_LABELS[name as DomainLayer] ?? name,
                ];
              }}
            />
            {/* Phase threshold reference lines */}
            {PHASE_ORDER.slice(0, -1).map((p) => {
              const threshold = PHASE_THRESHOLDS[p];
              if (threshold === undefined) return null;
              return (
                <ReferenceLine
                  key={p}
                  y={threshold}
                  stroke={`${PHASE_LABELS[p].includes("0") ? "#22c55e" : "#ef4444"}33`}
                  strokeDasharray="2 4"
                  label={false}
                />
              );
            })}
            {ALL_DOMAINS.map((domain) => (
              <Line
                key={domain}
                type="monotone"
                dataKey={domain}
                stroke={DOMAIN_COLORS[domain]}
                strokeWidth={focusDomain === domain ? 2.5 : 1.5}
                dot={focusDomain === domain ? { r: 2 } : false}
                name={domain}
                hide={!isDomainVisible(domain)}
              />
            ))}
            {/* Ψ line */}
            <Line
              type="monotone"
              dataKey="psi"
              stroke="#a855f7"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: "#a855f7" }}
              name="psi"
              connectNulls
              hide={!focusDomain && hiddenSeries.has("psi")}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {ALL_DOMAINS.map((domain) => (
          <button
            key={domain}
            type="button"
            className={`chart-legend__item${!isDomainVisible(domain) ? " chart-legend__item--hidden" : ""}${focusDomain === domain ? " chart-legend__item--focused" : ""}`}
            onClick={() => toggleSeries(domain)}
            onDoubleClick={() => handleFocus(domain)}
            title="Click to toggle, double-click to focus"
          >
            <span
              className="chart-legend__swatch"
              style={{ background: DOMAIN_COLORS[domain] }}
            />
            {DOMAIN_LABELS[domain]}
          </button>
        ))}
        <button
          type="button"
          className={`chart-legend__item${hiddenSeries.has("psi") ? " chart-legend__item--hidden" : ""}`}
          onClick={() => toggleSeries("psi")}
        >
          <span
            className="chart-legend__swatch chart-legend__swatch--dashed"
            style={{ background: "#a855f7" }}
          />
          Ψ
        </button>
      </div>
    </div>
  );
}
