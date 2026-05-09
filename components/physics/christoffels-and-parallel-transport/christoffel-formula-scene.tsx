"use client";

import { useEffect, useRef, useState } from "react";
import { christoffelSymbols, sphericalMetric } from "@/lib/physics/relativity/christoffel";

/**
 * §07 CHRISTOFFEL FORMULA SCENE
 *
 * Canvas 2D schematic showing how the three metric-derivative terms combine
 * to produce the Christoffel symbols Γ^ρ_{μν}.
 *
 * A slider selects among three metrics:
 *   0 — flat Euclidean (all Γ = 0)
 *   1 — polar Euclidean  (Γ^r_{φφ} = -r,  Γ^φ_{rφ} = 1/r)
 *   2 — unit sphere  (Γ^θ_{φφ} = -sin θ cos θ,  Γ^φ_{θφ} = cot θ)
 *
 * The computed Γ values are displayed as a numeric table to reinforce that
 * the formula gives computable numbers, not abstract symbols.
 */

const W = 660;
const H = 380;

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

export function ChristoffelFormulaScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [choice, setChoice] = useState<MetricChoice>(2);

  const spec = METRICS[choice];

  // Compute Γ numerically
  const Gamma = christoffelSymbols(spec.metric, spec.evalPoint);
  const n = 2;
  const [c0, c1] = spec.coordNames;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, W, H);

    // ── Title ──────────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = "bold 13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Γ^ρ_{μν} = (1/2) g^{ρσ} (∂_μ g_{νσ} + ∂_ν g_{μσ} − ∂_σ g_{μν})", W / 2, 26);

    // ── Diagram: three derivative boxes combining ──────────────────────────
    const boxW = 130;
    const boxH = 44;
    const boxY = 55;
    const cy = boxY + boxH / 2;
    const centers = [W / 2 - 190, W / 2, W / 2 + 190];
    const labels = ["∂_μ g_{νσ}", "∂_ν g_{μσ}", "−∂_σ g_{μν}"];
    const colors = ["#67E8F9", "#FBBF24", "#FF6ADE"];

    for (let i = 0; i < 3; i++) {
      const cx = centers[i];
      ctx.strokeStyle = colors[i];
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, cx - boxW / 2, boxY, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors[i];
      ctx.font = "13px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], cx, cy + 5);
    }

    // Arrows from boxes to a central "sum" node
    const sumX = W / 2;
    const sumY = boxY + boxH + 38;
    const sumR = 28;

    for (let i = 0; i < 3; i++) {
      const cx = centers[i];
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx, boxY + boxH);
      ctx.lineTo(sumX, sumY - sumR);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Sum node
    ctx.beginPath();
    ctx.arc(sumX, sumY, sumR, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("sum", sumX, sumY - 5);
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.fillText("× (1/2) g^{ρσ}", sumX, sumY + 11);

    // Arrow from sum node to Γ output
    const gammaY = sumY + sumR + 30;
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sumX, sumY + sumR);
    ctx.lineTo(sumX, gammaY - 14);
    ctx.stroke();
    // Arrowhead
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.moveTo(sumX, gammaY - 4);
    ctx.lineTo(sumX - 6, gammaY - 14);
    ctx.lineTo(sumX + 6, gammaY - 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 14px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Γ^ρ_{ ${c0}${c1} }`, sumX, gammaY + 6);

    // ── Numerical values table ─────────────────────────────────────────────
    const tableX = 30;
    const tableY = gammaY + 30;
    const colW = 150;
    const rowH = 22;

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Γ values at (${c0}, ${c1}) = (${spec.evalPoint[0].toFixed(2)}, ${spec.evalPoint[1].toFixed(2)})`, tableX, tableY);

    let col = 0;
    for (let rho = 0; rho < n; rho++) {
      for (let mu = 0; mu < n; mu++) {
        for (let nu = 0; nu < n; nu++) {
          const val = Gamma[rho][mu][nu];
          if (Math.abs(val) < 5e-4) continue; // hide near-zero entries
          const cx2 = tableX + col * colW;
          const cy2 = tableY + 20 + Math.floor(col / 4) * rowH;
          const coordLabel = spec.coordNames[rho];
          const muLabel = spec.coordNames[mu];
          const nuLabel = spec.coordNames[nu];
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.font = "11px ui-monospace, monospace";
          ctx.textAlign = "left";
          ctx.fillText(`Γ^${coordLabel}_{${muLabel}${nuLabel}}`, cx2, cy2);
          ctx.fillStyle = "#67E8F9";
          ctx.fillText(` = ${val.toFixed(4)}`, cx2 + 62, cy2);
          col++;
        }
      }
    }
    if (col === 0) {
      ctx.fillStyle = "#67E8F9";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("All Γ = 0 (flat Cartesian metric → no connection)", tableX, tableY + 20);
    }
  }, [choice, spec, Gamma, c0, c1]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      <div className="flex w-full max-w-[660px] items-center justify-center gap-4">
        {METRICS.map((m, i) => (
          <button
            key={m.name}
            onClick={() => setChoice(i as MetricChoice)}
            className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
              choice === i
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="font-mono text-xs text-white/50 text-center max-w-[600px]">
        {spec.description} The Christoffel symbols are computed purely from derivatives of g — no external structure required. The Levi-Civita connection is the unique torsion-free, metric-compatible choice.
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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
