"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  precessionArcsecPerCentury,
} from "@/lib/physics/relativity/mercurys-perihelion";
import { GM_SUN_SI, AU_M } from "@/lib/physics/constants";
import { Button } from "@/components/ui/button";

/**
 * FIG.40c — Why Mercury and not Jupiter.
 *
 * The GR precession in arcsec/century is plotted against orbital semi-major
 * axis (log axis, 0.3–6 AU). Two effects pile on at small radius: each orbit's
 * advance grows as 1/[a(1−e²)], AND the planet completes far more orbits per
 * century (Kepler's third law). The named planets are pinned on the curve; an
 * eccentricity slider lifts the whole curve. A draggable cursor reads off a/e.
 */

const PAD_L = 48;
const PAD_R = 18;
const PAD_T = 30;
const PAD_B = 40;

// Mean planetary elements (a in AU, e, sidereal period in days).
const PLANETS: { name: string; a: number; e: number; period: number }[] = [
  { name: "Mercury", a: 0.387, e: 0.206, period: 87.97 },
  { name: "Venus", a: 0.723, e: 0.007, period: 224.7 },
  { name: "Earth", a: 1.0, e: 0.0167, period: 365.26 },
  { name: "Mars", a: 1.524, e: 0.0934, period: 686.98 },
  { name: "Jupiter", a: 5.203, e: 0.0489, period: 4332.6 },
];

const A_MIN = 0.3;
const A_MAX = 6;
// Period from Kepler III: T[days] = 365.25 · a^1.5 (a in AU).
function periodDays(aAU: number): number {
  return 365.25 * Math.pow(aAU, 1.5);
}
function precForA(aAU: number, e: number): number {
  return precessionArcsecPerCentury(
    GM_SUN_SI,
    aAU * AU_M,
    e,
    periodDays(aAU),
  );
}

export function PrecessionVsOrbitScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [ecc, setEcc] = useState(0.2);
  const [cursorA, setCursorA] = useState(0.387);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, ecc, cursorA);
  }, [tokens, width, height, ecc, cursorA]);

  const cursorVal = precForA(cursorA, ecc);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A log-axis plot of general-relativistic perihelion precession in arcseconds per century against orbital semi-major axis from 0.3 to 6 astronomical units. The named inner planets sit on the curve; an eccentricity slider and a position cursor let the reader explore why Mercury precesses most."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">eccentricity e: {ecc.toFixed(3)}</span>
        <input
          type="range"
          min={0}
          max={0.6}
          step={0.005}
          value={ecc}
          onChange={(e) => setEcc(parseFloat(e.target.value))}
          className="min-w-[120px] flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">cursor a: {cursorA.toFixed(3)} AU</span>
        <input
          type="range"
          min={A_MIN}
          max={A_MAX}
          step={0.01}
          value={cursorA}
          onChange={(e) => setCursorA(parseFloat(e.target.value))}
          className="min-w-[120px] flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
        <span className="text-[var(--color-fg-3)]">
          → <span style={{ color: "var(--color-magenta)" }}>{cursorVal.toFixed(2)}″/cy</span>
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1 font-mono text-[11px]">
        {PLANETS.map((p) => (
          <Button
            key={p.name}
            onClick={() => {
              setCursorA(p.a);
              setEcc(p.e);
            }}
          >
            {p.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  ecc: number,
  cursorA: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, PAD_L, 10, "GR PRECESSION vs ORBIT SIZE", tokens.textMute);

  const plotX0 = PAD_L;
  const plotX1 = W - PAD_R;
  const plotY0 = PAD_T;
  const plotY1 = H - PAD_B;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  // log-x in AU, log-y in arcsec/cy.
  const logA0 = Math.log10(A_MIN);
  const logA1 = Math.log10(A_MAX);
  const Y_MIN = 0.01;
  const Y_MAX = 60;
  const logY0 = Math.log10(Y_MIN);
  const logY1 = Math.log10(Y_MAX);

  const aToX = (aAU: number) =>
    plotX0 + ((Math.log10(aAU) - logA0) / (logA1 - logA0)) * plotW;
  const vToY = (v: number) => {
    const lv = Math.log10(Math.max(Y_MIN, v));
    return plotY1 - ((lv - logY0) / (logY1 - logY0)) * plotH;
  };

  // ── grid + axis labels ──────────────────────────────────────────────────
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  for (const v of [0.01, 0.1, 1, 10]) {
    const y = vToY(v);
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX1, y);
    ctx.stroke();
    ctx.fillText(`${v}″`, plotX0 - 4, y);
  }
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  for (const a of [0.3, 0.5, 1, 2, 5]) {
    const x = aToX(a);
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.18);
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(`${a}`, x, plotY1 + 5);
  }
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("semi-major axis a (AU, log)", (plotX0 + plotX1) / 2, plotY1 + 20);

  // ── the precession curve at the current eccentricity ────────────────────
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const la = logA0 + ((logA1 - logA0) * i) / steps;
    const aAU = Math.pow(10, la);
    const v = precForA(aAU, ecc);
    const x = aToX(aAU);
    const y = vToY(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── named planets (use each planet's own e for its true marker) ─────────
  for (const p of PLANETS) {
    if (p.a < A_MIN || p.a > A_MAX) continue;
    const v = precForA(p.a, p.e);
    const x = aToX(p.a);
    const y = vToY(v);
    const isMercury = p.name === "Mercury";
    ctx.fillStyle = isMercury ? tokens.amber : tokens.textDim;
    ctx.beginPath();
    ctx.arc(x, y, isMercury ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = isMercury ? "11px ui-monospace, monospace" : "10px ui-monospace, monospace";
    ctx.fillStyle = isMercury ? tokens.amber : tokens.textMute;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${p.name} ${v.toFixed(1)}″`, x + 7, y - 3);
  }

  // ── cursor ──────────────────────────────────────────────────────────────
  const cv = precForA(cursorA, ecc);
  const cx = aToX(cursorA);
  const cy = vToY(cv);
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.7);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, plotY0);
  ctx.lineTo(cx, plotY1);
  ctx.moveTo(plotX0, cy);
  ctx.lineTo(plotX1, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.magenta;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // ── HUD ─────────────────────────────────────────────────────────────────
  drawHudReadout(
    ctx,
    plotX0 + 6,
    plotY0 + 2,
    "cursor: ",
    `a=${cursorA.toFixed(2)} AU, e=${ecc.toFixed(2)} → ${cv.toFixed(2)}″/cy`,
    tokens.textDim,
    tokens.magenta,
  );
}
