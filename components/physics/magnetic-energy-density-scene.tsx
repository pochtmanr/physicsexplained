"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { magneticEnergyDensity } from "@/lib/physics/electromagnetism/magnetic-energy";

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const B_MAX = 3.0; // tesla — slider max

/**
 * FIG.24a — the field as reservoir, magnetic edition.
 *
 * A 2D square region of uniform B (into-page dots spaced on a lattice).
 * Shading intensity tracks u = B²/(2μ₀). Slider for B. Side bars compare
 * a linear |B| meter (left) to the quadratic u meter (right) — the same
 * trick the §01 EnergyDensityScene uses for ½ε₀E², only here for magnetism.
 *
 * HUD shows u in J/m³ with an intuition scale:
 *   1 T ≈ 398 kJ/m³ ≈ a 100-W bulb burning for ~66 minutes per cubic metre.
 *   2 T ≈ 1.59 MJ/m³ ≈ that same bulb for ~17 minutes per cubic metre (×4).
 *
 * The intensity shading uses a cyan→magenta layered wash matching the
 * electric counterpart, so the reader sees them as a pair.
 */
export function MagneticEnergyDensityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [B, setB] = useState(1.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const u = magneticEnergyDensity(B);
      const uMax = magneticEnergyDensity(B_MAX);
      const intensity = uMax > 0 ? u / uMax : 0;

      // Layout
      const padTop = 48;
      const padBottom = 60;
      const sideBarW = 60;
      const fieldLeft = sideBarW + 30;
      const fieldRight = width - sideBarW - 30;
      const fieldTop = padTop;
      const fieldBottom = height - padBottom;
      const fieldH = fieldBottom - fieldTop;
      const fieldW = fieldRight - fieldLeft;

      // ─── Shading: layered cyan→magenta wash proportional to u ───
      const cyanA = Math.min(0.55, 0.1 + 0.6 * intensity);
      const magentaA = Math.min(0.5, intensity * 0.65);
      ctx.fillStyle = `rgba(111, 184, 198, ${cyanA.toFixed(3)})`;
      ctx.fillRect(fieldLeft, fieldTop, fieldW, fieldH);
      ctx.fillStyle = `rgba(255, 106, 222, ${magentaA.toFixed(3)})`;
      ctx.fillRect(fieldLeft, fieldTop, fieldW, fieldH);

      // ─── B-field: uniform, into the page (⊗ symbols on a lattice) ───
      const stepX = 54;
      const stepY = 50;
      const arrowAlpha = (0.3 + 0.55 * (B / B_MAX)).toFixed(3);
      ctx.strokeStyle = `rgba(120, 220, 255, ${arrowAlpha})`;
      ctx.fillStyle = `rgba(120, 220, 255, ${arrowAlpha})`;
      ctx.lineWidth = 1.1;
      const cols = Math.max(3, Math.floor(fieldW / stepX));
      const rows = Math.max(3, Math.floor(fieldH / stepY));
      const cx0 = fieldLeft + fieldW / (cols + 1);
      const cy0 = fieldTop + fieldH / (rows + 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = cx0 + c * (fieldW / (cols + 1));
          const y = cy0 + r * (fieldH / (rows + 1));
          const R = 5.5;
          ctx.beginPath();
          ctx.arc(x, y, R, 0, Math.PI * 2);
          ctx.stroke();
          // "×" inside a circle for B into the page
          ctx.beginPath();
          ctx.moveTo(x - R * 0.55, y - R * 0.55);
          ctx.lineTo(x + R * 0.55, y + R * 0.55);
          ctx.moveTo(x + R * 0.55, y - R * 0.55);
          ctx.lineTo(x - R * 0.55, y + R * 0.55);
          ctx.stroke();
        }
      }

      // ─── Outline the field region ───
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(fieldLeft, fieldTop, fieldW, fieldH);

      // ─── Side bars: |B| (linear) vs u (quadratic) ───
      const barTop = padTop;
      const barBot = height - padBottom;
      const barH = barBot - barTop;
      const barW = 24;
      const barX1 = (sideBarW - barW) / 2 + 6;
      const barX2 = width - sideBarW + (sideBarW - barW) / 2 - 6;

      drawSideBar(ctx, {
        x: barX1,
        y: barTop,
        w: barW,
        h: barH,
        frac: B / B_MAX,
        label: "B",
        sublabel: `${B.toFixed(2)} T`,
        color: "#78DCFF",
        colors,
      });
      drawSideBar(ctx, {
        x: barX2,
        y: barTop,
        w: barW,
        h: barH,
        frac: intensity,
        label: "u",
        sublabel: formatDensity(u),
        color: "#FF6ADE",
        colors,
      });

      // ─── HUD ───
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText(`u = B² / (2 μ₀)`, fieldLeft, 22);
      ctx.textAlign = "right";
      ctx.fillText(formatDensity(u), fieldRight, 22);

      // Footer intuition
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `B is linear · u goes as B²  (the field stores the energy)`,
        width / 2,
        height - 30,
      );
      ctx.fillStyle = "rgba(120, 220, 255, 0.85)";
      ctx.font = "10px monospace";
      ctx.fillText(intuitionCaption(u), width / 2, height - 14);

      // Right-hand-rule / axes badge bottom-left
      drawAxesBadge(ctx, 18, height - 20, colors);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2 font-mono text-xs">
        <label className="w-8 text-[var(--color-fg-3)]">|B|</label>
        <input
          type="range"
          min={0}
          max={B_MAX}
          step={0.01}
          value={B}
          onChange={(e) => setB(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#78DCFF" }}
        />
        <span className="w-20 text-right text-[var(--color-fg-1)]">
          {B.toFixed(2)} T
        </span>
      </div>
    </div>
  );
}

function drawSideBar(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    frac: number;
    label: string;
    sublabel: string;
    color: string;
    colors: { fg2: string; fg3: string };
  },
) {
  const { x, y, w, h, frac, label, sublabel, color, colors } = opts;
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  const fillH = Math.max(0, Math.min(1, frac)) * h;
  ctx.fillStyle = color;
  ctx.fillRect(x, y + h - fillH, w, fillH);

  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y - 6);
  ctx.font = "10px monospace";
  ctx.fillText(sublabel, x + w / 2, y + h + 14);
}

function drawAxesBadge(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  colors: { fg2: string; fg3: string },
) {
  // x̂ right, ŷ up, B into page (circle with ×)
  const len = 16;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1.1;

  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + len, oy);
  ctx.lineTo(ox + len - 3, oy - 3);
  ctx.lineTo(ox + len - 3, oy + 3);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy - len);
  ctx.lineTo(ox - 3, oy - len + 3);
  ctx.lineTo(ox + 3, oy - len + 3);
  ctx.closePath();
  ctx.fill();

  // B into page
  ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
  const bx = ox + 10;
  const by = oy - 12;
  ctx.beginPath();
  ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx - 2.4, by - 2.4);
  ctx.lineTo(bx + 2.4, by + 2.4);
  ctx.moveTo(bx + 2.4, by - 2.4);
  ctx.lineTo(bx - 2.4, by + 2.4);
  ctx.stroke();

  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("B⊗", ox + 17, oy - 9);
}

function formatDensity(u: number): string {
  if (u === 0) return "0 J/m³";
  if (u >= 1e6) return `${(u / 1e6).toFixed(2)} MJ/m³`;
  if (u >= 1e3) return `${(u / 1e3).toFixed(1)} kJ/m³`;
  if (u >= 1) return `${u.toFixed(2)} J/m³`;
  return `${u.toExponential(2)} J/m³`;
}

function intuitionCaption(u: number): string {
  // "this cubic metre at |B| stores as much energy as …"
  // 100 W bulb = 100 J/s  →  minutes = u / 6000
  const minutes = u / 6000;
  if (minutes < 1 / 60) return `≈ nothing — empty-space territory`;
  if (minutes < 1) return `≈ a 100-W bulb for ${(minutes * 60).toFixed(0)} s per m³`;
  if (minutes < 120) return `≈ a 100-W bulb for ${minutes.toFixed(0)} min per m³`;
  const hours = minutes / 60;
  return `≈ a 100-W bulb for ${hours.toFixed(1)} h per m³`;
}
