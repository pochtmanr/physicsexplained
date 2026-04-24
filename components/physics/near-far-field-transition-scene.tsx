"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 400;

const LILAC = "rgba(200, 160, 255,"; // near-field curve
const PALE_BLUE = "rgba(140, 200, 255,"; // far-field curve
const AMBER = "rgba(255, 180, 80,"; // crossover marker

/**
 * FIG.53b — near-field vs far-field vs r/λ.
 *
 * Log–log plot of the two dominant electric-field amplitudes of an
 * oscillating electric dipole:
 *
 *   · E_near(r)  ∝  1 / r³
 *   · E_far(r)   ∝  1 / r
 *
 * Both normalised so they cross at r = r_t = c/ω = λ/(2π). The two regimes
 * dominate on either side of that crossing: inside, the dipole looks
 * quasi-static; outside, all that remains is the radiation field.
 *
 * A slow pulse of the crossover marker draws the eye to the transition
 * radius, which is the whole point of the plot.
 */
export function NearFarFieldTransitionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 400 });

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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Plot area insets
      const padL = 60;
      const padR = 20;
      const padT = 30;
      const padB = 46;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const x0 = padL;
      const y0 = padT + plotH;

      // X-axis: log₁₀(r/λ) from −2.5 (r ≪ λ) to +1.5 (r ≫ λ).
      // The transition radius r_t = λ/(2π) → log₁₀(1/2π) ≈ −0.798.
      const xMin = -2.5;
      const xMax = 1.5;
      const xCross = Math.log10(1 / (2 * Math.PI));

      // Y-axis: log₁₀(|E|) in arbitrary normalised units. We choose the
      // normalisation so that both curves meet at y = 0 (|E| = 1) at x_cross.
      const yMin = -4;
      const yMax = 6;

      const xToPx = (lx: number) =>
        x0 + ((lx - xMin) / (xMax - xMin)) * plotW;
      const yToPx = (ly: number) =>
        y0 - ((ly - yMin) / (yMax - yMin)) * plotH;

      // ─── Grid: log-major lines ─────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let lx = Math.ceil(xMin); lx <= Math.floor(xMax); lx++) {
        const px = xToPx(lx);
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, y0);
        ctx.stroke();
      }
      for (let ly = Math.ceil(yMin); ly <= Math.floor(yMax); ly += 2) {
        const py = yToPx(ly);
        ctx.beginPath();
        ctx.moveTo(x0, py);
        ctx.lineTo(x0 + plotW, py);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ─── Axes ──────────────────────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x0 + plotW, y0);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let lx = Math.ceil(xMin); lx <= Math.floor(xMax); lx++) {
        const px = xToPx(lx);
        const label = lx === 0 ? "1" : `10${superscript(lx)}`;
        ctx.fillText(label, px, y0 + 14);
      }
      ctx.fillText("r / λ", x0 + plotW / 2, y0 + 30);
      ctx.textAlign = "right";
      for (let ly = Math.ceil(yMin); ly <= Math.floor(yMax); ly += 2) {
        const py = yToPx(ly);
        const label = ly === 0 ? "1" : `10${superscript(ly)}`;
        ctx.fillText(label, x0 - 8, py + 4);
      }
      ctx.save();
      ctx.translate(14, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("|E|  (arb.)", 0, 0);
      ctx.restore();

      // ─── Near-field: slope −3 line in log–log ───────────────────────
      // log E = −3 · log(r/λ) + c_near
      // Choose c_near so the line passes through (xCross, 0):
      //   0 = −3 · xCross + c_near  ⇒  c_near = 3 · xCross
      const cNear = 3 * xCross;
      ctx.strokeStyle = `${LILAC} 0.95)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      {
        const nSeg = 120;
        for (let i = 0; i <= nSeg; i++) {
          const lx = xMin + (i / nSeg) * (xMax - xMin);
          const ly = -3 * lx + cNear;
          const px = xToPx(lx);
          const py = yToPx(Math.max(yMin, Math.min(yMax, ly)));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // ─── Far-field: slope −1 line ──────────────────────────────────
      const cFar = 1 * xCross;
      ctx.strokeStyle = `${PALE_BLUE} 0.95)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      {
        const nSeg = 120;
        for (let i = 0; i <= nSeg; i++) {
          const lx = xMin + (i / nSeg) * (xMax - xMin);
          const ly = -1 * lx + cFar;
          const px = xToPx(lx);
          const py = yToPx(Math.max(yMin, Math.min(yMax, ly)));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // ─── Crossover marker ──────────────────────────────────────────
      const pulse = 0.7 + 0.3 * Math.sin(t * 1.4);
      const crossPx = xToPx(xCross);
      const crossPy = yToPx(0);

      // Vertical dashed line at r = r_t
      ctx.strokeStyle = `${AMBER} ${(0.6 * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(crossPx, padT);
      ctx.lineTo(crossPx, y0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crossover dot
      ctx.fillStyle = `${AMBER} ${pulse.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(crossPx, crossPy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Crossover label
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("r = c/ω = λ/(2π)", crossPx + 10, crossPy - 6);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("transition radius", crossPx + 10, crossPy + 8);

      // Zone labels
      ctx.fillStyle = `${LILAC} 0.9)`;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("NEAR FIELD  ·  slope −3", x0 + 6, padT + 14);
      ctx.fillStyle = `${PALE_BLUE} 0.9)`;
      ctx.textAlign = "right";
      ctx.fillText("FAR FIELD  ·  slope −1", x0 + plotW - 6, padT + 14);

      // ─── HUD ───────────────────────────────────────────────────────
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "FIG.53b · electric-dipole field amplitude vs radius",
        x0,
        14,
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
      <p className="mt-2 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        Below r = c/ω the 1/r³ near-field wins; above it the 1/r far-field
        wins. Only the far-field carries energy to infinity.
      </p>
    </div>
  );
}

/**
 * Return a short superscript string for an integer exponent, good enough for
 * "10⁻²" / "10⁶" kinds of labels.
 */
function superscript(n: number): string {
  const map: Record<string, string> = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return String(n)
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}
