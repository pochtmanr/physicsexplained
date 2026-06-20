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
  workFromCranking,
  temperatureRise,
  rumfordSlope,
} from "@/lib/physics/thermodynamics/mechanical-equivalent";

/**
 * FIG.02a — Rumford's cannon-boring experiment (1798).
 *
 * A blunt drill turns inside a brass cylinder immersed in water. The crank does
 * work against friction; that work appears as heat in the water. Crucially the
 * water temperature climbs *linearly with the total work done* and never levels
 * off — there is no asymptote. A finite store of "caloric" fluid would have run
 * dry; an inexhaustible supply of heat from mechanical work cannot. Set the
 * crank speed, start cranking, and watch ΔT track work with no ceiling.
 */

const FRICTION_TORQUE = 1.2; // N·m, the blunt tool's drag
const WATER_MASS = 0.4; // kg in the brass jacket
const C_WATER = 4186; // J/(kg·K)

export function RumfordCannonScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [speed, setSpeed] = useState(2); // rev/s
  const [running, setRunning] = useState(false);

  const tickRef = useSceneTick(true);
  const turnsRef = useRef(0); // accumulated revolutions
  const angleRef = useRef(0); // current drill angle
  const lastRef = useRef(0); // last frame time (s)

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
      const dt = lastRef.current === 0 ? 0 : Math.min(0.05, now - lastRef.current);
      lastRef.current = now;
      if (running) {
        turnsRef.current += speed * dt;
        angleRef.current += speed * dt * Math.PI * 2;
      }
      const work = workFromCranking(FRICTION_TORQUE, turnsRef.current);
      const deltaT = temperatureRise(work, WATER_MASS, C_WATER);
      draw(ctx, tokens, {
        angle: angleRef.current,
        work,
        deltaT,
        running,
      }, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speed, running, tokens, tickRef, width, height]);

  const reset = () => {
    turnsRef.current = 0;
    angleRef.current = 0;
    setRunning(false);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A blunt drill turning inside a water-jacketed brass cylinder. Cranking does work against friction; the water temperature rises linearly with total work done and never reaches an asymptote, refuting the caloric theory."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">crank: {speed.toFixed(1)} rev/s</span>
        <input
          type="range"
          min={0}
          max={5}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-amber)", color: "var(--color-amber)" }}
        >
          {running ? "stop cranking" : "crank"}
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
  angle: number;
  work: number;
  deltaT: number;
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
  const leftW = Math.min(W * 0.46, 320);

  // ── LEFT: water-jacketed brass cylinder + rotating drill ────────────────
  drawSectionTitle(ctx, PAD, 14, "BORING THE CANNON", tokens.textMute);

  const cx = PAD + leftW * 0.5;
  const cy = H * 0.5;
  const tankW = leftW * 0.74;
  const tankH = H * 0.46;
  const tankX = cx - tankW / 2;
  const tankY = cy - tankH / 2;

  // Water bath — warms in hue with ΔT.
  const warmFrac = Math.max(0, Math.min(1, s.deltaT / 12));
  const waterCol = warmFrac < 0.5
    ? mix(tokens.blue, tokens.amber, warmFrac / 0.5)
    : mix(tokens.amber, tokens.red, (warmFrac - 0.5) / 0.5);
  ctx.fillStyle = hexToRgba(waterCol, 0.32);
  ctx.fillRect(tankX, tankY, tankW, tankH);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tankX, tankY, tankW, tankH);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText("water bath", tankX + 4, tankY + tankH - 6);

  // Brass cylinder (the cannon bore) — horizontal capsule in the bath.
  const boreW = tankW * 0.66;
  const boreH = tankH * 0.34;
  const boreX = cx - boreW / 2;
  const boreY = cy - boreH / 2;
  ctx.fillStyle = hexToRgba(tokens.amber, 0.5);
  roundRect(ctx, boreX, boreY, boreW, boreH, boreH / 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
  ctx.lineWidth = 1.5;
  roundRect(ctx, boreX, boreY, boreW, boreH, boreH / 2);
  ctx.stroke();

  // Rotating drill bit inside the bore (cross of blades).
  const drillCx = cx;
  const drillR = boreH * 0.36;
  ctx.save();
  ctx.translate(drillCx, cy);
  ctx.rotate(s.angle);
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(drillR, 0);
    ctx.stroke();
  }
  ctx.restore();
  // hub
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.arc(drillCx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Crank handle to the left of the bore.
  const crankR = boreH * 0.5;
  const crankCx = boreX - 14;
  ctx.save();
  ctx.translate(crankCx, cy);
  ctx.rotate(s.angle);
  ctx.strokeStyle = tokens.textDim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -crankR);
  ctx.stroke();
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(0, -crankR, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // friction sparks hint when running fast
  if (s.running) {
    ctx.fillStyle = hexToRgba(tokens.red, 0.8);
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText("friction → heat", cx, tankY - 6);
  }

  // ── RIGHT: ΔT vs work (a straight line, no asymptote) ───────────────────
  const gx0 = PAD + leftW + 24;
  const gy0 = 34;
  const gx1 = W - PAD;
  const gy1 = H - PAD - 8;
  drawSectionTitle(ctx, gx0, 14, "ΔT  vs  WORK IN", tokens.textMute);

  const slope = rumfordSlope(WATER_MASS, C_WATER); // K per J
  // pick a work scale that always shows the current point with headroom
  const workMax = Math.max(4000, s.work * 1.25);
  const tMax = workMax * slope;

  const xOf = (work: number) => gx0 + (work / workMax) * (gx1 - gx0);
  const yOf = (t: number) => gy1 - (t / tMax) * (gy1 - gy0);

  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // the straight line ΔT = slope · W
  ctx.strokeStyle = tokens.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(0));
  ctx.lineTo(xOf(workMax), yOf(tMax));
  ctx.stroke();

  // current point
  ctx.fillStyle = tokens.red;
  ctx.beginPath();
  ctx.arc(xOf(s.work), yOf(s.deltaT), 4, 0, Math.PI * 2);
  ctx.fill();

  // "no asymptote" annotation near the top of the line
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.fillText("no ceiling — heat is not a fluid", gx1 - 2, gy0 + 10);

  // readouts
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let ry = gy0 + 22;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("work in", gx0 + 4, ry);
  ctx.fillStyle = tokens.amber;
  ctx.fillText(`${s.work.toFixed(0)} J`, gx0 + 78, ry);
  ry += 20;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("ΔT water", gx0 + 4, ry);
  ctx.fillStyle = tokens.red;
  ctx.fillText(`+${s.deltaT.toFixed(2)} K`, gx0 + 78, ry);

  ctx.textBaseline = "alphabetic";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
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
