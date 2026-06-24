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
import { ABSOLUTE_ZERO_C } from "@/lib/physics/thermodynamics/ideal-gas";

/**
 * FIG.14a — the three classical gas laws, one shared temperature knob.
 *
 * Panel 1 (Boyle): P versus 1/V is a straight line through the origin whose
 * slope is nRT — raise T and the isotherm tilts up. Panel 2 (Charles): V versus
 * T is a straight line that, extrapolated, strikes V = 0 at −273.15 °C — the
 * first sighting of absolute zero. Panel 3 (the collapse): PV/nR versus T is the
 * single line y = T onto which every gas falls at low density, regardless of
 * species. Drag the temperature; the Boyle slope steepens and the markers slide.
 */

const T_MIN = 150; // K
const T_MAX = 600; // K

export function GasLawsTripleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tempK, setTempK] = useState(300);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.42,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 240,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, tempK, width, height);
  }, [tokens, tempK, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Three panels of the gas laws. Left: pressure versus one-over-volume, a straight line through the origin whose slope grows with temperature (Boyle). Middle: volume versus temperature in Celsius, a straight line extrapolating to zero volume at minus 273 degrees (Charles). Right: PV over nR versus temperature in kelvin, the single line onto which helium, nitrogen and carbon dioxide all collapse."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">
          T: {tempK.toFixed(0)} K · {(tempK + ABSOLUTE_ZERO_C).toFixed(0)} °C
        </span>
        <input
          type="range"
          min={T_MIN}
          max={T_MAX}
          step={1}
          value={tempK}
          onChange={(e) => setTempK(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
    </div>
  );
}

const GASES = [
  { name: "He", color: "cyan" as const },
  { name: "N₂", color: "amber" as const },
  { name: "CO₂", color: "magenta" as const },
];

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tempK: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 18;
  const panelW = (W - gap * 2) / 3;
  drawBoyle(ctx, tokens, tempK, 0, panelW, H);
  drawCharles(ctx, tokens, tempK, panelW + gap, panelW, H);
  drawCollapse(ctx, tokens, tempK, 2 * (panelW + gap), panelW, H);
}

/** Common frame: returns plot rect and axis-mapping closures. */
function frame(x0: number, panelW: number, H: number) {
  const padL = 30;
  const padR = 10;
  const padT = 26;
  const padB = 24;
  const gx0 = x0 + padL;
  const gx1 = x0 + panelW - padR;
  const gy0 = padT;
  const gy1 = H - padB;
  return { gx0, gx1, gy0, gy1 };
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  f: ReturnType<typeof frame>,
  xLabel: string,
  yLabel: string,
) {
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(f.gx0, f.gy0);
  ctx.lineTo(f.gx0, f.gy1);
  ctx.lineTo(f.gx1, f.gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(xLabel, f.gx1, f.gy1 + 6);
  ctx.textAlign = "left";
  ctx.fillText(yLabel, f.gx0 - 22, f.gy0 - 14);
}

function drawBoyle(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tempK: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 30, 8, "BOYLE · P vs 1/V", tokens.textMute);
  const f = frame(x0, panelW, H);
  drawAxes(ctx, tokens, f, "1/V →", "P");

  // y = slope · x, slope ∝ T. Normalise so the hottest isotherm fills the box.
  const slopeOf = (T: number) => T / T_MAX;
  const xMax = 1;
  const yMax = 1;
  const xOf = (x: number) => f.gx0 + (x / xMax) * (f.gx1 - f.gx0);
  const yOf = (y: number) => f.gy1 - (y / yMax) * (f.gy1 - f.gy0);

  // faint reference isotherm (coldest)
  const drawLine = (T: number, color: string, w: number) => {
    const s = slopeOf(T);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(0));
    // clamp to the top edge if the line would exit the box
    const yAtMax = s * xMax;
    if (yAtMax <= yMax) {
      ctx.lineTo(xOf(xMax), yOf(yAtMax));
    } else {
      ctx.lineTo(xOf(yMax / s), yOf(yMax));
    }
    ctx.stroke();
  };
  drawLine(T_MIN, hexToRgba(tokens.gridHeavy, 0.4), 1.5);
  drawLine(tempK, tokens.cyan, 2.5);

  // marker partway along the current isotherm
  const s = slopeOf(tempK);
  const xm = Math.min(0.6, yMax / s);
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(xOf(xm), yOf(s * xm), 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCharles(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tempK: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 30, 8, "CHARLES · V vs T", tokens.textMute);
  const f = frame(x0, panelW, H);
  drawAxes(ctx, tokens, f, "T (°C) →", "V");

  const tcMin = -300;
  const tcMax = 360;
  const xOf = (tc: number) => f.gx0 + ((tc - tcMin) / (tcMax - tcMin)) * (f.gx1 - f.gx0);
  // V ∝ absolute T; normalise so V(tcMax) ≈ top of box
  const vOf = (tc: number) => (tc - ABSOLUTE_ZERO_C) / (tcMax - ABSOLUTE_ZERO_C);
  const yOf = (v: number) => f.gy1 - v * (f.gy1 - f.gy0);

  // dashed extrapolation from absolute zero to the first real datum
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xOf(ABSOLUTE_ZERO_C), yOf(0));
  ctx.lineTo(xOf(0), yOf(vOf(0)));
  ctx.stroke();
  ctx.setLineDash([]);

  // solid measured line from 0 °C upward
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(vOf(0)));
  ctx.lineTo(xOf(tcMax), yOf(vOf(tcMax)));
  ctx.stroke();

  // absolute-zero intercept
  ctx.fillStyle = tokens.red;
  ctx.beginPath();
  ctx.arc(xOf(ABSOLUTE_ZERO_C), yOf(0), 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText("−273 °C", xOf(ABSOLUTE_ZERO_C) + 4, yOf(0) - 4);

  // current-temperature marker (only if in view)
  const tc = tempK + ABSOLUTE_ZERO_C;
  if (tc >= 0) {
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(xOf(tc), yOf(vOf(tc)), 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCollapse(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tempK: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 30, 8, "COLLAPSE · PV/nR vs T", tokens.textMute);
  const f = frame(x0, panelW, H);
  drawAxes(ctx, tokens, f, "T (K) →", "PV/nR");

  const xOf = (T: number) => f.gx0 + (T / T_MAX) * (f.gx1 - f.gx0);
  const yOf = (v: number) => f.gy1 - (v / T_MAX) * (f.gy1 - f.gy0);

  // the single ideal line y = T
  ctx.strokeStyle = tokens.mint;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(0));
  ctx.lineTo(xOf(T_MAX), yOf(T_MAX));
  ctx.stroke();

  // every gas sits on the same line at the current T (the whole point)
  GASES.forEach((g, i) => {
    ctx.fillStyle = tokens[g.color];
    ctx.beginPath();
    ctx.arc(xOf(tempK), yOf(tempK), 5 - i, 0, Math.PI * 2);
    ctx.fill();
  });

  // legend
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  GASES.forEach((g, i) => {
    ctx.fillStyle = tokens[g.color];
    ctx.fillText(`● ${g.name}`, f.gx0 + 6, f.gy0 + 4 + i * 13);
  });
}
