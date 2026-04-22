"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  boundSurfaceChargeDensity,
  boundVolumeChargeDensity,
} from "@/lib/physics/electromagnetism/polarization";

/**
 * Two side-by-side panels.
 *
 * LEFT — Uniform polarization. Every dipole points the same way. Inside
 * the slab the +/− pieces of neighbouring atoms cancel exactly, so the
 * volume looks neutral. Only at the edges does the leaning fail to
 * cancel: the right face shows a row of leftover positive ends, the
 * left face a row of leftover negative ends. ρ_b = 0; σ_b = ±P.
 *
 * RIGHT — Diverging polarization. Dipoles fan outward from the centre,
 * so |P| grows with distance from the midline. Now the cancellation
 * inside fails: each row of atoms has more negative charge sitting on
 * its left than positive on its right, and a net negative ρ_b appears
 * in the bulk. ρ_b = −∇·P.
 *
 * Both panels share the same colour grammar as the money shot.
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";
const P_DEMO = 1.0e-6; // C/m² for HUD readouts

export function BoundChargeDensityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 320 });

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.46, 280), 360) });
        }
      }
    });
    ro.observe(c);
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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const panelW = width / 2;
      const wobble = 0.04 * Math.sin(t * 1.2); // gentle breathing

      // Divider line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelW, height * 0.12);
      ctx.lineTo(panelW, height * 0.88);
      ctx.stroke();

      drawUniformPanel(ctx, 0, 0, panelW, height, wobble, colors);
      drawDivergentPanel(ctx, panelW, 0, panelW, height, wobble, colors);
    },
  });

  // Pre-compute the displayed σ_b so the HUD numbers are exact, not eyeballed.
  const sigmaRight = boundSurfaceChargeDensity(
    { x: P_DEMO, y: 0 },
    { x: 1, y: 0 },
  );
  const sigmaLeft = boundSurfaceChargeDensity(
    { x: P_DEMO, y: 0 },
    { x: -1, y: 0 },
  );
  // For the divergent panel we use ∇·P = +1.5 × 10⁻⁴ C/m³ as a visual stand-in
  const divP = 1.5e-4;
  const rhoB = boundVolumeChargeDensity(divP);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-2 gap-3 px-2 text-xs font-mono text-[var(--color-fg-2)]">
        <div>
          <span className="text-[var(--color-fg-3)]">uniform P → </span>
          <span style={{ color: MAGENTA }}>+σ_b = {sigmaRight.toExponential(2)} C/m²</span>
          <span className="text-[var(--color-fg-3)]"> · </span>
          <span style={{ color: CYAN }}>−σ_b = {sigmaLeft.toExponential(2)} C/m²</span>
          <span className="text-[var(--color-fg-3)]"> · ρ_b = 0</span>
        </div>
        <div>
          <span className="text-[var(--color-fg-3)]">∇·P = +{divP.toExponential(1)} → </span>
          <span style={{ color: CYAN }}>ρ_b = {rhoB.toExponential(2)} C/m³</span>
        </div>
      </div>
    </div>
  );
}

function drawUniformPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  pw: number,
  ph: number,
  wobble: number,
  colors: { fg2: string; fg3: string },
) {
  const slabLeft = x0 + pw * 0.1;
  const slabRight = x0 + pw * 0.9;
  const slabTop = y0 + ph * 0.22;
  const slabBottom = y0 + ph * 0.78;
  const slabW = slabRight - slabLeft;
  const slabH = slabBottom - slabTop;

  // Slab outline
  ctx.fillStyle = "rgba(111, 184, 198, 0.04)";
  ctx.fillRect(slabLeft, slabTop, slabW, slabH);
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(slabLeft, slabTop, slabW, slabH);
  ctx.setLineDash([]);

  // Panel title
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("UNIFORM P → BOUND SURFACE CHARGE ONLY", x0 + pw / 2, y0 + 18);

  // Bound surface highlights (right = +, left = −)
  ctx.shadowColor = "rgba(255, 106, 222, 0.65)";
  ctx.shadowBlur = 14;
  ctx.strokeStyle = "rgba(255, 106, 222, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(slabRight, slabTop);
  ctx.lineTo(slabRight, slabBottom);
  ctx.stroke();
  ctx.shadowColor = "rgba(111, 184, 198, 0.65)";
  ctx.strokeStyle = "rgba(111, 184, 198, 0.9)";
  ctx.beginPath();
  ctx.moveTo(slabLeft, slabTop);
  ctx.lineTo(slabLeft, slabBottom);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = MAGENTA;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("+σ_b", slabRight + 5, slabTop + 12);
  ctx.fillStyle = CYAN;
  ctx.textAlign = "right";
  ctx.fillText("−σ_b", slabLeft - 5, slabTop + 12);

  // Dipole grid — every dipole identical, pointing right
  const cols = 6;
  const rows = 4;
  const dx = slabW / (cols + 1);
  const dy = slabH / (rows + 1);
  const half = Math.min(dx, dy) * 0.32;
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const cx = slabLeft + c * dx;
      const cy = slabTop + r * dy;
      drawDipole(ctx, cx, cy, 0 + wobble, half);
    }
  }

  // P label and arrow inside slab
  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("P →", x0 + pw / 2, slabBottom + 16);
}

function drawDivergentPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  pw: number,
  ph: number,
  wobble: number,
  colors: { fg2: string; fg3: string },
) {
  const slabLeft = x0 + pw * 0.1;
  const slabRight = x0 + pw * 0.9;
  const slabTop = y0 + ph * 0.22;
  const slabBottom = y0 + ph * 0.78;
  const slabW = slabRight - slabLeft;
  const slabH = slabBottom - slabTop;
  const cx0 = x0 + pw / 2;
  const cy0 = y0 + ph / 2;

  // Slab outline
  ctx.fillStyle = "rgba(111, 184, 198, 0.04)";
  ctx.fillRect(slabLeft, slabTop, slabW, slabH);
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(slabLeft, slabTop, slabW, slabH);
  ctx.setLineDash([]);

  // Panel title
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("DIVERGING P → BULK BOUND CHARGE", x0 + pw / 2, y0 + 18);

  // Tint the bulk to suggest negative ρ_b (since ∇·P > 0 here)
  ctx.fillStyle = "rgba(111, 184, 198, 0.10)";
  ctx.fillRect(slabLeft + 4, slabTop + 4, slabW - 8, slabH - 8);

  // ρ_b label inside
  ctx.fillStyle = CYAN;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ρ_b < 0", cx0, cy0 + 4);

  // Dipole grid — each dipole points radially outward from (cx0, cy0)
  const cols = 6;
  const rows = 4;
  const dx = slabW / (cols + 1);
  const dy = slabH / (rows + 1);
  const half0 = Math.min(dx, dy) * 0.18;
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const cx = slabLeft + c * dx;
      const cy = slabTop + r * dy;
      const rx = cx - cx0;
      const ry = cy - cy0;
      const dist = Math.hypot(rx, ry);
      if (dist < 1) continue;
      const ang = Math.atan2(ry, rx) + wobble * 0.3;
      // Length grows with distance to make ∇·P clearly positive
      const half = half0 + (dist / Math.hypot(slabW, slabH)) * half0 * 4;
      drawDipole(ctx, cx, cy, ang, half);
    }
  }

  // P arrows (radial, on the four sides) in faint amber
  const radii = Math.min(slabW, slabH) * 0.42;
  ctx.strokeStyle = "rgba(255, 214, 107, 0.45)";
  ctx.fillStyle = "rgba(255, 214, 107, 0.45)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const xa = cx0 + Math.cos(a) * radii;
    const ya = cy0 + Math.sin(a) * radii;
    const xb = cx0 + Math.cos(a) * (radii + 14);
    const yb = cy0 + Math.sin(a) * (radii + 14);
    ctx.beginPath();
    ctx.moveTo(xa, ya);
    ctx.lineTo(xb, yb);
    ctx.stroke();
    const ah = 4;
    ctx.beginPath();
    ctx.moveTo(xb, yb);
    ctx.lineTo(
      xb - ah * Math.cos(a - Math.PI / 6),
      yb - ah * Math.sin(a - Math.PI / 6),
    );
    ctx.lineTo(
      xb - ah * Math.cos(a + Math.PI / 6),
      yb - ah * Math.sin(a + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("P spreads outward", x0 + pw / 2, slabBottom + 16);
}

function drawDipole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angleRad: number,
  halfLen: number,
) {
  const dx = Math.cos(angleRad) * halfLen;
  const dy = Math.sin(angleRad) * halfLen;
  // Connecting line
  ctx.strokeStyle = "rgba(180, 200, 220, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - dy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.stroke();
  // Negative end (cyan)
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(cx - dx, cy - dy, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // Positive end (magenta)
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.arc(cx + dx, cy + dy, 2.6, 0, Math.PI * 2);
  ctx.fill();
}
