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
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { maxwellBoltzmannSpeed, K_B } from "@/lib/physics/thermodynamics/distributions";
import { speciesMass, vRms, SPECIES } from "@/lib/physics/thermodynamics/maxwell-boltzmann";
import { mulberry32, gaussian } from "@/lib/physics/thermodynamics/random";

/**
 * FIG.16c — Otto Stern's rotating-disc experiment (1920s). Molecules stream
 * from a hot oven through a slit toward a spinning chopper. Only molecules whose
 * flight time matches the disc rotation slip through the slot and reach the
 * detector, where they pile up by speed. Over seconds the deposition profile
 * (bars) climbs to match Maxwell's predicted f(v) (the curve) — the first direct
 * measurement of molecular speeds. Speed up the disc and the apparatus runs hot.
 */

const NB = 50; // detector bins
const N2 = SPECIES.find((s) => s.name === "N₂")!;

export function SternExperimentScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tempK, setTempK] = useState(500);
  const [discSpeed, setDiscSpeed] = useState(1.4);

  const tickRef = useSceneTick(true);
  const histRef = useRef<Float64Array>(new Float64Array(NB));
  const rngRef = useRef(mulberry32(20250620));
  const lastRef = useRef(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT + 40,
    minHeight: 320,
  });

  // reset the accumulated profile whenever the target distribution changes
  useEffect(() => {
    histRef.current = new Float64Array(NB);
    lastRef.current = 0;
  }, [tempK]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const m = speciesMass(N2);
    const sigma = Math.sqrt((K_B * tempK) / m);
    const vMax = 3.2 * vRms(tempK, m);

    let raf = 0;
    const loop = () => {
      const now = tickRef.current / 1000;
      const dt = lastRef.current === 0 ? 0 : Math.min(0.05, now - lastRef.current);
      lastRef.current = now;

      // deposit a few molecules per frame, sampled from the 3D MB speed law
      const rng = rngRef.current;
      const draws = Math.max(1, Math.round(dt * 600 * discSpeed));
      const hist = histRef.current;
      for (let k = 0; k < draws; k++) {
        const vx = gaussian(rng) * sigma;
        const vy = gaussian(rng) * sigma;
        const vz = gaussian(rng) * sigma;
        const speed = Math.hypot(vx, vy, vz);
        const bin = Math.floor((speed / vMax) * NB);
        if (bin >= 0 && bin < NB) hist[bin] += 1;
      }

      draw(ctx, tokens, tempK, discSpeed, now, hist, vMax, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, tempK, discSpeed, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Stern's rotating-disc apparatus: a hot oven emits molecules through a slit toward a spinning slotted disc and onto a detector. Below, a histogram of detected speeds builds up over time and converges to the Maxwell-Boltzmann distribution curve."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-36 shrink-0">oven T: {tempK.toFixed(0)} K</span>
        <input
          type="range"
          min={200}
          max={1200}
          step={10}
          value={tempK}
          onChange={(e) => setTempK(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-36 shrink-0">disc rate: {discSpeed.toFixed(1)}×</span>
        <input
          type="range"
          min={0.4}
          max={3}
          step={0.1}
          value={discSpeed}
          onChange={(e) => setDiscSpeed(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tempK: number,
  discSpeed: number,
  t: number,
  hist: Float64Array,
  vMax: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 30, 8, "STERN ROTATING-DISC · N₂", tokens.textMute);

  const apparatusH = H * 0.42;
  drawApparatus(ctx, tokens, discSpeed, t, W, apparatusH);
  drawHistogram(ctx, tokens, tempK, hist, vMax, W, apparatusH, H);
}

function drawApparatus(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  discSpeed: number,
  t: number,
  W: number,
  topH: number,
) {
  const cy = topH * 0.55 + 18;
  const ovenX = 40;
  const discX = W * 0.5;
  const detX = W - 40;

  // beam line
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.4);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(ovenX, cy);
  ctx.lineTo(detX, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // oven (hot source)
  ctx.fillStyle = hexToRgba(tokens.red, 0.85);
  ctx.fillRect(ovenX - 22, cy - 16, 22, 32);
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("oven", ovenX - 11, cy + 20);

  // flying molecules between oven and disc (decorative)
  ctx.fillStyle = tokens.cyan;
  for (let i = 0; i < 9; i++) {
    const phase = (t * (0.25 + i * 0.05) + i * 0.13) % 1;
    const x = ovenX + phase * (discX - ovenX);
    const y = cy + Math.sin(i * 2.1) * 3;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(phase * Math.PI);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // spinning chopper disc with a slot
  const R = Math.min(34, topH * 0.32);
  const ang = t * discSpeed * 2.2;
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 3;
  const slotHalf = 0.32; // radians
  ctx.beginPath();
  ctx.arc(discX, cy, R, ang + slotHalf, ang - slotHalf + Math.PI * 2);
  ctx.stroke();
  // hub + slot markers
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(discX, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.6);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(discX, cy);
  ctx.lineTo(discX + Math.cos(ang) * R, cy + Math.sin(ang) * R);
  ctx.stroke();
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("chopper", discX, cy + R + 6);

  // detector
  ctx.fillStyle = hexToRgba(tokens.mint, 0.7);
  ctx.fillRect(detX, cy - 20, 6, 40);
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("detector", detX - 3, cy + 24);
}

function drawHistogram(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tempK: number,
  hist: Float64Array,
  vMax: number,
  W: number,
  topH: number,
  H: number,
) {
  const padL = 30;
  const padR = 14;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = topH + 16;
  const gy1 = H - 24;

  const m = speciesMass(N2);

  // normalise the histogram to a density for comparison with f(v)
  const total = hist.reduce((a, b) => a + b, 0);
  const binW = vMax / NB;
  let densMax = 0;
  const dens = new Float64Array(NB);
  for (let i = 0; i < NB; i++) {
    dens[i] = total > 0 ? hist[i] / (total * binW) : 0;
    if (dens[i] > densMax) densMax = dens[i];
  }

  // analytic f(v) max for shared y-scale
  let fMax = 0;
  for (let i = 0; i <= 200; i++) {
    const v = (i / 200) * vMax;
    const f = maxwellBoltzmannSpeed(v, tempK, m);
    if (f > fMax) fMax = f;
  }
  const yScale = Math.max(densMax, fMax) * 1.12;
  const yOf = (d: number) => gy1 - (d / yScale) * (gy1 - gy0);
  const xOf = (v: number) => gx0 + (v / vMax) * (gx1 - gx0);

  // axis
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // deposition bars
  const bw = (gx1 - gx0) / NB;
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.55);
  for (let i = 0; i < NB; i++) {
    const h = gy1 - yOf(dens[i]);
    if (h > 0) ctx.fillRect(gx0 + i * bw + 0.5, yOf(dens[i]), bw - 1, h);
  }

  // analytic curve
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const v = (i / 200) * vMax;
    const x = xOf(v);
    const y = yOf(maxwellBoltzmannSpeed(v, tempK, m));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("detected speed →", gx1, gy1 + 6);
  ctx.textAlign = "left";
  ctx.fillStyle = tokens.amber;
  ctx.fillText("Maxwell f(v)", gx0 + 6, gy0 - 2);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.9);
  ctx.fillText(`deposited: ${total.toFixed(0)}`, gx0 + 90, gy0 - 2);
}
