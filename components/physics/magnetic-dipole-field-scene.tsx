"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  dipoleFieldEquatorial,
  dipoleFieldOnAxis,
} from "@/lib/physics/electromagnetism/magnetic-dipole";

const RATIO = 0.65;
const MAX_HEIGHT = 420;
const M_MOMENT = 1.0; // A·m² in physical units; the picture is dimensionless.

/**
 * Far-field B pattern of a small magnetic dipole, sampled on a grid.
 * The dipole sits at the centre with m pointing along +x. At each grid
 * point we evaluate the textbook far-field
 *
 *   B(r) = (μ₀ / 4π) · [ 3(m·r̂)r̂ − m ] / r³
 *
 * and draw an arrow whose direction follows B and whose length is a
 * compressed function of |B|. The pattern is identical (with E → B) to
 * the electric dipole the reader already met under Coulomb's law —
 * which is exactly the point of the figure.
 *
 * The slider for "view distance" effectively zooms out: as you increase
 * the field-of-view radius, the on-axis HUD readout tracks |B|(z) on
 * the right-hand axis, demonstrating the 1/r³ falloff.
 */
export function MagneticDipoleFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });
  // viewDistance: how far (in metres) the right edge of the canvas is from
  // the dipole. Larger = zoomed out; 1/r³ drop becomes very visible.
  const [viewDistance, setViewDistance] = useState(0.5);

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

      const cx = width / 2;
      const cy = height / 2;

      // Map screen pixels → physical metres so that the right edge sits
      // at +viewDistance metres from the dipole.
      const halfWidthM = viewDistance;
      const pxToM = halfWidthM / (width / 2);

      // Sample grid
      const cellPx = 32;
      const cols = Math.floor(width / cellPx);
      const rows = Math.floor(height / cellPx);
      const xOffset = (width - cols * cellPx) / 2 + cellPx / 2;
      const yOffset = (height - rows * cellPx) / 2 + cellPx / 2;

      // Skip cells too close to the dipole (the far-field formula diverges)
      const minR = halfWidthM * 0.08;

      // First pass: compute samples and find max magnitude for normalization
      const samples: Array<{
        sx: number;
        sy: number;
        bx: number;
        by: number;
      }> = [];
      let maxMag = 0;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const sx = xOffset + i * cellPx;
          const sy = yOffset + j * cellPx;
          const x = (sx - cx) * pxToM;
          const y = -(sy - cy) * pxToM; // flip y so canvas-down = -y physical
          const r = Math.hypot(x, y);
          if (r < minR) continue;
          const B = dipoleFarField2D(M_MOMENT, x, y);
          const mag = Math.hypot(B.x, B.y);
          if (mag > maxMag) maxMag = mag;
          samples.push({ sx, sy, bx: B.x, by: B.y });
        }
      }

      // Draw arrows
      const arrowMax = cellPx * 0.6;
      for (const s of samples) {
        const mag = Math.hypot(s.bx, s.by);
        if (mag === 0) continue;
        const norm = Math.log10(1 + mag) / Math.log10(1 + maxMag);
        const length = Math.max(4, norm * arrowMax);
        const ux = s.bx / mag;
        const uy = -s.by / mag; // flip back into canvas coords
        const x1 = s.sx + ux * length;
        const y1 = s.sy + uy * length;
        const alpha = 0.3 + 0.55 * norm;
        ctx.strokeStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
        ctx.fillStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.sx, s.sy);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const ah = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - ux * ah - uy * ah * 0.5, y1 - uy * ah + ux * ah * 0.5);
        ctx.lineTo(x1 - ux * ah + uy * ah * 0.5, y1 - uy * ah - ux * ah * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      // Draw the dipole as a small loop (edge-on) with m arrow
      drawDipole(ctx, cx, cy);

      // HUD
      const z1 = halfWidthM * 0.5; // a sample distance along axis
      const z2 = halfWidthM * 1.0;
      const Baxis1 = dipoleFieldOnAxis(M_MOMENT, z1);
      const Baxis2 = dipoleFieldOnAxis(M_MOMENT, z2);
      const Beq1 = dipoleFieldEquatorial(M_MOMENT, z1);

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`view radius: ${(halfWidthM * 100).toFixed(1)} cm`, 12, 18);
      ctx.fillText(
        `B_axis(${(z1 * 100).toFixed(0)} cm) = ${formatTesla(Baxis1)}`,
        12,
        34,
      );
      ctx.fillText(
        `B_axis(${(z2 * 100).toFixed(0)} cm) = ${formatTesla(Baxis2)}`,
        12,
        50,
      );
      ctx.textAlign = "right";
      ctx.fillText(
        `B_axis / B_eq at ${(z1 * 100).toFixed(0)} cm = ${(Baxis1 / Beq1).toFixed(2)}`,
        width - 12,
        18,
      );
      ctx.fillText(
        `ratio of inner to outer = ${(Baxis1 / Baxis2).toFixed(1)}× (1/r³)`,
        width - 12,
        34,
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
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm text-[var(--color-fg-3)]">
            view radius
          </label>
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.05}
            value={viewDistance}
            onChange={(e) => setViewDistance(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {(viewDistance * 100).toFixed(0)} cm
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Far-field magnetic dipole at the origin with moment m along +x̂,
 * evaluated at (x, y). Returns components in the same physical units
 * as μ₀ allows.
 *
 *   B = (μ₀ / 4π) · [ 3(m·r̂)r̂ − m ] / r³
 */
function dipoleFarField2D(
  m: number,
  x: number,
  y: number,
): { x: number; y: number } {
  const r2 = x * x + y * y;
  if (r2 === 0) return { x: 0, y: 0 };
  const r = Math.sqrt(r2);
  // m points along +x̂, so m·r̂ = m·(x/r). The vector m_vec = (m, 0).
  const mDotRhat = (m * x) / r;
  // 3(m·r̂)r̂ − m_vec
  const ax = 3 * mDotRhat * (x / r) - m;
  const ay = 3 * mDotRhat * (y / r);
  // (μ₀ / 4π) / r³ — we drop the constant prefactor in the picture since
  // we normalize arrow length by the maximum sampled magnitude. The shape
  // of the field is what matters here.
  const k = 1 / (r * r * r);
  return { x: k * ax, y: k * ay };
}

function drawDipole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  // Loop drawn edge-on (m points to the right): a thin vertical ellipse.
  ctx.strokeStyle = "#FFD66B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4, 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  // m arrow
  ctx.strokeStyle = "#FFD66B";
  ctx.fillStyle = "#FFD66B";
  ctx.lineWidth = 2;
  const ax = cx + 28;
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy);
  ctx.lineTo(ax, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax, cy);
  ctx.lineTo(ax - 6, cy - 4);
  ctx.lineTo(ax - 6, cy + 4);
  ctx.closePath();
  ctx.fill();

  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("m", ax + 4, cy + 4);
}

function formatTesla(B: number): string {
  const abs = Math.abs(B);
  if (abs >= 1) return `${B.toFixed(2)} T`;
  if (abs >= 1e-3) return `${(B * 1e3).toFixed(2)} mT`;
  if (abs >= 1e-6) return `${(B * 1e6).toFixed(2)} µT`;
  if (abs >= 1e-9) return `${(B * 1e9).toFixed(2)} nT`;
  return `${B.toExponential(2)} T`;
}
