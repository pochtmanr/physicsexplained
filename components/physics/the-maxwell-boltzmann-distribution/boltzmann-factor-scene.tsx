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
import { boltzmannFactor, K_B } from "@/lib/physics/thermodynamics/distributions";

/**
 * FIG.16b — the Boltzmann factor exp(−E/kT) on a logarithmic axis, so each
 * temperature is a straight line. Slide the activation energy E_a: the fraction
 * of molecules above it (the readout) plummets as you cool the gas and climbs
 * steeply as you heat it. This single exponential is the engine of reaction
 * rates, evaporation, and all of statistical mechanics.
 */

const EV = 1.602176634e-19; // joule per electron-volt
const E_MAX_EV = 1.0; // x-axis runs 0 → 1 eV
const LOG_MIN = -18; // y-axis floor: exp factor down to 1e-18

const TEMPS: { T: number; color: keyof Pick<SceneTokens, "blue" | "cyan" | "amber" | "red"> }[] = [
  { T: 300, color: "blue" },
  { T: 600, color: "cyan" },
  { T: 1200, color: "amber" },
  { T: 2400, color: "red" },
];

export function BoltzmannFactorScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [eaEv, setEaEv] = useState(0.4);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 260,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, eaEv, width, height);
  }, [tokens, eaEv, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The Boltzmann factor exp of minus E over kT plotted on a logarithmic vertical axis for four temperatures. Each temperature is a straight line; a vertical activation-energy marker shows the fraction of molecules above the barrier for each temperature."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">E_a: {eaEv.toFixed(2)} eV</span>
        <input
          type="range"
          min={0.02}
          max={E_MAX_EV}
          step={0.01}
          value={eaEv}
          onChange={(e) => setEaEv(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  eaEv: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 36, 8, "BOLTZMANN FACTOR · exp(−E/kT)", tokens.textMute);

  const padL = 42;
  const padR = 70;
  const padT = 24;
  const padB = 28;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const xOf = (eV: number) => gx0 + (eV / E_MAX_EV) * (gx1 - gx0);
  // y is log10 of the factor, mapped from [LOG_MIN, 0]
  const yOf = (log10: number) => gy1 - ((log10 - LOG_MIN) / (0 - LOG_MIN)) * (gy1 - gy0);

  // log gridlines
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let p = 0; p >= LOG_MIN; p -= 3) {
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx0, yOf(p));
    ctx.lineTo(gx1, yOf(p));
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(p === 0 ? "1" : `1e${p}`, gx0 - 4, yOf(p));
  }

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("E (eV) →", gx1, gy1 + 8);

  // one straight line per temperature
  const ln10 = Math.LN10;
  for (const { T, color } of TEMPS) {
    const col = tokens[color];
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 120; i++) {
      const eV = (i / 120) * E_MAX_EV;
      const log10 = Math.log(boltzmannFactor(eV * EV, T)) / ln10;
      const x = xOf(eV);
      const y = yOf(Math.max(LOG_MIN, log10));
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // activation-energy marker
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xOf(eaEv), gy0);
  ctx.lineTo(xOf(eaEv), gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.magenta;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`E_a ${eaEv.toFixed(2)} eV`, xOf(eaEv), gy0 + 12);

  // per-temperature readout of the fraction above E_a
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let ry = gy0 + 6;
  for (const { T, color } of TEMPS) {
    const frac = boltzmannFactor(eaEv * EV, T);
    const kt = ((K_B * T) / EV).toFixed(3);
    ctx.fillStyle = tokens[color];
    const txt = frac < 1e-4 ? frac.toExponential(1) : frac.toFixed(4);
    ctx.fillText(`${T}K (kT=${kt}eV): ${txt}`, gx1 + 6, ry);
    ry += 14;
  }
}
