"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  createRng,
  gaussian,
  randomRange,
  type Rng,
} from "@/lib/physics/thermodynamics/random";
import { binEntropy } from "@/lib/physics/thermodynamics/irreversibility";

/**
 * FIG.13b — Loschmidt's reversal.
 *
 * A gas of free particles starts clustered in the left third of the box (low
 * entropy) and diffuses to fill it (entropy rises). Press "Reverse velocities"
 * and every velocity flips: with perfect arithmetic the gas would exactly
 * retrace its path and un-mix, briefly running the second law backward —
 * Loschmidt's 1876 objection made literal. But nudge the round-off slider up
 * and the reversal is imperfect; the small velocity error compounds and the gas
 * re-mixes, its entropy climbing again instead of staying down.
 * The arrow of time is the statement that low-entropy initial conditions are
 * the rare ones — not that the laws forbid the reverse.
 */

const N = 240;
const GRID_X = 12;
const GRID_Y = 6;
const SEED = 0x10c_5c_d17 & 0xffffffff;

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function initGas(rng: Rng): P[] {
  const gas: P[] = [];
  for (let i = 0; i < N; i++) {
    const angle = randomRange(rng, 0, Math.PI * 2);
    const speed = randomRange(rng, 0.1, 0.26);
    gas.push({
      x: randomRange(rng, 0.02, 0.32), // clustered on the left
      y: randomRange(rng, 0.04, 0.96),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return gas;
}

function gridEntropy(gas: P[]): number {
  const counts = new Array(GRID_X * GRID_Y).fill(0);
  for (const p of gas) {
    const gx = Math.min(GRID_X - 1, Math.floor(p.x * GRID_X));
    const gy = Math.min(GRID_Y - 1, Math.floor(p.y * GRID_Y));
    counts[gy * GRID_X + gx]++;
  }
  return binEntropy(counts); // 0 … ln(GRID_X·GRID_Y)
}

const HISTORY = 260;

export function LoschmidtReversalScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [epsilon, setEpsilon] = useState(0.004);
  const epsRef = useRef(epsilon);
  epsRef.current = epsilon;

  const rngRef = useRef<Rng>(createRng(SEED));
  const gasRef = useRef<P[]>(initGas(rngRef.current));
  const histRef = useRef<number[]>([]);
  const marksRef = useRef<number[]>([]); // history indices of reverse events

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.52,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  function reset() {
    rngRef.current = createRng(SEED);
    gasRef.current = initGas(rngRef.current);
    histRef.current = [];
    marksRef.current = [];
  }
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reverseVelocities() {
    const eps = epsRef.current;
    const rng = rngRef.current;
    for (const p of gasRef.current) {
      p.vx = -p.vx + (eps > 0 ? gaussian(rng, 0, eps) : 0);
      p.vy = -p.vy + (eps > 0 ? gaussian(rng, 0, eps) : 0);
    }
    marksRef.current.push(histRef.current.length);
  }

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      const step = Math.min(dt, 0.04);
      const gas = gasRef.current;
      for (const p of gas) {
        p.x += p.vx * step;
        p.y += p.vy * step;
        if (p.x < 0) { p.x = -p.x; p.vx = -p.vx; }
        else if (p.x > 1) { p.x = 2 - p.x; p.vx = -p.vx; }
        if (p.y < 0) { p.y = -p.y; p.vy = -p.vy; }
        else if (p.y > 1) { p.y = 2 - p.y; p.vy = -p.vy; }
      }

      const s = gridEntropy(gas);
      const hist = histRef.current;
      hist.push(s);
      if (hist.length > HISTORY) {
        hist.shift();
        marksRef.current = marksRef.current
          .map((m) => m - 1)
          .filter((m) => m >= 0);
      }

      drawScene(ctx, tokens, width, height, gas, hist, marksRef.current);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A gas diffuses from a clustered start; reversing all velocities briefly un-mixes it until round-off re-mixes it."
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full font-mono text-xs text-[var(--color-fg-3)] sm:max-w-[16rem]">
          <div className="mb-1 flex items-center justify-between">
            <span>round-off ε</span>
            <span className="text-[var(--color-fg-2)]">{epsilon.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.02}
            step={0.001}
            value={epsilon}
            onChange={(e) => setEpsilon(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <div className="flex gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={reverseVelocities}
            className="rounded-sm border border-[var(--color-amber)] px-3 py-1 text-[var(--color-amber)] transition-colors hover:bg-[var(--color-amber)]/10"
          >
            ⇄ Reverse velocities
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-sm border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-3)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          >
            Reset
          </button>
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        With ε = 0 the reversal is perfect and the entropy dip returns all the
        way down. Any ε &gt; 0 and the dip is shallower — the velocity error
        compounds and the second law reasserts itself.
      </p>
    </div>
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  gas: P[],
  hist: number[],
  marks: number[],
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 16;
  const boxW = Math.min(H, (W - gap) * 0.5);
  const bx = 0;
  const by = (H - boxW) / 2;

  // ── Gas box
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW, boxW);
  for (const p of gas) {
    ctx.fillStyle = p.x < 0.5 ? tokens.cyan : tokens.magenta;
    ctx.beginPath();
    ctx.arc(bx + p.x * boxW, by + p.y * boxW, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Entropy-vs-time plot
  const px = bx + boxW + gap;
  const pw = W - px - 4;
  const py = by;
  const ph = boxW;
  const sMax = Math.log(GRID_X * GRID_Y);

  ctx.strokeStyle = tokens.gridHeavy;
  ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);

  // S_max guide line.
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.4);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(px, py + ph * 0.08);
  ctx.lineTo(px + pw, py + ph * 0.08);
  ctx.stroke();
  ctx.setLineDash([]);

  // Reverse-event markers.
  for (const m of marks) {
    const x = px + (m / HISTORY) * pw;
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.7);
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x, py + ph);
    ctx.stroke();
  }

  // Entropy curve (normalised so S_max sits near the top).
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < hist.length; i++) {
    const x = px + (i / HISTORY) * pw;
    const frac = sMax > 0 ? hist[i] / sMax : 0;
    const y = py + ph - frac * ph * 0.9 - ph * 0.04;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = tokens.textFaint;
  ctx.font = tokens.fontHud;
  ctx.textBaseline = "top";
  ctx.fillText("S_max", px + 4, py + ph * 0.08 + 2);
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("coarse-grained entropy →", px + 4, py + 4);
}
