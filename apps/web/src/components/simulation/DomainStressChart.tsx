import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DomainLayer, DOMAIN_LABELS, DOMAIN_COLORS, ALL_DOMAINS } from "../../types/domain";

interface StressHistoryEntry {
  turn: number;
  values: Record<DomainLayer, number>;
}

interface DomainStressChartProps {
  stressHistory: StressHistoryEntry[];
}

export default function DomainStressChart({
  stressHistory,
}: DomainStressChartProps) {
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

  const chartData = stressHistory.map((entry) => ({
    turn: entry.turn,
    ...entry.values,
  }));

  return (
    <div className="card">
      <div className="card__title">Domain Stress Over Time</div>
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
              formatter={(value: number, name: string) => [
                `${(value * 100).toFixed(1)}%`,
                DOMAIN_LABELS[name as DomainLayer] ?? name,
              ]}
            />
            {ALL_DOMAINS.map((domain) => (
              <Line
                key={domain}
                type="monotone"
                dataKey={domain}
                stroke={DOMAIN_COLORS[domain]}
                strokeWidth={1.5}
                dot={false}
                name={domain}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
