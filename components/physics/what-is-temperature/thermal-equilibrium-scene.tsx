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
  equilibriumTemperature,
  newtonCooling,
} from "@/lib/physics/thermodynamics/thermometry";

/**
 * FIG.01b — Thermal equilibrium.
 *
 * Two equal blocks at temperatures you set are brought into contact. Heat flows
 * from hot to cold and both temperatures relax exponentially toward a single
 * shared value — the operational *definition* of temperature: the quantity that
 * equalises on contact. With insulation ON, the shared value is the average of
 * the two starting temperatures (energy is conserved between the blocks). With
 * insulation OFF, both blocks instead drift to room temperature — equilibrium
 * with the surroundings, not just with each other.
 */

const AMBIENT_C = 22;
const COOL_RATE = 0.45; // 1/s
const WINDOW_S = 14; // plotted time window

export function ThermalEquilibriumScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tA0, setTA0] = useState(85);
  const [tB0, setTB0] = useState(10);
  const [insulated, setInsulated] = useState(true);
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
      draw(ctx, tokens, { tA0, tB0, insulated, elapsed, running }, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tA0, tB0, insulated, running, tokens, tickRef, width, height]);

  const startContact = () => {
    startRef.current = tickRef.current / 1000;
    setRunning(true);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two blocks at temperatures you choose are brought into contact and relax exponentially toward a shared equilibrium temperature. An insulation toggle switches between equilibrium with each other (the average) and equilibrium with the room."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="flex items-center gap-2">
          <span className="w-28 shrink-0" style={{ color: "var(--color-red)" }}>
            block A: {tA0.toFixed(0)} °C
          </span>
          <input
            type="range"
            min={-10}
            max={100}
            step={1}
            value={tA0}
            onChange={(e) => setTA0(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-red)" }}
          />
        </span>
        <span className="flex items-center gap-2">
          <span className="w-28 shrink-0" style={{ color: "var(--color-blue)" }}>
            block B: {tB0.toFixed(0)} °C
          </span>
          <input
            type="range"
            min={-10}
            max={100}
            step={1}
            value={tB0}
            onChange={(e) => setTB0(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-blue)" }}
          />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setInsulated((v) => !v)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={
            insulated
              ? { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
              : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
          }
        >
          insulation: {insulated ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={running ? () => setRunning(false) : startContact}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-amber)", color: "var(--color-amber)" }}
        >
          {running ? "reset" : "bring into contact"}
        </button>
      </div>
    </div>
  );
}

interface DrawState {
  tA0: number;
  tB0: number;
  insulated: boolean;
  elapsed: number;
  running: boolean;
}

function temps(s: DrawState): { tA: number; tB: number; tEq: number } {
  const tEqMutual = equilibriumTemperature([
    { heatCapacity: 1, temperature: s.tA0 },
    { heatCapacity: 1, temperature: s.tB0 },
  ]);
  if (!s.running) return { tA: s.tA0, tB: s.tB0, tEq: tEqMutual };
  if (s.insulated) {
    return {
      tA: newtonCooling(s.tA0, tEqMutual, COOL_RATE, s.elapsed),
      tB: newtonCooling(s.tB0, tEqMutual, COOL_RATE, s.elapsed),
      tEq: tEqMutual,
    };
  }
  return {
    tA: newtonCooling(s.tA0, AMBIENT_C, COOL_RATE, s.elapsed),
    tB: newtonCooling(s.tB0, AMBIENT_C, COOL_RATE, s.elapsed),
    tEq: AMBIENT_C,
  };
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
  const leftW = Math.min(W * 0.4, 280);
  const { tA, tB, tEq } = temps(s);

  // ── LEFT: the two blocks ─────────────────────────────────────────────────
  drawSectionTitle(ctx, PAD, 14, "BLOCKS", tokens.textMute);
  const blockSize = Math.min(78, leftW * 0.32);
  const midY = H * 0.5;
  const gap = s.running ? 2 : 40;
  const ax = PAD + leftW * 0.5 - blockSize - gap / 2;
  const bx = PAD + leftW * 0.5 + gap / 2;
  const by = midY - blockSize / 2;

  drawBlock(ctx, tokens, ax, by, blockSize, tA, "A");
  drawBlock(ctx, tokens, bx, by, blockSize, tB, "B");

  // heat-flow arrow when in contact and a gap in temperature remains
  if (s.running && Math.abs(tA - tB) > 0.5) {
    const fromHot = tA > tB;
    const y = midY - blockSize / 2 - 14;
    const x0 = fromHot ? ax + blockSize * 0.5 : bx + blockSize * 0.5;
    const x1 = fromHot ? bx + blockSize * 0.5 : ax + blockSize * 0.5;
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
    ctx.fillStyle = hexToRgba(tokens.amber, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    const dir = Math.sign(x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 - dir * 7, y - 4);
    ctx.lineTo(x1 - dir * 7, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText("heat", (x0 + x1) / 2, y - 10);
  }

  // ── RIGHT: temperature vs time plot ──────────────────────────────────────
  const gx0 = PAD + leftW + 20;
  const gy0 = 32;
  const gx1 = W - PAD;
  const gy1 = H - PAD - 8;
  drawSectionTitle(ctx, gx0, 14, "TEMPERATURE  vs  TIME", tokens.textMute);

  const allT = [s.tA0, s.tB0, tEq, AMBIENT_C];
  const tHi = Math.max(...allT) + 8;
  const tLo = Math.min(...allT) - 8;
  const xOf = (t: number) => gx0 + (t / WINDOW_S) * (gx1 - gx0);
  const yOf = (temp: number) =>
    gy1 - ((temp - tLo) / (tHi - tLo)) * (gy1 - gy0);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // equilibrium / target line
  ctx.strokeStyle = hexToRgba(tokens.mint, 0.8);
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(gx0, yOf(tEq));
  ctx.lineTo(gx1, yOf(tEq));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.mint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.fillText(
    `${s.insulated ? "T_eq" : "room"} ${tEq.toFixed(1)}°C`,
    gx1 - 2,
    yOf(tEq) - 4,
  );

  // curves over the whole window
  const targetA = s.insulated ? tEq : AMBIENT_C;
  const targetB = s.insulated ? tEq : AMBIENT_C;
  plotCurve(ctx, xOf, yOf, s.tA0, targetA, tokens.red);
  plotCurve(ctx, xOf, yOf, s.tB0, targetB, tokens.blue);

  // moving cursor
  if (s.running) {
    const cx = xOf(Math.min(s.elapsed, WINDOW_S));
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
    ctx.beginPath();
    ctx.moveTo(cx, gy0);
    ctx.lineTo(cx, gy1);
    ctx.stroke();
    dot(ctx, cx, yOf(tA), tokens.red);
    dot(ctx, cx, yOf(tB), tokens.blue);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function plotCurve(
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
    const temp = newtonCooling(t0, target, COOL_RATE, tt);
    const x = xOf(tt);
    const y = yOf(temp);
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

function drawBlock(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  size: number,
  temp: number,
  label: string,
) {
  // color from temperature: blue (cold) → grey → red (hot), clamped −10..100
  const frac = Math.max(0, Math.min(1, (temp + 10) / 110));
  const cold: [number, number, number] = [125, 211, 252]; // blue
  const hot: [number, number, number] = [248, 113, 113]; // red
  const r = Math.round(cold[0] + (hot[0] - cold[0]) * frac);
  const g = Math.round(cold[1] + (hot[1] - cold[1]) * frac);
  const b = Math.round(cold[2] + (hot[2] - cold[2]) * frac);
  ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  ctx.fillStyle = tokens.bg;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + size / 2, y + size / 2 - 8);
  ctx.font = FONT_HUD;
  ctx.fillText(`${temp.toFixed(1)}°C`, x + size / 2, y + size / 2 + 12);
  ctx.textBaseline = "alphabetic";
}
