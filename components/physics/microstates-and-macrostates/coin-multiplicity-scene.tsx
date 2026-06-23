"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { createRng, type Rng } from "@/lib/physics/thermodynamics/random";
import {
  gaussianProbability,
  macrostateProbability,
  occupancyStdDev,
} from "@/lib/physics/thermodynamics/multiplicity";

/**
 * FIG.11a — Coin-toss multiplicity.
 *
 * Toss N fair coins, over and over, and tally how many come up heads. The
 * empirical histogram (cyan bars) piles up around N/2 and is traced ever more
 * tightly by the de Moivre–Laplace Gaussian (amber curve) of width √N/2. Slide
 * N from 10 to 1000 and the peak sharpens: the absolute width grows like √N,
 * but the *relative* width 1/√N collapses — which is why a macroscopic number
 * of coins (or molecules) is pinned to its most-probable macrostate.
 *
 * The sampling is live and seeded (reproducible); "Reset" clears the tally.
 */
export function CoinMultiplicityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [n, setN] = useState(50);
  const [trials, setTrials] = useState(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // Empirical tally: counts[k] = number of trials with k heads. Lives in a ref
  // so the animation loop can mutate it without forcing a React re-render.
  const countsRef = useRef<Int32Array>(new Int32Array(n + 1));
  const trialsRef = useRef(0);
  const rngRef = useRef<Rng>(createRng(SEED_BASE));

  // Reset the tally whenever N changes (a different macrostate axis).
  useEffect(() => {
    countsRef.current = new Int32Array(n + 1);
    trialsRef.current = 0;
    rngRef.current = createRng(SEED_BASE + n);
    setTrials(0);
  }, [n]);

  const reset = () => {
    countsRef.current = new Int32Array(n + 1);
    trialsRef.current = 0;
    // Vary the seed by N so "Reset" gives a fresh-but-reproducible stream.
    rngRef.current = createRng(SEED_BASE + n * 7 + 1);
    setTrials(0);
  };

  // Theoretical peak probability sets the y-scale; precompute per N.
  const peakProb = useMemo(() => macrostateProbability(n, Math.round(n / 2)), [n]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      // ── Draw one batch of fresh trials (work-per-frame capped ~30k flips).
      const rng = rngRef.current;
      const counts = countsRef.current;
      const batch = Math.max(15, Math.floor(30000 / n));
      for (let t = 0; t < batch; t++) {
        let heads = 0;
        for (let c = 0; c < n; c++) if (rng() < 0.5) heads++;
        counts[heads]++;
      }
      trialsRef.current += batch;

      draw(ctx, tokens, width, height, n, counts, trialsRef.current, peakProb);

      // Throttle the React trial-counter update to once every ~20 frames.
      if (trialsRef.current % (batch * 20) < batch) {
        setTrials(trialsRef.current);
      }
    },
  });

  const sigma = occupancyStdDev(n);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label={`Histogram of heads counts from tossing ${n} fair coins, converging to a Gaussian of width sqrt(N)/2 centred at N/2.`}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full font-mono text-xs text-[var(--color-fg-3)] sm:max-w-xs">
          <div className="mb-1 flex items-center justify-between">
            <span>N (coins)</span>
            <span className="text-[var(--color-fg-2)]">{n}</span>
          </div>
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--color-fg-3)]">
          <span>
            σ = √(N/4) ={" "}
            <span className="text-[var(--color-amber)]">{sigma.toFixed(2)}</span>
          </span>
          <span>
            σ/⟨k⟩ ={" "}
            <span className="text-[var(--color-amber)]">
              {(1 / Math.sqrt(n)).toFixed(3)}
            </span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="rounded-sm border border-[var(--color-fg-4)] px-2 py-1 text-[var(--color-fg-3)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          >
            Reset
          </button>
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        {trials.toLocaleString()} tosses tallied. The bars are experiment; the
        amber curve is the Gaussian limit √(2/πN)·exp(−2(k−N/2)²/N).
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: ReturnType<typeof useSceneTokens>,
  W: number,
  H: number,
  n: number,
  counts: Int32Array,
  trials: number,
  peakProb: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const padL = 16;
  const padR = 16;
  const padT = 20;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseline = padT + plotH;

  // x maps heads-count k ∈ [0, N] across the plot; y maps probability.
  const xOf = (k: number) => padL + (k / n) * plotW;
  // Scale so the theoretical peak sits at ~88% height.
  const yScale = plotH / (peakProb * 1.15);
  const yOf = (p: number) => baseline - p * yScale;

  // ── Axis baseline
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, baseline + 0.5);
  ctx.lineTo(padL + plotW, baseline + 0.5);
  ctx.stroke();

  // ── Mean marker at N/2
  const meanX = xOf(n / 2);
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(meanX, padT);
  ctx.lineTo(meanX, baseline);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── ±σ band
  const sigma = Math.sqrt(n / 4);
  const sxL = xOf(n / 2 - sigma);
  const sxR = xOf(n / 2 + sigma);
  ctx.fillStyle = hexToRgba(tokens.amber, 0.08);
  ctx.fillRect(sxL, padT, sxR - sxL, plotH);

  // ── Empirical histogram bars (probability = counts/trials)
  if (trials > 0) {
    const barW = Math.max(1, plotW / (n + 1) - (n < 120 ? 1 : 0));
    ctx.fillStyle = tokens.cyan;
    for (let k = 0; k <= n; k++) {
      const c = counts[k];
      if (c === 0) continue;
      const p = c / trials;
      const x = xOf(k) - barW / 2;
      const y = yOf(p);
      ctx.fillRect(x, y, barW, baseline - y);
    }
  }

  // ── Gaussian limit curve (amber)
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 0; px <= plotW; px++) {
    const k = (px / plotW) * n;
    const p = gaussianProbability(n, k);
    const x = padL + px;
    const y = yOf(p);
    if (px === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── Labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = tokens.fontHud;
  ctx.textBaseline = "top";
  ctx.fillText("0", padL, baseline + 6);
  const nLabel = `${n}`;
  ctx.fillText(nLabel, padL + plotW - ctx.measureText(nLabel).width, baseline + 6);
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("N/2", meanX + 4, padT);
  ctx.fillStyle = tokens.textMute;
  const axisLabel = "heads count k";
  ctx.fillText(axisLabel, padL + plotW / 2 - ctx.measureText(axisLabel).width / 2, baseline + 18);
}

// Fixed base seed (no Math.random — it is banned and would break reproducibility).
const SEED_BASE = 0x9e3779b1;
