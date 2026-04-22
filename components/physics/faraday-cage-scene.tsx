"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 380;

// Decay timescale (seconds) for the interior field collapse.
// Real conductors equilibrate in ~10⁻¹⁹ s — this is a pedagogical animation.
const TAU = 1.4;

/**
 * A hollow rectangular metal box dropped into a uniform external field.
 * t = 0: external arrows pierce straight through the cavity.
 * t → ∞: induced surface charges (+ on the right face, − on the left face)
 *        accumulate, their field cancels the applied field inside, and the
 *        interior arrows shrink to zero. HUD tracks |E_inside| / |E_ext|.
 */
export function FaradayCageScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Loop the equilibration every ~6s so the viewer sees it again.
      const cycle = (t % 6) / 1; // seconds within cycle
      const insideRatio = Math.exp(-cycle / TAU); // 1 → 0
      const inducedFrac = 1 - insideRatio; // 0 → 1

      const cx = width / 2;
      const cy = height / 2;

      // Box geometry — leave room on the sides for external arrows
      const boxW = Math.min(width * 0.5, 320);
      const boxH = Math.min(height * 0.55, 200);
      const boxX = cx - boxW / 2;
      const boxY = cy - boxH / 2;

      // ── 1. External field arrows (left → right), unaffected outside ──
      const arrowGapY = 36;
      const externalArrowLen = 56;
      ctx.strokeStyle = colors.fg2;
      ctx.fillStyle = colors.fg2;
      ctx.lineWidth = 1.4;
      for (let y = arrowGapY; y < height - 10; y += arrowGapY) {
        // Left side (always full)
        if (y < boxY - 8 || y > boxY + boxH + 8) {
          drawArrow(ctx, 16, y, 16 + externalArrowLen, y, colors.fg1, 1.4);
          drawArrow(
            ctx,
            width - 16 - externalArrowLen,
            y,
            width - 16,
            y,
            colors.fg1,
            1.4,
          );
        } else {
          // Adjacent to the box
          drawArrow(ctx, 16, y, boxX - 4, y, colors.fg1, 1.4);
          drawArrow(ctx, boxX + boxW + 4, y, width - 16, y, colors.fg1, 1.4);
        }
      }

      // ── 2. Induced surface charge layer ──
      // Left face accumulates negative; right face accumulates positive.
      const layerThick = 6;
      const negShade = `rgba(111, 184, 198, ${0.18 + 0.62 * inducedFrac})`;
      const posShade = `rgba(255, 106, 222, ${0.18 + 0.62 * inducedFrac})`;
      ctx.fillStyle = negShade;
      ctx.fillRect(boxX, boxY, layerThick, boxH);
      ctx.fillStyle = posShade;
      ctx.fillRect(boxX + boxW - layerThick, boxY, layerThick, boxH);

      // Surface ± labels
      const signCount = 5;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const negLabelAlpha = 0.35 + 0.55 * inducedFrac;
      const posLabelAlpha = 0.35 + 0.55 * inducedFrac;
      for (let i = 0; i < signCount; i++) {
        const sy = boxY + (boxH * (i + 0.5)) / signCount;
        ctx.fillStyle = `rgba(111, 184, 198, ${negLabelAlpha})`;
        ctx.fillText("−", boxX + layerThick / 2 - 0.5, sy);
        ctx.fillStyle = `rgba(255, 106, 222, ${posLabelAlpha})`;
        ctx.fillText("+", boxX + boxW - layerThick / 2 + 0.5, sy);
      }
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      // ── 3. Box outline (the conductor) ──
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // ── 4. Interior arrows: shrink to zero as inducedFrac → 1 ──
      const interiorArrowLenMax = 36;
      const interiorArrowLen = interiorArrowLenMax * insideRatio;
      const interiorAlpha = 0.25 + 0.55 * insideRatio;
      const stepY = Math.max(28, boxH / 4);
      for (let y = boxY + stepY / 2; y < boxY + boxH; y += stepY) {
        const xStart = boxX + boxW / 2 - interiorArrowLen / 2;
        const xEnd = xStart + interiorArrowLen;
        if (interiorArrowLen > 4) {
          drawArrow(
            ctx,
            xStart,
            y,
            xEnd,
            y,
            `rgba(111, 184, 198, ${interiorAlpha})`,
            1.6,
          );
        } else {
          // Just a dot — field has effectively vanished
          ctx.fillStyle = `rgba(111, 184, 198, ${interiorAlpha})`;
          ctx.beginPath();
          ctx.arc(boxX + boxW / 2, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 5. HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("E_ext  →  applied", 12, 18);
      ctx.textAlign = "right";
      ctx.fillText(
        `|E_inside| / |E_ext| = ${insideRatio.toFixed(3)}`,
        width - 12,
        18,
      );
      ctx.fillText(`σ_induced: ${(inducedFrac * 100).toFixed(0)}%`, width - 12, 36);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ah = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * ah - uy * ah * 0.5, y1 - uy * ah + ux * ah * 0.5);
  ctx.lineTo(x1 - ux * ah + uy * ah * 0.5, y1 - uy * ah - ux * ah * 0.5);
  ctx.closePath();
  ctx.fill();
}
