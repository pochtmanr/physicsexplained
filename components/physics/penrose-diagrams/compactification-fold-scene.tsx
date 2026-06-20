"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  blendCompactify,
  conformalInfinities,
  type DiagramPoint,
} from "@/lib/physics/relativity/penrose-diagrams";

/**
 * FIG.46a — Watch infinity fold in.
 *
 * The infinite grid of Minkowski space (constant-t and constant-r lines plus a
 * fan of 45° light rays) is dragged into a finite diamond by the conformal map
 * ũ = arctan(t − r), ṽ = arctan(t + r). A "squeeze" slider blends from the raw
 * flat-space picture (s = 0) to the fully compactified Penrose diamond (s = 1),
 * with an auto-play button. Light rays stay exactly 45° at every value of s —
 * the whole point of a conformal rescaling.
 */

const PAD = 18;

// Sampled grid of physical events: constant-t worldsheets and constant-r tubes.
const T_LINES = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
const R_LINES = [0, 1.5, 3, 5, 8, 13];
const RAY_CONSTS = [-6, -3, 0, 3, 6]; // u₀ or v₀ for the light-ray fan

function projectToScreen(
  p: DiagramPoint,
  cx: number,
  cy: number,
  unit: number,
): [number, number] {
  // X to the right, T upward (canvas y grows downward).
  return [cx + p.X * unit, cy - p.T * unit];
}

export function CompactificationFoldScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [squeeze, setSqueeze] = useState(0.35);
  const [playing, setPlaying] = useState(false);
  const squeezeRef = useRef(squeeze);
  squeezeRef.current = squeeze;

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT + 40,
    minHeight: 340,
  });

  // Auto-play: ease squeeze 0 → 1 → 0.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let dir = 1;
    const loop = () => {
      let next = squeezeRef.current + dir * 0.006;
      if (next >= 1) {
        next = 1;
        dir = -1;
      } else if (next <= 0) {
        next = 0;
        dir = 1;
      }
      setSqueeze(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, squeeze, width, height);
  }, [tokens, squeeze, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Animation of conformal compactification: the infinite grid of Minkowski space is folded into a finite Penrose diamond while light rays remain at 45 degrees. A squeeze slider blends from flat space to the compactified diagram."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          squeeze s = {squeeze.toFixed(2)} {squeeze < 0.02 ? "(flat)" : squeeze > 0.98 ? "(compactified)" : ""}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={squeeze}
          onChange={(e) => {
            setPlaying(false);
            setSqueeze(parseFloat(e.target.value));
          }}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="shrink-0 rounded-sm border px-3 py-1"
          style={{
            borderColor: playing ? "var(--color-cyan)" : "var(--color-fg-4)",
            color: playing ? "var(--color-cyan)" : "var(--color-fg-3)",
          }}
        >
          {playing ? "pause" : "play"}
        </button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(
    ctx,
    PAD,
    PAD - 4,
    s < 0.5 ? "MINKOWSKI SPACE  (FOLDING IN)" : "PENROSE DIAMOND",
    tokens.textMute,
  );

  // Diagram fits inside the diamond bound |T| + X ≤ π. Choose a unit so the
  // full diamond fills the canvas with margins.
  const availW = W - PAD * 2;
  const availH = H - PAD * 2 - 28;
  const unit = Math.min(availW / (Math.PI * 1.05), availH / (Math.PI * 2.05));
  const cx = PAD + 10; // X starts at left edge (r = 0 axis)
  const cy = PAD + 28 + availH / 2;

  // ── constant-r tubes (vertical-ish) ──────────────────────────────────────
  ctx.lineWidth = 1;
  for (let i = 0; i < R_LINES.length; i++) {
    const r = R_LINES[i];
    ctx.strokeStyle = i === 0 ? tokens.axes : tokens.grid;
    ctx.beginPath();
    let started = false;
    for (let t = -16; t <= 16; t += 0.5) {
      const p = blendCompactify(t, r, s);
      const [sx, sy] = projectToScreen(p, cx, cy, unit);
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }

  // ── constant-t slices (horizontal-ish) ───────────────────────────────────
  for (const tVal of T_LINES) {
    ctx.strokeStyle = tVal === 0 ? tokens.axes : tokens.grid;
    ctx.beginPath();
    let started = false;
    for (let r = 0; r <= 16; r += 0.4) {
      const p = blendCompactify(tVal, r, s);
      const [sx, sy] = projectToScreen(p, cx, cy, unit);
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }

  // ── light-ray fan: outgoing (u const) AMBER, ingoing (v const) BLUE ───────
  for (const c of RAY_CONSTS) {
    // outgoing u = t − r = c  ⇒  t = c + r
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.85);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let started = false;
    for (let r = 0; r <= 16; r += 0.3) {
      const p = blendCompactify(c + r, r, s);
      const [sx, sy] = projectToScreen(p, cx, cy, unit);
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // ingoing v = t + r = c  ⇒  t = c − r
    ctx.strokeStyle = hexToRgba(tokens.blue, 0.7);
    ctx.beginPath();
    started = false;
    for (let r = 0; r <= 16; r += 0.3) {
      const p = blendCompactify(c - r, r, s);
      const [sx, sy] = projectToScreen(p, cx, cy, unit);
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // ── boundary diamond + infinity labels appear as s → 1 ───────────────────
  const inf = conformalInfinities();
  const boundaryAlpha = Math.max(0, (s - 0.55) / 0.45);
  if (boundaryAlpha > 0) {
    const ip = projectToScreen(inf.iPlus, cx, cy, unit);
    const im = projectToScreen(inf.iMinus, cx, cy, unit);
    const i0 = projectToScreen(inf.iZero, cx, cy, unit);
    ctx.strokeStyle = hexToRgba(tokens.magenta, boundaryAlpha);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ip[0], ip[1]);
    ctx.lineTo(i0[0], i0[1]);
    ctx.lineTo(im[0], im[1]);
    ctx.stroke();

    ctx.fillStyle = hexToRgba(tokens.textBright, boundaryAlpha);
    ctx.font = FONT_HUD_SMALL;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("i⁺", ip[0] + 6, ip[1]);
    ctx.fillText("i⁻", im[0] + 6, im[1]);
    ctx.textAlign = "right";
    ctx.fillText("i⁰", i0[0] - 6, i0[1]);
    ctx.fillStyle = hexToRgba(tokens.amber, boundaryAlpha);
    ctx.fillText("ℐ⁺", (ip[0] + i0[0]) / 2 + 14, (ip[1] + i0[1]) / 2 - 8);
    ctx.fillStyle = hexToRgba(tokens.blue, boundaryAlpha);
    ctx.fillText("ℐ⁻", (im[0] + i0[0]) / 2 + 14, (im[1] + i0[1]) / 2 + 8);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}
