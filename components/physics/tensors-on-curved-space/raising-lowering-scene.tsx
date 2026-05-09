"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.30c — Raising and Lowering Indices.
 *
 * Shows a contravariant vector V^μ and its covariant dual V_μ = g_{μν} V^ν
 * side by side as bar charts.  A slider switches between two metrics:
 *
 *   • flat (Minkowski): η = diag(1, −1, −1, −1)
 *     → the μ=0 component changes sign, others flip sign
 *
 *   • curved (spherical): g = diag(1, r², r² sin²θ)  in 3D  (r=2, θ=π/4)
 *     → the spatial components are stretched by r² and r² sin²θ factors
 *
 * The key physical point: the metric IS the instrument that relates a vector
 * to its dual.  In flat space the components are trivially related by signs;
 * in curved space the angular components are scaled by position-dependent
 * factors — a direct consequence of the non-Euclidean geometry.
 */

const W = 700;
const H = 340;
const BAR_MAX_H = 130;
const BAR_W = 40;
const GAP = 12;

// Fixed V^μ in the contravariant (upper-index) representation
// Using 3-component (r, θ, φ) vector for the spherical demonstration
const V_contra = [1.0, 0.8, 0.6]; // V^r, V^θ, V^φ

type MetricMode = "flat" | "curved";

const LABELS_CONTRA = ["V^r", "V^θ", "V^φ"];
const LABELS_COVA = ["V_r", "V_θ", "V_φ"];

function getMetric(mode: MetricMode): number[][] {
  if (mode === "flat") {
    // η = diag(1, -1, -1)  (Minkowski-like, 3-component)
    return [
      [1, 0, 0],
      [0, -1, 0],
      [0, 0, -1],
    ];
  }
  // Spherical: g = diag(1, r², r² sin²θ) with r=2, θ=π/4
  const r = 2;
  const theta = Math.PI / 4;
  const sin2 = Math.sin(theta) ** 2;
  return [
    [1, 0, 0],
    [0, r * r, 0],
    [0, 0, r * r * sin2],
  ];
}

function lowerVec(g: number[][], V: number[]): number[] {
  const n = V.length;
  return Array.from({ length: n }, (_, mu) => {
    let acc = 0;
    for (let nu = 0; nu < n; nu++) acc += g[mu][nu] * V[nu];
    return acc;
  });
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  values: number[],
  labels: string[],
  cx: number,
  cy: number,
  color: string,
  title: string,
  maxVal: number,
) {
  const n = values.length;
  const totalW = n * BAR_W + (n - 1) * GAP;
  const startX = cx - totalW / 2;

  // Title
  ctx.fillStyle = color;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, cx, cy - BAR_MAX_H - 16);

  // Zero line
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX - 10, cy);
  ctx.lineTo(startX + totalW + 10, cy);
  ctx.stroke();

  // Bars
  for (let i = 0; i < n; i++) {
    const bx = startX + i * (BAR_W + GAP);
    const norm = maxVal > 0 ? values[i] / maxVal : 0;
    const bh = norm * BAR_MAX_H;
    const barTop = cy - Math.max(0, bh);
    const barBottom = cy - Math.min(0, bh);
    const displayH = Math.abs(bh);

    // Bar fill
    const alpha = 0.6;
    ctx.fillStyle =
      values[i] >= 0
        ? color.replace(")", `,${alpha})`).replace("rgb(", "rgba(")
        : color.replace(")", `,${alpha * 0.7})`).replace("rgb(", "rgba(");

    // Simpler approach: just use rgba directly
    if (values[i] >= 0) {
      ctx.fillStyle = color.includes("rgba")
        ? color
        : `rgba(${hexToRgb(color)},0.55)`;
    } else {
      ctx.fillStyle = color.includes("rgba")
        ? color
        : `rgba(${hexToRgb(color)},0.35)`;
    }

    const rectY = values[i] >= 0 ? barTop : cy;
    ctx.fillRect(bx, rectY, BAR_W, displayH);

    // Bar outline
    ctx.strokeStyle = color.includes("rgba")
      ? color
      : `rgba(${hexToRgb(color)},0.80)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, rectY, BAR_W, displayH);

    // Value label
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = values[i] >= 0 ? "bottom" : "top";
    const valY = values[i] >= 0 ? barTop - 2 : barBottom + 2;
    ctx.fillText(values[i].toFixed(3), bx + BAR_W / 2, valY);

    // Component label
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.textBaseline = "top";
    ctx.fillText(labels[i], bx + BAR_W / 2, cy + 6);
  }
}

// Minimal hex-to-rgb helper for inline use
function hexToRgb(hex: string): string {
  if (hex.startsWith("#")) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }
  return "255,255,255";
}

export function RaisingLoweringScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<MetricMode>("flat");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const g = getMetric(mode);
    const V_cov = lowerVec(g, V_contra);

    // Scale both panels to the same max |val| for visual comparison
    const allVals = [...V_contra, ...V_cov];
    const maxVal = Math.max(...allVals.map(Math.abs), 0.1);

    const leftCX = W / 4;
    const rightCX = (3 * W) / 4;
    const cy = H / 2 + 20;

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();

    // Header
    const metricLabel =
      mode === "flat"
        ? "η = diag(1, −1, −1)  (flat / Minkowski-like)"
        : "g = diag(1, r², r²sin²θ)  r=2, θ=45°  (spherical)";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Metric: ${metricLabel}`, W / 2, 16);

    // Left panel: contravariant
    drawBars(
      ctx,
      V_contra,
      LABELS_CONTRA,
      leftCX,
      cy,
      "#67E8F9",
      "V^μ  (contravariant, upper)",
      maxVal,
    );

    // Right panel: covariant
    drawBars(
      ctx,
      V_cov,
      LABELS_COVA,
      rightCX,
      cy,
      "#FBBF24",
      "V_μ = g_{μν} V^ν  (covariant, lower)",
      maxVal,
    );

    // Arrow between panels
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 30, cy - 20);
    ctx.lineTo(W / 2 + 30, cy - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W / 2 + 22, cy - 26);
    ctx.lineTo(W / 2 + 30, cy - 20);
    ctx.lineTo(W / 2 + 22, cy - 14);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("g_{μν}", W / 2, cy - 30);

    // Mode-specific annotation
    if (mode === "curved") {
      ctx.fillStyle = "rgba(251,191,36,0.75)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `V_φ = g_{φφ} V^φ = ${(g[2][2]).toFixed(3)} × ${V_contra[2].toFixed(3)} = ${V_cov[2].toFixed(3)}`,
        W / 2,
        H - 24,
      );
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText(
        "g_{φφ} = r² sin²θ — position-dependent stretching",
        W / 2,
        H - 10,
      );
    } else {
      ctx.fillStyle = "rgba(103,232,249,0.75)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Flat: covariant components differ only by sign (η_{ii})",
        W / 2,
        H - 14,
      );
    }
  }, [mode]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex items-center gap-4 px-1">
        <span className="font-mono text-xs text-white/60">Metric:</span>
        <button
          onClick={() => setMode("flat")}
          className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
            mode === "flat"
              ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          flat  (η)
        </button>
        <button
          onClick={() => setMode("curved")}
          className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
            mode === "curved"
              ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          curved  (spherical)
        </button>
      </div>
      <p className="px-1 font-mono text-xs text-white/40">
        Left bars: contravariant components V^μ (fixed). Right bars: covariant
        components V_μ = g_&#123;μν&#125; V^ν. In flat space the metric only flips
        signs. In curved (spherical) space the angular components are scaled by
        r² and r²sin²θ — the metric encodes the geometry of the space itself.
      </p>
    </div>
  );
}
