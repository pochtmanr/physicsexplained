"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
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
import { R_GAS } from "@/lib/physics/thermodynamics/pv-plot";

/**
 * FIG.06c — reversible vs irreversible expansion.
 *
 * The same gas, the same start and end states, two ways to get there. On the
 * left the external pressure is lowered infinitesimally slowly: the gas stays in
 * step with its surroundings (quasi-static), traces the full isotherm, and does
 * the maximum possible work W_rev = nRT·ln(V₂/V₁). On the right the restraint is
 * yanked away and the gas expands freely against the low final pressure, doing
 * only W_irr = P₂·ΔV. Both finish at the same volume, but the slow one did more
 * work — and only the slow one can be run backwards along its own path. That gap
 * between W_rev and W_irr is the seed of the Second Law.
 */

const N = 1; // mol
const T = 300; // K (isothermal)
const V1 = 0.01; // m³
const V2 = 0.025; // m³
const P1 = (N * R_GAS * T) / V1; // Pa
const P2 = (N * R_GAS * T) / V2; // Pa

const W_REV = N * R_GAS * T * Math.log(V2 / V1); // J
const W_IRR = P2 * (V2 - V1); // J

export function ReversibleVsIrreversibleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const [phase, setPhase] = useState<"idle" | "expanding">("idle");
  const slowRef = useRef(0); // 0..1 reversible progress
  const fastRef = useRef(0); // 0..1 irreversible progress

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.56,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    let prev = performance.now();
    const render = () =>
      draw(ctx, tokens, { slow: slowRef.current, fast: fastRef.current }, width, height);

    if (phase === "idle") {
      render();
      return;
    }
    const tick = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      // the irreversible release snaps almost instantly; the reversible
      // expansion eases out slowly (quasi-static).
      fastRef.current = Math.min(1, fastRef.current + dt * 2.5);
      slowRef.current = Math.min(1, slowRef.current + dt * 0.32);
      render();
      if (slowRef.current < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, tokens, width, height]);

  const reset = () => {
    slowRef.current = 0;
    fastRef.current = 0;
    setPhase("idle");
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two cylinders of identical gas expand to the same final volume. The left expands slowly and reversibly, doing more work; the right is released suddenly and does less work. The work bars beneath compare the two."
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setPhase("expanding")}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }}
        >
          release
        </button>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }}
        >
          reset
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        same ΔV, same final state · W_rev = {W_REV.toFixed(0)} J (slow, reversible) &gt; W_irr ={" "}
        {W_IRR.toFixed(0)} J (sudden) · the lost {(W_REV - W_IRR).toFixed(0)} J never comes back
      </p>
    </div>
  );
}

interface DrawState {
  slow: number;
  fast: number;
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: DrawState,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const PAD = 16;
  const colW = (W - PAD * 3) / 2;
  const cylTop = 34;
  const cylH = H * 0.46;
  const cylBase = cylTop + cylH;

  drawCylinder(ctx, tokens, {
    x: PAD,
    w: colW,
    top: cylTop,
    base: cylBase,
    title: "SLOW — quasi-static",
    progress: s.slow,
    color: tokens.cyan,
    work: W_REV * s.slow,
    workMax: W_REV,
    note: "reversible · max work",
  });
  drawCylinder(ctx, tokens, {
    x: PAD * 2 + colW,
    w: colW,
    top: cylTop,
    base: cylBase,
    title: "SUDDEN — free release",
    progress: s.fast,
    color: tokens.red,
    work: W_IRR * s.fast,
    workMax: W_REV, // share the scale so bars are comparable
    note: "irreversible · less work",
  });

  // shared work-axis caption
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText(
    "work done by the gas (same bar scale) — slow wins",
    W / 2,
    H - PAD + 2,
  );
  ctx.textAlign = "left";
}

interface CylSpec {
  x: number;
  w: number;
  top: number;
  base: number;
  title: string;
  progress: number;
  color: string;
  work: number;
  workMax: number;
  note: string;
}

function drawCylinder(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  c: CylSpec,
) {
  drawSectionTitle(ctx, c.x, c.top - 16, c.title, tokens.textMute);

  const innerX = c.x + 8;
  const innerW = c.w - 16;
  const fullH = c.base - c.top;

  // gas column grows rightward-equivalent here we grow upward: piston rises
  const minFill = 0.4;
  const fill = minFill + (1 - minFill) * c.progress;
  const gasH = fullH * fill;
  const gasTop = c.base - gasH;

  // cylinder walls
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x, c.top);
  ctx.lineTo(c.x, c.base);
  ctx.lineTo(c.x + c.w, c.base);
  ctx.lineTo(c.x + c.w, c.top);
  ctx.stroke();

  // gas
  ctx.fillStyle = hexToRgba(c.color, 0.22);
  ctx.fillRect(innerX, gasTop, innerW, gasH);

  // particles
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.45);
  for (let i = 0; i < 16; i++) {
    const px = innerX + ((i * 47) % innerW);
    const py = gasTop + ((i * 83) % (gasH - 6)) + 3;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // piston
  ctx.fillStyle = hexToRgba(c.color, 0.9);
  ctx.fillRect(innerX, gasTop - 7, innerW, 7);

  // work bar beneath the cylinder
  const barTop = c.base + 18;
  const barH = 12;
  const barW = c.w;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(c.x, barTop, barW, barH);
  const frac = Math.max(0, Math.min(1, c.work / c.workMax));
  ctx.fillStyle = hexToRgba(c.color, 0.8);
  ctx.fillRect(c.x, barTop, barW * frac, barH);

  // readouts
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "center";
  ctx.fillText(`W = ${c.work.toFixed(0)} J`, c.x + c.w / 2, barTop + barH + 16);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(c.note, c.x + c.w / 2, barTop + barH + 30);
  ctx.textAlign = "left";
}
