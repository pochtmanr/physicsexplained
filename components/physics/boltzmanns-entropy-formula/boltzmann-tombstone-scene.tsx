"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.12a — Boltzmann's tombstone.
 *
 * The Vienna Zentralfriedhof headstone carries one line: S = k log W. Hover any
 * symbol to read what it means. Press "Derive" and the scene steps through the
 * logic that forces the formula — count the microstates, take a log because
 * entropy adds while multiplicity multiplies, bridge to joules-per-kelvin with
 * k_B — highlighting each symbol as its step comes up.
 */

type SymbolKey = "S" | "k" | "log" | "W";

const MEANINGS: Record<SymbolKey, { title: string; body: string }> = {
  S: {
    title: "S — entropy",
    body: "The macroscopic entropy, in joules per kelvin. The same S that Clausius defined as ∫dQ/T — now read as a property of counting.",
  },
  k: {
    title: "k — Boltzmann's constant",
    body: "1.380649 × 10⁻²³ J/K. The exchange rate between a dimensionless count and thermodynamic entropy; k_B T is the natural scale of thermal energy.",
  },
  log: {
    title: "log — natural logarithm",
    body: "Entropy is additive but multiplicity is multiplicative. Only a logarithm turns Ω₁·Ω₂ into ln Ω₁ + ln Ω₂, so S adds when systems combine.",
  },
  W: {
    title: "W — multiplicity Ω",
    body: "The number of microstates in the macrostate (Boltzmann wrote W for Wahrscheinlichkeit, 'probability'). The headstone's W is this topic's Ω.",
  },
};

const DERIVE_STEPS: { focus: SymbolKey; text: string }[] = [
  { focus: "W", text: "1 — Count the microstates of the macrostate: W = Ω." },
  { focus: "log", text: "2 — Entropy must add; Ω multiplies. Take the logarithm." },
  { focus: "k", text: "3 — Convert the bare count to J/K with Boltzmann's k." },
  { focus: "S", text: "4 — The result is the entropy: S = k ln W." },
];
const STEP_SECONDS = 1.8;

interface Box {
  key: SymbolKey;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function BoltzmannTombstoneScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [deriving, setDeriving] = useState(false);
  const [hovered, setHovered] = useState<SymbolKey | null>(null);

  const derivingRef = useRef(deriving);
  derivingRef.current = deriving;
  const hoveredRef = useRef<SymbolKey | null>(hovered);
  hoveredRef.current = hovered;
  const boxesRef = useRef<Box[]>([]);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 320,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      const stepIndex = derivingRef.current
        ? Math.floor((t / STEP_SECONDS) % DERIVE_STEPS.length)
        : -1;
      const focus =
        stepIndex >= 0 ? DERIVE_STEPS[stepIndex].focus : hoveredRef.current;

      drawTombstone(ctx, tokens, width, height, focus, boxesRef);

      // Caption strip below the stone.
      const caption =
        stepIndex >= 0
          ? DERIVE_STEPS[stepIndex].text
          : hoveredRef.current
            ? MEANINGS[hoveredRef.current].title
            : "Hover a symbol, or press Derive.";
      ctx.fillStyle = tokens.textMute;
      ctx.font = tokens.fontHudLarge;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(caption, width / 2, height - 14);
      ctx.textAlign = "left";
    },
  });

  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (derivingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let hit: SymbolKey | null = null;
    for (const b of boxesRef.current) {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        hit = b.key;
        break;
      }
    }
    if (hit !== hoveredRef.current) setHovered(hit);
  }

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", cursor: "pointer" }}
        className={SCENE_CANVAS_CLASS}
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
        aria-label="Boltzmann's tombstone engraved with S = k log W; hover a symbol for its meaning."
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-[var(--color-fg-3)]">
          {hovered ? MEANINGS[hovered].body : "Vienna Zentralfriedhof, 1906."}
        </p>
        <button
          type="button"
          onClick={() => setDeriving((d) => !d)}
          className={`shrink-0 rounded-sm border px-3 py-1 font-mono text-xs transition-colors ${
            deriving
              ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          }`}
        >
          {deriving ? "■ Stop" : "▶ Derive"}
        </button>
      </div>
    </div>
  );
}

function drawTombstone(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  focus: SymbolKey | null,
  boxesRef: React.RefObject<Box[]>,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Stone: a rounded-top slab, centred.
  const stoneW = Math.min(W * 0.6, 420);
  const stoneH = H - 70;
  const sx = (W - stoneW) / 2;
  const sy = 16;
  const radius = stoneW / 2;

  ctx.beginPath();
  ctx.moveTo(sx, sy + stoneH);
  ctx.lineTo(sx, sy + radius);
  ctx.arc(sx + radius, sy + radius, radius, Math.PI, 0);
  ctx.lineTo(sx + stoneW, sy + stoneH);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(tokens.textFaint, 0.12);
  ctx.fill();
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── "LUDWIG BOLTZMANN" + dates, engraved small.
  ctx.fillStyle = tokens.textMute;
  ctx.font = tokens.fontHud;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("LUDWIG BOLTZMANN", W / 2, sy + 54);
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("1844 — 1906", W / 2, sy + 72);

  // ── The engraved equation, large. Lay out tokens left→right and record
  //    bounding boxes for hover hit-testing.
  const cy = sy + stoneH * 0.55;
  const big = Math.max(26, Math.min(46, stoneW / 7));
  ctx.font = `${big}px ui-monospace, monospace`;
  ctx.textBaseline = "middle";

  const tokensSeq: { key: SymbolKey | null; text: string }[] = [
    { key: "S", text: "S" },
    { key: null, text: " = " },
    { key: "k", text: "k" },
    { key: null, text: " " },
    { key: "log", text: "log" },
    { key: null, text: " " },
    { key: "W", text: "W" },
  ];
  const widths = tokensSeq.map((tk) => ctx.measureText(tk.text).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = W / 2 - total / 2;
  const boxes: Box[] = [];
  ctx.textAlign = "left";
  for (let i = 0; i < tokensSeq.length; i++) {
    const tk = tokensSeq[i];
    const w = widths[i];
    const isFocus = tk.key !== null && tk.key === focus;
    if (isFocus) {
      ctx.fillStyle = hexToRgba(tokens.amber, 0.18);
      ctx.fillRect(x - 4, cy - big * 0.62, w + 8, big * 1.24);
    }
    ctx.fillStyle = isFocus ? tokens.amber : tokens.textBright;
    ctx.fillText(tk.text, x, cy);
    if (tk.key) {
      boxes.push({ key: tk.key, x: x - 4, y: cy - big * 0.62, w: w + 8, h: big * 1.24 });
    }
    x += w;
  }
  boxesRef.current = boxes;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
