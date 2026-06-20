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

/**
 * FIG.04c — Supercooling and nucleation.
 *
 * Pure water, cooled gently below 0 °C with no nucleation sites, can stay
 * liquid — supercooled. It is metastable: drop in a single seed crystal and the
 * whole vessel flash-freezes in a moment, and the temperature jumps straight
 * back up to 0 °C as the latent heat of fusion, released by the freezing, warms
 * the slush to its melting point. Set how far below zero the water is held, then
 * drop the seed and watch the freeze sweep across.
 */

const FREEZE_MS = 1500;
const WARM_MS = 600;

export function SupercoolingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [supercoolT, setSupercoolT] = useState(-8);
  const [seeded, setSeeded] = useState(false);
  const seedStartRef = useRef(0);
  const tickRef = useSceneTick(true);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
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
      const elapsed = seeded ? nowMs - seedStartRef.current : 0;
      const crystalFrac = seeded ? Math.min(1, elapsed / FREEZE_MS) : 0;
      const temp = seeded
        ? supercoolT + (0 - supercoolT) * Math.min(1, elapsed / WARM_MS)
        : supercoolT;
      draw(
        ctx,
        tokens,
        { supercoolT, seeded, crystalFrac, temp },
        width,
        height,
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [supercoolT, seeded, tokens, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A beaker of supercooled liquid water held below zero Celsius. Dropping a nucleation seed flash-freezes the whole volume while the temperature jumps back up to zero Celsius as latent heat of fusion is released."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">held at: {supercoolT.toFixed(0)} °C</span>
        <input
          type="range"
          min={-15}
          max={-1}
          step={1}
          value={supercoolT}
          disabled={seeded}
          onChange={(e) => setSupercoolT(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-blue)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => {
            seedStartRef.current = tickRef.current;
            setSeeded(true);
          }}
          disabled={seeded}
          className="cursor-pointer rounded-sm border px-2 py-0.5 disabled:opacity-40"
          style={{ borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }}
        >
          drop nucleation seed
        </button>
        <button
          type="button"
          onClick={() => setSeeded(false)}
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
  supercoolT: number;
  seeded: boolean;
  crystalFrac: number;
  temp: number;
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
  drawSectionTitle(ctx, 16, 12, "SUPERCOOLING & NUCLEATION", tokens.textMute);

  const PAD = 16;
  // beaker geometry (left half)
  const bw = Math.min(W * 0.32, 200);
  const bh = H * 0.6;
  const bx = PAD + 20;
  const by = H * 0.28;

  // beaker walls
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by + bh);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by);
  ctx.stroke();

  const waterTop = by + bh * 0.2;
  const waterH = by + bh - waterTop;

  // liquid water (blue, slightly deeper blue when colder)
  ctx.fillStyle = hexToRgba(tokens.blue, 0.32);
  ctx.fillRect(bx + 1, waterTop, bw - 2, waterH - 1);

  // crystals — radial flash-freeze from a seed near the surface
  if (s.seeded && s.crystalFrac > 0) {
    const seedX = bx + bw * 0.5;
    const seedY = waterTop + 6;
    const maxR = Math.hypot(bw, waterH);
    const r = s.crystalFrac * maxR;
    // ice fill: clip to beaker water box, radial gradient
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx + 1, waterTop, bw - 2, waterH - 1);
    ctx.clip();
    const g = ctx.createRadialGradient(seedX, seedY, 0, seedX, seedY, r);
    g.addColorStop(0, hexToRgba(tokens.cyan, 0.7));
    g.addColorStop(0.85, hexToRgba(tokens.cyan, 0.5));
    g.addColorStop(1, hexToRgba(tokens.cyan, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(seedX, seedY, r, 0, Math.PI * 2);
    ctx.fill();

    // dendrite spikes
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.5);
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(seedX, seedY);
      ctx.lineTo(seedX + Math.cos(ang) * r * 0.95, seedY + Math.sin(ang) * r * 0.95);
      ctx.stroke();
    }
    ctx.restore();
  }

  // water surface line
  ctx.strokeStyle = hexToRgba(tokens.blue, 0.8);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx + 1, waterTop);
  ctx.lineTo(bx + bw - 1, waterTop);
  ctx.stroke();

  // state label under beaker
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.textMute;
  const stateLabel = !s.seeded
    ? "supercooled liquid"
    : s.crystalFrac >= 1
      ? "ice + water slush"
      : "freezing…";
  ctx.fillText(stateLabel, bx + bw / 2, by + bh + 16);

  // ── right: big temperature readout + explanation ────────────────────────
  const rx = bx + bw + 48;
  ctx.textAlign = "left";

  // thermometer dial-ish readout
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("temperature", rx, by + 6);

  ctx.font = "bold 30px ui-monospace, monospace";
  const tempColor = s.temp < -0.2 ? tokens.blue : tokens.cyan;
  ctx.fillStyle = tempColor;
  ctx.fillText(`${s.temp.toFixed(1)} °C`, rx, by + 40);

  // freezing-point reference
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("freezing point: 0 °C", rx, by + 62);

  // jump arrow annotation once seeded
  if (s.seeded) {
    ctx.fillStyle = tokens.amber;
    ctx.font = FONT_HUD;
    ctx.fillText("latent heat released →", rx, by + 92);
    ctx.fillStyle = tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText("freezing warms the slush back to 0 °C", rx, by + 110);
  } else {
    ctx.fillStyle = tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText("metastable: no crystal to grow on,", rx, by + 92);
    ctx.fillText("so it stays liquid below 0 °C", rx, by + 108);
  }

  ctx.textBaseline = "alphabetic";
}
