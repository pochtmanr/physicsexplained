"use client";

import { useEffect, useRef } from "react";

/**
 * §07 CHART OVERLAP SCENE
 *
 * Canvas 2D schematic of two overlapping coordinate patches on a manifold.
 * Two rectangles represent the images φ(U) and ψ(V) of two charts in ℝ²;
 * a colored overlap region represents the transition domain; and an arrow
 * labeled φ ∘ ψ⁻¹ is drawn between them to indicate the transition map.
 *
 * The layout is purely schematic — no actual sphere geometry is drawn.
 * The purpose is to make the atlas / transition-map concept visually concrete.
 */

const WIDTH = 520;
const HEIGHT = 300;

export function ChartOverlapScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background
    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ── Layout constants ─────────────────────────────────────────────────────
    const padY = 40;
    const boxH = HEIGHT - 2 * padY;
    const boxW = 160;
    const overlapW = 50;
    const leftBoxX = 30;
    const rightBoxX = WIDTH - 30 - boxW;
    const overlapLeftX = leftBoxX + boxW - overlapW;
    const overlapRightX = rightBoxX;
    // Confirm overlap region X coords make sense (left box extends to leftBoxX+boxW,
    // right box starts at rightBoxX; overlap is their intersection)
    const overlapX = Math.max(overlapLeftX, overlapRightX);
    const overlapEndX = Math.min(leftBoxX + boxW, rightBoxX + boxW);

    // ── Left chart rectangle φ(U) ────────────────────────────────────────────
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(103, 232, 249, 0.07)";
    ctx.beginPath();
    ctx.rect(leftBoxX, padY, boxW, boxH);
    ctx.fill();
    ctx.stroke();

    // Grid lines inside left chart
    ctx.strokeStyle = "rgba(103, 232, 249, 0.18)";
    ctx.lineWidth = 0.75;
    const gridStep = 24;
    for (let gx = leftBoxX + gridStep; gx < leftBoxX + boxW; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, padY);
      ctx.lineTo(gx, padY + boxH);
      ctx.stroke();
    }
    for (let gy = padY + gridStep; gy < padY + boxH; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(leftBoxX, gy);
      ctx.lineTo(leftBoxX + boxW, gy);
      ctx.stroke();
    }

    // Left chart label
    ctx.fillStyle = "#67E8F9";
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("φ(U)", leftBoxX + boxW / 2, padY - 12);
    ctx.fillStyle = "rgba(103,232,249,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("chart 1  ℝ²", leftBoxX + boxW / 2, padY + boxH + 18);

    // ── Right chart rectangle ψ(V) ───────────────────────────────────────────
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(255, 106, 222, 0.07)";
    ctx.beginPath();
    ctx.rect(rightBoxX, padY, boxW, boxH);
    ctx.fill();
    ctx.stroke();

    // Grid lines inside right chart
    ctx.strokeStyle = "rgba(255, 106, 222, 0.18)";
    ctx.lineWidth = 0.75;
    for (let gx = rightBoxX + gridStep; gx < rightBoxX + boxW; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, padY);
      ctx.lineTo(gx, padY + boxH);
      ctx.stroke();
    }
    for (let gy = padY + gridStep; gy < padY + boxH; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(rightBoxX, gy);
      ctx.lineTo(rightBoxX + boxW, gy);
      ctx.stroke();
    }

    // Right chart label
    ctx.fillStyle = "#FF6ADE";
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("ψ(V)", rightBoxX + boxW / 2, padY - 12);
    ctx.fillStyle = "rgba(255,106,222,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("chart 2  ℝ²", rightBoxX + boxW / 2, padY + boxH + 18);

    // ── Manifold shape (center oval) ─────────────────────────────────────────
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const rx = 60;
    const ry = 50;

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // U patch (left part of oval)
    ctx.fillStyle = "rgba(103, 232, 249, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cx - 16, cy, rx * 0.72, ry * 0.78, 0, 0, 2 * Math.PI);
    ctx.fill();

    // V patch (right part of oval)
    ctx.fillStyle = "rgba(255, 106, 222, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cx + 16, cy, rx * 0.72, ry * 0.78, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Overlap tint
    ctx.fillStyle = "rgba(255, 240, 100, 0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.32, ry * 0.65, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Manifold label
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("M", cx, cy + ry + 16);

    // Patch labels on manifold
    ctx.fillStyle = "#67E8F9";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("U", cx - 34, cy - 4);
    ctx.fillStyle = "#FF6ADE";
    ctx.fillText("V", cx + 34, cy - 4);

    // ── Transition-map arrow between the two rectangles ──────────────────────
    // Arrow flows from the overlap region in left chart to the overlap region in right chart,
    // passing above the manifold oval.
    const arrowY = padY - 22;
    const arrowStartX = leftBoxX + boxW - 20;
    const arrowEndX = rightBoxX + 20;

    ctx.strokeStyle = "#FBBF24";
    ctx.lineWidth = 1.75;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowY);
    ctx.bezierCurveTo(
      arrowStartX + (arrowEndX - arrowStartX) * 0.3,
      arrowY - 18,
      arrowStartX + (arrowEndX - arrowStartX) * 0.7,
      arrowY - 18,
      arrowEndX,
      arrowY,
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead
    const headLen = 8;
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowY);
    ctx.lineTo(arrowEndX - headLen, arrowY - 4);
    ctx.lineTo(arrowEndX - headLen + 2, arrowY + 4);
    ctx.closePath();
    ctx.fill();

    // Transition-map label
    ctx.fillStyle = "#FBBF24";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("φ ∘ ψ⁻¹", (arrowStartX + arrowEndX) / 2, arrowY - 26);

    // ── Chart arrows from manifold to rectangles ──────────────────────────────
    // φ: oval → left rectangle
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - rx - 4, cy);
    ctx.lineTo(leftBoxX + boxW + 4, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead pointing left
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.moveTo(leftBoxX + boxW + 4, cy);
    ctx.lineTo(leftBoxX + boxW + 4 + 8, cy - 4);
    ctx.lineTo(leftBoxX + boxW + 4 + 8, cy + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#67E8F9";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("φ", (cx - rx + leftBoxX + boxW) / 2, cy - 8);

    // ψ: oval → right rectangle
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cx + rx + 4, cy);
    ctx.lineTo(rightBoxX - 4, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead pointing right
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.moveTo(rightBoxX - 4, cy);
    ctx.lineTo(rightBoxX - 4 - 8, cy - 4);
    ctx.lineTo(rightBoxX - 4 - 8, cy + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FF6ADE";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("ψ", (cx + rx + rightBoxX) / 2, cy - 8);

    // ── Overlap region tint in both rectangles (shared domain) ───────────────
    // Left rectangle — right 50 px = overlap with right patch
    ctx.fillStyle = "rgba(255, 240, 100, 0.14)";
    ctx.fillRect(leftBoxX + boxW - overlapW, padY, overlapW, boxH);
    ctx.strokeStyle = "rgba(255, 240, 100, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(leftBoxX + boxW - overlapW, padY, overlapW, boxH);

    // Right rectangle — left 50 px = overlap with left patch
    ctx.fillStyle = "rgba(255, 240, 100, 0.14)";
    ctx.fillRect(rightBoxX, padY, overlapW, boxH);
    ctx.strokeStyle = "rgba(255, 240, 100, 0.5)";
    ctx.strokeRect(rightBoxX, padY, overlapW, boxH);

    // ── Bottom caption ────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "Two charts whose union covers the manifold. The transition map φ ∘ ψ⁻¹ is required to be smooth.",
      WIDTH / 2,
      HEIGHT - 6,
    );
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-md border border-white/10 bg-black/40"
    />
  );
}
