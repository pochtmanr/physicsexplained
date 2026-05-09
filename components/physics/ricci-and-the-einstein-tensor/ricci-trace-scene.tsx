"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.35a — Ricci Tensor Contraction Schematic.
 *
 * The Riemann tensor R^ρ_{σμν} is a rank-(1,3) object — four index slots.
 * The Ricci tensor R_{μν} = R^λ_{μλν} is obtained by setting ρ = μ and
 * summing (Einstein convention). This contracts the first and third indices,
 * reducing rank-(1,3) to rank-(0,2).
 *
 * Visual layout:
 *  - Left panel: Riemann tensor as a blob with 1 cyan upper box (ρ) and
 *    3 amber lower boxes (σ, μ, ν). The first and third boxes are highlighted
 *    to show which pair is contracted.
 *  - Right panel: Ricci tensor — blob with 2 amber lower boxes (μ, ν).
 *  - Slider: "contraction progress" 0→1 that animates the two contracted boxes
 *    collapsing together and disappearing, leaving the Ricci blob.
 *
 * The label always shows the tensor equation R_{μν} = R^λ_{μλν}.
 */

const W = 680;
const H = 320;

const BLOB_R = 24;
const BOX_W = 22;
const BOX_H = 16;
const SLOT_GAP = 8;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  fillColor: string,
  strokeColor: string,
  alpha = 1,
) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, BOX_W, BOX_H);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, BOX_W, BOX_H);
  ctx.fillStyle = strokeColor;
  ctx.font = "bold 10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + BOX_W / 2, y + BOX_H / 2);
  ctx.globalAlpha = 1;
}

function drawConnector(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  alpha = 0.3,
) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  symbol: string,
  alpha = 1,
) {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(cx, cy, BLOB_R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, cx, cy);
  ctx.globalAlpha = 1;
}

function render(ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0A0C12";
  ctx.fillRect(0, 0, W, H);

  // ── Title ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("RIEMANN → RICCI CONTRACTION", 12, 18);

  // ── Equation line ─────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("R_{μν} = R^λ_{μλν}", W / 2, H - 14);

  // ── Left side: Riemann tensor ──────────────────────────────────────────────
  const riemannCX = W * 0.26;
  const riemannCY = H / 2;

  // How far along the contraction we are
  const contracted = Math.min(1, t * 2);    // first half: contract
  const showing = Math.max(0, (t - 0.5) * 2); // second half: show result

  // Labels for lower indices: σ(amber), μ(cyan-highlighted), ν(amber)
  // In R^ρ_{σμν} we contract ρ (upper) with the third lower slot (second λ position)
  // i.e. set ρ = λ and contract over λ to get R^λ_{μλν} = R_{μν}
  // We'll show: upper slot ρ (cyan) and lower slots: μ, λ, ν
  // Contract the upper ρ slot with the middle lower λ slot.

  const numLower = 3;
  const totalLowerW = numLower * BOX_W + (numLower - 1) * SLOT_GAP;
  const lowerStartX = riemannCX - totalLowerW / 2;
  const lowerY = riemannCY + BLOB_R + 10;
  const upperY = riemannCY - BLOB_R - 10 - BOX_H;

  // Upper slot: λ (cyan) — this is the index being contracted
  const upperX = riemannCX - BOX_W / 2;

  // Lower boxes: indices μ, λ, ν (positions 0,1,2)
  const lowerLabels = ["μ", "λ", "ν"];
  const lowerColors = [
    ["rgba(103,232,249,0.18)", "#67E8F9"], // μ — cyan
    ["rgba(251,191,36,0.18)", "#FBBF24"],  // λ — amber (being contracted)
    ["rgba(103,232,249,0.18)", "#67E8F9"], // ν — cyan
  ];

  // Riemann blob (fades out after contraction)
  const riemannAlpha = lerp(1, 0, showing);
  drawBlob(ctx, riemannCX, riemannCY, "R", riemannAlpha);

  // Upper box (λ) — moves toward the contracted lower λ box
  const lowerLamX = lowerStartX + 1 * (BOX_W + SLOT_GAP);
  const contractedUpperX = lerp(upperX, lowerLamX, contracted);
  const contractedUpperY = lerp(upperY, lowerY, contracted);
  const contractedAlpha = lerp(1, 0, contracted) * riemannAlpha;

  drawConnector(ctx, upperX + BOX_W / 2, upperY + BOX_H, riemannCX, riemannCY - BLOB_R, "#67E8F9", 0.3 * riemannAlpha);
  drawBox(ctx, contractedUpperX, contractedUpperY, "λ", "rgba(103,232,249,0.25)", "#67E8F9", contractedAlpha);

  // Lower boxes
  for (let i = 0; i < 3; i++) {
    const bx = lowerStartX + i * (BOX_W + SLOT_GAP);
    const [fill, stroke] = lowerColors[i];
    const isLambda = i === 1;
    const alpha = isLambda ? lerp(1, 0, contracted) * riemannAlpha : riemannAlpha;
    drawConnector(ctx, bx + BOX_W / 2, lowerY, riemannCX, riemannCY + BLOB_R, stroke, 0.3 * alpha);
    drawBox(ctx, bx, lowerY, lowerLabels[i], fill, stroke, alpha);
  }

  // "contraction" arc annotation
  if (contracted > 0.05 && contracted < 0.95) {
    const arcX = riemannCX;
    const arcY = lowerY - 18;
    ctx.globalAlpha = Math.min(contracted, 1 - contracted) * 2 * riemannAlpha;
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(arcX, arcY, 38, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#FF6ADE";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("contract", arcX, arcY - 44);
    ctx.globalAlpha = 1;
  }

  // "Riemann" label
  ctx.globalAlpha = riemannAlpha;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("Riemann  (1,3)", riemannCX, H - 60);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("4⁴ = 256 components", riemannCX, H - 46);
  ctx.globalAlpha = 1;

  // ── Arrow ─────────────────────────────────────────────────────────────────
  const arrowAlpha = Math.min(t / 0.4, 1);
  ctx.globalAlpha = arrowAlpha;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  const ax1 = riemannCX + 70;
  const ax2 = W * 0.62 - 70;
  const ay = H / 2;
  ctx.beginPath();
  ctx.moveTo(ax1, ay);
  ctx.lineTo(ax2, ay);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax2, ay);
  ctx.lineTo(ax2 - 8, ay - 5);
  ctx.moveTo(ax2, ay);
  ctx.lineTo(ax2 - 8, ay + 5);
  ctx.stroke();
  ctx.fillStyle = "#FF6ADE";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("R^λ_{μλν}", (ax1 + ax2) / 2, ay - 12);
  ctx.globalAlpha = 1;

  // ── Right side: Ricci tensor ───────────────────────────────────────────────
  const ricciCX = W * 0.76;
  const ricciCY = H / 2;
  const ricciAlpha = showing;

  drawBlob(ctx, ricciCX, ricciCY, "Ric", ricciAlpha);

  // Two lower boxes: μ, ν (cyan)
  const ricciLowerW = 2 * BOX_W + SLOT_GAP;
  const ricciLowerStartX = ricciCX - ricciLowerW / 2;
  const ricciLowerY = ricciCY + BLOB_R + 10;

  ["μ", "ν"].forEach((label, i) => {
    const bx = ricciLowerStartX + i * (BOX_W + SLOT_GAP);
    drawConnector(ctx, bx + BOX_W / 2, ricciLowerY, ricciCX, ricciCY + BLOB_R, "#67E8F9", 0.3 * ricciAlpha);
    drawBox(ctx, bx, ricciLowerY, label, "rgba(103,232,249,0.18)", "#67E8F9", ricciAlpha);
  });

  ctx.globalAlpha = ricciAlpha;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("Ricci  (0,2)", ricciCX, H - 60);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("10 independent", ricciCX, H - 46);
  ctx.globalAlpha = 1;

  // ── Legend ────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#67E8F9";
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("cyan = free index", W - 130, 18);
  ctx.fillStyle = "#FBBF24";
  ctx.fillText("amber = contracted index", W - 12, 18);
}

export function RicciTraceScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    render(ctx, t);
  }, [t]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
        <span>contraction</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={t}
          onChange={(e) => setT(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-8 text-right">{(t * 100).toFixed(0)}%</span>
      </label>
      <p className="px-1 font-mono text-xs text-white/40">
        The Riemann tensor R&#955;<sub>&#956;&#955;&#957;</sub> has 4 index slots. Setting the first and third slots equal and
        summing (the trace over &#955;) collapses rank-(1,3) to rank-(0,2): the Ricci tensor R<sub>&#956;&#957;</sub>.
        4D spacetime: 256 components &#8594; 10 independent.
      </p>
    </div>
  );
}
