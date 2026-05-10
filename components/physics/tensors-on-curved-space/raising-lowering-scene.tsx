"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  FONT_HUD_LARGE,
  SCENE_CANVAS_CLASS,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  drawDivider,
  drawArrow,
  hexToRgba,
  SCENE_WIDTH_DEFAULT,
  SCENE_HEIGHT_DEFAULT,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared";

/**
 * FIG.30c — Raising and Lowering Indices.
 *
 * Two columns of 3-vectors side by side, metric matrix g_{μν} in the centre.
 *   Left  column: V^μ contravariant (CYAN)
 *   Right column: V_μ = g_{μν} V^ν  covariant (MAGENTA)
 *
 * A slider toggles between:
 *   • flat metric   η = diag(1, −1, −1)   → components differ by sign
 *   • spherical g   = diag(1, r², r²sin²θ) r=2, θ=π/4  → spatially stretched
 *
 * The metric matrix is drawn in the centre: diagonal in TEXT_BRIGHT,
 * off-diagonal in TEXT_MUTE.  The row being multiplied pulses in AMBER.
 *
 * The transition between metrics is animated smoothly over ~250 ms.
 */

const W = SCENE_WIDTH_DEFAULT;
const H = SCENE_HEIGHT_DEFAULT;

type MetricMode = "flat" | "curved";

// Fixed contravariant vector
const V_CONTRA = [1.0, 0.8, 0.6]; // V^r, V^θ, V^φ
const COMP_LABELS_UP   = ["V^r",  "V^θ",  "V^φ"];
const COMP_LABELS_DOWN = ["V_r",  "V_θ",  "V_φ"];
const IDX_LABELS       = ["r",    "θ",    "φ"];

const METRIC_FLAT: number[][] = [
  [1,  0,  0],
  [0, -1,  0],
  [0,  0, -1],
];

function metricCurved(): number[][] {
  const r = 2;
  const th = Math.PI / 4;
  return [
    [1, 0, 0],
    [0, r * r, 0],
    [0, 0, r * r * Math.sin(th) ** 2],
  ];
}

function lerpMetric(a: number[][], b: number[][], t: number): number[][] {
  return a.map((row, i) => row.map((v, j) => v + (b[i][j] - v) * t));
}

function lowerVec(g: number[][], V: number[]): number[] {
  return V.map((_, mu) => V.reduce((acc, _, nu) => acc + g[mu][nu] * V[nu], 0));
}

// Layout constants
const LEFT_CX   = W * 0.13;   // centre x of contravariant column
const MATRIX_CX = W * 0.50;   // centre x of 3×3 metric matrix
const RIGHT_CX  = W * 0.87;   // centre x of covariant column

const TABLE_TOP  = 72;
const ROW_H      = 54;         // vertical spacing per component row

// Cell dimensions for the vector component rows
const CELL_W = 110;
const CELL_H = 38;

// Metric matrix cell size
const MC_W = 52;
const MC_H = 30;

// Animation
const ANIM_DURATION = 250; // ms

function drawVectorColumn(
  ctx: CanvasRenderingContext2D,
  values: number[],
  labels: string[],
  cx: number,
  color: string,
  title: string,
  highlightRow: number,   // -1 = none
  highlightT: number,     // 0..1 intensity
  tokens: SceneTokens,
) {
  // Title
  ctx.save();
  ctx.font = `bold 11px ui-monospace, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(title, cx, TABLE_TOP - 26);
  ctx.restore();

  for (let i = 0; i < values.length; i++) {
    const cy = TABLE_TOP + i * ROW_H;
    const x  = cx - CELL_W / 2;
    const isHl = i === highlightRow;
    const hlA = isHl ? highlightT * 0.22 : 0;

    // Cell background
    ctx.save();
    ctx.fillStyle = isHl
      ? hexToRgba(tokens.amber, hlA + 0.06)
      : hexToRgba(color, 0.06);
    ctx.fillRect(x, cy, CELL_W, CELL_H);
    ctx.strokeStyle = isHl
      ? hexToRgba(tokens.amber, 0.40 * highlightT + 0.20)
      : hexToRgba(color, 0.30);
    ctx.lineWidth = isHl ? 1.5 : 1;
    ctx.strokeRect(x, cy, CELL_W, CELL_H);
    ctx.restore();

    // Index label (left inside cell)
    ctx.save();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = isHl ? tokens.amber : hexToRgba(color, 0.65);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(labels[i], x + 8, cy + CELL_H / 2);
    ctx.restore();

    // Value (right inside cell)
    ctx.save();
    ctx.font = FONT_HUD_LARGE;
    ctx.fillStyle = isHl ? tokens.amber : color;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const sgn = values[i] >= 0 ? " " : "";
    ctx.fillText(sgn + values[i].toFixed(4), x + CELL_W - 8, cy + CELL_H / 2);
    ctx.restore();
  }
}

function drawMetricMatrix(
  ctx: CanvasRenderingContext2D,
  g: number[][],
  highlightRow: number,
  highlightT: number,
  tokens: SceneTokens,
) {
  const n = 3;
  const matW = n * MC_W;
  const matH = n * MC_H;
  const startX = MATRIX_CX - matW / 2;
  const startY = TABLE_TOP;

  // Matrix title
  ctx.save();
  ctx.font = `bold 11px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("g_{μν}", MATRIX_CX, TABLE_TOP - 26);
  ctx.restore();

  // Matrix bracket lines
  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textDim, 0.40);
  ctx.lineWidth = 1.5;
  // left bracket
  ctx.beginPath();
  ctx.moveTo(startX - 6, startY - 2);
  ctx.lineTo(startX - 12, startY - 2);
  ctx.lineTo(startX - 12, startY + matH + 2);
  ctx.lineTo(startX - 6, startY + matH + 2);
  ctx.stroke();
  // right bracket
  ctx.beginPath();
  ctx.moveTo(startX + matW + 6, startY - 2);
  ctx.lineTo(startX + matW + 12, startY - 2);
  ctx.lineTo(startX + matW + 12, startY + matH + 2);
  ctx.lineTo(startX + matW + 6, startY + matH + 2);
  ctx.stroke();
  ctx.restore();

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x  = startX + c * MC_W;
      const y  = startY + r * MC_H;
      const isDiag = r === c;
      const isHlRow = r === highlightRow;

      // Cell highlight
      if (isHlRow) {
        ctx.save();
        ctx.fillStyle = hexToRgba(tokens.amber, 0.12 * highlightT);
        ctx.fillRect(x, y, MC_W, MC_H);
        ctx.restore();
      }

      // Cell border (subtle)
      ctx.save();
      ctx.strokeStyle = hexToRgba(tokens.textMute, 0.12);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, MC_W, MC_H);
      ctx.restore();

      // Value text
      const val = g[r][c];
      ctx.save();
      ctx.font = FONT_HUD_SMALL;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (isHlRow && isDiag) {
        ctx.fillStyle = hexToRgba(tokens.amber, 0.6 + 0.4 * highlightT);
      } else {
        ctx.fillStyle = isDiag ? tokens.textBright : tokens.textMute;
      }
      // Format: if exact integer-ish, show fixed(2), else toFixed(3)
      const formatted = Math.abs(val) < 0.001 ? "0" : val.toFixed(Math.abs(val) >= 10 ? 2 : 3);
      ctx.fillText(formatted, x + MC_W / 2, y + MC_H / 2);
      ctx.restore();
    }
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  g: number[][],
  highlightRow: number,
  highlightT: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const V_cov = lowerVec(g, V_CONTRA);

  // ── Section title ─────────────────────────────────────────────────────────
  drawSectionTitle(ctx, 12, 12, "RAISING & LOWERING INDICES", tokens.textMute);

  // ── Metric label ──────────────────────────────────────────────────────────
  // (shown in HUD below)

  // ── Vector columns ────────────────────────────────────────────────────────
  drawVectorColumn(ctx, V_CONTRA, COMP_LABELS_UP,   LEFT_CX,  tokens.cyan,    "V^μ  (contravariant)", highlightRow, highlightT, tokens);
  drawVectorColumn(ctx, V_cov,    COMP_LABELS_DOWN,  RIGHT_CX, tokens.magenta, "V_μ  (covariant)",     highlightRow, highlightT, tokens);

  // ── Metric matrix in centre ───────────────────────────────────────────────
  drawMetricMatrix(ctx, g, highlightRow, highlightT, tokens);

  // ── Multiplication arrows (contravariant → covariant) ─────────────────────
  for (let i = 0; i < 3; i++) {
    const y = TABLE_TOP + i * ROW_H + CELL_H / 2;
    const isHl = i === highlightRow;
    const col = isHl ? hexToRgba(tokens.amber, 0.50 + 0.50 * highlightT) : hexToRgba(tokens.textDim, 0.18);
    // left col right edge → matrix left edge
    drawArrow(ctx, LEFT_CX + CELL_W / 2 + 2, y, MATRIX_CX - 3 * MC_W / 2 - 16, y, col, 1, 6);
    // matrix right edge → right col left edge
    drawArrow(ctx, MATRIX_CX + 3 * MC_W / 2 + 14, y, RIGHT_CX - CELL_W / 2 - 2, y, col, 1, 6);
  }

  // ── HUD strip at bottom ───────────────────────────────────────────────────
  const hudY = TABLE_TOP + 3 * ROW_H + 14;
  drawDivider(ctx, 12, W - 12, hudY, tokens.grid);

  // Show active multiplication for highlighted row
  if (highlightRow >= 0) {
    const mu = highlightRow;
    const gval = g[mu][mu]; // diagonal metric component
    const vContra = V_CONTRA[mu];
    const vCov = V_cov[mu];
    const eq = `V_${IDX_LABELS[mu]} = g_{${IDX_LABELS[mu]}${IDX_LABELS[mu]}} × V^${IDX_LABELS[mu]} = ${gval.toFixed(3)} × ${vContra.toFixed(3)} = ${vCov.toFixed(4)}`;
    let ry = hudY + 10;
    ry = drawHudReadout(ctx, 12, ry, "active row: ", `μ = ${IDX_LABELS[mu]}`, tokens.textDim, tokens.amber);
    drawHudReadout(ctx, 12, ry, "", eq, tokens.textDim, tokens.textDim);
  }
}

export function RaisingLoweringScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [mode, setMode] = useState<MetricMode>("flat");

  // Animated metric transition
  const animRef = useRef<{ from: number[][]; to: number[][]; startT: number } | null>(null);
  const currentGRef = useRef<number[][]>(METRIC_FLAT);
  const rafRef = useRef(0);

  // Highlight animation: cycle through rows at ~1.5s each
  const highlightCycleMs = 3 * 1200;

  useEffect(() => {
    const targetG = mode === "flat" ? METRIC_FLAT : metricCurved();
    animRef.current = {
      from: currentGRef.current.map(r => [...r]),
      to: targetG,
      startT: performance.now(),
    };

    let cancelled = false;
    cancelAnimationFrame(rafRef.current);

    const loop = (t: number) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = applyDpr(canvas, W, H);
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

      // Metric interpolation
      let g: number[][];
      if (animRef.current) {
        const elapsed = t - animRef.current.startT;
        const tNorm = Math.min(elapsed / ANIM_DURATION, 1);
        // ease out cubic
        const ease = 1 - Math.pow(1 - tNorm, 3);
        g = lerpMetric(animRef.current.from, animRef.current.to, ease);
        currentGRef.current = g;
        if (tNorm >= 1) {
          g = animRef.current.to;
          currentGRef.current = g;
          animRef.current = null;
        }
      } else {
        g = currentGRef.current;
      }

      // Highlight cycling
      const cyclePos = (t % highlightCycleMs) / highlightCycleMs;
      const highlightIdx = Math.floor(cyclePos * 3);
      // Pulse within the 1.2s window: 0..1..0
      const withinRow = (cyclePos * 3) % 1;
      const pulse = Math.sin(withinRow * Math.PI);

      draw(ctx, g, highlightIdx, pulse, tokens);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [mode, tokens]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        aria-label="Raising and lowering indices: contravariant vector V^μ (cyan) on the left, covariant V_μ (magenta) on the right, connected through the metric tensor g_{μν} in the centre. A toggle switches between flat Minkowski metric and spherical curved metric."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="shrink-0">Metric:</span>
        <button
          onClick={() => setMode("flat")}
          className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
            mode === "flat"
              ? "bg-[var(--color-cyan)]/20 text-[var(--color-cyan)] ring-1 ring-[var(--color-cyan)]/50"
              : "text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          flat (η)
        </button>
        <button
          onClick={() => setMode("curved")}
          className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
            mode === "curved"
              ? "bg-[var(--color-amber)]/20 text-[var(--color-amber)] ring-1 ring-[var(--color-amber)]/50"
              : "text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          curved (spherical)
        </button>
        <span className="text-[var(--color-fg-4)]">
          {mode === "flat"
            ? "η = diag(1, −1, −1)"
            : "g = diag(1, r², r²sin²θ)  r=2, θ=45°"}
        </span>
      </div>
    </div>
  );
}
