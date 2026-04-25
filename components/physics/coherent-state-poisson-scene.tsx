"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { coherentStatePhotonStats } from "@/lib/physics/electromagnetism/qed-classical-limit";

/**
 * FIG.66a — Photon-number distribution P(N) of a coherent state |α⟩.
 *
 * Coherent states are eigenstates of the annihilation operator â|α⟩ = α|α⟩,
 * with a Poisson photon-number distribution:
 *
 *   P(N) = exp(−|α|²) · |α|^{2N} / N!
 *
 * Mean ⟨N⟩ = |α|², variance σ² = |α|², relative width σ/⟨N⟩ = 1/|α|.
 *
 * The slider scrubs |α| ∈ [0.5, 12]. Small |α|: a broad, manifestly quantum
 * distribution centred near zero — you can count individual photons. Large
 * |α|: a sharp Gaussian-looking spike at ⟨N⟩ = |α|², relative width 1/|α|
 * shrinking to invisibility — the "classical" limit where photon number
 * is for-all-purposes definite.
 *
 * Palette:
 *   amber  — Poisson bars (the photon-number distribution)
 *   lilac  — quantum-noise envelope (σ band around ⟨N⟩)
 *   cyan   — ⟨N⟩ marker
 *   magenta — relative-fluctuation readout when 1/√⟨N⟩ ≪ 1
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

// Locally-scoped Poisson PMF using a stable log-form, to handle large means
// without N! overflow. log P(N) = N·ln(mean) − mean − lgamma(N+1).
//   TODO: promote to qed-classical-limit.ts if used elsewhere.
function poissonProbability(n: number, mean: number): number {
  if (n < 0 || !Number.isFinite(mean) || mean < 0) return 0;
  if (mean === 0) return n === 0 ? 1 : 0;
  const logP = n * Math.log(mean) - mean - logGamma(n + 1);
  return Math.exp(logP);
}

// Stirling-series log-gamma; good to ~1e-10 for x ≥ 1, more than enough
// for a chart axis.
function logGamma(x: number): number {
  if (x < 1) {
    // reflection: Γ(x) = Γ(x+1)/x
    return logGamma(x + 1) - Math.log(x);
  }
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.001208650973866179, -0.000005395239384953,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const ci of c) {
    y += 1;
    ser += ci / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

export function CoherentStatePoissonScene() {
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const a = alphaRef.current;
      const stats = coherentStatePhotonStats(a);
      const meanN = stats.meanN;
      const sigma = Math.sqrt(stats.varianceN);

      // Choose a window of N centred on ⟨N⟩ that is wide enough to capture
      // the bulk of the distribution. Use ±4σ for large mean, full bracket
      // for small mean.
      const nMin = Math.max(0, Math.floor(meanN - 4 * sigma - 2));
      const nMax = Math.max(nMin + 8, Math.ceil(meanN + 4 * sigma + 2));
      const nCount = nMax - nMin + 1;

      const padX = 44;
      const padTop = 24;
      const padBot = 50;
      const innerW = width - 2 * padX;
      const innerH = height - padTop - padBot;
      const x0 = padX;
      const y0 = padTop;
      const y1 = y0 + innerH;

      // Axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, y0, innerW, innerH);

      // Title
      ctx.fillStyle = colors.fg2;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("P(N) = e^{−|α|²} |α|^{2N} / N!", x0 + 6, y0 + 14);

      // Compute probabilities and find the chart's vertical scale
      const probs: number[] = [];
      let pMax = 0;
      for (let i = 0; i < nCount; i++) {
        const n = nMin + i;
        const p = poissonProbability(n, meanN);
        probs.push(p);
        if (p > pMax) pMax = p;
      }
      // For very large means, pMax becomes small (e.g. 1/√(2πN)). Lock a
      // sensible chart scale so bars stay visible.
      const yScale = pMax > 0 ? (innerH - 16) / pMax : 1;
      const barW = innerW / nCount;

      // Draw bars
      for (let i = 0; i < nCount; i++) {
        const p = probs[i];
        if (p <= 0) continue;
        const bx = x0 + i * barW + 1;
        const bh = p * yScale;
        const by = y1 - bh;
        ctx.fillStyle = "rgba(255, 180, 80, 0.85)";
        ctx.fillRect(bx, by, Math.max(barW - 2, 1), bh);
      }

      // ⟨N⟩ marker (cyan vertical)
      const meanX = x0 + ((meanN - nMin) / nCount) * innerW + barW * 0.5;
      ctx.strokeStyle = "rgba(96, 220, 255, 0.95)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(meanX, y0 + 4);
      ctx.lineTo(meanX, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(96, 220, 255, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`⟨N⟩ = ${meanN.toFixed(2)}`, meanX + 4, y0 + 16);

      // ±σ envelope (lilac translucent band)
      const sigLeftX = x0 + ((meanN - sigma - nMin) / nCount) * innerW + barW * 0.5;
      const sigRightX = x0 + ((meanN + sigma - nMin) / nCount) * innerW + barW * 0.5;
      ctx.fillStyle = "rgba(200, 160, 255, 0.10)";
      ctx.fillRect(
        Math.max(sigLeftX, x0),
        y0 + 1,
        Math.min(sigRightX, x0 + innerW) - Math.max(sigLeftX, x0),
        innerH - 1,
      );
      ctx.strokeStyle = "rgba(200, 160, 255, 0.60)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(sigLeftX, y0 + 4);
      ctx.lineTo(sigLeftX, y1);
      ctx.moveTo(sigRightX, y0 + 4);
      ctx.lineTo(sigRightX, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // x-axis ticks: a few representative N values
      ctx.fillStyle = colors.fg2;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      const tickCount = 6;
      for (let k = 0; k <= tickCount; k++) {
        const frac = k / tickCount;
        const nVal = Math.round(nMin + frac * (nCount - 1));
        const tx = x0 + frac * innerW;
        ctx.fillText(String(nVal), tx, y1 + 14);
      }
      ctx.textAlign = "left";
      ctx.fillText("N", x0 + innerW - 14, y1 + 26);

      // HUD: stats readout, lower-left
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      const yHud = height - 24;
      ctx.fillText(
        `|α| = ${a.toFixed(2)}    ⟨N⟩ = ${meanN.toFixed(2)}    σ = ${sigma.toFixed(2)}`,
        12,
        yHud,
      );
      const relFluc = stats.relativeFluctuation;
      const relStr = Number.isFinite(relFluc) ? relFluc.toFixed(3) : "∞";
      ctx.fillStyle =
        meanN > 25 ? "rgba(255, 106, 222, 0.95)" : colors.fg2;
      ctx.fillText(
        `σ/⟨N⟩ = 1/|α| = ${relStr}     classical-limit indicator`,
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
          className="flex-1 accent-[#FFB450]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {alpha.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Small |α|: a broad quantum distribution — every photon counts. Large
        |α|: a sharp spike at ⟨N⟩ = |α|², relative width 1/|α| → 0. The
        radio you listen to has |α|² of order 10^20.
      </div>
    </div>
  );
}
