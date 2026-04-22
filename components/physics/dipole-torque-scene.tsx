"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  dipoleEnergy,
  dipoleTorque,
} from "@/lib/physics/electromagnetism/magnetic-dipole";

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const M_MOMENT = 0.02; // A·m² — a small lab-scale loop
const B_FIELD = 0.5; // T — between a fridge magnet and an MRI bore

/**
 * Square current loop in a uniform external B field. The user drags a
 * slider for the angle θ between the loop's magnetic moment m and B.
 * The torque τ = m · B · sin θ is shown as an arrow whose length tracks
 * sin θ, and an energy curve U(θ) = −m·B·cos θ is plotted alongside,
 * with the current θ marked on it. The bottom of the bowl is θ = 0:
 * the loop wants to align m with B.
 */
export function DipoleTorqueScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [thetaDeg, setThetaDeg] = useState(60);

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
    onFrame: () => {
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

      const theta = (thetaDeg * Math.PI) / 180;

      // Layout: loop on the left half, energy bowl on the right.
      const splitX = Math.min(width * 0.55, width - 220);
      drawLoopPanel(ctx, 0, 0, splitX, height, theta, colors);
      drawEnergyPanel(
        ctx,
        splitX,
        0,
        width - splitX,
        height,
        theta,
        colors,
      );
    },
  });

  const torque = dipoleTorque(M_MOMENT, B_FIELD, (thetaDeg * Math.PI) / 180);
  const energy = dipoleEnergy(M_MOMENT, B_FIELD, (thetaDeg * Math.PI) / 180);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-10 text-sm text-[var(--color-fg-3)]">θ</label>
          <input
            type="range"
            min={0}
            max={180}
            step={1}
            value={thetaDeg}
            onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {thetaDeg.toFixed(0)}°
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-[var(--color-fg-2)]">
          <span>m = {M_MOMENT.toFixed(3)} A·m²</span>
          <span>B = {B_FIELD.toFixed(2)} T</span>
          <span>|τ| = {(torque * 1e3).toFixed(2)} mN·m</span>
          <span>U = {(energy * 1e3).toFixed(2)} mJ</span>
        </div>
      </div>
    </div>
  );
}

function drawLoopPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  theta: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;

  // Background B-field hint: faint horizontal arrows pointing to the right
  drawBFieldBackground(ctx, x0, y0, w, h);

  // Loop axis (the m direction). m starts pointing right at θ=0 and tilts
  // upward by θ (so θ=π/2 is straight up, θ=π is leftward).
  const mLen = Math.min(w, h) * 0.32;
  const mx = Math.cos(theta);
  const my = -Math.sin(theta); // canvas y is inverted

  // Draw loop as an ellipse perpendicular to m. The loop is a flat disc
  // whose normal is m. Project onto the canvas so it foreshortens as θ
  // changes — at θ=0 (m points right) the loop edge-on appears as a
  // vertical line; at θ=π/2 (m points up) the loop appears nearly circular
  // viewed from above.
  const loopR = mLen * 0.7;
  // The loop's plane is spanned by ŷ_world and (m × ŷ_world). For a 2D
  // canvas we draw it as an ellipse centred at (cx, cy):
  //   - major axis = loopR along the world ŷ direction → constant vertical
  //   - minor axis = loopR · |sin(θ)| along the projection of (perpendicular to m)
  // That gives an edge-on strip when m is horizontal (θ = 0), opening up
  // as θ approaches π/2.
  ctx.save();
  ctx.translate(cx, cy);
  // The major axis is always vertical in this stylization.
  const minor = loopR * Math.abs(Math.sin(theta));
  ctx.strokeStyle = "#FFD66B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(2, minor), loopR, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Direction-of-current arrows on the ellipse
  if (minor > 6) {
    drawCurrentArrows(ctx, minor, loopR);
  }
  ctx.restore();

  // Magnetic moment vector m (amber)
  drawArrow(ctx, cx, cy, cx + mx * mLen, cy + my * mLen, "#FFD66B", 2.5, 9);
  ctx.fillStyle = "#FFD66B";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText("m", cx + mx * mLen + 6, cy + my * mLen - 4);

  // Torque arrow — perpendicular to m, in the plane of rotation, pointing
  // toward the alignment direction. For our θ measured from B (= +x̂),
  // the loop wants to rotate so θ → 0; the angular velocity sign is
  // −sin θ around the out-of-page axis, so the tangential direction
  // applied to the tip of m points downward when θ ∈ (0, π).
  const tauMag = Math.sin(theta);
  if (Math.abs(tauMag) > 0.01) {
    const tx = -my; // perpendicular to m, rotated −90°
    const ty = mx;
    const tipX = cx + mx * mLen;
    const tipY = cy + my * mLen;
    const tauLen = 50 * Math.abs(tauMag);
    // Arrow points from m's tip in the direction that rotates m toward B
    const sign = -Math.sign(Math.sin(theta));
    drawArrow(
      ctx,
      tipX,
      tipY,
      tipX + sign * tx * tauLen,
      tipY + sign * ty * tauLen,
      "rgba(255, 214, 107, 0.85)",
      2,
      7,
    );
    ctx.fillStyle = "rgba(255, 214, 107, 0.85)";
    ctx.font = "bold 11px monospace";
    ctx.fillText(
      "τ",
      tipX + sign * tx * tauLen + 6,
      tipY + sign * ty * tauLen + 4,
    );
  }

  // B label in the corner
  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("B →", x0 + 12, y0 + h - 14);
  ctx.textAlign = "right";
  ctx.fillText("current loop", x0 + w - 12, y0 + 18);
}

function drawCurrentArrows(
  ctx: CanvasRenderingContext2D,
  minor: number,
  loopR: number,
) {
  // Two little arrowheads on the top and bottom of the ellipse to suggest
  // circulation. We draw tangent-direction triangles.
  ctx.fillStyle = "#FFD66B";
  // Top of the ellipse: tangent points to the right when m points "out of
  // page" toward the viewer (θ near π/2). For simplicity we just always
  // draw the same convention.
  drawTinyTriangle(ctx, minor, 0, 1, 0); // right side, pointing down
  drawTinyTriangle(ctx, -minor, 0, -1, 0); // left side, pointing up
  // suppress unused
  void loopR;
}

function drawTinyTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dirX: number,
  dirY: number,
) {
  void dirX;
  const s = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy + dirY * s);
  ctx.lineTo(cx - s, cy - dirY * s);
  ctx.lineTo(cx + s, cy - dirY * s);
  ctx.closePath();
  ctx.fill();
}

function drawBFieldBackground(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
) {
  ctx.strokeStyle = "rgba(120, 220, 255, 0.18)";
  ctx.fillStyle = "rgba(120, 220, 255, 0.18)";
  ctx.lineWidth = 1;
  const stepX = 70;
  const stepY = 50;
  for (let xi = x0 + stepX / 2; xi < x0 + w; xi += stepX) {
    for (let yi = y0 + stepY / 2; yi < y0 + h; yi += stepY) {
      ctx.beginPath();
      ctx.moveTo(xi - 12, yi);
      ctx.lineTo(xi + 12, yi);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xi + 12, yi);
      ctx.lineTo(xi + 8, yi - 3);
      ctx.lineTo(xi + 8, yi + 3);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawEnergyPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  theta: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const padL = 30;
  const padR = 18;
  const padT = 28;
  const padB = 36;
  const plotX = x0 + padL;
  const plotY = y0 + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const midY = plotY + plotH / 2;

  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  // Zero line
  ctx.strokeStyle = colors.fg3;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(plotX, midY);
  ctx.lineTo(plotX + plotW, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Plot U(θ) = −m·B·cos θ, normalized so the curve fills the panel.
  // We just plot −cos θ; the y-axis is "energy in units of m·B".
  ctx.strokeStyle = "#FFD66B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI;
    const u = -Math.cos(t); // ∈ [-1, 1]
    const sx = plotX + (t / Math.PI) * plotW;
    const sy = midY - u * (plotH / 2 - 6);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Mark current θ on the curve
  const u = -Math.cos(theta);
  const cxDot = plotX + (theta / Math.PI) * plotW;
  const cyDot = midY - u * (plotH / 2 - 6);
  ctx.fillStyle = "#FF6ADE";
  ctx.beginPath();
  ctx.arc(cxDot, cyDot, 5, 0, Math.PI * 2);
  ctx.fill();

  // Axis labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("0", plotX, plotY + plotH + 14);
  ctx.fillText("π/2", plotX + plotW / 2, plotY + plotH + 14);
  ctx.fillText("π", plotX + plotW, plotY + plotH + 14);
  ctx.textAlign = "left";
  ctx.fillText("U(θ) = −m·B·cos θ", plotX, plotY - 10);
  // y-axis end points
  ctx.textAlign = "right";
  ctx.fillText("+mB", plotX - 4, plotY + 10);
  ctx.fillText("−mB", plotX - 4, plotY + plotH - 4);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
  headSize: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * headSize - uy * headSize * 0.55,
    y1 - uy * headSize + ux * headSize * 0.55,
  );
  ctx.lineTo(
    x1 - ux * headSize + uy * headSize * 0.55,
    y1 - uy * headSize - ux * headSize * 0.55,
  );
  ctx.closePath();
  ctx.fill();
}
