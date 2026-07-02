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
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { mulberry32, maxwellVelocity2D, type Rng } from "@/lib/physics/thermodynamics/random";

/**
 * FIG.15a — pressure is the drumbeat of collisions.
 *
 * A box of point molecules flies in straight lines and bounces elastically off
 * the walls. Each bounce delivers an impulse 2m·|v⊥|; summing those impulses
 * over time and dividing by the wall length gives a *measured* pressure. Beside
 * it sits the kinetic-theory prediction P = N m⟨v²⟩ / 2A (the 2D form of
 * PV = ⅓Nm⟨v²⟩). Raise N or the temperature and watch the two track each other.
 * Mass is set to 1 in scene units; "temperature" is the velocity scale, since
 * ⟨½mv²⟩ ∝ T.
 */

interface Mol {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const MASS = 1; // scene units

function makeGas(rng: Rng, n: number, temp: number, w: number, h: number): Mol[] {
  const sigma = Math.sqrt(temp); // speed scale ∝ √T
  const out: Mol[] = [];
  for (let i = 0; i < n; i++) {
    const v = maxwellVelocity2D(rng, sigma);
    out.push({
      x: 0.05 * w + rng() * 0.9 * w,
      y: 0.05 * h + rng() * 0.9 * h,
      vx: v.x,
      vy: v.y,
    });
  }
  return out;
}

export function MolecularPressureScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [n, setN] = useState(120);
  const [temp, setTemp] = useState(1.0);
  const tickRef = useSceneTick(true);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // simulation state in refs (no re-render per frame)
  const molsRef = useRef<Mol[]>([]);
  const lastRef = useRef(0);
  const impulseRef = useRef(0);
  const elapsedRef = useRef(0);
  const pMeasRef = useRef(0);
  const nRef = useRef(n);
  const tempRef = useRef(temp);
  const boxRef = useRef({ w: 0, h: 0 });

  // box geometry (logical sim coords share canvas px, minus padding)
  const PAD_L = 16;
  const PAD_T = 28;
  const PAD_R = 200; // room for the HUD column on the right
  const PAD_B = 16;

  // (re)seed the gas whenever N, T, or size changes
  useEffect(() => {
    const bw = Math.max(40, width - PAD_L - PAD_R);
    const bh = Math.max(40, height - PAD_T - PAD_B);
    boxRef.current = { w: bw, h: bh };
    const rng = mulberry32(20260620 + n);
    molsRef.current = makeGas(rng, n, temp, bw, bh);
    impulseRef.current = 0;
    elapsedRef.current = 0;
    nRef.current = n;
    tempRef.current = temp;
  }, [n, temp, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const now = tickRef.current / 1000;
      let dt = lastRef.current === 0 ? 0 : now - lastRef.current;
      lastRef.current = now;
      dt = Math.min(0.04, dt);
      // run a few sub-steps for stability at high speed
      const steps = 2;
      const sub = dt / steps;
      const { w: bw, h: bh } = boxRef.current;
      const mols = molsRef.current;
      const speedScale = 60; // px/s per scene-velocity unit
      for (let s = 0; s < steps; s++) {
        for (const m of mols) {
          m.x += m.vx * sub * speedScale;
          m.y += m.vy * sub * speedScale;
          if (m.x < 0) {
            m.x = -m.x;
            m.vx = -m.vx;
            impulseRef.current += 2 * MASS * Math.abs(m.vx);
          } else if (m.x > bw) {
            m.x = 2 * bw - m.x;
            m.vx = -m.vx;
            impulseRef.current += 2 * MASS * Math.abs(m.vx);
          }
          if (m.y < 0) {
            m.y = -m.y;
            m.vy = -m.vy;
            impulseRef.current += 2 * MASS * Math.abs(m.vy);
          } else if (m.y > bh) {
            m.y = 2 * bh - m.y;
            m.vy = -m.vy;
            impulseRef.current += 2 * MASS * Math.abs(m.vy);
          }
        }
        elapsedRef.current += sub;
      }
      // measured pressure = (impulse / time) / perimeter, smoothed; reset window
      if (elapsedRef.current > 0.5) {
        const perimeter = 2 * (bw + bh);
        const inst = impulseRef.current / elapsedRef.current / perimeter;
        pMeasRef.current = pMeasRef.current === 0 ? inst : pMeasRef.current * 0.6 + inst * 0.4;
        impulseRef.current = 0;
        elapsedRef.current = 0;
      }
      draw(ctx, tokens, molsRef.current, boxRef.current, pMeasRef.current, width, height, {
        PAD_L,
        PAD_T,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A box of point molecules bouncing off the walls. A live readout compares the pressure measured from accumulated wall impulses against the kinetic-theory prediction N m mean-square-speed over twice the area; the two agree."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="flex items-center gap-2">
          <span className="w-16 shrink-0">N: {n}</span>
          <input
            type="range"
            min={20}
            max={400}
            step={10}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value))}
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </span>
        <span className="flex items-center gap-2">
          <span className="w-20 shrink-0">T: {temp.toFixed(1)}×</span>
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={temp}
            onChange={(e) => setTemp(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-amber)" }}
          />
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  mols: Mol[],
  box: { w: number; h: number },
  pMeas: number,
  W: number,
  H: number,
  pad: { PAD_L: number; PAD_T: number },
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, pad.PAD_L, 8, "MOLECULAR PRESSURE", tokens.textMute);

  const ox = pad.PAD_L;
  const oy = pad.PAD_T;

  // box frame
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ox, oy, box.w, box.h);

  // molecules
  ctx.fillStyle = tokens.cyan;
  for (const m of mols) {
    ctx.beginPath();
    ctx.arc(ox + m.x, oy + m.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // kinetic prediction P = N m ⟨v²⟩ / (2A), in the same scene units as pMeas
  let sumSq = 0;
  for (const m of mols) sumSq += m.vx * m.vx + m.vy * m.vy;
  const meanSq = mols.length ? sumSq / mols.length : 0;
  const area = box.w * box.h;
  // measured impulse uses px/s scaling = speedScale; fold it in so units match
  const speedScale = 60;
  const pPred = (mols.length * MASS * meanSq * speedScale) / (2 * area);

  // HUD column on the right
  const hx = ox + box.w + 18;
  let hy = oy + 4;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const line = (label: string, value: string, color: string) => {
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(label, hx, hy);
    ctx.fillStyle = color;
    ctx.fillText(value, hx, hy + 13);
    hy += 34;
  };
  line("molecules N", `${mols.length}`, tokens.textBright);
  line("⟨v²⟩ (scene)", meanSq.toFixed(2), tokens.amber);
  line("P measured (walls)", pMeas.toFixed(3), tokens.cyan);
  line("P = Nm⟨v²⟩/2A", pPred.toFixed(3), tokens.mint);

  // agreement bar
  const ratio = pPred > 0 ? pMeas / pPred : 0;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("measured / predicted", hx, hy);
  ctx.fillStyle = Math.abs(ratio - 1) < 0.15 ? tokens.mint : tokens.amber;
  ctx.fillText(ratio ? `${ratio.toFixed(2)}×` : "—", hx, hy + 13);
  hy += 34;

  ctx.fillStyle = hexToRgba(tokens.textFaint, 0.9);
  wrapText(ctx, "Both rise together with N and T — pressure is collisions.", hx, hy, 170, 13);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
