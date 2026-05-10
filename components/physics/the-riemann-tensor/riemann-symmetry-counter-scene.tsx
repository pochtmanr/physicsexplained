"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  FONT_HUD,
  FONT_HUD_SMALL,
  FONT_HUD_LARGE,
  drawSectionTitle,
  drawDivider,
  hexToRgba,
  SCENE_HEIGHT_TALL,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared";

/**
 * RIEMANN SYMMETRY COUNTER SCENE — §08 THE RIEMANN TENSOR
 *
 * Bar chart of the counting argument. Bars animate in sequentially (one per
 * second). Each bar is CYAN with label below in TEXT_DIM. Final count (20) in
 * GREEN with glow. Below: table of n²(n²−1)/12 for n = 1..4 in monospace.
 *
 * Sequence: 256 → 96 → 36 → 21 → 20.
 */

interface Step {
  label: string;
  count: number;
  explanation: string;
}

const STEPS: Step[] = [
  {
    label: "Raw components",
    count: 256,
    explanation: "Four free indices 0–3: 4⁴ = 256",
  },
  {
    label: "Antisymmetry (μ,ν)",
    count: 96,
    explanation: "R^ρ_{σμν} = −R^ρ_{σνμ}  →  4²×C(4,2) = 96",
  },
  {
    label: "Antisymmetry (ρ,σ)",
    count: 36,
    explanation: "R_{ρσμν} = −R_{σρμν}  →  6×6 = 36",
  },
  {
    label: "Pair-swap symmetry",
    count: 21,
    explanation: "R_{ρσμν} = R_{μνρσ}  →  C(6,2)+6 = 21",
  },
  {
    label: "First Bianchi identity",
    count: 20,
    explanation: "R^ρ_{[σμν]} = 0  →  21−1 = 20",
  },
];

const DIM_DATA = [
  { n: 1, count: 0, meaning: "Always flat" },
  { n: 2, count: 1, meaning: "Gaussian curvature K" },
  { n: 3, count: 6, meaning: "Ricci tensor only (Weyl = 0)" },
  { n: 4, count: 20, meaning: "20 scalars — spacetime curvature" },
];

const BAR_MAX = 256;
// Chart layout (constants relative to fixed left/top; bar track widths derive
// from canvas width at draw time so the layout stays responsive).
const CHART_LEFT = 32;
const CHART_TOP = 68;
const BAR_HEIGHT = 28;
const BAR_GAP = 14;
const LABEL_COL_W = 168;
const TABLE_ROW = 22;

function draw(
  ctx: CanvasRenderingContext2D,
  visibleCount: number,
  barProgress: number,
  tokens: SceneTokens,
  W: number,
  H: number,
) {
  const CHART_RIGHT = W - 32;
  const BAR_LEFT = CHART_LEFT + LABEL_COL_W + 8;
  const BAR_RIGHT = CHART_RIGHT - 60;
  const BAR_TRACK = BAR_RIGHT - BAR_LEFT;
  const COL_N = CHART_LEFT + 10;
  const COL_RAW = COL_N + 70;
  const COL_IND = COL_RAW + 90;
  const COL_MEANING = COL_IND + 90;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Section title ──
  drawSectionTitle(ctx, CHART_LEFT, 18, "INDEPENDENT RIEMANN COMPONENTS — 4D", tokens.textMute);
  drawDivider(ctx, CHART_LEFT, CHART_RIGHT, 36, tokens.grid);

  // Axis scale hint
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("0", BAR_LEFT, CHART_TOP - 14);
  ctx.textAlign = "right";
  ctx.fillText("256", BAR_RIGHT, CHART_TOP - 14);
  ctx.restore();

  // ── Bar chart ──
  for (let i = 0; i < visibleCount; i++) {
    const step = STEPS[i];
    const isLast = i === visibleCount - 1;
    const isFinal = step.count === 20;

    // Animation: last bar grows in
    const fraction = isLast ? barProgress : 1;
    const barW = Math.max(0, (step.count / BAR_MAX) * BAR_TRACK * fraction);

    const barY = CHART_TOP + i * (BAR_HEIGHT + BAR_GAP);

    // Label (left column)
    ctx.save();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = isLast ? tokens.textDim : tokens.textMute;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText(step.label, CHART_LEFT + LABEL_COL_W, barY + BAR_HEIGHT / 2);
    ctx.restore();

    // Track background
    ctx.save();
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.06);
    ctx.fillRect(BAR_LEFT, barY, BAR_TRACK, BAR_HEIGHT);
    ctx.restore();

    // Bar fill
    const barColor = isFinal ? tokens.green : tokens.cyan;
    ctx.save();
    if (isFinal && barProgress >= 1) {
      ctx.shadowColor = tokens.green;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = hexToRgba(barColor, isLast ? 0.85 : 0.35);
    ctx.fillRect(BAR_LEFT, barY, barW, BAR_HEIGHT);
    ctx.restore();

    // Bar border
    ctx.save();
    ctx.strokeStyle = hexToRgba(barColor, isLast ? 0.9 : 0.3);
    ctx.lineWidth = 1;
    ctx.strokeRect(BAR_LEFT, barY, BAR_TRACK, BAR_HEIGHT);
    ctx.restore();

    // Count inside bar
    const countX = BAR_LEFT + barW + 6;
    ctx.save();
    if (isFinal && barProgress >= 1) {
      ctx.shadowColor = tokens.green;
      ctx.shadowBlur = 12;
    }
    ctx.font = isLast ? FONT_HUD_LARGE : FONT_HUD;
    ctx.fillStyle = isLast ? (isFinal ? tokens.green : tokens.cyan) : tokens.textMute;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`${step.count}`, countX, barY + BAR_HEIGHT / 2);
    ctx.restore();

    // Explanation (rightmost — only active step)
    if (isLast) {
      const expX = BAR_LEFT + barW + 48;
      if (expX + 80 < CHART_RIGHT) {
        ctx.save();
        ctx.font = FONT_HUD_SMALL;
        ctx.fillStyle = tokens.textDim;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        // Wrap explanation to two lines if needed
        const words = step.explanation.split("  ");
        ctx.fillText(words[0] ?? step.explanation, expX, barY + BAR_HEIGHT / 2 - 6);
        if (words[1]) ctx.fillText(words[1], expX, barY + BAR_HEIGHT / 2 + 8);
        ctx.restore();
      }
    }
  }

  // Explanation footer for active step
  const activeStep = STEPS[visibleCount - 1];
  const footerY = CHART_TOP + STEPS.length * (BAR_HEIGHT + BAR_GAP) - 8;
  drawDivider(ctx, CHART_LEFT, CHART_RIGHT, footerY, tokens.grid);

  ctx.save();
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textDim;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(activeStep.explanation, CHART_LEFT, footerY + 8);
  ctx.restore();

  // ── Dimension table ──
  const tY = footerY + 30;
  drawSectionTitle(ctx, CHART_LEFT, tY, "n²(n²−1)/12  across dimensions", tokens.textMute);
  drawDivider(ctx, CHART_LEFT, CHART_RIGHT, tY + 18, tokens.grid);

  // Table header
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("n", COL_N, tY + 24);
  ctx.fillText("4ⁿ raw", COL_RAW, tY + 24);
  ctx.fillText("independent", COL_IND, tY + 24);
  ctx.fillText("physical meaning", COL_MEANING, tY + 24);
  ctx.restore();

  drawDivider(ctx, CHART_LEFT, CHART_RIGHT, tY + 38, tokens.grid);

  DIM_DATA.forEach((row, i) => {
    const ry = tY + 44 + i * TABLE_ROW;
    const isFour = row.n === 4;

    ctx.save();
    ctx.font = isFour ? FONT_HUD : FONT_HUD_SMALL;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ctx.fillStyle = isFour ? tokens.green : tokens.textDim;
    ctx.fillText(`${row.n}`, COL_N, ry);
    ctx.fillText(`${row.n ** 4}`, COL_RAW, ry);

    if (isFour) {
      ctx.save();
      ctx.shadowColor = tokens.green;
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = isFour ? tokens.green : tokens.cyan;
    ctx.font = isFour ? FONT_HUD_LARGE : FONT_HUD_SMALL;
    ctx.fillText(`${row.count}`, COL_IND + 20, ry);
    if (isFour) ctx.restore();

    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = isFour ? tokens.textDim : tokens.textMute;
    ctx.fillText(row.meaning, COL_MEANING, ry);
    ctx.restore();

    if (i < DIM_DATA.length - 1) {
      drawDivider(ctx, CHART_LEFT, CHART_RIGHT, ry + TABLE_ROW - 3, hexToRgba(tokens.panelBorder, 0.5));
    }
  });
}

export function RiemannSymmetryCounterScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
  });
  // visibleCount: how many bars are shown (1..5)
  const [visibleCount, setVisibleCount] = useState(1);
  // barProgress: 0..1 for the entering bar's growth animation
  const [barProgress, setBarProgress] = useState(1);
  const animRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const targetCountRef = useRef(1);

  // Sequential auto-reveal: add one bar per second
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((v) => {
        const next = Math.min(v + 1, STEPS.length);
        if (next === v) return v;
        targetCountRef.current = next;
        setBarProgress(0);
        // Animate bar growth
        startRef.current = null;
        const animate = (t: number) => {
          if (startRef.current === null) startRef.current = t;
          const elapsed = t - startRef.current;
          const p = Math.min(1, elapsed / 700);
          setBarProgress(p);
          if (p < 1) animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return next;
      });
    }, 1200);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, visibleCount, barProgress, tokens, width, height);
  }, [visibleCount, barProgress, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="Animated bar chart showing the reduction of Riemann tensor components from 256 raw entries to 20 independent ones in 4D spacetime, with a cross-dimension table."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="text-[var(--color-fg-3)]">step</span>
        {STEPS.map((step, i) => (
          <button
            key={i}
            onClick={() => {
              cancelAnimationFrame(animRef.current);
              setVisibleCount(i + 1);
              setBarProgress(1);
            }}
            className={`h-2 flex-1 rounded transition-colors ${
              i < visibleCount
                ? i === visibleCount - 1
                  ? "bg-[var(--color-cyan)]"
                  : "bg-[var(--color-fg-3)]"
                : "bg-[var(--color-fg-4)]"
            }`}
            aria-label={`Show step ${i + 1}: ${step.label}`}
          />
        ))}
        <span className="w-6 text-right text-[var(--color-fg-2)]">{STEPS[visibleCount - 1]?.count}</span>
      </div>
    </div>
  );
}
