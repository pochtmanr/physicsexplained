"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { superpose } from "@/lib/physics/coulomb";

const RATIO = 0.65;
const MAX_HEIGHT = 380;

/**
 * A static dipole — one + and one − charge at fixed separation along x.
 * Sample the force-on-positive-test-charge field on a regular grid and draw
 * each sample as a small arrow. Pure educational diagram, no controls.
 */
export function DipoleFieldScene() {
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

      // Charge layout (in screen coords). Use 1 µC sources.
      const cx = width / 2;
      const cy = height / 2;
      const sep = Math.min(width * 0.18, 110); // separation in pixels
      const xPlus = cx - sep / 2;
      const xMinus = cx + sep / 2;

      // For the physics, treat 1 px = 0.005 m (so the dipole is roughly half a meter).
      const pxToM = 0.005;
      const sources = [
        { q: +1e-6, x: (xPlus - cx) * pxToM, y: 0 },
        { q: -1e-6, x: (xMinus - cx) * pxToM, y: 0 },
      ];

      // Sample grid of test points. Skip cells too close to a source.
      const cellPx = 36;
      const cols = Math.floor(width / cellPx);
      const rows = Math.floor(height / cellPx);
      const xOffset = (width - cols * cellPx) / 2 + cellPx / 2;
      const yOffset = (height - rows * cellPx) / 2 + cellPx / 2;
      const minDist = sep * 0.45;

      // First pass to find max magnitude for normalization
      const samples: Array<{ sx: number; sy: number; fx: number; fy: number }> = [];
      let maxMag = 0;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const sx = xOffset + i * cellPx;
          const sy = yOffset + j * cellPx;
          const dxP = sx - xPlus;
          const dyP = sy - cy;
          const dxM = sx - xMinus;
          const dyM = sy - cy;
          if (
            Math.hypot(dxP, dyP) < minDist ||
            Math.hypot(dxM, dyM) < minDist
          ) {
            continue;
          }
          const f = superpose(sources, {
            q: 1e-9, // 1 nC test charge
            x: (sx - cx) * pxToM,
            y: (sy - cy) * pxToM,
          });
          const mag = Math.hypot(f.x, f.y);
          if (mag > maxMag) maxMag = mag;
          samples.push({ sx, sy, fx: f.x, fy: f.y });
        }
      }

      // Draw sampled arrows
      const arrowMax = cellPx * 0.65;
      for (const s of samples) {
        const mag = Math.hypot(s.fx, s.fy);
        if (mag === 0) continue;
        // Logarithmic compression so weak-field cells still show
        const norm = Math.log10(1 + mag) / Math.log10(1 + maxMag);
        const length = Math.max(4, norm * arrowMax);
        const ux = s.fx / mag;
        const uy = s.fy / mag;
        const x1 = s.sx + ux * length;
        const y1 = s.sy + uy * length;
        const alpha = 0.35 + 0.55 * norm;
        ctx.strokeStyle = `rgba(111, 184, 198, ${alpha.toFixed(3)})`;
        ctx.fillStyle = `rgba(111, 184, 198, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.sx, s.sy);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        // arrowhead
        const ah = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - ux * ah - uy * ah * 0.5, y1 - uy * ah + ux * ah * 0.5);
        ctx.lineTo(x1 - ux * ah + uy * ah * 0.5, y1 - uy * ah - ux * ah * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      // Draw the two charges on top
      drawCharge(ctx, xPlus, cy, +1);
      drawCharge(ctx, xMinus, cy, -1);

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("force on a + test charge", 12, 18);
      ctx.textAlign = "right";
      ctx.fillText("dipole · |q| = 1 µC", width - 12, 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawCharge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sign: number,
) {
  const radius = 14;
  const isPos = sign > 0;
  const fill = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.6)"
    : "rgba(111, 184, 198, 0.6)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#1A1D24";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : "−", cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}
