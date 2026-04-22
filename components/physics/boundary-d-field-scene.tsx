"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

/**
 * Same setup as the E-field scene, but the arrows show the D vector instead.
 *
 * Boundary conditions:
 *   D₁_n − D₂_n = σ_free      (normal D continuous when σ_free = 0)
 *   D₂_t        = (κ₂/κ₁) D₁_t  (tangential D scales with κ ratio)
 *
 * The reveal: D's normal component is the cleanest of all four — it just
 * matches when there's no free surface charge, regardless of the κ jump.
 * That's why D is the right field to think with at dielectric interfaces.
 */
export function BoundaryDFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [kappa1, setKappa1] = useState(1);
  const [kappa2, setKappa2] = useState(4);
  const [sigmaFree, setSigmaFree] = useState(0); // scaled (in same units as D)
  const [theta1deg, setTheta1deg] = useState(40);
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

      const interfaceY = height * 0.52;
      const cx = width / 2;

      // Reference: an applied E in medium 1 with magnitude 1, tilt theta1
      // from the normal. Then D₁ = κ₁ E₁ in scaled units.
      const theta1 = (theta1deg * Math.PI) / 180;
      const E1mag = 1;
      const D1_t = kappa1 * E1mag * Math.sin(theta1);
      const D1_n = kappa1 * E1mag * Math.cos(theta1);

      // Boundary conditions for D:
      const D2_n = D1_n - sigmaFree;       // normal D ↔ σ_free
      const D2_t = (kappa2 / kappa1) * D1_t; // tangential D scales by κ ratio

      // ---- backgrounds ----
      ctx.fillStyle = "rgba(255, 106, 222, 0.04)";
      ctx.fillRect(0, 0, width, interfaceY);
      ctx.fillStyle = "rgba(111, 184, 198, 0.05)";
      ctx.fillRect(0, interfaceY, width, height - interfaceY);

      // ---- interface line ----
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, interfaceY);
      ctx.lineTo(width - 20, interfaceY);
      ctx.stroke();

      if (Math.abs(sigmaFree) > 1e-6) {
        const bandH = 4;
        ctx.fillStyle = sigmaFree > 0 ? "#FF6ADE" : "#6FB8C6";
        ctx.globalAlpha = Math.min(0.65, 0.15 + Math.abs(sigmaFree) * 0.5);
        ctx.fillRect(20, interfaceY - bandH / 2, width - 40, bandH);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`medium 1   κ₁ = ${kappa1.toFixed(2)}`, 14, 18);
      ctx.fillText(`medium 2   κ₂ = ${kappa2.toFixed(2)}`, 14, height - 12);

      // ---- D vectors ----
      const cols = [cx - width * 0.28, cx, cx + width * 0.28];
      const armPx = 38; // smaller scale because D ~ κ E and κ can be 10
      const yAbove = interfaceY - 70;
      const yBelow = interfaceY + 70;

      cols.forEach((x) => {
        const d1x = D1_t * armPx;
        const d1y = D1_n * armPx;
        drawArrow(ctx, x, yAbove, x + d1x, yAbove + d1y, "#FFD66B", 2.2);
        drawArrow(
          ctx,
          x,
          yAbove,
          x + d1x,
          yAbove,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );
        drawArrow(
          ctx,
          x + d1x,
          yAbove,
          x + d1x,
          yAbove + d1y,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );

        const d2x = D2_t * armPx;
        const d2y = D2_n * armPx;
        drawArrow(ctx, x, yBelow, x + d2x, yBelow + d2y, "#FFD66B", 2.2);
        drawArrow(
          ctx,
          x,
          yBelow,
          x + d2x,
          yBelow,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );
        drawArrow(
          ctx,
          x + d2x,
          yBelow,
          x + d2x,
          yBelow + d2y,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );
      });

      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("D₁", cx + 8, yAbove - 8);
      ctx.fillText("D₂", cx + 8, yBelow - 8);

      // ---- HUD ----
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`D₁_t = ${D1_t.toFixed(3)}`, width - 14, 18);
      ctx.fillText(`D₂_t = ${D2_t.toFixed(3)}  (×κ₂/κ₁)`, width - 14, 34);
      ctx.fillText(`D₁_n = ${D1_n.toFixed(3)}`, width - 14, 54);
      ctx.fillText(
        `D₂_n = ${D2_n.toFixed(3)}  ${
          Math.abs(sigmaFree) < 1e-6 ? "(matches!)" : "(jumps by σ_free)"
        }`,
        width - 14,
        70,
      );
      if (Math.abs(sigmaFree) > 1e-6) {
        ctx.fillStyle = "#FF6ADE";
        ctx.fillText(`σ_free = ${sigmaFree.toFixed(3)}`, width - 14, 90);
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-col gap-3 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <label className="w-16 text-[var(--color-fg-3)]">κ₁ (top)</label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={kappa1}
            onChange={(e) => setKappa1(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {kappa1.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-16 text-[var(--color-fg-3)]">κ₂ (bot)</label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={kappa2}
            onChange={(e) => setKappa2(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {kappa2.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-16 text-[var(--color-fg-3)]">σ_free</label>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={sigmaFree}
            onChange={(e) => setSigmaFree(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {sigmaFree.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-16 text-[var(--color-fg-3)]">tilt θ₁</label>
          <input
            type="range"
            min={0}
            max={75}
            step={1}
            value={theta1deg}
            onChange={(e) => setTheta1deg(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {theta1deg.toFixed(0)}°
          </span>
        </div>
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
  dashed = false,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;

  ctx.save();
  if (dashed) ctx.setLineDash([3, 4]);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();

  if (dashed) return;

  const ux = dx / len;
  const uy = dy / len;
  const aSize = 5.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * aSize - uy * aSize * 0.55, y1 - uy * aSize + ux * aSize * 0.55);
  ctx.lineTo(x1 - ux * aSize + uy * aSize * 0.55, y1 - uy * aSize - ux * aSize * 0.55);
  ctx.closePath();
  ctx.fill();
}
