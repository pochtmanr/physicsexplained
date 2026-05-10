"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  drawSectionTitle,
  drawArrow,
  drawHudReadout,
  drawDivider,
  hexToRgba,
  FONT_HUD,
  FONT_HUD_SMALL,
  FONT_HUD_LARGE,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { christoffelSymbols, sphericalMetric } from "@/lib/physics/relativity/christoffel";

/**
 * §07 CHRISTOFFEL FORMULA SCENE
 *
 * Canvas 2D flow diagram: Γ^ρ_{μν} = (1/2) g^{ρσ} (∂_μ g_{νσ} + ∂_ν g_{μσ} − ∂_σ g_{μν})
 *
 * Three CYAN derivative-of-g boxes at top converge via AMBER arrows to a
 * contraction row, then a final GREEN Γ symbol appears at the bottom.
 *
 * Animation (6-second loop):
 *   0–2s  — three derivative boxes appear sequentially
 *   2–4s  — arrows draw and contraction node fades in
 *   4–6s  — Γ symbol appears (GREEN glow)
 *
 * Selector buttons choose the metric (flat/polar/sphere). A live numeric
 * Γ table is drawn below the diagram for the chosen metric.
 *
 * Design: scene-tokens palette throughout. No inline hex except via tokens.
 */

type MetricChoice = 0 | 1 | 2;

interface MetricSpec {
  name: string;
  label: string;
  metric: (x: readonly number[]) => readonly (readonly number[])[];
  evalPoint: readonly number[];
  coordNames: [string, string];
  description: string;
}

function flatMetric(x: readonly number[]): readonly (readonly number[])[] {
  void x;
  return [
    [1, 0],
    [0, 1],
  ];
}

function polarMetric(x: readonly number[]): readonly (readonly number[])[] {
  const r = x[0];
  return [
    [1, 0],
    [0, r * r],
  ];
}

const METRICS: MetricSpec[] = [
  {
    name: "flat",
    label: "Flat (Cartesian)",
    metric: flatMetric,
    evalPoint: [1.0, 0.5],
    coordNames: ["x", "y"],
    description: "g = diag(1, 1) — constant metric → all Γ = 0.",
  },
  {
    name: "polar",
    label: "Flat (Polar)",
    metric: polarMetric,
    evalPoint: [1.5, Math.PI / 4],
    coordNames: ["r", "φ"],
    description: "g = diag(1, r²) — Γ encodes the rotating basis.",
  },
  {
    name: "sphere",
    label: "Unit Sphere",
    metric: sphericalMetric(1),
    evalPoint: [Math.PI / 4, Math.PI / 6],
    coordNames: ["θ", "φ"],
    description: "g = diag(1, sin²θ) — intrinsic curvature.",
  },
];

/** roundRect path helper */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw a box with rounded corners in CYAN. Returns true if visible given phase. */
function drawDerivBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bw: number,
  bh: number,
  label: string,
  alpha: number,
  cyan: string,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = hexToRgba(cyan, 0.08);
  roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 6);
  ctx.fill();
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 6);
  ctx.stroke();
  ctx.fillStyle = cyan;
  ctx.font = FONT_HUD_LARGE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

export function ChristoffelFormulaScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
  });
  const [choice, setChoice] = useState<MetricChoice>(2);
  // phase: 0..1 over 6s loop, drives animation
  const [phase, setPhase] = useState(0);

  const spec = METRICS[choice];
  const Gamma = christoffelSymbols(spec.metric, spec.evalPoint);
  const n = 2;
  const [c0, c1] = spec.coordNames;

  // Animation RAF
  useEffect(() => {
    let raf = 0;
    const CYCLE = 6000; // 6s
    const start = performance.now();
    const loop = (t: number) => {
      setPhase(((t - start) % CYCLE) / CYCLE);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    const W = width;
    const H = height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    // ── Section title ───────────────────────────────────────────────────────
    drawSectionTitle(ctx, 16, 14, "Christoffel Symbol Formula", tokens.textMute);

    // ── Formula headline ────────────────────────────────────────────────────
    ctx.save();
    ctx.font = FONT_HUD_LARGE;
    ctx.fillStyle = tokens.textBright;
    ctx.textAlign = "center";
    ctx.fillText("Γ^ρ_{μν} = (1/2) g^{ρσ} (∂_μ g_{νσ} + ∂_ν g_{μσ} − ∂_σ g_{μν})", W / 2, 38);
    ctx.restore();

    drawDivider(ctx, 16, W - 16, 50, tokens.grid);

    // ── Flow diagram ────────────────────────────────────────────────────────
    // Animation phases:
    //   box1 alpha: 0–0.33  → 0..1
    //   box2 alpha: 0.11–0.44 → 0..1
    //   box3 alpha: 0.22–0.55 → 0..1
    //   arrows + sum: 0.44–0.66 → 0..1
    //   Γ output: 0.66–0.88 → 0..1
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const a1 = clamp((phase - 0) / 0.33);
    const a2 = clamp((phase - 0.11) / 0.33);
    const a3 = clamp((phase - 0.22) / 0.33);
    const aArrows = clamp((phase - 0.44) / 0.22);
    const aGamma = clamp((phase - 0.66) / 0.22);

    const boxW = 140;
    const boxH = 46;
    const boxY = 74;
    const boxCY = boxY + boxH / 2;
    const centers = [W / 2 - 200, W / 2, W / 2 + 200];
    const derLabels = ["∂_μ g_{νσ}", "∂_ν g_{μσ}", "−∂_σ g_{μν}"];
    const boxAlphas = [a1, a2, a3];

    for (let i = 0; i < 3; i++) {
      drawDerivBox(ctx, centers[i], boxCY, boxW, boxH, derLabels[i], boxAlphas[i], tokens.cyan);
    }

    // Sum node
    const sumX = W / 2;
    const sumY = boxY + boxH + 50;
    const sumR = 30;

    ctx.save();
    ctx.globalAlpha = aArrows;

    // Arrows from boxes to sum node (AMBER)
    for (let i = 0; i < 3; i++) {
      const startX = centers[i];
      const startY = boxY + boxH;
      // endpoint on the top arc of the sum circle
      const angle = Math.atan2(-(sumY - sumR - startY), sumX - startX);
      const endX = sumX - Math.cos(angle) * sumR;
      const endY = sumY - Math.sin(angle) * sumR;
      drawArrow(ctx, startX, startY, endX, endY, tokens.amber, 1.5, 7);
    }

    // Sum circle
    ctx.beginPath();
    ctx.arc(sumX, sumY, sumR, 0, 2 * Math.PI);
    ctx.fillStyle = hexToRgba(tokens.amber, 0.08);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.55);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = FONT_HUD;
    ctx.fillStyle = tokens.textBright;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("sum", sumX, sumY - 7);
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.textMute;
    ctx.fillText("× ½ g^{ρσ}", sumX, sumY + 9);
    ctx.textBaseline = "alphabetic";
    ctx.restore();

    // Arrow from sum to Γ output
    const gammaY = sumY + sumR + 40;
    ctx.save();
    ctx.globalAlpha = aArrows;
    drawArrow(ctx, sumX, sumY + sumR, sumX, gammaY - 10, tokens.amber, 2, 8);
    ctx.restore();

    // Γ symbol (GREEN with glow)
    ctx.save();
    ctx.globalAlpha = aGamma;

    // Glow halo
    const glowGrad = ctx.createRadialGradient(sumX, gammaY + 6, 4, sumX, gammaY + 6, 28);
    glowGrad.addColorStop(0, hexToRgba(tokens.green, 0.35));
    glowGrad.addColorStop(1, hexToRgba(tokens.green, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sumX, gammaY + 6, 28, 0, 2 * Math.PI);
    ctx.fill();

    // Γ box
    const gbW = 160;
    const gbH = 40;
    ctx.fillStyle = hexToRgba(tokens.green, 0.1);
    roundRect(ctx, sumX - gbW / 2, gammaY - 10, gbW, gbH, 8);
    ctx.fill();
    ctx.strokeStyle = tokens.green;
    ctx.lineWidth = 2;
    roundRect(ctx, sumX - gbW / 2, gammaY - 10, gbW, gbH, 8);
    ctx.stroke();

    ctx.font = "bold 14px ui-monospace, monospace";
    ctx.fillStyle = tokens.green;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Γ^ρ_{ ${c0}${c1} }`, sumX, gammaY + 10);
    ctx.textBaseline = "alphabetic";
    ctx.restore();

    // ── Divider before table ────────────────────────────────────────────────
    const tableStartY = gammaY + 40;
    drawDivider(ctx, 16, W - 16, tableStartY - 4, tokens.grid);

    // ── Numeric Γ table ─────────────────────────────────────────────────────
    drawSectionTitle(ctx, 16, tableStartY + 2, `Γ values at (${c0}, ${c1}) = (${spec.evalPoint[0].toFixed(2)}, ${spec.evalPoint[1].toFixed(2)})`, tokens.textMute);

    let col = 0;
    const colW2 = 155;
    const rowH2 = 20;
    let currentY = tableStartY + 22;

    for (let rho = 0; rho < n; rho++) {
      for (let mu = 0; mu < n; mu++) {
        for (let nu = 0; nu < n; nu++) {
          const val = Gamma[rho][mu][nu];
          if (Math.abs(val) < 5e-4) continue;
          const cx2 = 16 + col * colW2;
          const cy2 = currentY + Math.floor(col / 4) * rowH2;
          const coordLabel = spec.coordNames[rho];
          const muLabel = spec.coordNames[mu];
          const nuLabel = spec.coordNames[nu];
          drawHudReadout(ctx, cx2, cy2, `Γ^${coordLabel}_{${muLabel}${nuLabel}} = `, val.toFixed(4), tokens.textDim, tokens.cyan, rowH2);
          col++;
        }
      }
    }

    if (col === 0) {
      ctx.save();
      ctx.font = FONT_HUD;
      ctx.fillStyle = tokens.textDim;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("All Γ = 0", 16, currentY);
      ctx.fillStyle = tokens.textMute;
      ctx.fillText("flat Cartesian metric → no connection", 16 + ctx.measureText("All Γ = 0  ").width, currentY);
      ctx.textBaseline = "alphabetic";
      ctx.restore();
    }
  }, [choice, spec, Gamma, c0, c1, phase, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Flow diagram showing how three metric derivative terms ∂_μ g_{νσ}, ∂_ν g_{μσ}, and −∂_σ g_{μν} combine via contraction with the inverse metric to produce the Christoffel symbols Γ^ρ_{μν}. A live numeric table shows computed values for the selected metric."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="text-[var(--color-fg-3)] uppercase tracking-wider text-[11px]">metric:</span>
        {METRICS.map((m, i) => (
          <button
            key={m.name}
            onClick={() => setChoice(i as MetricChoice)}
            className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
              choice === i
                ? "bg-[var(--color-fg-4)] text-[var(--color-fg-0)]"
                : "bg-[var(--color-bg-1)] text-[var(--color-fg-3)] hover:bg-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)] text-center max-w-[600px]">
        {spec.description} The Christoffel symbols are computed purely from derivatives of g — no external structure required. The Levi-Civita connection is the unique torsion-free, metric-compatible choice.
      </p>
    </div>
  );
}
