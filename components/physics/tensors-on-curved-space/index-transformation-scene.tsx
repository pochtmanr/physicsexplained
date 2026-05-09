"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.30b — Index Transformation Scene.
 *
 * A 2D plane with a fixed vector V drawn from the origin.  Two coordinate
 * frames are shown simultaneously:
 *   • Frame S  — Cartesian x/y (fixed, white grid)
 *   • Frame S' — the same frame rotated by angle θ (purple grid)
 *
 * The vector arrow does NOT move.  The two component readouts (V^x, V^y) in
 * S and (V'^x, V'^y) in S' change as the slider rotates S'.
 *
 * Transformation law:
 *   V'^a = J^a_μ V^μ    where J = rotation matrix by θ
 *
 * This is the contravariant transformation rule — the components transform
 * inversely to the basis vectors.  The vector itself is invariant.
 */

const W = 700;
const H = 380;
const ORIGIN_X = 350;
const ORIGIN_Y = 220;
const GRID_SPACING = 50; // pixels per unit
const N_GRID_LINES = 5;

// The fixed vector in world space (units)
const VX = 2.0;
const VY = -1.3;

function drawGrid(
  ctx: CanvasRenderingContext2D,
  angle: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.translate(ORIGIN_X, ORIGIN_Y);
  ctx.rotate(-angle); // rotate grid axes

  ctx.strokeStyle = `rgba(${color},${alpha})`;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 4]);

  for (let i = -N_GRID_LINES; i <= N_GRID_LINES; i++) {
    const d = i * GRID_SPACING;
    ctx.beginPath();
    ctx.moveTo(d, -H);
    ctx.lineTo(d, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-W, d);
    ctx.lineTo(W, d);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawAxis(
  ctx: CanvasRenderingContext2D,
  angle: number,
  color: string,
  labelX: string,
  labelY: string,
) {
  ctx.save();
  ctx.translate(ORIGIN_X, ORIGIN_Y);
  ctx.rotate(-angle);

  const len = 220;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // X axis
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  // X arrowhead
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(len - 8, -4);
  ctx.lineTo(len - 8, 4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(labelX, len + 4, 0);

  // Y axis (screen y is down, physics y is up — flip)
  ctx.beginPath();
  ctx.moveTo(0, len);
  ctx.lineTo(0, -len);
  ctx.stroke();
  // Y arrowhead
  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.lineTo(-4, -len + 8);
  ctx.lineTo(4, -len + 8);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(labelY, 0, -len - 2);

  ctx.restore();
}

export function IndexTransformationScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [theta, setTheta] = useState(0);

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

    // ── Grids ──────────────────────────────────────────────────────────────
    drawGrid(ctx, 0, "255,255,255", 0.06); // Cartesian — fixed white
    drawGrid(ctx, theta, "167,139,250", 0.12); // Rotated — purple

    // ── Axes ───────────────────────────────────────────────────────────────
    drawAxis(ctx, 0, "rgba(255,255,255,0.45)", "x", "y");
    drawAxis(ctx, theta, "rgba(167,139,250,0.85)", "x'", "y'");

    // ── Vector arrow V ─────────────────────────────────────────────────────
    const vPx = VX * GRID_SPACING;
    const vPy = VY * GRID_SPACING; // note: canvas y is flipped

    ctx.save();
    ctx.translate(ORIGIN_X, ORIGIN_Y);
    // Vector line
    ctx.strokeStyle = "#FB923C";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(vPx, -vPy); // flip y for canvas
    ctx.stroke();
    // Arrowhead
    const angle0 = Math.atan2(-vPy, vPx); // angle in canvas coords
    ctx.beginPath();
    ctx.moveTo(vPx, -vPy);
    ctx.lineTo(
      vPx - 12 * Math.cos(angle0 - 0.4),
      -vPy - 12 * Math.sin(angle0 - 0.4),
    );
    ctx.lineTo(
      vPx - 12 * Math.cos(angle0 + 0.4),
      -vPy - 12 * Math.sin(angle0 + 0.4),
    );
    ctx.closePath();
    ctx.fillStyle = "#FB923C";
    ctx.fill();
    // Label
    ctx.fillStyle = "#FB923C";
    ctx.font = "bold 13px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("V", vPx + 6, -vPy - 4);
    ctx.restore();

    // ── Component projections in S' ────────────────────────────────────────
    // V' components:  V'^x = cos(θ)Vx + sin(θ)Vy,  V'^y = -sin(θ)Vx + cos(θ)Vy
    const Vpx = Math.cos(theta) * VX + Math.sin(theta) * VY;
    const Vpy = -Math.sin(theta) * VX + Math.cos(theta) * VY;

    // Draw dashed projections onto rotated axes
    ctx.save();
    ctx.translate(ORIGIN_X, ORIGIN_Y);
    ctx.rotate(-theta);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(167,139,250,0.50)";
    ctx.lineWidth = 1;
    // Projection onto x' axis: go from tip of V to foot on x'
    const tipXrot = vPx * Math.cos(theta) + (-vPy) * Math.sin(theta);
    // Vertical drop to x' axis
    ctx.beginPath();
    ctx.moveTo(tipXrot, -(Vpy * GRID_SPACING)); // wait — recalc in rotated frame
    // In the rotated frame the vector tip is at (Vpx, -Vpy) * GRID_SPACING
    const tipX_rot = Vpx * GRID_SPACING;
    const tipY_rot = -Vpy * GRID_SPACING;
    ctx.moveTo(tipX_rot, tipY_rot);
    ctx.lineTo(tipX_rot, 0);
    ctx.stroke();
    ctx.moveTo(tipX_rot, tipY_rot);
    ctx.lineTo(0, tipY_rot);
    ctx.stroke();
    ctx.setLineDash([]);

    // Component tick on x' axis
    ctx.strokeStyle = "rgba(167,139,250,0.90)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tipX_rot, -6);
    ctx.lineTo(tipX_rot, 6);
    ctx.stroke();
    ctx.restore();

    // ── HUD box ────────────────────────────────────────────────────────────
    const hudX = 12;
    const hudY = 12;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(hudX, hudY, 300, 120);
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX, hudY, 300, 120);

    const fmt = (n: number) => n.toFixed(3);

    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Frame S components
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.fillText("Frame S  (Cartesian, fixed)", hudX + 10, hudY + 20);
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(`  V^x  =  ${fmt(VX)}`, hudX + 10, hudY + 38);
    ctx.fillText(`  V^y  =  ${fmt(VY)}`, hudX + 10, hudY + 53);

    // Frame S' components
    ctx.fillStyle = "rgba(167,139,250,0.90)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.fillText(`Frame S'  (rotated θ = ${(theta * 180 / Math.PI).toFixed(1)}°)`, hudX + 10, hudY + 75);
    ctx.fillStyle = "rgba(167,139,250,0.70)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(`  V'^x = ${fmt(Vpx)}`, hudX + 10, hudY + 93);
    ctx.fillText(`  V'^y = ${fmt(Vpy)}`, hudX + 10, hudY + 108);

    // ── Annotation ─────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "V is fixed — only its description changes",
      ORIGIN_X,
      H - 10,
    );
  }, [theta]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-44 shrink-0">
            rotation θ = {((theta * 180) / Math.PI).toFixed(1)}°
          </span>
          <input
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.01}
            value={theta}
            onChange={(e) => setTheta(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <p className="font-mono text-xs text-white/40">
          The orange vector V is fixed in the plane. As you rotate frame S' (purple
          axes) by θ, the components V'^x and V'^y change by the Jacobian
          (rotation matrix) while V^x and V^y stay constant. The vector itself
          hasn&apos;t moved — only its coordinate description has changed.
        </p>
      </div>
    </div>
  );
}
