"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { relativeEnergyFluctuation } from "@/lib/physics/thermodynamics/fluctuations";

/**
 * FIG.21a — fluctuations and the law of large numbers. A canonical system of N
 * molecules exchanges energy with a bath; its instantaneous energy E(t) jitters
 * around the mean ⟨E⟩. Slide N: the relative wobble is σ/⟨E⟩ = √(2/3N), so it
 * shrinks as 1/√N. At N = 100 the trace is wild and the shaded ±σ band is fat;
 * crank N toward Avogadro and the line flattens onto its mean — which is exactly
 * why bulk thermodynamics can pretend energy is fixed.
 */

const BUFLEN = 260; // samples shown across the trace
const MEAN = 1; // reference ⟨E⟩ in arbitrary units

/** Crude zero-mean, unit-variance Gaussian: sum of 6 uniforms minus 3. */
function gauss(): number {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.random();
  return (s - 3) / Math.sqrt(0.5);
}

export function FluctuationScalingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [logN, setLogN] = useState(2); // N = 10^logN
  const logNRef = useRef(logN);
  logNRef.current = logN;
  const bufRef = useRef<number[]>(new Array(BUFLEN).fill(MEAN));
  const accRef = useRef(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (last === 0) last = t;
      accRef.current += (t - last) / 1000;
      last = t;
      // push samples at a fixed cadence so the speed is DPR-independent
      const N = Math.pow(10, logNRef.current);
      const sigma = relativeEnergyFluctuation(N);
      while (accRef.current > 0.03) {
        accRef.current -= 0.03;
        bufRef.current.push(MEAN * (1 + sigma * gauss()));
        if (bufRef.current.length > BUFLEN) bufRef.current.shift();
      }
      draw(ctx, tokens, bufRef.current, sigma, N, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height]);

  const N = Math.pow(10, logN);
  const sigma = relativeEnergyFluctuation(N);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The instantaneous energy of a canonical system jittering around its mean, with a shaded one-sigma band whose width shrinks as the number of particles increases."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-52 shrink-0">
          N = 10^{logN.toFixed(1)} · σ/⟨E⟩ = {(sigma * 100).toFixed(2)}%
        </span>
        <input
          type="range"
          min={2}
          max={6}
          step={0.1}
          value={logN}
          onChange={(e) => setLogN(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  buf: number[],
  sigma: number,
  N: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 30, 8, "E(t) / ⟨E⟩  ·  canonical ensemble", tokens.textMute);

  const padL = 34;
  const padR = 14;
  const padT = 26;
  const padB = 22;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  // fixed vertical span so the shrinking band is visible against a stable scale
  const span = 0.9; // ±0.45 around the mean of 1
  const vMin = MEAN - span / 2;
  const vMax = MEAN + span / 2;
  const yOf = (v: number) => gy1 - ((v - vMin) / (vMax - vMin)) * (gy1 - gy0);
  const xOf = (i: number) => gx0 + (i / (BUFLEN - 1)) * (gx1 - gx0);

  // ±σ band
  const yHi = yOf(MEAN + sigma);
  const yLo = yOf(MEAN - sigma);
  ctx.fillStyle = hexToRgba(tokens.amber, 0.16);
  ctx.fillRect(gx0, Math.min(yHi, yLo), gx1 - gx0, Math.abs(yLo - yHi));

  // mean line
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(gx0, yOf(MEAN));
  ctx.lineTo(gx1, yOf(MEAN));
  ctx.stroke();
  ctx.setLineDash([]);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // E(t) trace (clamped into view)
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  buf.forEach((v, i) => {
    const cv = Math.max(vMin, Math.min(vMax, v));
    const x = xOf(i);
    const y = yOf(cv);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = hexToRgba(tokens.amber, 0.95);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("⟨E⟩", gx0 + 4, yOf(MEAN) - 8);
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("time →", gx1, gy1 + 6);
  ctx.textAlign = "left";
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("σ/⟨E⟩ = √(2/3N) ∝ 1/√N", gx0 + 4, gy0 + 2);
}
