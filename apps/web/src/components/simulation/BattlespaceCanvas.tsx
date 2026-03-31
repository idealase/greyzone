import { useEffect, useRef, useState } from "react";
import {
  ALL_DOMAINS,
  DOMAIN_COLORS,
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

export default function BattlespaceCanvas({
  worldState,
  previousWorldState,
}: BattlespaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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

    // 1. Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Phase-tinted background overlay
    if (worldState) {
      const phaseColor = PHASE_COLORS[worldState.phase];
      const [r, g, b] = hexToRgb(phaseColor);
      const alpha = Math.min(0.15, worldState.order_parameter * 0.2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    }

    // 2. Grid lines
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      const x = c * cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayHeight);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = r * cellH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayWidth, y);
      ctx.stroke();
    }

    if (!worldState) {
      // Empty state label
      ctx.fillStyle = "#555";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Awaiting world state\u2026",
        displayWidth / 2,
        displayHeight / 2
      );
      return;
    }

    const { layers, turn, coupling_matrix } = worldState;

    // Zone center coordinates for coupling lines
    const zoneCenters: Record<string, [number, number]> = {};

    // 3. Domain zones
    ALL_DOMAINS.forEach((domain, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = col * cellW;
      const y = row * cellH;
      const layer = layers[domain];

      const cx = x + cellW / 2;
      const cy = y + cellH / 2;
      zoneCenters[domain] = [cx, cy];

      // Zone fill: domain color at stress-driven alpha
      const [dr, dg, db] = hexToRgb(DOMAIN_COLORS[domain]);
      const fillAlpha = 0.15 + layer.stress * 0.85;
      ctx.fillStyle = `rgba(${dr},${dg},${db},${fillAlpha})`;
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // Resilience border
      const borderWidth = 1 + layer.resilience * 4;
      ctx.strokeStyle = DOMAIN_COLORS[domain];
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        x + borderWidth / 2,
        y + borderWidth / 2,
        cellW - borderWidth,
        cellH - borderWidth
      );

      // Activity particles
      const particleCount = Math.floor(layer.activity_level * 20);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      for (let i = 0; i < particleCount; i++) {
        const seed = turn * 1000 + idx * 100 + i;
        const px = x + 4 + seededRandom(seed) * (cellW - 8);
        const py = y + 4 + seededRandom(seed + 7) * (cellH - 8);
        const size = 2 + seededRandom(seed + 13);
        ctx.fillRect(px, py, size, size);
      }

      // Friction hatching
      if (layer.friction > 0.3) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, cellW, cellH);
        ctx.clip();

        ctx.strokeStyle = `rgba(255,255,255,0.15)`;
        ctx.lineWidth = 0.5;
        const spacing = 8;
        const diag = cellW + cellH;
        for (let d = -diag; d < diag; d += spacing) {
          ctx.beginPath();
          ctx.moveTo(x + d, y);
          ctx.lineTo(x + d + cellH, y + cellH);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Turn flash: highlight domains with significant stress change
      if (previousWorldState) {
        const prevLayer = previousWorldState.layers[domain];
        if (prevLayer && Math.abs(layer.stress - prevLayer.stress) > 0.05) {
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        }
      }
    });

    // 4. Coupling lines
    if (coupling_matrix) {
      const drawn = new Set<string>();
      for (const domA of Object.keys(coupling_matrix)) {
        const row = coupling_matrix[domA];
        if (!row) continue;
        for (const domB of Object.keys(row)) {
          const weight = row[domB];
          if (weight <= 0.01) continue;
          const key = [domA, domB].sort().join("|");
          if (drawn.has(key)) continue;
          drawn.add(key);

          const a = zoneCenters[domA];
          const b = zoneCenters[domB];
          if (!a || !b) continue;

          ctx.strokeStyle = `rgba(74,78,105,${0.2 + weight * 0.5})`;
          ctx.lineWidth = 0.5 + weight * 3;
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        }
      }
    }

    // 5. Domain labels
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "9px monospace";
    ALL_DOMAINS.forEach((domain, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = col * cellW + 4;
      const y = row * cellH + 3;
      ctx.fillStyle = "rgba(204,204,204,0.7)";
      ctx.fillText(SHORT_LABELS[domain], x, y);
    });
  }, [worldState, previousWorldState, containerWidth]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {containerWidth > 0 && (
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            imageRendering: "pixelated",
            width: containerWidth,
            height: Math.floor(containerWidth / 2),
          }}
        />
      )}
    </div>
  );
}
