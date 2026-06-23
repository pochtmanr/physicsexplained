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
  randomRange,
  type Rng,
} from "@/lib/physics/thermodynamics/random";

/**
 * FIG.11b — The two-box gas.
 *
 * N molecules bounce freely in a single box notionally split down the middle.
 * Nothing stops a molecule crossing, yet the live histogram of how many sit in
 * the left half (sampled every frame) tells the statistical story: for N = 10
 * the left fraction swings wildly between 0.2 and 0.8; for N = 500 it is
 * welded to 0.5, because the relative spread is 1/(2√N). The macrostate
 * "roughly half on each side" is not enforced — it simply has overwhelmingly
 * the most microstates.
 */

interface Mol {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const HIST_BINS = 41; // left-fraction histogram resolution
const SEED = 0x2b1d_e7a3 | 0;

function makeMolecules(n: number, rng: Rng): Mol[] {
  const mols: Mol[] = [];
  for (let i = 0; i < n; i++) {
    const speed = 0.18;
    const angle = randomRange(rng, 0, Math.PI * 2);
    mols.push({
      x: randomRange(rng, 0.02, 0.98),
      y: randomRange(rng, 0.02, 0.98),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return mols;
}

export function TwoBoxGasScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [n, setN] = useState(20);
  const [readout, setReadout] = useState({ left: 0, frac: 0.5 });

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  const molsRef = useRef<Mol[]>([]);
  const histRef = useRef<Float64Array>(new Float64Array(HIST_BINS));
  const samplesRef = useRef(0);
  const rngRef = useRef<Rng>(createRng(SEED));

  // Rebuild the gas and clear the histogram whenever N changes.
  useEffect(() => {
    rngRef.current = createRng(SEED + n);
    molsRef.current = makeMolecules(n, rngRef.current);
    histRef.current = new Float64Array(HIST_BINS);
    samplesRef.current = 0;
  }, [n]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      const step = Math.min(dt, 0.05);
      const mols = molsRef.current;

      // Advance molecules with elastic wall reflection.
      let left = 0;
      for (const m of mols) {
        m.x += m.vx * step;
        m.y += m.vy * step;
        if (m.x < 0) { m.x = -m.x; m.vx = -m.vx; }
        else if (m.x > 1) { m.x = 2 - m.x; m.vx = -m.vx; }
        if (m.y < 0) { m.y = -m.y; m.vy = -m.vy; }
        else if (m.y > 1) { m.y = 2 - m.y; m.vy = -m.vy; }
        if (m.x < 0.5) left++;
      }

      // Record the left fraction into the histogram.
      if (mols.length > 0) {
        const frac = left / mols.length;
        const bin = Math.min(HIST_BINS - 1, Math.floor(frac * HIST_BINS));
        histRef.current[bin] += 1;
        samplesRef.current += 1;
        if (samplesRef.current % 12 === 0) setReadout({ left, frac });
      }

      draw(ctx, tokens, width, height, mols, histRef.current, samplesRef.current, n);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label={`${n} molecules bouncing in a box split in half, with a live histogram of the left-half occupancy.`}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full font-mono text-xs text-[var(--color-fg-3)] sm:max-w-xs">
          <div className="mb-1 flex items-center justify-between">
            <span>N (molecules)</span>
            <span className="text-[var(--color-fg-2)]">{n}</span>
          </div>
          <input
            type="range"
            min={10}
            max={500}
            step={5}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <div className="font-mono text-[11px] text-[var(--color-fg-3)]">
          left ={" "}
          <span className="text-[var(--color-cyan)]">{readout.left}</span> /{" "}
          {n} ={" "}
          <span className="text-[var(--color-amber)]">
            {readout.frac.toFixed(3)}
          </span>
          {"   "}σ/N = {(1 / (2 * Math.sqrt(n))).toFixed(3)}
        </div>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  mols: Mol[],
  hist: Float64Array,
  samples: number,
  n: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 18;
  const boxW = Math.min(H - 8, (W - gap) * 0.52);
  const boxX = 4;
  const boxY = (H - boxW) / 2;

  // ── Box frame + centre divider
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW, boxW);
  const midX = boxX + boxW / 2;
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.7);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(midX, boxY);
  ctx.lineTo(midX, boxY + boxW);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Molecules (cyan on the left, magenta on the right)
  const r = Math.max(1.4, boxW / (Math.sqrt(n) * 12));
  for (const m of mols) {
    ctx.fillStyle = m.x < 0.5 ? tokens.cyan : tokens.magenta;
    ctx.beginPath();
    ctx.arc(boxX + m.x * boxW, boxY + m.y * boxW, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Histogram of left-fraction
  const histX = boxX + boxW + gap;
  const histW = W - histX - 6;
  const histY = boxY;
  const histH = boxW;

  ctx.strokeStyle = tokens.gridHeavy;
  ctx.beginPath();
  ctx.moveTo(histX, histY + histH + 0.5);
  ctx.lineTo(histX + histW, histY + histH + 0.5);
  ctx.stroke();

  // 0.5 reference line
  const halfX = histX + histW / 2;
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(halfX, histY);
  ctx.lineTo(halfX, histY + histH);
  ctx.stroke();
  ctx.setLineDash([]);

  let maxBin = 1;
  for (let i = 0; i < hist.length; i++) if (hist[i] > maxBin) maxBin = hist[i];

  const barW = histW / HIST_BINS;
  ctx.fillStyle = tokens.cyan;
  for (let i = 0; i < HIST_BINS; i++) {
    const h = (hist[i] / maxBin) * (histH - 6);
    if (h <= 0) continue;
    ctx.fillRect(histX + i * barW, histY + histH - h, Math.max(1, barW - 0.5), h);
  }

  // Labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = tokens.fontHud;
  ctx.textBaseline = "top";
  ctx.fillText("0", histX, histY + histH + 6);
  ctx.fillStyle = tokens.amber;
  ctx.fillText("½", halfX - 3, histY + histH + 6);
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("1", histX + histW - 6, histY + histH + 6);
  const title = "left-half occupancy";
  ctx.fillText(title, histX, histY - 2);
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText(`${samples.toLocaleString()} samples`, histX, histY + 14);
}
