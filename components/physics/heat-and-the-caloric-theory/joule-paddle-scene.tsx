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
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  workFromFallingWeight,
  temperatureRise,
  joulesToCalories,
  JOULES_PER_CALORIE,
} from "@/lib/physics/thermodynamics/mechanical-equivalent";

/**
 * FIG.02b — Joule's paddle-wheel apparatus (1843–45).
 *
 * A falling weight, hung over a pulley, turns a paddle wheel in an insulated
 * barrel of water. The work the weight does, W = m g h, reappears exactly as
 * heat: the water warms by ΔT = m g h / (m_w c). Drop the weight and the two
 * tallies — work in (joules) and heat out (m_w c ΔT) — rise together and
 * stay equal. Their ratio fixes the mechanical equivalent of heat, 4.186 J
 * per calorie. Joule measured it, by candlelight, in the family brewery.
 */

const WATER_MASS = 1.0; // kg
const C_WATER = 4186; // J/(kg·K)
const G = 9.80665;
const DROP_MS = 1600;

export function JoulePaddleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [weightMass, setWeightMass] = useState(5);
  const [dropHeight, setDropHeight] = useState(2);

  const tickRef = useSceneTick(true);
  const totalWorkRef = useRef(0);
  const totalDtRef = useRef(0);
  const dropRef = useRef<{ active: boolean; start: number; work: number; dt: number }>(
    { active: false, start: 0, work: 0, dt: 0 },
  );
  const spinRef = useRef(0);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.52,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const nowMs = tickRef.current;
      const d = dropRef.current;
      let progress = 0;
      if (d.active) {
        progress = Math.min(1, (nowMs - d.start) / DROP_MS);
        spinRef.current += 0.35; // paddle whirls during the fall
        if (progress >= 1) {
          totalWorkRef.current += d.work;
          totalDtRef.current += d.dt;
          d.active = false;
        }
      }
      const liveWork = totalWorkRef.current + (d.active ? d.work * progress : 0);
      const liveDt = totalDtRef.current + (d.active ? d.dt * progress : 0);
      draw(ctx, tokens, {
        weightMass,
        dropHeight,
        dropProgress: d.active ? progress : 1,
        dropping: d.active,
        spin: spinRef.current,
        work: liveWork,
        deltaT: liveDt,
      }, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [weightMass, dropHeight, tokens, tickRef, width, height]);

  const drop = () => {
    if (dropRef.current.active) return;
    const work = workFromFallingWeight(weightMass, dropHeight, G);
    const dt = temperatureRise(work, WATER_MASS, C_WATER);
    dropRef.current = { active: true, start: tickRef.current, work, dt };
  };
  const reset = () => {
    totalWorkRef.current = 0;
    totalDtRef.current = 0;
    dropRef.current = { active: false, start: 0, work: 0, dt: 0 };
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Joule's paddle-wheel apparatus: a falling weight turns a paddle in insulated water. Dropping the weight raises the water temperature by mgh over m_w c. The work in and heat out tallies rise together and stay equal, fixing the mechanical equivalent of heat at 4.186 joules per calorie."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="flex items-center gap-2">
          <span className="w-32 shrink-0">weight: {weightMass.toFixed(1)} kg</span>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={weightMass}
            onChange={(e) => setWeightMass(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </span>
        <span className="flex items-center gap-2">
          <span className="w-32 shrink-0">drop: {dropHeight.toFixed(1)} m</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={dropHeight}
            onChange={(e) => setDropHeight(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={drop}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-amber)", color: "var(--color-amber)" }}
        >
          drop weight
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
    </div>
  );
}

interface DrawState {
  weightMass: number;
  dropHeight: number;
  dropProgress: number;
  dropping: boolean;
  spin: number;
  work: number;
  deltaT: number;
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
  const leftW = Math.min(W * 0.5, 340);

  drawSectionTitle(ctx, PAD, 14, "JOULE'S PADDLE WHEEL", tokens.textMute);

  // ── Apparatus geometry ──────────────────────────────────────────────────
  const barrelW = leftW * 0.42;
  const barrelH = H * 0.5;
  const barrelX = PAD + leftW * 0.52;
  const barrelY = H * 0.32;

  // Pulley + falling weight to the left of the barrel.
  const pulleyX = PAD + leftW * 0.16;
  const pulleyY = barrelY - 6;
  const fallTop = pulleyY + 14;
  const fallBottom = barrelY + barrelH * 0.9;
  const weightY = fallTop + s.dropProgress * (fallBottom - fallTop);

  // cord from pulley to weight
  ctx.strokeStyle = tokens.textFaint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pulleyX, pulleyY);
  ctx.lineTo(pulleyX, weightY);
  ctx.stroke();
  // cord from pulley over to barrel axle
  ctx.beginPath();
  ctx.moveTo(pulleyX, pulleyY);
  ctx.lineTo(barrelX + barrelW / 2, barrelY - 8);
  ctx.stroke();

  // pulley
  ctx.strokeStyle = tokens.textDim;
  ctx.beginPath();
  ctx.arc(pulleyX, pulleyY, 6, 0, Math.PI * 2);
  ctx.stroke();

  // weight block
  const wSize = 16 + s.weightMass * 2.2;
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.8);
  ctx.fillRect(pulleyX - wSize / 2, weightY, wSize, wSize * 0.7);
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1;
  ctx.strokeRect(pulleyX - wSize / 2, weightY, wSize, wSize * 0.7);
  ctx.fillStyle = tokens.bg;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${s.weightMass.toFixed(0)}kg`, pulleyX, weightY + wSize * 0.35);
  ctx.textBaseline = "alphabetic";

  // drop-height marker
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(pulleyX + wSize, fallTop);
  ctx.lineTo(pulleyX + wSize, fallBottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText(`h = ${s.dropHeight.toFixed(1)} m`, pulleyX + wSize + 4, (fallTop + fallBottom) / 2);

  // ── Barrel of water with paddle wheel ───────────────────────────────────
  const warmFrac = Math.max(0, Math.min(1, s.deltaT / 0.02));
  const waterCol = warmFrac < 0.5
    ? mix(tokens.blue, tokens.amber, warmFrac / 0.5)
    : mix(tokens.amber, tokens.red, (warmFrac - 0.5) / 0.5);
  ctx.fillStyle = hexToRgba(waterCol, 0.34);
  ctx.fillRect(barrelX, barrelY, barrelW, barrelH);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barrelX, barrelY, barrelW, barrelH);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText("insulated water", barrelX + barrelW / 2, barrelY + barrelH - 6);

  // paddle wheel
  const padCx = barrelX + barrelW / 2;
  const padCy = barrelY + barrelH * 0.42;
  const padR = Math.min(barrelW, barrelH) * 0.28;
  ctx.save();
  ctx.translate(padCx, padCy);
  ctx.rotate(s.spin);
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.strokeRect(padR * 0.5, -3, padR * 0.5, 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(padR, 0);
    ctx.stroke();
  }
  ctx.restore();

  // thermometer on the right edge of the barrel
  const thX = barrelX + barrelW + 12;
  const thTop = barrelY + 6;
  const thBot = barrelY + barrelH - 6;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(thX, thTop);
  ctx.lineTo(thX, thBot);
  ctx.stroke();
  // mercury level scaled to ΔT (cap display at ~0.02 K range)
  const lvl = Math.min(1, s.deltaT / 0.02);
  ctx.strokeStyle = tokens.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(thX, thBot);
  ctx.lineTo(thX, thBot - lvl * (thBot - thTop));
  ctx.stroke();
  ctx.fillStyle = tokens.red;
  ctx.beginPath();
  ctx.arc(thX, thBot + 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // ── RIGHT: work-in vs heat-out tallies ──────────────────────────────────
  const gx0 = PAD + leftW + 16;
  drawSectionTitle(ctx, gx0, 14, "ENERGY AUDIT", tokens.textMute);

  const heatOut = WATER_MASS * C_WATER * s.deltaT; // = work, by construction
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let y = 36;

  const rows: [string, string, string][] = [
    ["work in  (m g h)", `${s.work.toFixed(1)} J`, tokens.amber],
    ["heat out (m_w c ΔT)", `${heatOut.toFixed(1)} J`, tokens.red],
    ["ΔT water", `+${(s.deltaT * 1000).toFixed(2)} mK`, tokens.red],
    ["= in calories", `${joulesToCalories(s.work).toFixed(2)} cal`, tokens.cyan],
  ];
  for (const [label, value, color] of rows) {
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(label, gx0, y);
    ctx.fillStyle = color;
    ctx.fillText(value, gx0 + 150, y);
    y += 22;
  }

  // equality bars
  const barX = gx0;
  const barW = W - PAD - barX;
  const wmax = Math.max(1, s.work);
  y += 8;
  bar(ctx, barX, y, barW, hexToRgba(tokens.amber, 0.85), 1, "in");
  bar(ctx, barX, y + 16, barW, hexToRgba(tokens.red, 0.85), heatOut / wmax, "out");

  y += 44;
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(
    `mechanical equivalent: 1 cal = ${JOULES_PER_CALORIE} J`,
    gx0,
    y,
  );
  ctx.fillStyle = tokens.mint;
  ctx.fillText("work in = heat out — heat is energy", gx0, y + 16);

  ctx.textBaseline = "alphabetic";
}

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
  frac: number,
  label: string,
) {
  ctx.fillStyle = hexToRgba(color, 0.25);
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), 10);
  ctx.fillStyle = color;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w + 4, y + 5);
  ctx.textBaseline = "alphabetic";
}

function mix(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hex(h: string): [number, number, number] | null {
  if (!h.startsWith("#")) return null;
  const s = h.replace("#", "");
  const e = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  if (e.length !== 6) return null;
  return [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16),
  ];
}
