"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { aFromInfiniteWire } from "@/lib/physics/electromagnetism/vector-potential";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * Side-by-side: A from a current-carrying wire vs. V from a line of charge.
 *
 * Both fields satisfy a Poisson equation in the Coulomb gauge:
 *
 *   ∇²V = −ρ/ε₀
 *   ∇²A = −μ₀ J
 *
 * — same shape, different source. For the 1D-symmetric case (infinite wire
 * vs infinite line), both potentials fall off logarithmically with
 * perpendicular distance. The wire's A points axially (along the current);
 * the line's V is a scalar. Otherwise they tell exactly the same story.
 *
 * Left panel: cross-section of the wire. A is into/out of page (axial); we
 * encode it by the colour intensity of each cell, magenta for +A_z. Field
 * lines of B = ∇×A swirl in φ̂ — drawn as faint blue-cyan rings.
 * Right panel: cross-section of the line of charge. V is a scalar drawn as
 * heatmap (magenta = high V near positive line). E = −∇V points outward.
 *
 * The visual punchline: the colour pattern in both panels is the same shape.
 */
export function ASourceCurrentScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 420 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
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

      const stacked = width < 560;
      const panelW = stacked ? width : width / 2;
      const panelH = stacked ? height / 2 : height;

      drawWirePanel(ctx, 0, 0, panelW, panelH);

      const x2 = stacked ? 0 : panelW;
      const y2 = stacked ? panelH : 0;
      drawLineChargePanel(ctx, x2, y2, panelW, panelH);

      // Faint divider
      ctx.strokeStyle = "rgba(86, 104, 127, 0.35)";
      ctx.lineWidth = 1;
      if (stacked) {
        ctx.beginPath();
        ctx.moveTo(0, panelH);
        ctx.lineTo(width, panelH);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(panelW, 0);
        ctx.lineTo(panelW, height);
        ctx.stroke();
      }

      // Headers
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("A from wire   ∇²A = −μ₀J", 12, 16);
      ctx.textAlign = stacked ? "left" : "left";
      ctx.fillText(
        "V from line of charge   ∇²V = −ρ/ε₀",
        x2 + 12,
        y2 + 16,
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
      <div className="mt-2 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        same Poisson equation, different source · A is a vector (axial,
        along J) · V is a scalar · both fall off as −ln(r/d_ref)
      </div>
    </div>
  );
}

function drawWirePanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
) {
  // Wire at the centre, current I = 1 A out of page, dRef = 0.5 m.
  const I = 1;
  const dRef = 0.5;
  const halfWorld = 0.5;
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const scale = Math.min(w, h) * 0.42;

  // Heatmap of A_z
  const cellPx = 5;
  const cols = Math.floor(w / cellPx);
  const rows = Math.floor(h / cellPx);
  // First find max |A| for normalization, ignoring the singular core.
  let aMax = 0;
  const samples: number[] = new Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const sx = x0 + (i + 0.5) * cellPx;
      const sy = y0 + (j + 0.5) * cellPx;
      const xM = (sx - cx) / scale;
      const yM = -(sy - cy) / scale;
      const r = Math.hypot(xM, yM);
      const rClamped = Math.max(r, 0.04);
      const a = aFromInfiniteWire(I, rClamped, dRef);
      samples[j * cols + i] = a;
      if (Math.abs(a) > aMax) aMax = Math.abs(a);
    }
  }
  const aClip = aMax * 0.85;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = samples[j * cols + i]!;
      const norm = Math.max(-1, Math.min(1, a / aClip));
      ctx.fillStyle = scalarColor(norm);
      ctx.fillRect(
        x0 + i * cellPx,
        y0 + j * cellPx,
        cellPx + 0.5,
        cellPx + 0.5,
      );
    }
  }

  // B-field rings (faint, cyan) — concentric
  ctx.strokeStyle = "rgba(120, 220, 255, 0.45)";
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  for (const f of [0.12, 0.2, 0.32, 0.45]) {
    ctx.beginPath();
    ctx.arc(cx, cy, f * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Tiny arrows on one ring to show φ̂ direction
  const ringR = 0.32 * scale;
  ctx.fillStyle = "rgba(120, 220, 255, 0.85)";
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2;
    const px = cx + ringR * Math.cos(ang);
    const py = cy + ringR * Math.sin(ang);
    // tangent (counterclockwise in math, screen y flipped → adjust)
    const tx = -Math.sin(ang);
    const ty = -Math.cos(ang); // screen-y inverted
    const ah = 4;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - tx * ah - ty * ah * 0.5, py - ty * ah + tx * ah * 0.5);
    ctx.lineTo(px - tx * ah + ty * ah * 0.5, py - ty * ah - tx * ah * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Wire (current out of page)
  ctx.fillStyle = "rgba(255, 214, 107, 1.0)";
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1A1D24";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Frame
  ctx.strokeStyle = "rgba(86, 104, 127, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  // Labels
  ctx.fillStyle = "rgba(238, 242, 249, 0.7)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("J ⊙", cx + 12, cy - 8);
  void halfWorld;
}

function drawLineChargePanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
) {
  // Line of positive charge at the centre, dRef = 0.5 m.
  // V from an infinite line: V = −(λ/2πε₀) · ln(r/dRef). Same shape as A.
  const halfWorld = 0.5;
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const scale = Math.min(w, h) * 0.42;
  const dRef = 0.5;

  const cellPx = 5;
  const cols = Math.floor(w / cellPx);
  const rows = Math.floor(h / cellPx);
  let vMax = 0;
  const samples: number[] = new Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const sx = x0 + (i + 0.5) * cellPx;
      const sy = y0 + (j + 0.5) * cellPx;
      const xM = (sx - cx) / scale;
      const yM = -(sy - cy) / scale;
      const r = Math.hypot(xM, yM);
      const rClamped = Math.max(r, 0.04);
      // Same logarithmic shape as A — sign convention: positive line, V > 0
      // near the line. Use −ln(r/dRef) so V is large near the wire.
      const v = -Math.log(rClamped / dRef);
      samples[j * cols + i] = v;
      if (Math.abs(v) > vMax) vMax = Math.abs(v);
    }
  }
  const vClip = vMax * 0.85;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const v = samples[j * cols + i]!;
      const norm = Math.max(-1, Math.min(1, v / vClip));
      ctx.fillStyle = scalarColor(norm);
      ctx.fillRect(
        x0 + i * cellPx,
        y0 + j * cellPx,
        cellPx + 0.5,
        cellPx + 0.5,
      );
    }
  }

  // E-field outward arrows on a ring
  const ringR = 0.32 * scale;
  ctx.fillStyle = "rgba(255, 106, 222, 0.85)";
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2;
    const px = cx + ringR * Math.cos(ang);
    const py = cy + ringR * Math.sin(ang);
    // outward radial
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const ah = 4;
    ctx.strokeStyle = "rgba(255, 106, 222, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + ux * ah * 1.6, py + uy * ah * 1.6);
    ctx.stroke();
    const tipX = px + ux * ah * 1.6;
    const tipY = py + uy * ah * 1.6;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - ux * ah - uy * ah * 0.5, tipY - uy * ah + ux * ah * 0.5);
    ctx.lineTo(tipX - ux * ah + uy * ah * 0.5, tipY - uy * ah - ux * ah * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Equipotential rings (faint)
  ctx.strokeStyle = "rgba(238, 242, 249, 0.18)";
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  for (const f of [0.12, 0.2, 0.32, 0.45]) {
    ctx.beginPath();
    ctx.arc(cx, cy, f * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Line of charge (cross-section: a +)
  ctx.fillStyle = "rgba(255, 106, 222, 1.0)";
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1A1D24";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", cx, cy + 1);
  ctx.textBaseline = "alphabetic";

  // Frame
  ctx.strokeStyle = "rgba(86, 104, 127, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  ctx.fillStyle = "rgba(238, 242, 249, 0.7)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("λ > 0", cx + 12, cy - 8);
  void dRef;
  void halfWorld;
}

/** Magenta for +, cyan for −, black for 0. norm ∈ [−1, 1]. */
function scalarColor(norm: number, alpha = 1): string {
  const n = Math.max(-1, Math.min(1, norm));
  if (n >= 0) {
    const r = Math.round(20 + n * (255 - 20));
    const g = Math.round(28 + n * (106 - 28));
    const b = Math.round(48 + n * (222 - 48));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    const t = -n;
    const r = Math.round(20 + t * (120 - 20));
    const g = Math.round(28 + t * (220 - 28));
    const b = Math.round(48 + t * (255 - 48));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
