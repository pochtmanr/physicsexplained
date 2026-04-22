"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { normalEJump } from "@/lib/physics/electromagnetism/boundary-conditions";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

/**
 * Two dielectrics meet on a horizontal interface. An applied uniform E field
 * tilted at some angle hits the boundary from above. We display:
 *   - the E vectors (resultant amber arrows) and their tangential/normal
 *     components on each side,
 *   - a HUD showing how each piece transforms across.
 *
 * Sliders: κ₁ (above), κ₂ (below), σ_free on the interface, tilt of E_above.
 *
 * Tangential E always matches across (gauss loop). Normal E jumps according
 * to κ₁E_n − κ₂E_n = σ_free / ε₀ (in scaled units we drop ε₀).
 */
export function BoundaryEFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [kappa1, setKappa1] = useState(1);
  const [kappa2, setKappa2] = useState(4);
  const [sigmaFree, setSigmaFree] = useState(0); // scaled units (σ/ε₀ in V/m)
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

      // Layout: horizontal interface across the canvas mid-line.
      const interfaceY = height * 0.52;
      const cx = width / 2;

      // E_above: a uniform field at the chosen tilt. Magnitude = 1 (scaled).
      // theta is measured from the surface NORMAL (so θ = 0 is normal incidence).
      const theta1 = (theta1deg * Math.PI) / 180;
      const E1mag = 1;
      const E1_t = E1mag * Math.sin(theta1);
      const E1_n = E1mag * Math.cos(theta1);

      // Apply boundary conditions.
      // We use a scaled σ where σ/ε₀ goes directly into the formula. Pass
      // sigmaFree * EPSILON_0 to the helper so the EPSILON_0 in the divisor
      // cancels out — but easier: invoke the math inline with our scaled units.
      const E2_t = E1_t; // tangential E continuous
      // normalEJump expects σ in C/m². We want our slider to act as σ/ε₀ directly,
      // so pass sigmaFree * EPSILON_0 — but cleaner to compute manually here:
      const E2_n = (kappa1 * E1_n - sigmaFree) / kappa2;

      // ====================================================================
      // 1. The two media — tinted backgrounds
      // ====================================================================
      ctx.fillStyle = "rgba(255, 106, 222, 0.04)"; // faint magenta tint above
      ctx.fillRect(0, 0, width, interfaceY);
      ctx.fillStyle = "rgba(111, 184, 198, 0.05)"; // faint cyan tint below
      ctx.fillRect(0, interfaceY, width, height - interfaceY);

      // ====================================================================
      // 2. The interface line + σ_free indicator
      // ====================================================================
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, interfaceY);
      ctx.lineTo(width - 20, interfaceY);
      ctx.stroke();

      // σ_free band (only when nonzero)
      if (Math.abs(sigmaFree) > 1e-6) {
        const bandH = 4;
        ctx.fillStyle = sigmaFree > 0 ? "#FF6ADE" : "#6FB8C6";
        ctx.globalAlpha = Math.min(0.65, 0.15 + Math.abs(sigmaFree) * 0.5);
        ctx.fillRect(20, interfaceY - bandH / 2, width - 40, bandH);
        ctx.globalAlpha = 1;
      }

      // Medium labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`medium 1   κ₁ = ${kappa1.toFixed(2)}`, 14, 18);
      ctx.fillText(
        `medium 2   κ₂ = ${kappa2.toFixed(2)}`,
        14,
        height - 12,
      );

      // ====================================================================
      // 3. The E vectors — drawn at three sample columns (left, centre, right)
      // ====================================================================
      const cols = [cx - width * 0.28, cx, cx + width * 0.28];
      const armPx = 60; // length representing |E1| = 1

      // Above-interface (E1) and below-interface (E2) anchor offsets
      const yAbove = interfaceY - 70;
      const yBelow = interfaceY + 70;

      cols.forEach((x) => {
        // E1 vector (above) — tilted from normal by theta1; we use the
        // convention that the tangential component is +x, normal is into the
        // interface (downward in canvas coords).
        const e1x = E1_t * armPx;
        const e1y = E1_n * armPx; // positive = downward = into interface
        drawArrow(ctx, x, yAbove, x + e1x, yAbove + e1y, "#FFD66B", 2.2);
        // Decompose into t / n (faint guides)
        drawArrow(
          ctx,
          x,
          yAbove,
          x + e1x,
          yAbove,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );
        drawArrow(
          ctx,
          x + e1x,
          yAbove,
          x + e1x,
          yAbove + e1y,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );

        // E2 vector (below) — note E2_n may have flipped sign with σ_free.
        const e2x = E2_t * armPx;
        const e2y = E2_n * armPx;
        drawArrow(ctx, x, yBelow, x + e2x, yBelow + e2y, "#FFD66B", 2.2);
        drawArrow(
          ctx,
          x,
          yBelow,
          x + e2x,
          yBelow,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );
        drawArrow(
          ctx,
          x + e2x,
          yBelow,
          x + e2x,
          yBelow + e2y,
          "rgba(255, 214, 107, 0.45)",
          1.2,
          true,
        );
      });

      // Centre-column annotations
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("E₁", cx + 8, yAbove - 8);
      ctx.fillText("E₂", cx + 8, yBelow - 8);

      // ====================================================================
      // 4. HUD — numerical values
      // ====================================================================
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`E₁_t = ${E1_t.toFixed(3)}`, width - 14, 18);
      ctx.fillText(`E₂_t = ${E2_t.toFixed(3)}  (matches)`, width - 14, 34);
      ctx.fillText(`E₁_n = ${E1_n.toFixed(3)}`, width - 14, 54);
      ctx.fillText(
        `E₂_n = ${E2_n.toFixed(3)}  (jumps)`,
        width - 14,
        70,
      );
      if (Math.abs(sigmaFree) > 1e-6) {
        ctx.fillStyle = "#FF6ADE";
        ctx.fillText(
          `σ_free / ε₀ = ${sigmaFree.toFixed(3)}`,
          width - 14,
          90,
        );
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
          <label className="w-16 text-[var(--color-fg-3)]">σ/ε₀</label>
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

// Note: normalEJump is imported above. We compute the same expression inline
// in scaled units (σ already pre-divided by ε₀) for clarity in the canvas.
// The library function is verified by the test suite; this scene mirrors it.
void normalEJump;

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
