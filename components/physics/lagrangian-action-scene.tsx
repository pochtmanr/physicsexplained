"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.62b — The action S = ∫L d⁴x and the principle of least action for
 * the EM Lagrangian.
 *
 * Single panel. We render a parabolic well centred on the physical
 * solution A^μ_phys: a "perturbation amplitude" slider ε scrubs along
 * the abscissa, and the visible curve plots S(ε) ∝ ε² (the second-order
 * Taylor expansion of the action about its minimum, which is what the
 * Euler-Lagrange equation guarantees).
 *
 * On top of the parabola we draw a "trial trajectory" line that wiggles
 * up and down with ε — a cartoon of A^μ being perturbed off the
 * physical solution. At ε = 0 the trial coincides with the physical
 * trajectory and S sits at its minimum. As |ε| grows the trial pulls
 * away and S climbs.
 *
 * The HUD shows the canonical line "L = − (1/4) F_{μν} F^{μν} − A_μ J^μ"
 * and the live readouts of S and δS = S − S_min.
 *
 * Palette:
 *   lilac   — action volume / parabola
 *   amber   — trial trajectory
 *   magenta — δS readout, perturbation indicator
 *   cyan    — physical solution baseline
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

export function LagrangianActionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  // Perturbation amplitude ε ∈ [-1, 1].
  const [eps, setEps] = useState(0.0);
  const epsRef = useRef(eps);
  useEffect(() => {
    epsRef.current = eps;
  }, [eps]);

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

      const e = epsRef.current;

      // ── Layout: top half = trial trajectory cartoon, bottom = action curve.
      const topY0 = 12;
      const topH = height * 0.42;
      const topY1 = topY0 + topH;
      const botY0 = topY1 + 14;
      const botH = height - botY0 - 28;
      const botY1 = botY0 + botH;
      const padX = 32;
      const innerW = width - 2 * padX;

      // ── Top panel: spacetime slab with the physical trajectory
      //    (cyan) and the trial trajectory (amber) drawn on top.
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, topY0, innerW, topH);
      ctx.fillStyle = colors.fg2;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("A^μ(x) — trial vs physical", padX + 6, topY0 + 14);

      // physical baseline (cyan): a flat sinusoid at midline
      const midY = topY0 + topH * 0.55;
      ctx.strokeStyle = "rgba(96, 220, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const px = padX + xn * innerW;
        const py = midY + Math.sin(xn * Math.PI * 4) * topH * 0.10;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // trial trajectory (amber): physical + ε · η(x) where η is a
      //   localised bump. Draw as a deformation of the baseline.
      ctx.strokeStyle = "rgba(255, 180, 80, 0.95)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const px = padX + xn * innerW;
        // Test mode η(x) = sin(πx) · sin(3πx), peaks in the middle.
        const eta = Math.sin(xn * Math.PI) * Math.sin(xn * Math.PI * 3);
        const py = midY + Math.sin(xn * Math.PI * 4) * topH * 0.10
          + e * eta * topH * 0.30;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // legend
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(96, 220, 255, 0.95)";
      ctx.fillText("physical (S = S_min)", padX + innerW - 8, topY0 + 14);
      ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
      ctx.fillText("trial (S = S_min + δS)", padX + innerW - 8, topY0 + 28);

      // ── Bottom panel: the action curve S(ε) ∝ ε² parabola.
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, botY0, innerW, botH);

      ctx.fillStyle = colors.fg2;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("S(ε) — the action, parabolic about the minimum", padX + 6, botY0 + 14);

      // axes baseline (S_min line) and ε = 0 vertical
      const yMin = botY1 - 14;
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padX + 4, yMin);
      ctx.lineTo(padX + innerW - 4, yMin);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padX + innerW * 0.5, botY0 + 4);
      ctx.lineTo(padX + innerW * 0.5, botY1 - 4);
      ctx.stroke();
      ctx.setLineDash([]);

      // parabola S(ε) = S_min + α ε²
      const epsRange = 1.0;
      const alpha = (botH - 24) / (epsRange * epsRange);
      ctx.strokeStyle = "rgba(200, 160, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const M = 200;
      for (let i = 0; i <= M; i++) {
        const epsN = -epsRange + (2 * epsRange * i) / M;
        const px = padX + innerW * 0.5 + (epsN / epsRange) * (innerW * 0.45);
        const py = yMin - alpha * epsN * epsN;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // fill under the parabola for the action volume
      ctx.fillStyle = "rgba(200, 160, 255, 0.10)";
      ctx.beginPath();
      ctx.moveTo(padX + innerW * 0.5 - innerW * 0.45, yMin);
      for (let i = 0; i <= M; i++) {
        const epsN = -epsRange + (2 * epsRange * i) / M;
        const px = padX + innerW * 0.5 + (epsN / epsRange) * (innerW * 0.45);
        const py = yMin - alpha * epsN * epsN;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(padX + innerW * 0.5 + innerW * 0.45, yMin);
      ctx.closePath();
      ctx.fill();

      // current ε position on the parabola (magenta dot + tick)
      const currX = padX + innerW * 0.5 + (e / epsRange) * (innerW * 0.45);
      const currY = yMin - alpha * e * e;
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(currX, currY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 106, 222, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(currX, currY);
      ctx.lineTo(currX, yMin);
      ctx.stroke();
      ctx.setLineDash([]);

      // axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ε = 0  (physical)", padX + innerW * 0.5, botY1 - 2);
      ctx.fillText("S_min", padX + 26, yMin + 2);

      // ── HUD: the canonical line and the live readout
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "L  =  − ¼ F_{μν} F^{μν}  −  A_μ J^μ",
        width / 2,
        height - 8,
      );

      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      const dS = alpha * e * e;
      ctx.fillText(
        `ε = ${e.toFixed(2)}    δS = ${dS.toFixed(1)}    S = S_min + δS`,
        padX + 6,
        botY1 - 2,
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
        <label className="text-sm text-[var(--color-fg-3)]">ε</label>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={eps}
          onChange={(e) => setEps(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {eps.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        At ε = 0 the trial trajectory equals the physical solution and S is at
        its minimum. Any perturbation ε ≠ 0 increases S — quadratically near
        the minimum, by Euler-Lagrange. δS/δε = 0 ⇒ Maxwell's equations.
      </div>
    </div>
  );
}
