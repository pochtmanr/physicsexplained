"use client";

import { useEffect, useRef } from "react";

/**
 * FIG.30a — Tensor Rank Schematic.
 *
 * Shows the five canonical tensor ranks of GR as index-slot diagrams:
 *   • (0,0) scalar          — 1 component, no index boxes
 *   • (1,0) vector          — 4 components, 1 upper box
 *   • (0,1) covector        — 4 components, 1 lower box
 *   • (0,2) metric tensor   — 16 components, 2 lower boxes
 *   • (1,3) Riemann tensor  — 256 components, 1 upper + 3 lower boxes
 *
 * Each tensor is drawn as a central blob (the tensor itself) with coloured
 * "index slots" attached: cyan boxes above for contravariant (upper) indices
 * and amber boxes below for covariant (lower) indices.
 *
 * The component count n^(p+q) with n = 4 is displayed beneath each diagram
 * to reinforce that rank determines count.
 */

const W = 700;
const H = 300;

interface TensorSpec {
  label: string;
  pqLabel: string;
  p: number; // contravariant indices (upper, cyan)
  q: number; // covariant indices (lower, amber)
  components: number;
  symbol: string;
}

const TENSORS: TensorSpec[] = [
  { label: "scalar", pqLabel: "(0,0)", p: 0, q: 0, components: 1, symbol: "φ" },
  { label: "vector", pqLabel: "(1,0)", p: 1, q: 0, components: 4, symbol: "Vⁿ" },
  { label: "covector", pqLabel: "(0,1)", p: 0, q: 1, components: 4, symbol: "ωₙ" },
  { label: "metric", pqLabel: "(0,2)", p: 0, q: 2, components: 16, symbol: "gₘₙ" },
  {
    label: "Riemann",
    pqLabel: "(1,3)",
    p: 1,
    q: 3,
    components: 256,
    symbol: "Rⁿₘₙₗ",
  },
];

const BOX_W = 18;
const BOX_H = 14;
const BLOB_R = 20;
const SLOT_GAP = 6;

function drawTensor(
  ctx: CanvasRenderingContext2D,
  spec: TensorSpec,
  cx: number,
  cy: number,
) {
  const { p, q, label, pqLabel, components, symbol } = spec;

  // ── Central blob ──────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, BLOB_R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.30)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Symbol inside blob
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, cx, cy);

  // ── Upper index boxes (contravariant) ─────────────────────────────────────
  const upperTotalW = p * BOX_W + Math.max(0, p - 1) * SLOT_GAP;
  const upperStartX = cx - upperTotalW / 2;
  const upperY = cy - BLOB_R - 8 - BOX_H;

  for (let i = 0; i < p; i++) {
    const bx = upperStartX + i * (BOX_W + SLOT_GAP);
    ctx.fillStyle = "rgba(103,232,249,0.18)";
    ctx.fillRect(bx, upperY, BOX_W, BOX_H);
    ctx.strokeStyle = "rgba(103,232,249,0.70)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, upperY, BOX_W, BOX_H);

    // Greek index label
    ctx.fillStyle = "#67E8F9";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("μ", bx + BOX_W / 2, upperY + BOX_H / 2);

    // Connecting line from blob to box
    ctx.strokeStyle = "rgba(103,232,249,0.30)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - BLOB_R);
    ctx.lineTo(bx + BOX_W / 2, upperY + BOX_H);
    ctx.stroke();
  }

  // ── Lower index boxes (covariant) ─────────────────────────────────────────
  const lowerTotalW = q * BOX_W + Math.max(0, q - 1) * SLOT_GAP;
  const lowerStartX = cx - lowerTotalW / 2;
  const lowerY = cy + BLOB_R + 8;

  for (let i = 0; i < q; i++) {
    const bx = lowerStartX + i * (BOX_W + SLOT_GAP);
    ctx.fillStyle = "rgba(251,191,36,0.15)";
    ctx.fillRect(bx, lowerY, BOX_W, BOX_H);
    ctx.strokeStyle = "rgba(251,191,36,0.65)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, lowerY, BOX_W, BOX_H);

    ctx.fillStyle = "#FBBF24";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ν", bx + BOX_W / 2, lowerY + BOX_H / 2);

    ctx.strokeStyle = "rgba(251,191,36,0.30)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + BLOB_R);
    ctx.lineTo(bx + BOX_W / 2, lowerY);
    ctx.stroke();
  }

  // ── Labels below ─────────────────────────────────────────────────────────
  const bottomY = cy + BLOB_R + 8 + BOX_H + 16;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, cx, bottomY);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(pqLabel, cx, bottomY + 14);

  ctx.fillStyle =
    components === 1
      ? "rgba(167,239,167,0.75)"
      : components === 4
        ? "rgba(103,232,249,0.75)"
        : components === 16
          ? "rgba(167,139,250,0.75)"
          : "rgba(251,191,36,0.75)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(`${components} component${components > 1 ? "s" : ""}`, cx, bottomY + 28);
}

export function TensorRankScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    // Dividers
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    const colW = W / TENSORS.length;
    for (let i = 1; i < TENSORS.length; i++) {
      ctx.beginPath();
      ctx.moveTo(i * colW, 20);
      ctx.lineTo(i * colW, H - 20);
      ctx.stroke();
    }

    // Header
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("TENSOR RANKS  (n = 4 dimensions)", 12, 16);

    // Legend
    ctx.fillStyle = "#67E8F9";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("cyan = contravariant (upper)", W - 130, 16);
    ctx.fillStyle = "#FBBF24";
    ctx.fillText("amber = covariant (lower)", W - 12, 16);

    TENSORS.forEach((spec, i) => {
      const cx = colW * i + colW / 2;
      const cy = H / 2 - 10;
      drawTensor(ctx, spec, cx, cy);
    });
  }, []);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <p className="px-1 font-mono text-xs text-white/40">
        Each tensor is its index slots. Cyan boxes above the blob = contravariant
        (upper) indices; amber boxes below = covariant (lower) indices. Component
        count = 4^(p+q). A rank-(1,3) Riemann tensor has 4^4 = 256 components in
        4D spacetime.
      </p>
    </div>
  );
}
