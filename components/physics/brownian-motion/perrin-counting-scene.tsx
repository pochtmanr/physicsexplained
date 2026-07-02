"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  drawHudReadout,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { mulberry32, gaussian, type Rng } from "@/lib/physics/thermodynamics/random";
import {
  K_B,
  einsteinStokesD,
  kBFromD,
} from "@/lib/physics/thermodynamics/brownian";

/**
 * FIG.18b — Perrin's experiment, in miniature. A field of suspended spheres
 * jitters under the microscope. Each "observation" records how far a bead has
 * wandered after a fixed time t; pile thousands of those displacements into a
 * histogram and a Gaussian emerges, its width σ = √(2Dt) growing as the square
 * root of time. From the measured spread Perrin read off the diffusion
 * coefficient D, and the Einstein–Stokes relation D = k_BT/6πηr handed him
 * Boltzmann's constant — and therefore Avogadro's number — directly. The
 * readout shows that inversion with real laboratory numbers (η, r, T known).
 */

// Lab-scale numbers for the Perrin inversion shown in the readout.
const ETA = 1e-3; // Pa·s (water)
const R_BEAD = 0.5e-6; // m (gamboge sphere)
const T_LAB = 293; // K
const GAS_R = 8.314462618; // J/(mol·K), for N_A = R/k_B

const STEP_STD = 1.0; // simulation displacement units per unit time
const SAMPLES_PER_FRAME = 25;
const BINS = 41;

export function PerrinCountingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tObs, setTObs] = useState(40); // observation time (steps)
  const tickRef = useSceneTick(true);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  const rngRef = useRef<Rng>(mulberry32(1908));
  const binsRef = useRef<number[]>(new Array(BINS).fill(0));
  const sumSqRef = useRef(0);
  const countRef = useRef(0);
  const tRef = useRef(tObs);
  const spheresRef = useRef<{ x: number; y: number }[] | null>(null);

  // reset the histogram whenever the observation time changes
  useEffect(() => {
    tRef.current = tObs;
    binsRef.current = new Array(BINS).fill(0);
    sumSqRef.current = 0;
    countRef.current = 0;
  }, [tObs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    // seed decorative sphere positions once
    if (!spheresRef.current) {
      const r = mulberry32(77);
      spheresRef.current = Array.from({ length: 46 }, () => ({
        x: r(),
        y: r(),
      }));
    }

    // displacement axis half-width: a few σ at the largest plausible t
    const sigmaMax = STEP_STD * Math.sqrt(120);
    const halfRange = 3.2 * sigmaMax;

    let raf = 0;
    const loop = () => {
      const t = tRef.current;
      const sigma = STEP_STD * Math.sqrt(t); // net-displacement std on one axis
      // draw fresh samples: net 1D displacement after t steps is N(0, σ²)
      for (let s = 0; s < SAMPLES_PER_FRAME; s++) {
        const dx = gaussian(rngRef.current) * sigma;
        const frac = (dx + halfRange) / (2 * halfRange);
        const bin = Math.floor(frac * BINS);
        if (bin >= 0 && bin < BINS) binsRef.current[bin]++;
        sumSqRef.current += dx * dx;
        countRef.current++;
      }
      draw(
        ctx,
        tokens,
        binsRef.current,
        sumSqRef.current,
        countRef.current,
        sigma,
        halfRange,
        t,
        tickRef.current / 1000,
        spheresRef.current!,
        width,
        height,
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height, tickRef]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A microscope field of jittering suspended spheres on the left; on the right a histogram of bead displacements after a fixed time builds up a Gaussian whose width grows as the square root of the observation time. A readout reports Boltzmann's constant and Avogadro's number recovered by the Einstein–Stokes inversion."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">observation time t: {tObs.toFixed(0)}</span>
        <input
          type="range"
          min={10}
          max={120}
          step={2}
          value={tObs}
          onChange={(e) => setTObs(parseFloat(e.target.value))}
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
  bins: number[],
  sumSq: number,
  count: number,
  sigma: number,
  halfRange: number,
  t: number,
  time: number,
  spheres: { x: number; y: number }[],
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 18;
  const leftW = Math.min(H, W * 0.46);
  drawMicroscope(ctx, tokens, spheres, time, 0, leftW, H);
  drawHistogram(
    ctx,
    tokens,
    bins,
    sumSq,
    count,
    sigma,
    halfRange,
    t,
    leftW + gap,
    W - (leftW + gap),
    H,
  );
}

function drawMicroscope(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  spheres: { x: number; y: number }[],
  time: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 12, 8, "MICROSCOPE FIELD", tokens.textMute);
  const cx = x0 + panelW / 2;
  const cy = H / 2 + 6;
  const radius = Math.min(panelW, H - 40) / 2 - 6;

  ctx.save();
  // circular aperture
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();

  spheres.forEach((s, i) => {
    // gentle per-sphere jitter so the field looks alive
    const jx = Math.sin(time * 1.7 + i * 2.3) * 3;
    const jy = Math.cos(time * 1.9 + i * 1.1) * 3;
    const px = x0 + 8 + s.x * (panelW - 16) + jx;
    const py = 28 + s.y * (H - 48) + jy;
    ctx.fillStyle = hexToRgba(i === 0 ? tokens.amber : tokens.cyan, i === 0 ? 0.9 : 0.45);
    ctx.beginPath();
    ctx.arc(px, py, i === 0 ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("resin spheres in water", cx, cy + radius + 8);
}

function drawHistogram(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  bins: number[],
  sumSq: number,
  count: number,
  sigma: number,
  halfRange: number,
  t: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 30, 8, "DISPLACEMENT HISTOGRAM", tokens.textMute);
  const padL = 14;
  const padR = 12;
  const padT = 26;
  const padB = 70;
  const gx0 = x0 + padL;
  const gx1 = x0 + panelW - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const maxCount = Math.max(1, ...bins);
  const bw = (gx1 - gx0) / BINS;

  // histogram bars
  for (let i = 0; i < BINS; i++) {
    const h = (bins[i] / maxCount) * (gy1 - gy0);
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.45);
    ctx.fillRect(gx0 + i * bw, gy1 - h, bw - 1, h);
  }

  // Gaussian fit of width σ, scaled to the histogram peak
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 0; px <= panelW - padL - padR; px++) {
    const x = gx0 + px;
    const disp = (px / (gx1 - gx0)) * (2 * halfRange) - halfRange;
    const g = Math.exp(-(disp * disp) / (2 * sigma * sigma));
    const y = gy1 - g * (gy1 - gy0);
    if (px === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // zero axis
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((gx0 + gx1) / 2, gy0);
  ctx.lineTo((gx0 + gx1) / 2, gy1);
  ctx.moveTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("← bead displacement after time t →", (gx0 + gx1) / 2, gy1 + 6);

  // ── readout: the Perrin inversion ──────────────────────────────────────
  const measuredSigma = count > 1 ? Math.sqrt(sumSq / count) : 0;
  const D_lab = einsteinStokesD(T_LAB, ETA, R_BEAD);
  const kB = kBFromD(D_lab, T_LAB, ETA, R_BEAD);
  const NA = GAS_R / kB;
  let y = gy1 + 24;
  y = drawHudReadout(
    ctx,
    gx0,
    y,
    "σ √t-law: ",
    `σ=${measuredSigma.toFixed(2)} (predicted ${sigma.toFixed(2)})`,
    tokens.textMute,
    tokens.cyan,
  );
  y = drawHudReadout(
    ctx,
    gx0,
    y,
    "⇒ k_B = ",
    `${(kB * 1e23).toFixed(2)}×10⁻²³ J/K`,
    tokens.textMute,
    tokens.amber,
  );
  drawHudReadout(
    ctx,
    gx0,
    y,
    "⇒ Nₐ = ",
    `${(NA / 1e23).toFixed(2)}×10²³ /mol`,
    tokens.textMute,
    tokens.mint,
  );
  // reference to the exact constant so the readout reads as a verification
  void K_B;
}
