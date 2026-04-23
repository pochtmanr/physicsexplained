"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  planeWaveB,
  planeWaveE,
  speedOfLight,
} from "@/lib/physics/electromagnetism/em-wave-equation";

const RATIO = 0.56;
const MAX_HEIGHT = 440;

const MAGENTA = "rgba(255, 100, 200,"; // E-field
const CYAN = "rgba(120, 220, 255,"; // B-field
const AMBER = "rgba(255, 180, 80,"; // k-vector

/**
 * FIG.38b — THE ACTUAL WAVE.
 *
 * A 1D plane electromagnetic wave propagating along +x̂. We draw two
 * perpendicular sinusoids stemming from the x-axis:
 *
 *   E-field (magenta) in the y-direction.
 *   B-field (cyan) in the z-direction, projected via isometric skew so it
 *   reads as "into/out-of the page" relative to x–y.
 *
 * Amplitude of B is E₀/c so the visual ratio feels right (B-arrows ~3×10⁸
 * times smaller than E-arrows in SI — we scale them to the same visible
 * height since the lock-step is the point, not the magnitude difference).
 *
 * An amber arrow along +x̂ labelled k / propagation. A speed slider in
 * units of c/10 (for visibility) controls ω while keeping k fixed, and the
 * HUD states that the physical phase velocity is c = 1/√(μ₀ε₀).
 */
export function VacuumWaveScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 820, height: 400 });
  // Visual speed slider: integer 1..10 → animation phase rate. Does not
  // represent any real physical speed other than the labelled c.
  const [speedTicks, setSpeedTicks] = useState(6);

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

      // Background
      ctx.fillStyle = "#0b0d10";
      ctx.fillRect(0, 0, width, height);

      // Axes origin — offset left so the wave propagates to the right.
      const axisX0 = 60;
      const axisXEnd = width - 40;
      const axisY = height / 2;
      const span = axisXEnd - axisX0;

      // Sampled wave parameters — chosen to look nice on a 600–800 px canvas.
      // (They do NOT represent 500 nm light; we are picturing the wave, not
      // fitting reality.)
      const nPeriods = 2.2;
      const k = (2 * Math.PI * nPeriods) / span; // rad / px
      const omega = k * (20 + speedTicks * 20); // phase rate, px / s
      const E0 = Math.min(height * 0.28, 110); // visual amplitude (px)

      // Draw the axis (propagation direction).
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(axisX0, axisY);
      ctx.lineTo(axisXEnd, axisY);
      ctx.stroke();
      ctx.setLineDash([]);

      // k-vector tip — amber arrow along +x̂.
      ctx.strokeStyle = `${AMBER} 0.9)`;
      ctx.fillStyle = `${AMBER} 1)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(axisX0 - 40, axisY);
      ctx.lineTo(axisX0 - 10, axisY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(axisX0 - 10, axisY);
      ctx.lineTo(axisX0 - 18, axisY - 5);
      ctx.lineTo(axisX0 - 18, axisY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.textAlign = "left";
      ctx.fillText("k̂", axisX0 - 56, axisY - 8);

      // Render E(x,t) as a magenta sinusoid in the plane of the screen.
      const NPTS = 140;
      ctx.strokeStyle = `${MAGENTA} 0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= NPTS; i++) {
        const frac = i / NPTS;
        const xpx = axisX0 + frac * span;
        const E = planeWaveE(xpx - axisX0, t, k, omega, E0);
        if (i === 0) ctx.moveTo(xpx, axisY - E);
        else ctx.lineTo(xpx, axisY - E);
      }
      ctx.stroke();

      // E-arrows at a few sampled phases (every ~1/4 period).
      const nArrows = 9;
      for (let i = 1; i < nArrows; i++) {
        const frac = i / nArrows;
        const xpx = axisX0 + frac * span;
        const E = planeWaveE(xpx - axisX0, t, k, omega, E0);
        drawArrow(ctx, xpx, axisY, xpx, axisY - E, `${MAGENTA} 0.75)`, 2);
      }
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("E (ŷ)", axisX0 + 4, axisY - E0 - 8);

      // Render B(x,t) as a cyan sinusoid skewed isometrically to suggest
      // out-of-the-screen ẑ. Scale B-amplitude to match visual E amplitude so
      // the phase-lock reads clearly; annotate "|B| = |E|/c" in the HUD.
      const isoSkewX = 0.6;
      const isoSkewY = -0.35;
      ctx.strokeStyle = `${CYAN} 0.85)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= NPTS; i++) {
        const frac = i / NPTS;
        const xpx = axisX0 + frac * span;
        // Use planeWaveB but rescale to the same visual amplitude as E.
        const Bphys = planeWaveB(xpx - axisX0, t, k, omega, E0);
        const c = speedOfLight();
        const Bvis = Bphys * c; // undo the 1/c so |B_vis| ≈ E0 in px
        const px = xpx + Bvis * isoSkewX;
        const py = axisY + Bvis * isoSkewY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // B-arrows, out of the axis into the isometric plane.
      for (let i = 1; i < nArrows; i++) {
        const frac = i / nArrows;
        const xpx = axisX0 + frac * span;
        const Bphys = planeWaveB(xpx - axisX0, t, k, omega, E0);
        const c = speedOfLight();
        const Bvis = Bphys * c;
        drawArrow(
          ctx,
          xpx,
          axisY,
          xpx + Bvis * isoSkewX,
          axisY + Bvis * isoSkewY,
          `${CYAN} 0.75)`,
          2,
        );
      }
      ctx.fillStyle = `${CYAN} 0.95)`;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("B (ẑ)", axisX0 + 4, axisY + E0 * Math.abs(isoSkewY) + 20);

      // HUD — label + phase velocity.
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "plane EM wave in vacuum · E ⟂ B ⟂ k̂ · in-phase",
        16,
        22,
      );
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.fillText(
        `E(x,t) = E₀·cos(k·x − ω·t)`,
        16,
        height - 44,
      );
      ctx.fillStyle = `${CYAN} 0.95)`;
      ctx.fillText(
        `B(x,t) = (E₀/c)·cos(k·x − ω·t)   ⇒   |B| = |E|/c`,
        16,
        height - 28,
      );
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.fillText(
        `phase velocity = ω/k = c = 1/√(μ₀ε₀) ≈ 2.998 × 10⁸ m/s`,
        16,
        height - 12,
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
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 font-mono text-xs">
        <label className="flex items-center gap-2 text-[var(--color-fg-3)]">
          visual speed
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={speedTicks}
            onChange={(e) => setSpeedTicks(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-[var(--color-fg-1)]">
            {(speedTicks / 10).toFixed(1)} · c (visual)
          </span>
        </label>
        <span className="text-[var(--color-fg-3)]">
          physical phase velocity locked at c — slider rescales on-screen motion only
        </span>
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
  width: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  // Arrowhead
  const headLen = Math.min(7, len * 0.3);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * headLen - uy * headLen * 0.5, y1 - uy * headLen + ux * headLen * 0.5);
  ctx.lineTo(x1 - ux * headLen + uy * headLen * 0.5, y1 - uy * headLen - ux * headLen * 0.5);
  ctx.closePath();
  ctx.fill();
}
