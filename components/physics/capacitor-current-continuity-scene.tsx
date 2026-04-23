"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { capacitorCurrentContinuity } from "@/lib/physics/electromagnetism/displacement-current";

const RATIO = 0.5;
const MAX_HEIGHT = 360;

const AMBER = "rgba(255, 214, 107,"; // conduction
const LILAC = "rgba(200, 160, 255,"; // displacement

const PLATE_AREA = 0.02;
const PLATE_GAP = 1e-3;
const DRIVE_I = 1.0;

/**
 * FIG.33c — continuity across the plate boundary.
 *
 * A single dashed-line closed surface wraps around one plate of a parallel-
 * plate capacitor. The surface has two relevant crossings:
 *
 *   - LEFT FACE (intersects the wire): conduction current I flows in.
 *   - RIGHT FACE (intersects the gap): displacement current ε₀·∂E/∂t
 *     flows out.
 *
 * With Maxwell's term, the two balance exactly. The divergence of the
 * generalised current (J + ∂D/∂t) is zero through the closed surface — the
 * total current is continuous across the plate boundary.
 *
 * Visual: amber dots stream IN from the left; lilac dots stream OUT to the
 * right. The HUD displays I_in and I_out and the residual (≈ 0).
 */
export function CapacitorCurrentContinuityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 360 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
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

      const { Iconduction, Idisplacement } = capacitorCurrentContinuity(
        PLATE_AREA,
        PLATE_GAP,
        DRIVE_I,
      );

      // Layout
      const cx = width / 2;
      const cy = height / 2;
      const plateH = Math.min(height * 0.52, 160);
      const plateGap = 22;
      const plateW = 6;
      const leftPlateX = cx - plateGap / 2;
      const rightPlateX = cx + plateGap / 2;

      // Wire
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, cy);
      ctx.lineTo(leftPlateX, cy);
      ctx.moveTo(rightPlateX, cy);
      ctx.lineTo(width - 20, cy);
      ctx.stroke();

      // Plates
      ctx.fillStyle = "rgba(255, 106, 222, 0.8)";
      ctx.fillRect(leftPlateX - plateW, cy - plateH / 2, plateW, plateH);
      ctx.fillStyle = "rgba(111, 184, 198, 0.8)";
      ctx.fillRect(rightPlateX, cy - plateH / 2, plateW, plateH);

      // ─────── Dashed Gaussian "pillbox" wrapping the + plate ───────
      const boxX0 = leftPlateX - plateW - 40;
      const boxX1 = cx + 2; // end-cap sits BETWEEN the plates
      const boxY0 = cy - plateH / 2 - 20;
      const boxY1 = cy + plateH / 2 + 20;

      ctx.save();
      ctx.strokeStyle = "rgba(230, 237, 247, 0.9)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(boxX0, boxY0, boxX1 - boxX0, boxY1 - boxY0);
      ctx.restore();

      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("closed surface wraps one plate", (boxX0 + boxX1) / 2, boxY0 - 6);

      // ─────── Conduction arrows entering LEFT face ───────
      // Amber dots flow left→right in the wire; where they cross the left
      // face of the box we fire a small amber arrow inward.
      const nIn = 3;
      const speed = 60;
      const phase = (t * speed) % 40;
      ctx.fillStyle = `${AMBER} 0.95)`;
      for (let i = 0; i < nIn; i++) {
        const yy = cy;
        const xx = boxX0 - 80 + ((i * 40 + phase) % 80);
        ctx.beginPath();
        ctx.arc(xx, yy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Big labeled arrow at the LEFT face
      drawLabeledArrow(
        ctx,
        boxX0 - 4,
        cy,
        boxX0 + 30,
        cy,
        `${AMBER} 0.95)`,
        `I_c = ${Iconduction.toFixed(2)} A in`,
        "above",
        colors.fg1,
      );

      // ─────── Displacement arrow exiting RIGHT face (inside the gap) ───────
      // Lilac flux arrows between plates — crossing the right end-cap of
      // the box (which sits in the middle of the gap).
      const nLines = 4;
      const step = plateH / (nLines + 1);
      ctx.strokeStyle = `${LILAC} 0.85)`;
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.lineWidth = 1.4;
      for (let i = 1; i <= nLines; i++) {
        const yy = cy - plateH / 2 + i * step;
        const x0 = leftPlateX + 2;
        const x1 = boxX1 + 4;
        ctx.beginPath();
        ctx.moveTo(x0, yy);
        ctx.lineTo(x1, yy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x1, yy);
        ctx.lineTo(x1 - 5, yy - 3);
        ctx.lineTo(x1 - 5, yy + 3);
        ctx.closePath();
        ctx.fill();
      }
      drawLabeledArrow(
        ctx,
        boxX1 - 6,
        cy + plateH / 2 + 32,
        boxX1 + 30,
        cy + plateH / 2 + 32,
        `${LILAC} 0.95)`,
        `I_d = ${Idisplacement.toFixed(2)} A out`,
        "below",
        colors.fg1,
      );

      // ─────── HUD ───────
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("conduction stops at the plate — displacement picks up", 12, 18);
      const residual = Math.abs(Iconduction - Idisplacement);
      ctx.fillStyle =
        residual < 1e-9 ? "rgba(120, 255, 170, 0.95)" : "rgba(255, 180, 180, 0.95)";
      ctx.fillText(
        `I_in − I_out = ${residual.toExponential(2)} A  (≈ 0 · current continuous)`,
        12,
        height - 14,
      );
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

function drawLabeledArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  label: string,
  labelPlacement: "above" | "below",
  labelColor: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ah = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * ah - uy * 3, y1 - uy * ah + ux * 3);
  ctx.lineTo(x1 - ux * ah + uy * 3, y1 - uy * ah - ux * 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = labelColor;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  const yLabel = labelPlacement === "above" ? y0 - 6 : y0 + 14;
  ctx.fillText(label, x0, yLabel);
}
