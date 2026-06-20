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
  heatTransferDsUniverse,
  reversibleHeatTransferEntropy,
} from "@/lib/physics/thermodynamics/entropy";

/**
 * FIG.10b — The same heat, two ways.
 *
 * Move heat Q from a hot reservoir to a cold one. Let it conduct directly and
 * the universe's entropy jumps by Q(1/T_c − 1/T_h) > 0 — the heat lands where
 * each joule buys more entropy. Route the same Q through a reversible Carnot
 * engine instead and the entropy leaving the hot side exactly equals what
 * enters the cold side: ΔS_universe = 0, and the difference comes out as usable
 * work. The bars compare the two; the gap is the work the direct path throws away.
 */

const Q = 1000; // J

export function ReversibleVsIrreversibleDsScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tHot, setTHot] = useState(600);
  const [tCold, setTCold] = useState(300);

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
    draw(ctx, tokens, { tHot, tCold }, width, height);
  }, [tHot, tCold, tokens, width, height]);

  const direct = heatTransferDsUniverse(Q, tHot, tCold);
  const work = Q * (1 - tCold / tHot);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two bars comparing the universe's entropy change when heat is moved directly (positive) versus through a reversible Carnot engine (zero)."
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
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        direct: ΔS_univ = +{direct.dsUniverse.toFixed(2)} J/K · reversible: ΔS_univ = 0, and{" "}
        {work.toFixed(0)} J of work recovered (Q = {Q} J)
      </p>
    </div>
  );
}

interface DrawState {
  tHot: number;
  tCold: number;
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
  drawSectionTitle(ctx, 16, 4, "ΔS_UNIVERSE  —  DIRECT vs REVERSIBLE", tokens.textMute);

  const direct = heatTransferDsUniverse(Q, s.tHot, s.tCold);
  const rev = reversibleHeatTransferEntropy(Q, s.tHot, s.tCold);

  const PAD = 16;
  const y0 = PAD + 26;
  const y1 = H - PAD - 28;
  const axisX = PAD + 40;

  // baseline + scale
  const maxDs = Math.max(0.5, direct.dsUniverse * 1.25);
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(axisX, y0);
  ctx.lineTo(axisX, y1);
  ctx.lineTo(W - PAD, y1);
  ctx.stroke();
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let g = 0; g <= 4; g++) {
    const val = (maxDs * g) / 4;
    const y = y1 - (val / maxDs) * (y1 - y0);
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.2);
    ctx.beginPath();
    ctx.moveTo(axisX, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(val.toFixed(1), axisX - 4, y);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const slot = (W - PAD - axisX) / 2;
  const bw = slot * 0.4;

  // direct bar (irreversible, > 0)
  const c1 = axisX + slot * 0.5;
  const h1 = (direct.dsUniverse / maxDs) * (y1 - y0);
  ctx.fillStyle = hexToRgba(tokens.red, 0.7);
  ctx.fillRect(c1 - bw / 2, y1 - h1, bw, h1);
  barLabel(ctx, tokens, c1, y1, "DIRECT", `+${direct.dsUniverse.toFixed(2)} J/K`, y1 - h1);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText("irreversible", c1, y1 - h1 - 30);
  ctx.fillText("Q(1/T_c − 1/T_h)", c1, y1 - h1 - 18);

  // reversible bar (= 0)
  const c2 = axisX + slot * 1.5;
  ctx.strokeStyle = tokens.mint;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c2 - bw / 2, y1);
  ctx.lineTo(c2 + bw / 2, y1);
  ctx.stroke();
  barLabel(ctx, tokens, c2, y1, "REVERSIBLE", `${rev.dsUniverse.toFixed(2)} J/K`, y1 - 4);
  ctx.fillStyle = tokens.mint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  const work = Q * (1 - s.tCold / s.tHot);
  ctx.fillText("via Carnot engine", c2, y1 - 40);
  ctx.fillText(`+${work.toFixed(0)} J work out`, c2, y1 - 28);
  ctx.textAlign = "left";
}

function barLabel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  baseY: number,
  name: string,
  value: string,
  valueY: number,
) {
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText(name, cx, baseY + 14);
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.fillText(value, cx, valueY - 6);
  ctx.textAlign = "left";
}
