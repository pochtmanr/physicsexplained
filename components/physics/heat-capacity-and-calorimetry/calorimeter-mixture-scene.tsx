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
import { methodOfMixtures } from "@/lib/physics/thermodynamics/calorimetry";
import { newtonCooling } from "@/lib/physics/thermodynamics/thermometry";

/**
 * FIG.03b — The method of mixtures.
 *
 * Drop a hot metal block into an insulated cup of water and the two settle to a
 * single equilibrium temperature, fixed by m_s c_s ΔT_s = m_w c_w ΔT_w. Choose
 * the metal (which sets its specific heat), the block's mass and starting
 * temperature, then drop it in. Because water's specific heat is so large, even
 * a glowing block barely nudges the water — the experimental workhorse of
 * 19th-century thermometry, and the way specific heats were first measured.
 */

const WATER_MASS_G = 200;
const WATER_C = 4.186; // J/(g·K)
const WATER_T0 = 20; // °C
const COOL_RATE = 0.7; // 1/s
const WINDOW_S = 10;

const METALS = [
  { name: "Aluminium", c: 0.897 },
  { name: "Iron", c: 0.449 },
  { name: "Copper", c: 0.385 },
  { name: "Lead", c: 0.13 },
  { name: "Mercury", c: 0.14 },
];

export function CalorimeterMixtureScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [metalIdx, setMetalIdx] = useState(2); // copper
  const [blockMass, setBlockMass] = useState(150);
  const [blockT, setBlockT] = useState(200);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const tickRef = useSceneTick(true);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
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
      const now = tickRef.current / 1000;
      const elapsed = running ? Math.max(0, now - startRef.current) : 0;
      draw(
        ctx,
        tokens,
        { metal: METALS[metalIdx], blockMass, blockT, elapsed, running },
        width,
        height,
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [metalIdx, blockMass, blockT, running, tokens, tickRef, width, height]);

  const drop = () => {
    startRef.current = tickRef.current / 1000;
    setRunning(true);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A hot metal block dropped into an insulated cup of water. Choose the metal, its mass, and starting temperature; the block cools and the water warms until they meet at the equilibrium temperature set by conservation of energy."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="flex items-center gap-2">
          <span className="w-28 shrink-0">mass: {blockMass} g</span>
          <input
            type="range"
            min={20}
            max={300}
            step={10}
            value={blockMass}
            onChange={(e) => setBlockMass(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-red)" }}
          />
        </span>
        <span className="flex items-center gap-2">
          <span className="w-28 shrink-0">block T: {blockT} °C</span>
          <input
            type="range"
            min={40}
            max={400}
            step={10}
            value={blockT}
            onChange={(e) => setBlockT(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-red)" }}
          />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {METALS.map((m, i) => (
          <button
            key={m.name}
            type="button"
            onClick={() => setMetalIdx(i)}
            className="cursor-pointer rounded-sm border px-2 py-0.5"
            style={
              metalIdx === i
                ? { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
                : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
            }
          >
            {m.name}
          </button>
        ))}
        <button
          type="button"
          onClick={running ? () => setRunning(false) : drop}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-amber)", color: "var(--color-amber)" }}
        >
          {running ? "reset" : "drop block"}
        </button>
      </div>
    </div>
  );
}

interface DrawState {
  metal: { name: string; c: number };
  blockMass: number;
  blockT: number;
  elapsed: number;
  running: boolean;
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
  const leftW = Math.min(W * 0.42, 280);

  const tEq = methodOfMixtures([
    { mass: s.blockMass, specificHeat: s.metal.c, temperature: s.blockT },
    { mass: WATER_MASS_G, specificHeat: WATER_C, temperature: WATER_T0 },
  ]);
  const tBlock = s.running
    ? newtonCooling(s.blockT, tEq, COOL_RATE, s.elapsed)
    : s.blockT;
  const tWater = s.running
    ? newtonCooling(WATER_T0, tEq, COOL_RATE, s.elapsed)
    : WATER_T0;

  // ── LEFT: insulated cup ─────────────────────────────────────────────────
  drawSectionTitle(ctx, PAD, 14, "INSULATED CALORIMETER", tokens.textMute);
  const cupW = leftW * 0.6;
  const cupH = H * 0.5;
  const cupX = PAD + leftW * 0.5 - cupW / 2;
  const cupY = H * 0.34;

  // double wall (insulation)
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeRect(cupX - 5, cupY - 5, cupW + 10, cupH + 10);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cupX, cupY, cupW, cupH);

  // water fill — hue from temperature
  ctx.fillStyle = hexToRgba(tempColor(tWater), 0.34);
  ctx.fillRect(cupX + 1, cupY + cupH * 0.25, cupW - 2, cupH * 0.75 - 1);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText(`water ${WATER_MASS_G} g`, cupX + cupW / 2, cupY + cupH - 6);

  // block: above the cup before drop, submerged after
  const blkSize = 22 + (s.blockMass / 300) * 26;
  const blkX = cupX + cupW / 2 - blkSize / 2;
  const restY = cupY + cupH * 0.5 - blkSize / 2;
  const aboveY = cupY - blkSize - 8;
  const blkY = s.running
    ? restY
    : aboveY;
  ctx.fillStyle = hexToRgba(tempColor(tBlock), 0.9);
  ctx.fillRect(blkX, blkY, blkSize, blkSize);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(blkX, blkY, blkSize, blkSize);
  ctx.fillStyle = tokens.bg;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s.metal.name.slice(0, 2), blkX + blkSize / 2, blkY + blkSize / 2);
  ctx.textBaseline = "alphabetic";

  // ── RIGHT: T vs time ─────────────────────────────────────────────────────
  const gx0 = PAD + leftW + 24;
  const gy0 = 34;
  const gx1 = W - PAD;
  const gy1 = H - PAD - 8;
  drawSectionTitle(ctx, gx0, 14, "TEMPERATURE  vs  TIME", tokens.textMute);

  const tHi = Math.max(s.blockT, WATER_T0) + 15;
  const tLo = Math.min(WATER_T0, tEq) - 10;
  const xOf = (t: number) => gx0 + (t / WINDOW_S) * (gx1 - gx0);
  const yOf = (T: number) => gy1 - ((T - tLo) / (tHi - tLo)) * (gy1 - gy0);

  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // eq line
  ctx.strokeStyle = hexToRgba(tokens.mint, 0.85);
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(gx0, yOf(tEq));
  ctx.lineTo(gx1, yOf(tEq));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.mint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.fillText(`T_eq ${tEq.toFixed(1)}°C`, gx1 - 2, yOf(tEq) - 4);

  curve(ctx, xOf, yOf, s.blockT, tEq, tokens.red);
  curve(ctx, xOf, yOf, WATER_T0, tEq, tokens.blue);

  if (s.running) {
    const cx = xOf(Math.min(s.elapsed, WINDOW_S));
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
    ctx.beginPath();
    ctx.moveTo(cx, gy0);
    ctx.lineTo(cx, gy1);
    ctx.stroke();
    dot(ctx, cx, yOf(tBlock), tokens.red);
    dot(ctx, cx, yOf(tWater), tokens.blue);
  }

  // readouts
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillStyle = tokens.red;
  ctx.fillText(`block ${tBlock.toFixed(1)}°C  (c=${s.metal.c})`, gx0 + 4, gy0 + 10);
  ctx.fillStyle = tokens.blue;
  ctx.fillText(`water ${tWater.toFixed(1)}°C`, gx0 + 4, gy0 + 26);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function curve(
  ctx: CanvasRenderingContext2D,
  xOf: (t: number) => number,
  yOf: (T: number) => number,
  t0: number,
  target: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const tt = (i / 120) * WINDOW_S;
    const T = newtonCooling(t0, target, COOL_RATE, tt);
    const x = xOf(tt);
    const y = yOf(T);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Temperature → color, blue (cold) to red (hot), clamped 0..300 °C. */
function tempColor(t: number): string {
  const frac = Math.max(0, Math.min(1, t / 300));
  const cold: [number, number, number] = [125, 211, 252];
  const hot: [number, number, number] = [248, 113, 113];
  const r = Math.round(cold[0] + (hot[0] - cold[0]) * frac);
  const g = Math.round(cold[1] + (hot[1] - cold[1]) * frac);
  const b = Math.round(cold[2] + (hot[2] - cold[2]) * frac);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
