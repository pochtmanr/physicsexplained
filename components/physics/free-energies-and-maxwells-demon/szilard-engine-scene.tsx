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
import { szilardWork } from "@/lib/physics/thermodynamics/free-energy";

/**
 * FIG.20b — the Szilard engine, one full cycle on a loop. (1) MEASURE: the demon
 * sees which half the lone molecule is in and drops a partition. (2) EXTRACT: the
 * partition becomes a piston the molecule pushes outward; the isothermal
 * expansion from half-box to full-box yields W = k_BT ln 2 of work. (3) ERASE:
 * resetting the demon's one-bit memory dissipates k_BT ln 2 — Landauer's price.
 * The ledger keeps score: work out, erase cost, net zero. The demon breaks even
 * and the second law walks away intact.
 */

type Phase = "measure" | "extract" | "erase" | "settle";
const DURATION: Record<Phase, number> = {
  measure: 1.8,
  extract: 2.6,
  erase: 1.8,
  settle: 1.2,
};
const ORDER: Phase[] = ["measure", "extract", "erase", "settle"];

const W300 = szilardWork(300); // ≈ 2.87e-21 J, for the magnitude label

interface SimState {
  phaseIdx: number;
  clock: number;
  molX: number; // fraction 0..1 within box
  molY: number; // fraction 0..1
  vx: number;
  vy: number;
  side: "L" | "R";
  memorySet: boolean;
}

function freshState(): SimState {
  return {
    phaseIdx: 0,
    clock: 0,
    molX: 0.5,
    molY: 0.5,
    vx: 0.9,
    vy: 0.5,
    side: "L",
    memorySet: false,
  };
}

export function SzilardEngineScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [running, setRunning] = useState(true);
  const runningRef = useRef(running);
  runningRef.current = running;
  const simRef = useRef<SimState>(freshState());

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (last === 0) last = t;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (runningRef.current) advance(simRef.current, dt);
      draw(ctx, tokens, simRef.current, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A single molecule in a box. The demon measures its side and drops a partition; the molecule pushes the partition out, doing k_BT ln 2 of work; erasing the memory costs the same; the ledger shows the net work is zero."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }}
        >
          {running ? "pause" : "play"}
        </button>
        <button
          type="button"
          onClick={() => {
            simRef.current = freshState();
          }}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }}
        >
          restart cycle
        </button>
        <span className="text-[var(--color-fg-3)]">W = k_BT ln 2 ≈ {(W300 * 1e21).toFixed(2)}×10⁻²¹ J at 300 K</span>
      </div>
    </div>
  );
}

function advance(s: SimState, dt: number) {
  const phase = ORDER[s.phaseIdx];
  s.clock += dt;

  // molecule motion, confined to the currently accessible region
  const { lo, hi } = accessibleRange(s);
  s.molX += s.vx * dt;
  s.molY += s.vy * dt;
  if (s.molX < lo + 0.02) {
    s.molX = lo + 0.02;
    s.vx = Math.abs(s.vx);
  }
  if (s.molX > hi - 0.02) {
    s.molX = hi - 0.02;
    s.vx = -Math.abs(s.vx);
  }
  if (s.molY < 0.05) {
    s.molY = 0.05;
    s.vy = Math.abs(s.vy);
  }
  if (s.molY > 0.95) {
    s.molY = 0.95;
    s.vy = -Math.abs(s.vy);
  }

  // phase transitions
  if (s.clock >= DURATION[phase]) {
    s.clock = 0;
    if (phase === "measure") {
      // record which side the molecule ended up on
      s.side = s.molX < 0.5 ? "L" : "R";
      s.memorySet = true;
    }
    if (phase === "settle") {
      // begin a new cycle: pick a fresh random side by re-bouncing
      s.memorySet = false;
      s.vx = (Math.random() > 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.5);
      s.vy = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.4);
    }
    if (phase === "erase") {
      s.memorySet = false;
    }
    s.phaseIdx = (s.phaseIdx + 1) % ORDER.length;
  }
}

/** The fraction-range [lo, hi] the molecule may occupy in the current phase. */
function accessibleRange(s: SimState): { lo: number; hi: number } {
  const phase = ORDER[s.phaseIdx];
  if (phase === "measure") return { lo: 0, hi: 1 };
  if (phase === "extract") {
    const f = s.clock / DURATION.extract; // piston travels outward
    // molecule trapped on its side; the wall facing the empty half recedes
    return s.side === "L" ? { lo: 0, hi: 0.5 + 0.5 * f } : { lo: 0.5 - 0.5 * f, hi: 1 };
  }
  // erase / settle: box is full again
  return { lo: 0, hi: 1 };
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: SimState,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const phase = ORDER[s.phaseIdx];
  const boxW = W * 0.56;
  const padL = 16;
  const padT = 34;
  const padB = 22;
  const bx0 = padL;
  const bx1 = padL + boxW;
  const by0 = padT;
  const by1 = H - padB;

  drawSectionTitle(ctx, bx0, 10, `SZILARD ENGINE · ${phase.toUpperCase()}`, tokens.textMute);

  // box
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx0, by0, boxW, by1 - by0);

  const xOf = (f: number) => bx0 + f * boxW;

  // accessible region shading
  const { lo, hi } = accessibleRange(s);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.07);
  ctx.fillRect(xOf(lo), by0, (hi - lo) * boxW, by1 - by0);

  // partition / piston (present from end of measure through extract)
  let pistonF: number | null = null;
  if (phase === "extract") {
    pistonF = s.side === "L" ? hi : lo; // the moving wall
  } else if (phase === "measure" && s.clock > DURATION.measure * 0.8) {
    pistonF = 0.5; // dropping the partition
  }
  if (pistonF !== null) {
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xOf(pistonF), by0 + 2);
    ctx.lineTo(xOf(pistonF), by1 - 2);
    ctx.stroke();
  }

  // molecule
  const mx = xOf(s.molX);
  const my = by0 + s.molY * (by1 - by0);
  ctx.fillStyle = tokens.magenta;
  ctx.beginPath();
  ctx.arc(mx, my, 5, 0, Math.PI * 2);
  ctx.fill();

  // work arrow during extraction
  if (phase === "extract") {
    const dir = s.side === "L" ? 1 : -1;
    const ay = by0 - 0; // along top inside
    ctx.fillStyle = hexToRgba(tokens.green, 0.9);
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("→ work out →", (bx0 + bx1) / 2 + dir * 0, by1 - 6);
  }

  // ── ledger panel ──
  const px0 = bx1 + 22;
  const pw = W - px0 - 14;
  drawLedger(ctx, tokens, s, px0, by0, pw, by1 - by0);

  // memory bit
  drawMemory(ctx, tokens, s, bx0, by1 + 4);
}

function drawLedger(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: SimState,
  x0: number,
  y0: number,
  w: number,
  h: number,
) {
  const phase = ORDER[s.phaseIdx];
  // cumulative fractions of k_BT ln 2
  const workOut =
    phase === "measure" ? 0 : phase === "extract" ? s.clock / DURATION.extract : 1;
  const eraseCost = phase === "erase" ? s.clock / DURATION.erase : phase === "settle" ? 1 : 0;
  const net = workOut - eraseCost;

  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("LEDGER  (units of k_BT ln 2)", x0, y0);

  const barX = x0;
  const barW = w;
  const barH = 16;
  const rows: { label: string; value: number; color: string }[] = [
    { label: "work extracted", value: workOut, color: tokens.green },
    { label: "erasure cost", value: -eraseCost, color: tokens.red },
  ];
  let yy = y0 + 26;
  for (const r of rows) {
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(r.label, barX, yy);
    yy += 16;
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, yy, barW, barH);
    ctx.fillStyle = hexToRgba(r.color, 0.8);
    ctx.fillRect(barX, yy, Math.abs(r.value) * barW, barH);
    ctx.fillStyle = r.color;
    ctx.textAlign = "right";
    ctx.fillText(`${r.value >= 0 ? "+" : "−"}${Math.abs(r.value).toFixed(2)}`, barX + barW, yy + 2);
    ctx.textAlign = "left";
    yy += barH + 14;
  }

  // net
  ctx.strokeStyle = tokens.panelBorder;
  ctx.beginPath();
  ctx.moveTo(barX, yy);
  ctx.lineTo(barX + barW, yy);
  ctx.stroke();
  yy += 8;
  ctx.font = FONT_HUD;
  ctx.fillStyle = Math.abs(net) < 0.02 ? tokens.green : tokens.textBright;
  ctx.fillText(`net work = ${net >= 0 ? "+" : "−"}${Math.abs(net).toFixed(2)}`, barX, yy);
  if (phase === "settle") {
    ctx.fillStyle = tokens.green;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText("second law intact", barX, yy + 18);
  }
}

function drawMemory(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: SimState,
  x0: number,
  y: number,
) {
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("demon memory:", x0, y);
  const bx = x0 + 92;
  ctx.strokeStyle = s.memorySet ? tokens.cyan : tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, y - 2, 22, 16);
  ctx.fillStyle = s.memorySet ? tokens.cyan : tokens.textFaint;
  ctx.textAlign = "center";
  ctx.fillText(s.memorySet ? s.side : "—", bx + 11, y);
}
