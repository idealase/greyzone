import { useEffect, useRef, useState, useCallback } from "react";
import {
  ALL_DOMAINS,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  DomainLayer,
} from "../../types/domain";
import { WorldState } from "../../types/run";
import { PHASE_COLORS } from "../../types/phase";

interface BattlespaceCanvasProps {
  worldState: WorldState | null;
  previousWorldState: WorldState | null;
}

/** Simple seeded PRNG for stable particle positions. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Parse hex color "#rrggbb" to [r, g, b]. */
function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

// Grid layout: 4 columns x 2 rows
const COLS = 4;
const ROWS = 2;
const ZONE_PAD = 3;

// Short labels for compact display
const SHORT_LABELS: Record<DomainLayer, string> = {
  [DomainLayer.Kinetic]: "KIN",
  [DomainLayer.MaritimeLogistics]: "MAR",
  [DomainLayer.Energy]: "NRG",
  [DomainLayer.GeoeconomicIndustrial]: "GEO",
  [DomainLayer.Cyber]: "CYB",
  [DomainLayer.SpacePnt]: "SPC",
  [DomainLayer.InformationCognitive]: "INF",
  [DomainLayer.DomesticPoliticalFiscal]: "POL",
};

const DOMAIN_FULL_LABELS: Record<DomainLayer, string> = {
  [DomainLayer.Kinetic]: "Kinetic",
  [DomainLayer.MaritimeLogistics]: "Maritime",
  [DomainLayer.Energy]: "Energy",
  [DomainLayer.GeoeconomicIndustrial]: "Geoeconomic",
  [DomainLayer.Cyber]: "Cyber",
  [DomainLayer.SpacePnt]: "Space/PNT",
  [DomainLayer.InformationCognitive]: "Info/Cogn",
  [DomainLayer.DomesticPoliticalFiscal]: "Domestic",
};

interface ZoneRect {
  domain: DomainLayer;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TooltipData {
  domain: DomainLayer;
  x: number;
  y: number;
}

export default function BattlespaceCanvas({
  worldState,
  previousWorldState,
}: BattlespaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<DomainLayer | null>(null);
  const zoneRectsRef = useRef<ZoneRect[]>([]);

  // Track container width via ResizeObserver so we re-render on layout
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hitTest = useCallback((clientX: number, clientY: number): DomainLayer | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    for (const zone of zoneRectsRef.current) {
      if (mx >= zone.x && mx <= zone.x + zone.w && my >= zone.y && my <= zone.y + zone.h) {
        return zone.domain;
      }
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const domain = hitTest(e.clientX, e.clientY);
    setHoveredDomain(domain);
    if (domain) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setTooltip({ domain, x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
      }
    } else {
      setTooltip(null);
    }
  }, [hitTest]);

  const handleMouseLeave = useCallback(() => {
    setHoveredDomain(null);
    setTooltip(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // DPR-aware sizing
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = containerWidth;
    const displayHeight = Math.floor(displayWidth / 2); // 2:1 aspect ratio
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const cellW = displayWidth / COLS;
    const cellH = displayHeight / ROWS;

    // Store zone rects for hit-testing (in CSS pixel coords)
    const newZoneRects: ZoneRect[] = [];

    // 1. Background
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Phase-tinted background overlay
    if (worldState) {
      const phaseColor = PHASE_COLORS[worldState.phase];
      const [r, g, b] = hexToRgb(phaseColor);
      const alpha = Math.min(0.15, worldState.order_parameter * 0.2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    }

    if (!worldState) {
      // Empty state — draw zone outlines as structural skeleton
      ALL_DOMAINS.forEach((domain, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const x = col * cellW;
        const y = row * cellH;

        // Dim zone fill
        const [dr, dg, db] = hexToRgb(DOMAIN_COLORS[domain]);
        ctx.fillStyle = `rgba(${dr},${dg},${db},0.08)`;
        ctx.fillRect(x + ZONE_PAD, y + ZONE_PAD, cellW - ZONE_PAD * 2, cellH - ZONE_PAD * 2);

        // Border
        ctx.strokeStyle = `rgba(${dr},${dg},${db},0.3)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + ZONE_PAD, y + ZONE_PAD, cellW - ZONE_PAD * 2, cellH - ZONE_PAD * 2);

        // Label
        ctx.fillStyle = "rgba(160,160,160,0.5)";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(SHORT_LABELS[domain], x + ZONE_PAD + 4, y + ZONE_PAD + 4);
      });

      ctx.fillStyle = "#444";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Awaiting world state\u2026",
        displayWidth / 2,
        displayHeight / 2
      );
      zoneRectsRef.current = [];
      return;
    }

    const { layers, turn, coupling_matrix } = worldState;

    // Zone center coordinates for coupling lines
    const zoneCenters: Record<string, [number, number]> = {};

    // 2. Domain zones
    ALL_DOMAINS.forEach((domain, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = col * cellW;
      const y = row * cellH;
      const zx = x + ZONE_PAD;
      const zy = y + ZONE_PAD;
      const zw = cellW - ZONE_PAD * 2;
      const zh = cellH - ZONE_PAD * 2;
      const layer = layers[domain];

      const cx = x + cellW / 2;
      const cy = y + cellH / 2;
      zoneCenters[domain] = [cx, cy];

      // Store zone rect for hit-testing
      newZoneRects.push({ domain, x: zx, y: zy, w: zw, h: zh });

      const [dr, dg, db] = hexToRgb(DOMAIN_COLORS[domain]);
      const isHovered = hoveredDomain === domain;

      // Zone fill: domain color with minimum visibility + stress-driven intensity
      const fillAlpha = 0.12 + layer.stress * 0.75;
      ctx.fillStyle = `rgba(${dr},${dg},${db},${fillAlpha})`;
      ctx.fillRect(zx, zy, zw, zh);

      // Inner glow — brighter bar at bottom proportional to stress
      if (layer.stress > 0.01) {
        const barH = Math.max(2, zh * layer.stress * 0.3);
        ctx.fillStyle = `rgba(${dr},${dg},${db},${0.3 + layer.stress * 0.5})`;
        ctx.fillRect(zx, zy + zh - barH, zw, barH);
      }

      // Resilience border — always visible, thickness scales with resilience
      const borderAlpha = isHovered ? 1 : (0.35 + layer.resilience * 0.65);
      const borderWidth = isHovered ? (2 + layer.resilience * 3) : (1 + layer.resilience * 3);
      ctx.strokeStyle = isHovered
        ? `rgba(255,255,255,0.9)`
        : `rgba(${dr},${dg},${db},${borderAlpha})`;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        zx + borderWidth / 2,
        zy + borderWidth / 2,
        zw - borderWidth,
        zh - borderWidth
      );

      // Hover glow
      if (isHovered) {
        ctx.shadowColor = `rgba(${dr},${dg},${db},0.6)`;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = `rgba(${dr},${dg},${db},0.4)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(zx, zy, zw, zh);
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      // Activity particles — minimum 2 so zones always look "alive"
      const particleCount = Math.max(2, Math.floor(layer.activity_level * 25));
      const particleAlpha = 0.2 + layer.activity_level * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${particleAlpha})`;
      for (let i = 0; i < particleCount; i++) {
        const seed = turn * 1000 + idx * 100 + i;
        const px = zx + 6 + seededRandom(seed) * (zw - 12);
        const py = zy + 18 + seededRandom(seed + 7) * (zh - 24);
        const size = 1.5 + seededRandom(seed + 13) * 1.5;
        ctx.fillRect(px, py, size, size);
      }

      // Friction hatching
      if (layer.friction > 0.2) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(zx, zy, zw, zh);
        ctx.clip();

        const hatchAlpha = 0.06 + layer.friction * 0.12;
        ctx.strokeStyle = `rgba(255,255,255,${hatchAlpha})`;
        ctx.lineWidth = 0.5;
        const spacing = 6;
        const diag = zw + zh;
        for (let d = -diag; d < diag; d += spacing) {
          ctx.beginPath();
          ctx.moveTo(zx + d, zy);
          ctx.lineTo(zx + d + zh, zy + zh);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Turn flash: highlight domains with significant stress change
      if (previousWorldState) {
        const prevLayer = previousWorldState.layers[domain];
        if (prevLayer && Math.abs(layer.stress - prevLayer.stress) > 0.03) {
          const flashAlpha = Math.min(0.25, Math.abs(layer.stress - prevLayer.stress) * 0.8);
          ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
          ctx.fillRect(zx, zy, zw, zh);
        }
      }

      // Domain label — short code top-left, full name below
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = `rgba(${dr},${dg},${db},0.9)`;
      ctx.fillText(SHORT_LABELS[domain], zx + 4, zy + 4);

      ctx.font = "8px monospace";
      ctx.fillStyle = "rgba(180,180,180,0.5)";
      ctx.fillText(DOMAIN_FULL_LABELS[domain], zx + 4, zy + 16);

      // Stress value readout bottom-right
      const stressPct = (layer.stress * 100).toFixed(0);
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.font = "9px monospace";
      ctx.fillStyle = `rgba(${dr},${dg},${db},0.7)`;
      ctx.fillText(`${stressPct}%`, zx + zw - 4, zy + zh - 4);
    });

    zoneRectsRef.current = newZoneRects;

    // 3. Coupling lines
    if (coupling_matrix) {
      const drawn = new Set<string>();
      for (const domA of Object.keys(coupling_matrix)) {
        const rowData = coupling_matrix[domA];
        if (!rowData) continue;
        for (const domB of Object.keys(rowData)) {
          const weight = rowData[domB];
          if (weight <= 0.01) continue;
          const key = [domA, domB].sort().join("|");
          if (drawn.has(key)) continue;
          drawn.add(key);

          const a = zoneCenters[domA];
          const b = zoneCenters[domB];
          if (!a || !b) continue;

          const isHighlighted = hoveredDomain === domA || hoveredDomain === domB;
          ctx.strokeStyle = isHighlighted
            ? `rgba(200,210,240,${0.4 + weight * 0.5})`
            : `rgba(100,110,140,${0.15 + weight * 0.4})`;
          ctx.lineWidth = isHighlighted ? (1 + weight * 3) : (0.5 + weight * 2.5);
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        }
      }
    }
  }, [worldState, previousWorldState, containerWidth, hoveredDomain]);

  const fmtPct = (v: number) => `${(v * 100).toFixed(0)}%`;
  const layer = tooltip && worldState ? worldState.layers[tooltip.domain] : null;
  const prevLayer = tooltip && previousWorldState ? previousWorldState.layers[tooltip.domain] : null;
  const trendArrow = (cur: number, prev?: number) => {
    if (prev == null) return "→";
    const d = cur - prev;
    if (Math.abs(d) < 0.005) return "→";
    return d > 0 ? "↑" : "↓";
  };

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {containerWidth > 0 && (
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            imageRendering: "pixelated",
            width: containerWidth,
            height: Math.floor(containerWidth / 2),
            cursor: hoveredDomain ? "pointer" : "default",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* Hover tooltip */}
      {tooltip && layer && (
        <div
          className="bc-tooltip"
          style={{
            left: Math.min(tooltip.x + 12, containerWidth - 180),
            top: tooltip.y + 12,
          }}
        >
          <div className="bc-tooltip__title">{DOMAIN_LABELS[tooltip.domain]}</div>
          <div className="bc-tooltip__row">
            Stress: <strong>{fmtPct(layer.stress)}</strong> {trendArrow(layer.stress, prevLayer?.stress)}
          </div>
          <div className="bc-tooltip__row">
            Resilience: <strong>{fmtPct(layer.resilience)}</strong> {trendArrow(layer.resilience, prevLayer?.resilience)}
          </div>
          <div className="bc-tooltip__row">
            Activity: <strong>{fmtPct(layer.activity_level)}</strong>
          </div>
          <div className="bc-tooltip__row">
            Friction: <strong>{fmtPct(layer.friction)}</strong>
          </div>
        </div>
      )}

      {/* Legend toggle */}
      <button
        className="bc-legend-toggle"
        onClick={() => setShowLegend((v) => !v)}
        title="Toggle legend"
      >
        {showLegend ? "✕" : "?"}
      </button>

      {/* Legend overlay */}
      {showLegend && (
        <div className="bc-legend">
          <div className="bc-legend__title">Visual Legend</div>
          <div className="bc-legend__item">
            <span className="bc-legend__swatch bc-legend__swatch--fill" />
            Background intensity = stress level
          </div>
          <div className="bc-legend__item">
            <span className="bc-legend__swatch bc-legend__swatch--particles" />
            White dots = activity level
          </div>
          <div className="bc-legend__item">
            <span className="bc-legend__swatch bc-legend__swatch--hatch" />
            Diagonal hatching = friction
          </div>
          <div className="bc-legend__item">
            <span className="bc-legend__swatch bc-legend__swatch--line" />
            Line thickness = coupling strength
          </div>
          <div className="bc-legend__item">
            <span className="bc-legend__swatch bc-legend__swatch--border" />
            Border thickness = resilience
          </div>
        </div>
      )}
    </div>
  );
}
