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
import {
  carnotTSRectangle,
  tsRectangleArea,
  carnotEfficiency,
} from "@/lib/physics/thermodynamics/carnot";

/**
 * FIG.08c — The Carnot cycle as a rectangle in the T–S plane.
 *
 * Plot temperature against entropy and the cycle stops being a lens and becomes
 * a clean rectangle: the isotherms are flat lines at T_h and T_c, the reversible
 * adiabats are vertical (constant entropy — they are isentropes). The heat
 * absorbed is the area under the top edge, the heat rejected the area under the
 * bottom, and the enclosed rectangle, ΔS·(T_h − T_c), is the net work. This is
 * the picture that makes entropy feel like an axis — the subject of FIG.10.
 */

export function TsDiagramScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tHot, setTHot] = useState(600);
  const [tCold, setTCold] = useState(300);
  const [deltaS, setDeltaS] = useState(6); // J/K

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
    draw(ctx, tokens, { tHot, tCold, deltaS }, width, height);
  }, [tHot, tCold, deltaS, tokens, width, height]);

  const work = tsRectangleArea({ tHot, tCold, sLow: 0, sHigh: deltaS });
  const qHot = tHot * deltaS;
  const eff = carnotEfficiency(tHot, tCold);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Temperature–entropy diagram in which the Carnot cycle is a rectangle. The top edge is the hot isotherm, the bottom the cold isotherm, the sides are constant-entropy adiabats, and the enclosed area is the net work."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0" style={{ color: "var(--color-red)" }}>
            T_h: {tHot} K
          </span>
          <input
            type="range"
            min={360}
            max={900}
            step={10}
            value={tHot}
            onChange={(e) => setTHot(Math.max(tCold + 30, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-red)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0" style={{ color: "var(--color-blue)" }}>
            T_c: {tCold} K
          </span>
          <input
            type="range"
            min={200}
            max={560}
            step={10}
            value={tCold}
            onChange={(e) => setTCold(Math.min(tHot - 30, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-blue)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0" style={{ color: "var(--color-mint)" }}>
            ΔS: {deltaS.toFixed(1)} J/K
          </span>
          <input
            type="range"
            min={2}
            max={12}
            step={0.5}
            value={deltaS}
            onChange={(e) => setDeltaS(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-mint)" }}
          />
        </div>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        area = ΔS·(T_h − T_c) = W = {work.toFixed(0)} J · Q_h = T_h·ΔS ={" "}
        {qHot.toFixed(0)} J · η = {(eff * 100).toFixed(1)}%
      </p>
    </div>
  );
}

interface DrawState {
  tHot: number;
  tCold: number;
  deltaS: number;
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
  drawSectionTitle(ctx, 16, 4, "CARNOT CYCLE  T–S", tokens.textMute);

  const PAD = 16;
  const x0 = PAD + 30;
  const x1 = W - PAD - 4;
  const y0 = PAD + 18;
  const y1 = H - PAD - 18;

  const tMax = 1000;
  const sMax = 14;
  const sx = (sVal: number) => x0 + (sVal / sMax) * (x1 - x0);
  const sy = (t: number) => y1 - (t / tMax) * (y1 - y0);

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

  const sLow = 3; // arbitrary offset for display
  const sHigh = sLow + s.deltaS;
  const rect = carnotTSRectangle({
    tHot: s.tHot,
    tCold: s.tCold,
    sLow,
    sHigh,
  });

  const xL = sx(sLow);
  const xR = sx(sHigh);
  const yTop = sy(s.tHot);
  const yBot = sy(s.tCold);

  // area under cold isotherm (rejected heat Q_c) — faint blue
  ctx.fillStyle = hexToRgba(tokens.blue, 0.14);
  ctx.fillRect(xL, yBot, xR - xL, y1 - yBot);
  // enclosed rectangle (net work) — amber
  ctx.fillStyle = hexToRgba(tokens.amber, 0.2);
  ctx.fillRect(xL, yTop, xR - xL, yBot - yTop);

  // rectangle outline with colored edges
  const edges: [number, number, number, number, string, number][] = [
    [xL, yTop, xR, yTop, tokens.red, 2.4], // hot isotherm
    [xR, yTop, xR, yBot, tokens.textFaint, 1.4], // adiabat
    [xR, yBot, xL, yBot, tokens.blue, 2.4], // cold isotherm
    [xL, yBot, xL, yTop, tokens.textFaint, 1.4], // adiabat
  ];
  for (const [ax, ay, bx, by, col, lw] of edges) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // corner dots
  ctx.fillStyle = tokens.textMute;
  for (const c of rect) {
    ctx.beginPath();
    ctx.arc(sx(c.s), sy(c.t), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // labels
  ctx.fillStyle = tokens.red;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText(`T_h = ${s.tHot} K`, xL + 4, yTop - 6);
  ctx.fillStyle = tokens.blue;
  ctx.fillText(`T_c = ${s.tCold} K`, xL + 4, yBot + 12);

  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "center";
  if (yBot - yTop > 24) {
    ctx.fillText("W = ΔS·ΔT", (xL + xR) / 2, (yTop + yBot) / 2 - 6);
    ctx.fillStyle = tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText("net work", (xL + xR) / 2, (yTop + yBot) / 2 + 8);
  }
  ctx.textAlign = "left";
}
