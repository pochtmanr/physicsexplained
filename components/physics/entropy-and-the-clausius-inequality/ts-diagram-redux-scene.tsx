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

/**
 * FIG.10c — Cycles as shapes in the T–S plane.
 *
 * Once entropy is an axis, every thermodynamic cycle becomes a closed loop whose
 * enclosed area, ∮ T dS, is exactly the net work. The Carnot cycle is the
 * cleanest: a rectangle, because its isotherms are flat and its reversible
 * adiabats are vertical. The Otto cycle (idealised petrol engine) closes its top
 * and bottom with constant-volume curves; the Diesel cycle adds heat along a
 * gentler constant-pressure curve. Switch between them and read the area.
 */

const R = 8.314462618;
const N = 1;
const CV = 1.5 * R;
const CP = 2.5 * R;
const S_LOW = 2;
const S_HIGH = 8;
const T_BASE = 300;

type Cycle = "carnot" | "otto" | "diesel";

interface TS {
  s: number;
  t: number;
}

function carnotPath(): TS[] {
  const tHot = 620;
  const tCold = 300;
  return [
    { s: S_LOW, t: tHot },
    { s: S_HIGH, t: tHot },
    { s: S_HIGH, t: tCold },
    { s: S_LOW, t: tCold },
  ];
}

/** Constant-heat-capacity curve T(s) = Tref·exp((s − sref)/(nC)). */
function curve(sFrom: number, sTo: number, tFrom: number, nC: number, samples = 40): TS[] {
  const out: TS[] = [];
  for (let i = 0; i < samples; i++) {
    const s = sFrom + ((sTo - sFrom) * i) / (samples - 1);
    out.push({ s, t: tFrom * Math.exp((s - sFrom) / nC) });
  }
  return out;
}

function ottoPath(): TS[] {
  const t1 = T_BASE; // bottom-left
  const t2 = t1 * 2.0; // after isentropic compression (vertical, const S)
  const top = curve(S_LOW, S_HIGH, t2, N * CV); // constant-volume heat addition
  const bottom = curve(S_HIGH, S_LOW, t1 * Math.exp((S_HIGH - S_LOW) / (N * CV)), N * CV);
  // bottom returns from right back to left along the lower const-volume curve
  return [{ s: S_LOW, t: t1 }, ...top, ...bottom];
}

function dieselPath(): TS[] {
  const t1 = T_BASE;
  const t2 = t1 * 2.0;
  const top = curve(S_LOW, S_HIGH, t2, N * CP); // constant-pressure heat addition (gentler)
  const bottom = curve(S_HIGH, S_LOW, t1 * Math.exp((S_HIGH - S_LOW) / (N * CV)), N * CV);
  return [{ s: S_LOW, t: t1 }, ...top, ...bottom];
}

function pathFor(c: Cycle): TS[] {
  if (c === "carnot") return carnotPath();
  if (c === "otto") return ottoPath();
  return dieselPath();
}

/** Net work = ∮ T dS, the signed area of the closed T–S loop (shoelace). */
function loopArea(pts: TS[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.s * q.t - q.s * p.t;
  }
  return Math.abs(a) / 2;
}

export function TsDiagramReduxScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [cycle, setCycle] = useState<Cycle>("carnot");

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
    draw(ctx, tokens, cycle, width, height);
  }, [cycle, tokens, width, height]);

  const area = loopArea(pathFor(cycle));

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Temperature–entropy diagrams of the Carnot, Otto, and Diesel cycles. The enclosed area of each loop is the net work."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
        {(
          [
            ["carnot", "Carnot (rectangle)"],
            ["otto", "Otto"],
            ["diesel", "Diesel"],
          ] as [Cycle, string][]
        ).map(([c, label]) => (
          <button
            key={c}
            type="button"
            onClick={() => setCycle(c)}
            className="cursor-pointer rounded-sm border px-2 py-0.5"
            style={
              cycle === c
                ? { borderColor: "var(--color-amber)", color: "var(--color-amber)" }
                : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
            }
          >
            {label}
          </button>
        ))}
        <span className="text-[var(--color-fg-3)]">
          enclosed area = ∮ T dS = net work ≈ {(area / 1000).toFixed(2)} kJ
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cycle: Cycle,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 16, 4, `${cycle.toUpperCase()} CYCLE  T–S`, tokens.textMute);

  const pts = pathFor(cycle);

  const PAD = 16;
  const x0 = PAD + 30;
  const x1 = W - PAD - 4;
  const y0 = PAD + 18;
  const y1 = H - PAD - 18;

  const sMin = 0;
  const sMax = 10;
  const tMin = 0;
  const tMax = 1400;
  const sx = (s: number) => x0 + ((s - sMin) / (sMax - sMin)) * (x1 - x0);
  const sy = (t: number) => y1 - ((t - tMin) / (tMax - tMin)) * (y1 - y0);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("T (K)", x0 - 2, y0 - 12);
  ctx.fillText("S (J/K)", x1 - 40, y1 + 4);

  // filled loop
  ctx.beginPath();
  pts.forEach((p, i) => {
    const X = sx(p.s);
    const Y = sy(p.t);
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  });
  ctx.closePath();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.18);
  ctx.fill();
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.stroke();

  // centroid label
  let cs = 0;
  let cttt = 0;
  for (const p of pts) {
    cs += p.s;
    cttt += p.t;
  }
  cs /= pts.length;
  cttt /= pts.length;
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "center";
  ctx.fillText("net work", sx(cs), sy(cttt));
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("area = ∮ T dS", sx(cs), sy(cttt) + 14);
  ctx.textAlign = "left";

  // caption note per cycle
  const notes: Record<Cycle, string> = {
    carnot: "flat isotherms + vertical adiabats → a clean rectangle",
    otto: "vertical adiabats + constant-volume curves (petrol engine)",
    diesel: "heat added along a gentler constant-pressure curve",
  };
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(notes[cycle], x0 + 2, y0 + 2);
}
