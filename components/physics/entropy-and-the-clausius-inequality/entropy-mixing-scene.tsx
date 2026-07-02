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
import { entropyOfMixing } from "@/lib/physics/thermodynamics/entropy";

/**
 * FIG.10a — The entropy of mixing.
 *
 * Two gases — red on the left, blue on the right — sit either side of a
 * partition. Pull it out and they interdiffuse until each fills the whole box.
 * No heat is added and no work is done, yet entropy rises: the gases simply gain
 * access to more configurations. The live curve tracks ΔS climbing to the
 * mixing value (n_A + n_B)·R·ln 2 for equal amounts, then flattening — the
 * saturating signature of an irreversible, spontaneous process.
 */

const PER_SIDE = 44;
const FINAL_DS_OVER_R = entropyOfMixing({ nA: 1, nB: 1 }) / 8.314462618; // = 2 ln 2

interface Particle {
  x: number; // 0..1 across full box
  y: number; // 0..1
  vx: number;
  vy: number;
  red: boolean;
}

export function EntropyMixingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [open, setOpen] = useState(false);

  const particlesRef = useRef<Particle[]>([]);
  const openRef = useRef(open);
  const historyRef = useRef<{ t: number; m: number }[]>([]);
  const elapsedRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  if (particlesRef.current.length === 0) {
    particlesRef.current = makeParticles();
  }

  const reset = () => {
    particlesRef.current = makeParticles();
    historyRef.current = [];
    elapsedRef.current = 0;
    setOpen(false);
  };

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.56,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    const loop = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      step(particlesRef.current, openRef.current, dt);
      const m = mixedness(particlesRef.current);
      if (openRef.current) {
        elapsedRef.current += dt;
        const hist = historyRef.current;
        if (hist.length === 0 || elapsedRef.current - hist[hist.length - 1].t > 0.05) {
          hist.push({ t: elapsedRef.current, m });
          if (hist.length > 400) hist.shift();
        }
      }
      const ctx = applyDpr(canvas, width, height);
      if (ctx) {
        draw(ctx, tokens, particlesRef.current, openRef.current, m, historyRef.current, width, height);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lastRef.current = null;
    };
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two gases separated by a partition. When the partition is removed they interdiffuse and the entropy of mixing rises to its saturation value, even though no heat is added."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={open}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={
            open
              ? { borderColor: "var(--color-fg-4)", color: "var(--color-fg-4)" }
              : { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
          }
        >
          remove partition
        </button>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }}
        >
          reset
        </button>
        <span className="text-[var(--color-fg-3)]">
          ΔS climbs to (n_A + n_B)·R·ln 2 = {FINAL_DS_OVER_R.toFixed(2)} R, with no heat added
        </span>
      </div>
    </div>
  );
}

function makeParticles(): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < PER_SIDE; i++) {
    ps.push(spawn(true));
    ps.push(spawn(false));
  }
  return ps;
}

function spawn(red: boolean): Particle {
  const speed = 0.18 + Math.random() * 0.12;
  const ang = Math.random() * Math.PI * 2;
  const x = red ? Math.random() * 0.47 : 0.53 + Math.random() * 0.47;
  return {
    x,
    y: 0.04 + Math.random() * 0.92,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    red,
  };
}

function step(ps: Particle[], open: boolean, dt: number) {
  for (const p of ps) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < 0.01) {
      p.x = 0.01;
      p.vx = Math.abs(p.vx);
    }
    if (p.x > 0.99) {
      p.x = 0.99;
      p.vx = -Math.abs(p.vx);
    }
    if (p.y < 0.01) {
      p.y = 0.01;
      p.vy = Math.abs(p.vy);
    }
    if (p.y > 0.99) {
      p.y = 0.99;
      p.vy = -Math.abs(p.vy);
    }
    // partition at x=0.5 while closed
    if (!open) {
      if (p.x > 0.48 && p.x < 0.5 && p.vx > 0) {
        p.x = 0.48;
        p.vx = -p.vx;
      }
      if (p.x >= 0.5 && p.x < 0.52 && p.vx < 0) {
        p.x = 0.52;
        p.vx = -p.vx;
      }
    }
  }
}

/** 0 when fully separated, 1 when reds are evenly split across the two halves. */
function mixedness(ps: Particle[]): number {
  let redLeft = 0;
  let redTotal = 0;
  for (const p of ps) {
    if (p.red) {
      redTotal++;
      if (p.x < 0.5) redLeft++;
    }
  }
  const frac = redTotal > 0 ? redLeft / redTotal : 0.5;
  return Math.max(0, 1 - 2 * Math.abs(frac - 0.5));
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  ps: Particle[],
  open: boolean,
  m: number,
  history: { t: number; m: number }[],
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 16, 4, "ENTROPY OF MIXING", tokens.textMute);

  const PAD = 16;
  const boxX = PAD;
  const boxY = PAD + 18;
  const boxW = W * 0.62 - PAD;
  const boxH = H - boxY - PAD;

  // box frame
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // partition
  if (!open) {
    ctx.strokeStyle = tokens.textDim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(boxX + boxW / 2, boxY);
    ctx.lineTo(boxX + boxW / 2, boxY + boxH);
    ctx.stroke();
  }

  // particles
  for (const p of ps) {
    ctx.fillStyle = p.red ? tokens.red : tokens.blue;
    ctx.beginPath();
    ctx.arc(boxX + p.x * boxW, boxY + p.y * boxH, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ΔS curve panel
  const gx0 = W * 0.66;
  const gx1 = W - PAD;
  const gy0 = boxY + 6;
  const gy1 = boxY + boxH;
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("ΔS / R", gx0 - 2, gy0 - 8);

  // saturation line at final value
  const yFinal = gy1 - (gy1 - gy0) * 0.9; // draw final at 90% height
  ctx.strokeStyle = hexToRgba(tokens.mint, 0.5);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(gx0, yFinal);
  ctx.lineTo(gx1, yFinal);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.mint;
  ctx.fillText(`${FINAL_DS_OVER_R.toFixed(2)}`, gx1 - 26, yFinal - 4);

  // history curve (m maps to fraction of final)
  if (history.length > 1) {
    const tMax = Math.max(4, history[history.length - 1].t);
    ctx.strokeStyle = tokens.mint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = gx0 + (h.t / tMax) * (gx1 - gx0);
      const y = gy1 - h.m * 0.9 * (gy1 - gy0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // current value readout
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.fillText(`ΔS = ${(m * FINAL_DS_OVER_R).toFixed(2)} R`, gx0, gy1 + 0);

  // status
  ctx.fillStyle = open ? tokens.mint : tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(open ? "partition removed — mixing" : "partitioned — separate", boxX + 4, boxY + boxH - 6);
}
