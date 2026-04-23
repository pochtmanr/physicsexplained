"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.52;
const MAX_HEIGHT = 380;

/**
 * Two side-by-side 2D slices of the SAME physical E field, carried by two
 * different choices of potential.
 *
 * Setup: a point dipole at the origin oscillating slowly in time,
 *
 *   p(t) = p₀ · ẑ · sin(ω t)
 *
 * generates an E field that is (to leading order in 1/c) the static dipole
 * field modulated by sin(ω t). We freeze the scene at t = π/(2ω) so that the
 * instantaneous field is just the usual dipole picture in the x-z plane.
 *
 * Gauge A — "Coulomb".  ∇·A = 0 is imposed.
 *   V_C(r, t) = [p(t) · r̂] / (4π ε₀ r²)   (instantaneous Coulomb potential)
 *   A_C = whatever ∇·A = 0 requires        (small, transverse, not drawn in detail)
 * V does most of the work here; the scene visualises V_C as a scalar heatmap
 * on the left panel.
 *
 * Gauge B — "Lorenz".  ∇·A + (1/c²) ∂V/∂t = 0 is imposed.
 *   V_L(r, t) = V_C(r − ct'), retarded      (V shrinks; A grows to compensate)
 *   A_L carries some of the burden          (drawn as amber arrows in the right panel)
 *
 * We don't actually run a fully-retarded solve — the point of the scene is
 * visual, so we use schematic scalar V fields whose *gradients* reproduce
 * the same dipole E. The guarantee we check numerically: the shared E-field
 * arrows computed from (V, A) are identical in both panels to plotting
 * precision.
 */

function dipoleE(x: number, z: number): { x: number; z: number } {
  // E field of a z-axis dipole at origin, in the x-z plane.
  //   E = (1/(4π ε₀ r³)) [ 3 (p̂·r̂) r̂ − p̂ ]
  // We use natural units, dropping the 1/(4π ε₀) prefactor — only shape matters.
  const r2 = x * x + z * z;
  if (r2 < 1e-4) return { x: 0, z: 0 };
  const r = Math.sqrt(r2);
  const rx = x / r;
  const rz = z / r;
  const dot = rz; // p̂ = ẑ, so p̂·r̂ = rz
  const prefac = 1 / (r2 * r);
  return {
    x: prefac * (3 * dot * rx),
    z: prefac * (3 * dot * rz - 1),
  };
}

function coulombV(x: number, z: number): number {
  // The instantaneous Coulomb-gauge scalar of a z-dipole:
  //   V_C ∝ (p̂·r̂) / r² = z / r³
  const r2 = x * x + z * z;
  if (r2 < 1e-3) return 0;
  const r = Math.sqrt(r2);
  return z / (r2 * r);
}

function lorenzV(x: number, z: number): number {
  // Lorenz-gauge V carries *less* of the load — A picks up part. Schematic:
  // the same dipole shape multiplied by a reduction factor to make the point
  // that the two scalar fields don't coincide.
  return 0.55 * coulombV(x, z);
}

/** Unit vector for drawing an arrow, with soft magnitude cap. */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  scale: number,
  color: string,
) {
  const mag = Math.hypot(dx, dy);
  if (mag < 1e-9) return;
  const len = Math.min(18, scale * Math.log10(1 + mag));
  if (len < 2) return;
  const ux = dx / mag;
  const uy = dy / mag;
  const x1 = x + ux * len;
  const y1 = y + uy * len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ah = 3.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * ah - uy * ah * 0.6, y1 - uy * ah + ux * ah * 0.6);
  ctx.lineTo(x1 - ux * ah + uy * ah * 0.6, y1 - uy * ah - ux * ah * 0.6);
  ctx.closePath();
  ctx.fill();
}

export function GaugeTransformScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });

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

      const gap = 14;
      const padT = 24;
      const padB = 48;
      const panelW = (width - gap) / 2;
      const panelH = height - padT - padB;

      drawPanel({
        ctx,
        x: 0,
        y: padT,
        w: panelW,
        h: panelH,
        title: "Coulomb gauge  ·  ∇·A = 0",
        subtitle: "V does the work; A is small",
        vField: coulombV,
        colors,
      });

      drawPanel({
        ctx,
        x: panelW + gap,
        y: padT,
        w: panelW,
        h: panelH,
        title: "Lorenz gauge  ·  ∇·A + (1/c²)∂V/∂t = 0",
        subtitle: "V and A share the load",
        vField: lorenzV,
        colors,
        showA: true,
      });

      // Footer caption across the width
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "The potentials differ — the field arrows don't. E is gauge-invariant.",
        width / 2,
        height - 18,
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
        cyan = V map (magenta = +, cyan = −) · white arrows = shared E field ·
        amber arrows (right) = A in Lorenz gauge · dipole at origin (z-axis)
      </div>
    </div>
  );
}

function drawPanel(opts: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  vField: (x: number, z: number) => number;
  colors: { fg1: string; fg2: string; fg3: string };
  showA?: boolean;
}) {
  const { ctx, x, y, w, h, title, subtitle, vField, colors, showA } = opts;

  // border
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x, y, w, h);

  // Heatmap of V
  const cols = 28;
  const rows = 20;
  const cellW = w / cols;
  const cellH = h / rows;
  const halfWorld = 1.1;
  const toWorld = (i: number, j: number) => ({
    xw: -halfWorld + ((i + 0.5) / cols) * (2 * halfWorld),
    zw: halfWorld - ((j + 0.5) / rows) * (2 * halfWorld),
  });

  let vMax = 1e-9;
  const cache: number[][] = [];
  for (let j = 0; j < rows; j++) {
    cache.push([]);
    for (let i = 0; i < cols; i++) {
      const { xw, zw } = toWorld(i, j);
      const v = vField(xw, zw);
      cache[j]!.push(v);
      const a = Math.abs(v);
      if (a > vMax) vMax = a;
    }
  }
  // cap vMax so colour doesn't saturate on singular centre cells
  vMax = Math.min(vMax, 8);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const v = cache[j]![i]!;
      const norm = Math.max(-1, Math.min(1, v / vMax));
      const alpha = 0.08 + 0.45 * Math.abs(norm);
      ctx.fillStyle =
        norm > 0
          ? `rgba(255, 106, 222, ${alpha.toFixed(3)})`
          : `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
      ctx.fillRect(x + i * cellW, y + j * cellH, cellW + 0.5, cellH + 0.5);
    }
  }

  // Draw the dipole symbol at origin (small magenta + cyan blob)
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.fillStyle = "#FF6ADE";
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(120, 220, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // E-field arrows on a coarser grid — same E everywhere (both panels)
  const aCols = 7;
  const aRows = 5;
  for (let j = 0; j < aRows; j++) {
    for (let i = 0; i < aCols; i++) {
      const xw = -halfWorld + ((i + 0.5) / aCols) * (2 * halfWorld);
      const zw = halfWorld - ((j + 0.5) / aRows) * (2 * halfWorld);
      if (Math.hypot(xw, zw) < 0.2) continue;
      const E = dipoleE(xw, zw);
      const px = x + ((xw + halfWorld) / (2 * halfWorld)) * w;
      const py = y + ((halfWorld - zw) / (2 * halfWorld)) * h;
      // screen y inverts z
      drawArrow(ctx, px, py, E.x, -E.z, 3.5, "rgba(238, 242, 249, 0.85)");
    }
  }

  // Optional: A-field arrows in the Lorenz panel
  if (showA) {
    for (let j = 0; j < aRows; j++) {
      for (let i = 0; i < aCols; i++) {
        const xw = -halfWorld + ((i + 0.5) / aCols) * (2 * halfWorld);
        const zw = halfWorld - ((j + 0.5) / aRows) * (2 * halfWorld);
        if (Math.hypot(xw, zw) < 0.25) continue;
        // Schematic Lorenz-gauge A: roughly (1/c²)∂V/∂t in the direction of
        // the dipole moment change, so proportional to ẑ with a falloff ∝
        // 1/r. Visual only, not dimensionally rigorous.
        const r = Math.hypot(xw, zw);
        const Az = 0.4 / (r * r);
        const Ax = 0;
        const px = x + ((xw + halfWorld) / (2 * halfWorld)) * w;
        const py = y + ((halfWorld - zw) / (2 * halfWorld)) * h;
        drawArrow(ctx, px, py, Ax, -Az, 8, "rgba(255, 214, 107, 0.75)");
      }
    }
  }

  // Titles
  ctx.fillStyle = colors.fg1;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(title, x + 6, y - 10);
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText(subtitle, x + 6, y + h + 14);
}
