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

/**
 * FIG.47c — Two very different stars, one identical black hole.
 *
 * Two progenitors collapse in parallel: LEFT a blue, smooth, fast-rotating
 * massive star made of (say) hydrogen and helium; RIGHT a red, lumpy,
 * magnetised star of carbon and iron with a wild magnetic field — tuned so
 * the two share the SAME mass and the SAME total angular momentum. On PLAY
 * both collapse, radiate their distinguishing "hair" (composition, magnetic
 * field, lumps), and converge to the IDENTICAL Kerr horizon in the centre.
 * The point of the no-hair theorem made visual: the bald remnant retains no
 * memory of which star made it.
 *
 * Tokens only; responsive; ref-based ticker; a replay button.
 */

const PAD = 16;
const DUR = 4.2; // seconds for a full collapse-and-merge cycle

interface Progenitor {
  name: string;
  composition: string;
  field: string;
  colorKey: "blue" | "red";
  lumpy: boolean;
  seed: number;
}

const LEFT: Progenitor = {
  name: "Star A",
  composition: "H / He, smooth",
  field: "weak B field",
  colorKey: "blue",
  lumpy: false,
  seed: 1.7,
};
const RIGHT: Progenitor = {
  name: "Star B",
  composition: "C / O / Fe, lumpy",
  field: "10¹² G magnetar",
  colorKey: "red",
  lumpy: true,
  seed: 4.1,
};

export function SameHoleComparisonScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);
  const startRef = useRef(0);
  const [playing, setPlaying] = useState(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    startRef.current = tickRef.current;
  }, [playing, tickRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const elapsed = playing ? (tickRef.current - startRef.current) / 1000 : 0;
      draw(ctx, tokens, width, height, elapsed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height, playing, tickRef]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two very different progenitor stars — one smooth blue hydrogen star, one lumpy magnetised iron star — share the same mass and angular momentum. Both collapse and converge to an identical Kerr black hole, demonstrating that the remnant keeps no memory of the star that made it."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-sm border border-[var(--color-fg-4)] px-3 py-1 hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
        >
          {playing ? "❚❚ pause" : "▶ replay"}
        </button>
        <span className="text-[var(--color-fg-3)]">
          same M, same J — identical bald remnant
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  elapsed: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const t = elapsed % (DUR + 0.8);
  const p = Math.min(1, t / DUR); // 0..1 collapse-and-merge progress

  const panelY0 = PAD + 22;
  const panelH = H - PAD * 2 - 22;
  const cyMid = panelY0 + panelH * 0.45;

  // Anchor positions: the two stars start apart and slide toward center.
  const startSep = Math.min(W * 0.3, 220);
  const cx = W / 2;
  const leftX = cx - startSep * (1 - p);
  const rightX = cx + startSep * (1 - p);

  drawSectionTitle(ctx, PAD, panelY0 - 18, "STAR A", tokens.textMute);
  ctx.textAlign = "right";
  drawSectionTitle(ctx, W - PAD - 40, panelY0 - 18, "STAR B", tokens.textMute);
  ctx.textAlign = "left";

  const baseR = Math.min(W * 0.5, panelH) * 0.2;

  // During the first 70% they are distinct stars shedding hair; in the final
  // 30% the two merge into a single identical Kerr horizon.
  const mergeP = Math.max(0, (p - 0.7) / 0.3);

  if (mergeP < 1) {
    drawProgenitor(ctx, tokens, LEFT, leftX, cyMid, baseR, p, elapsed);
    drawProgenitor(ctx, tokens, RIGHT, rightX, cyMid, baseR, p, elapsed);
  }

  // The converged, identical bald hole.
  if (p > 0.55) {
    const a = Math.min(1, (p - 0.55) / 0.25);
    drawBaldHole(ctx, tokens, cx, cyMid, baseR * (0.95 + 0.1 * mergeP), a, elapsed);
  }

  // Caption strip.
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  const phase =
    p < 0.55
      ? "two different stars — different composition, field, shape"
      : p < 0.99
        ? "collapse: the distinguishing hair radiates away…"
        : "one Kerr black hole — only M and J remain";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(phase, cx, panelY0 + panelH - 14);
  ctx.textAlign = "left";

  // Identity tags (composition / field) fade as the hair is lost.
  const tagAlpha = Math.max(0, 1 - p / 0.7);
  if (tagAlpha > 0.02) {
    ctx.font = FONT_HUD_SMALL;
    ctx.textBaseline = "top";
    ctx.fillStyle = hexToRgba(tokens.blue, tagAlpha);
    ctx.textAlign = "center";
    ctx.fillText(LEFT.composition, leftX, cyMid + baseR + 12);
    ctx.fillText(LEFT.field, leftX, cyMid + baseR + 26);
    ctx.fillStyle = hexToRgba(tokens.red, tagAlpha);
    ctx.fillText(RIGHT.composition, rightX, cyMid + baseR + 12);
    ctx.fillText(RIGHT.field, rightX, cyMid + baseR + 26);
    ctx.textAlign = "left";
  }
}

function drawProgenitor(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  star: Progenitor,
  x: number,
  y: number,
  baseR: number,
  p: number,
  t: number,
) {
  const color = star.colorKey === "blue" ? tokens.blue : tokens.red;
  // Star shrinks as it collapses.
  const R = baseR * (1 - 0.35 * Math.min(1, p / 0.7));
  const fade = Math.max(0, 1 - p / 0.78);

  // Magnetic-field loops for the magnetar (right) — distinctive hair.
  if (star.field.includes("magnetar") && fade > 0.05) {
    for (let i = 0; i < 4; i++) {
      const rr = R * (1.2 + i * 0.28);
      ctx.beginPath();
      ctx.ellipse(x, y, rr * 0.5, rr, t * 0.4 + i, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(tokens.red, 0.18 * fade);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Wobbly (lumpy) or smooth body.
  const N = 96;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const ang = (i / N) * Math.PI * 2;
    const lump = star.lumpy
      ? fade *
        R *
        0.18 *
        (Math.cos(3 * ang + star.seed) + 0.6 * Math.cos(5 * ang - star.seed))
      : 0;
    const r = R + lump;
    const px = x + r * Math.cos(ang);
    const py = y + r * Math.sin(ang);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
  grad.addColorStop(0, hexToRgba(color, 0.95 * fade + 0.1));
  grad.addColorStop(0.7, hexToRgba(color, 0.6 * fade + 0.05));
  grad.addColorStop(1, hexToRgba(tokens.bg1, 0.9));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.7 * fade + 0.15);
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Hair radiating away as faint outgoing ripples once collapse begins.
  if (p > 0.2 && p < 0.85) {
    const q = (p - 0.2) / 0.65;
    for (let k = 0; k < 3; k++) {
      const rr = R + 10 + k * 22 + q * 60;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(color, Math.max(0, 0.3 * (1 - q) * (1 - k / 3)));
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawBaldHole(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  R: number,
  alpha: number,
  t: number,
) {
  // Frame-dragging swirl (both stars carried the SAME J).
  const arms = 5;
  for (let i = 0; i < arms; i++) {
    const a0 = t * 1.1 + (i / arms) * Math.PI * 2;
    ctx.beginPath();
    for (let s = 0; s <= 20; s++) {
      const f = s / 20;
      const rr = R * (1.05 + f * 0.45);
      const ang = a0 + f * 2.0;
      const px = x + rr * Math.cos(ang);
      const py = y + rr * Math.sin(ang);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.28 * alpha);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Photon ring.
  ctx.beginPath();
  ctx.arc(x, y, R * 1.18, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5 * alpha);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Black horizon disk.
  const grad = ctx.createRadialGradient(x, y, R * 0.1, x, y, R);
  grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
  grad.addColorStop(0.85, `rgba(0,0,0,${alpha})`);
  grad.addColorStop(1, hexToRgba(tokens.bg1, alpha));
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.8 * alpha);
  ctx.lineWidth = 2;
  ctx.stroke();
}
