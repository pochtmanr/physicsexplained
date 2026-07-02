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
import { johnsonNyquistVoltage } from "@/lib/physics/thermodynamics/fluctuations";

/**
 * FIG.21b — Johnson–Nyquist noise on an oscilloscope. Every resistor at
 * temperature T hisses: an open-circuit voltage whose RMS amplitude is
 * V = √(4 k_BT R Δf), set only by temperature, resistance and bandwidth — never
 * by the resistor's material. Slide T and R; the trace and its shaded ±V_rms
 * band grow as √T and √R. The full-scale is fixed, so cooling the resistor or
 * dropping its resistance visibly flattens the hiss toward silence.
 */

const BUFLEN = 300;
const BANDWIDTH = 1e4; // Δf = 10 kHz, fixed
const FULLSCALE_UV = 10; // ±5 µV visible span

/** Crude zero-mean, unit-variance Gaussian: sum of 6 uniforms minus 3. */
function gauss(): number {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.random();
  return (s - 3) / Math.sqrt(0.5);
}

export function JohnsonNyquistScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tempK, setTempK] = useState(300);
  const [logR, setLogR] = useState(4); // R = 10^logR ohms
  const tempRef = useRef(tempK);
  const logRRef = useRef(logR);
  tempRef.current = tempK;
  logRRef.current = logR;
  const bufRef = useRef<number[]>(new Array(BUFLEN).fill(0));
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
      const R = Math.pow(10, logRRef.current);
      const vrmsUV = johnsonNyquistVoltage(tempRef.current, R, BANDWIDTH) * 1e6;
      while (accRef.current > 0.02) {
        accRef.current -= 0.02;
        bufRef.current.push(vrmsUV * gauss());
        if (bufRef.current.length > BUFLEN) bufRef.current.shift();
      }
      draw(ctx, tokens, bufRef.current, vrmsUV, tempRef.current, R, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height]);

  const R = Math.pow(10, logR);
  const vrmsUV = johnsonNyquistVoltage(tempK, R, BANDWIDTH) * 1e6;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="An oscilloscope trace of thermal noise voltage across a resistor, with a shaded one-sigma band whose amplitude grows with the square root of temperature and resistance."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">T: {tempK.toFixed(0)} K</span>
        <input
          type="range"
          min={4}
          max={600}
          step={2}
          value={tempK}
          onChange={(e) => setTempK(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          R: {formatOhms(R)} · V {vrmsUV.toFixed(2)} µV
        </span>
        <input
          type="range"
          min={2}
          max={6}
          step={0.1}
          value={logR}
          onChange={(e) => setLogR(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
    </div>
  );
}

function formatOhms(R: number): string {
  if (R >= 1e6) return `${(R / 1e6).toFixed(1)} MΩ`;
  if (R >= 1e3) return `${(R / 1e3).toFixed(1)} kΩ`;
  return `${R.toFixed(0)} Ω`;
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  buf: number[],
  vrmsUV: number,
  tempK: number,
  R: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 30, 8, "THERMAL NOISE · V = √(4k_BTRΔf)", tokens.textMute);

  const padL = 40;
  const padR = 14;
  const padT = 26;
  const padB = 22;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const yOf = (uv: number) =>
    (gy0 + gy1) / 2 - (uv / FULLSCALE_UV) * (gy1 - gy0);
  const xOf = (i: number) => gx0 + (i / (BUFLEN - 1)) * (gx1 - gx0);

  // ±V_rms band
  const yHi = yOf(Math.min(vrmsUV, FULLSCALE_UV / 2));
  const yLo = yOf(-Math.min(vrmsUV, FULLSCALE_UV / 2));
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.16);
  ctx.fillRect(gx0, yHi, gx1 - gx0, yLo - yHi);

  // zero baseline
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, yOf(0));
  ctx.lineTo(gx1, yOf(0));
  ctx.stroke();

  // axis frame
  ctx.strokeStyle = tokens.axes;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.stroke();

  // noise trace (clamped to scope range)
  const half = FULLSCALE_UV / 2;
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  buf.forEach((uv, i) => {
    const c = Math.max(-half, Math.min(half, uv));
    const x = xOf(i);
    const y = yOf(c);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`+${half.toFixed(0)}µV`, gx0 - 4, gy0 + 6);
  ctx.fillText(`−${half.toFixed(0)}µV`, gx0 - 4, gy1 - 6);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.95);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `V_rms = ${vrmsUV.toFixed(2)} µV   (Δf = 10 kHz)`,
    gx0 + 6,
    gy0 + 2,
  );
}
