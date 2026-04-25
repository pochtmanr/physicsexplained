"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { coherentStatePhotonStats } from "@/lib/physics/electromagnetism/qed-classical-limit";

/**
 * FIG.66b — Coherent-state field expectation as a classical wave with a
 * shrinking quantum-noise envelope.
 *
 * The expectation value ⟨α|Ê(x,t)|α⟩ for a single-mode coherent state with
 * amplitude α is a classical sinusoid of amplitude proportional to |α|.
 * The standard deviation of Ê (vacuum-fluctuation noise) is independent of
 * |α|, so the relative noise is 1/|α|. As |α| grows, the smooth pale-blue
 * wave dominates and the lilac noise envelope shrinks to zero in relative
 * terms — that is the operational meaning of the classical limit.
 *
 * Slider scrubs |α| from 0.5 (manifestly noisy) to 12 (visually classical).
 *
 * Palette:
 *   pale-blue  — ⟨α|Ê|α⟩, the classical wave
 *   lilac      — ±1σ fluctuation envelope (constant absolute width)
 *   amber      — discrete-photon "ticks" overlaid for small α
 *   magenta    — relative-fluctuation indicator
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

// Visible amplitude at |α| = 1; scaled to keep the chart legible up to |α|=12.
const AMP_PER_ALPHA = 12;
// Constant absolute noise (vacuum fluctuation). In scene units.
const NOISE_STD = 12;

// Cheap hash-based pseudo-random in [-1, 1] keyed on integer index.
function noiseAt(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return 2 * (s - Math.floor(s)) - 1;
}

export function PhotonNumberToClassicalFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [alpha, setAlpha] = useState(2.0);
  const alphaRef = useRef(alpha);
  useEffect(() => {
    alphaRef.current = alpha;
  }, [alpha]);

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

      const a = alphaRef.current;
      const stats = coherentStatePhotonStats(a);

      const padX = 32;
      const padTop = 22;
      const padBot = 56;
      const innerW = width - 2 * padX;
      const innerH = height - padTop - padBot;
      const x0 = padX;
      const y0 = padTop;
      const yMid = y0 + innerH / 2;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, y0, innerW, innerH);

      // Title
      ctx.fillStyle = colors.fg2;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("⟨α|Ê(x,t)|α⟩  (pale-blue)  ±σ envelope (lilac)", x0 + 6, y0 + 14);

      // Amplitude of classical wave grows linearly with |α|.
      const amp = AMP_PER_ALPHA * a;

      // Envelope: ±1σ band, lilac, drawn first (under the curve).
      const N = 220;
      ctx.fillStyle = "rgba(200, 160, 255, 0.18)";
      ctx.beginPath();
      // top of band
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const px = x0 + xn * innerW;
        const phase = xn * Math.PI * 4 - t * 1.6;
        const wave = amp * Math.sin(phase);
        const py = yMid - (wave + NOISE_STD);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      // bottom of band, going back
      for (let i = N; i >= 0; i--) {
        const xn = i / N;
        const px = x0 + xn * innerW;
        const phase = xn * Math.PI * 4 - t * 1.6;
        const wave = amp * Math.sin(phase);
        const py = yMid - (wave - NOISE_STD);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Stochastic noisy single-shot trace: classical wave plus per-bin
      // gaussian-ish noise of std NOISE_STD. This mimics what an actual
      // measurement of the field would look like on a single sample.
      ctx.strokeStyle = "rgba(200, 160, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const px = x0 + xn * innerW;
        const phase = xn * Math.PI * 4 - t * 1.6;
        const wave = amp * Math.sin(phase);
        // Time-varying noise: sum two phases of a cheap pseudo-random for a
        // smoother, less aliased look while still feeling stochastic.
        const tIdx = Math.floor(t * 8);
        const noise =
          NOISE_STD *
          0.6 *
          (noiseAt(i + tIdx) + 0.6 * noiseAt(i * 3 + tIdx + 17));
        const py = yMid - (wave + noise);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Smooth classical wave on top, in pale blue.
      ctx.strokeStyle = "rgba(140, 200, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const px = x0 + xn * innerW;
        const phase = xn * Math.PI * 4 - t * 1.6;
        const wave = amp * Math.sin(phase);
        const py = yMid - wave;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Discrete-photon "ticks" overlaid only at small α: little amber
      // pluses scattered along the wave to suggest individual photon
      // arrivals. They fade out as |α| grows past 4 — Poisson into the
      // continuum.
      const tickAlpha = Math.max(0, 1 - (a - 0.5) / 4);
      if (tickAlpha > 0.02) {
        ctx.fillStyle = `rgba(255, 180, 80, ${(0.85 * tickAlpha).toFixed(3)})`;
        const photonCount = Math.max(8, Math.floor(stats.meanN * 4 + 6));
        for (let k = 0; k < photonCount; k++) {
          // Pseudo-random positions, retimed so they drift but don't strobe.
          const tIdx = Math.floor(t * 2);
          const r1 = 0.5 * (noiseAt(k + tIdx) + 1); // [0,1]
          const r2 = noiseAt(k * 7 + tIdx + 31);
          const xn = r1;
          const phase = xn * Math.PI * 4 - t * 1.6;
          const wave = amp * Math.sin(phase);
          const px = x0 + xn * innerW;
          const py = yMid - wave + r2 * NOISE_STD * 0.6;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Centre line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, yMid);
      ctx.lineTo(x0 + innerW, yMid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Legend (top-right)
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(140, 200, 255, 0.95)";
      ctx.fillText("⟨Ê⟩ = E_classical", x0 + innerW - 8, y0 + 14);
      ctx.fillStyle = "rgba(200, 160, 255, 0.85)";
      ctx.fillText("vacuum noise σ (constant)", x0 + innerW - 8, y0 + 28);

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      const yHud = height - 30;
      ctx.fillText(
        `|α| = ${a.toFixed(2)}     ⟨N⟩ = |α|² = ${stats.meanN.toFixed(2)}     amp ∝ |α|, noise = const`,
        12,
        yHud,
      );
      const rel = stats.relativeFluctuation;
      const relStr = Number.isFinite(rel) ? rel.toFixed(3) : "∞";
      ctx.fillStyle =
        stats.meanN > 25 ? "rgba(255, 106, 222, 0.95)" : colors.fg2;
      ctx.fillText(
        `relative fluctuation 1/|α| = ${relStr} → 0 as |α| → ∞   (the classical limit)`,
        12,
        yHud + 14,
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
        <label className="text-sm text-[var(--color-fg-3)]">|α|</label>
        <input
          type="range"
          min={0.5}
          max={12}
          step={0.1}
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          className="flex-1 accent-[#8CC8FF]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {alpha.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        The smooth pale-blue wave is ⟨α|Ê|α⟩, the classical EM field. The
        lilac envelope is the vacuum-fluctuation noise — its absolute width
        is constant; the wave amplitude grows as |α|. Result: relative noise
        1/|α| vanishes in the high-occupation limit.
      </div>
    </div>
  );
}
