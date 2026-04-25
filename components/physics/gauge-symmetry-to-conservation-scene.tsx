"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.63b — Noether's bridge: gauge symmetry ⟹ conserved current.
 *
 * Two side-by-side panels with a connecting arrow.
 *
 *   LEFT — U(1) phase circle with a generator arrow. A small dot orbits
 *   the circle (lilac) representing the continuous symmetry parameter
 *   θ ∈ [0, 2π). The generator arrow (lilac) shows the infinitesimal
 *   shift δψ = iqδθ ψ. Label: "U(1) symmetry: ψ → e^{iqθ}ψ".
 *
 *   ARROW — a curved amber arrow with the legend "Noether 1918".
 *
 *   RIGHT — a closed cyan surface with magenta four-current arrows
 *   flowing in on one side and out the other in equal amount. Label:
 *   "∂_μ J^μ = 0  →  charge conservation". Animated flow.
 *
 * Slider: q (the charge coupling). Larger q makes the inflow/outflow
 * arrows bigger, but the conservation law is exact regardless of q —
 * which is the point.
 *
 * Palette:
 *   lilac   — symmetry generator / phase circle
 *   amber   — Noether bridge arrow
 *   cyan    — closed surface
 *   magenta — four-current J flowing through
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

export function GaugeSymmetryToConservationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [charge, setCharge] = useState(1.0);
  const chargeRef = useRef(charge);
  useEffect(() => {
    chargeRef.current = charge;
  }, [charge]);

  const [size, setSize] = useState({ width: 720, height: 380 });
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
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const q = chargeRef.current;

      const padX = 12;
      const innerW = width - 2 * padX;
      const leftW = innerW * 0.42;
      const arrowW = innerW * 0.16;
      const rightW = innerW - leftW - arrowW;

      // ── LEFT PANEL: U(1) circle ──
      drawSymmetryPanel(ctx, colors, padX, 0, leftW, height, t);

      // ── ARROW PANEL ──
      drawNoetherBridge(
        ctx,
        colors,
        padX + leftW,
        0,
        arrowW,
        height,
      );

      // ── RIGHT PANEL: conserved current ──
      drawConservationPanel(
        ctx,
        colors,
        padX + leftW + arrowW,
        0,
        rightW,
        height,
        t,
        q,
      );

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "every continuous symmetry of the action ⟹ a conserved current   (Noether 1918)",
        width / 2,
        height - 10,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">q</label>
        <input
          type="range"
          min={0.2}
          max={2}
          step={0.05}
          value={charge}
          onChange={(e) => setCharge(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {charge.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Charge q sets the size of the four-current J^μ — but ∂_μJ^μ = 0
        regardless. The conservation law is the symmetry, not the magnitude.
      </div>
    </div>
  );
}

function drawSymmetryPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x0: number,
  y0: number,
  w: number,
  h: number,
  t: number,
): void {
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 4, y0 + 4, w - 8, h - 36);

  ctx.fillStyle = colors.fg1;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("U(1) phase symmetry", x0 + 12, y0 + 22);

  // Centred circle
  const cx = x0 + w / 2;
  const cy = y0 + h * 0.50;
  const R = Math.min(w * 0.32, h * 0.32);

  // Circle stroke (lilac)
  ctx.strokeStyle = "rgba(200, 160, 255, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Tick marks at 0, π/2, π, 3π/2
  ctx.fillStyle = "rgba(200, 160, 255, 0.55)";
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const x = cx + R * Math.cos(a);
    const y = cy - R * Math.sin(a);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Orbiting dot — represents continuous symmetry parameter θ
  const theta = (t * 0.6) % (Math.PI * 2);
  const dotX = cx + R * Math.cos(theta);
  const dotY = cy - R * Math.sin(theta);

  // Trail (faded arc behind the dot)
  ctx.strokeStyle = "rgba(120, 220, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, -theta, -theta + 0.6, true);
  ctx.stroke();

  // Generator arrow — tangent to the circle at the dot
  const tx = -Math.sin(theta);
  const ty = -Math.cos(theta);
  const tipX = dotX + tx * R * 0.35;
  const tipY = dotY + ty * R * 0.35;
  drawArrow(ctx, dotX, dotY, tipX, tipY, "rgba(255, 180, 80, 0.95)", 1.8);

  // Dot
  ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
  ctx.beginPath();
  ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Centre label "ψ"
  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ψ", cx, cy + 4);

  // Equation under
  ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ψ → e^{iqθ}ψ", cx, y0 + h - 22);
}

function drawNoetherBridge(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x0: number,
  y0: number,
  w: number,
  h: number,
): void {
  const cy = y0 + h * 0.50;

  // Curved arrow
  ctx.strokeStyle = "rgba(255, 180, 80, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 6, cy);
  ctx.bezierCurveTo(
    x0 + w * 0.4,
    cy - 18,
    x0 + w * 0.6,
    cy + 18,
    x0 + w - 14,
    cy,
  );
  ctx.stroke();

  // Arrow head
  ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
  ctx.beginPath();
  ctx.moveTo(x0 + w - 6, cy);
  ctx.lineTo(x0 + w - 14, cy - 6);
  ctx.lineTo(x0 + w - 14, cy + 6);
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Noether", x0 + w / 2, cy - 22);
  ctx.fillText("1918", x0 + w / 2, cy + 28);
}

function drawConservationPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x0: number,
  y0: number,
  w: number,
  h: number,
  t: number,
  q: number,
): void {
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 4, y0 + 4, w - 8, h - 36);

  ctx.fillStyle = colors.fg1;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("conserved four-current", x0 + 12, y0 + 22);

  // Closed surface (cyan dashed rectangle)
  const surfX = x0 + w * 0.22;
  const surfY = y0 + h * 0.30;
  const surfW = w * 0.56;
  const surfH = h * 0.40;

  ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(surfX, surfY, surfW, surfH);
  ctx.setLineDash([]);

  // Inflow / outflow arrows — magenta
  const arrowAlpha = 0.55 + 0.4 * (Math.sin(t * 1.6) + 1) * 0.5;
  const arrowLen = 38 + 18 * (q - 1);
  const nArrows = 3;
  for (let i = 0; i < nArrows; i++) {
    const yA = surfY + (i + 0.5) * (surfH / nArrows);
    drawArrow(
      ctx,
      surfX - arrowLen,
      yA,
      surfX - 6,
      yA,
      `rgba(255, 106, 222, ${arrowAlpha.toFixed(3)})`,
      1.8,
    );
    drawArrow(
      ctx,
      surfX + surfW + 6,
      yA,
      surfX + surfW + arrowLen,
      yA,
      `rgba(255, 106, 222, ${arrowAlpha.toFixed(3)})`,
      1.8,
    );
  }

  // Labels
  ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("J^μ in", surfX - arrowLen / 2 - 6, surfY - 6);
  ctx.fillText("J^μ out", surfX + surfW + arrowLen / 2 + 6, surfY - 6);

  ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
  ctx.font = "11px monospace";
  ctx.fillText("∂_μ J^μ = 0", x0 + w / 2, y0 + h - 22);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(7, len * 0.35);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * head + nx * head * 0.5,
    y1 - uy * head + ny * head * 0.5,
  );
  ctx.lineTo(
    x1 - ux * head - nx * head * 0.5,
    y1 - uy * head - ny * head * 0.5,
  );
  ctx.closePath();
  ctx.fill();
}
