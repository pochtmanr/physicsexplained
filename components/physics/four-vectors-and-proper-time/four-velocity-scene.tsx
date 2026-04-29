"use client";

import { useEffect, useRef, useState } from "react";
import { fourVelocity } from "@/lib/physics/relativity/four-vectors";
import { gamma } from "@/lib/physics/relativity/types";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * FIG.14a — The 3-velocity vector v on the left vs the four-velocity
 * components u^μ = γ(c, v_x, v_y, v_z) on the right. β slider drives both.
 *
 * Left panel: a 2D arrow in the (v_x, v_y) plane (the z-component is held
 * at zero for visual clarity). The arrow head is clamped to the |v| < c
 * disc so the slider cannot draw a superluminal vector. The disc boundary
 * (|v| = c) is rendered as a dashed amber circle — the unreachable
 * asymptote.
 *
 * Right panel: a four-bar chart of |u^0|/c, |u^1|/c, |u^2|/c, |u^3|/c
 * in units of c, plus a HUD line that prints u^μ u_μ / c² — which stays
 * pinned at exactly 1 for every β. That invariance is the geometric
 * statement of "everyone moves through spacetime at c."
 */

const CANVAS_W = 640;
const CANVAS_H = 320;
const PANEL_PAD = 24;

export function FourVelocityScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.6);
  const [angleDeg, setAngleDeg] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const angleRad = (angleDeg * Math.PI) / 180;
    const v = {
      x: beta * SPEED_OF_LIGHT * Math.cos(angleRad),
      y: beta * SPEED_OF_LIGHT * Math.sin(angleRad),
      z: 0,
    };
    const u = fourVelocity(v);
    const g = gamma(beta);

    // ── Left panel: 3-velocity arrow in the (v_x, v_y) plane ─────────────
    const leftCx = CANVAS_W * 0.25;
    const leftCy = CANVAS_H * 0.5;
    const radius = Math.min(CANVAS_W * 0.2, CANVAS_H * 0.4);

    // |v| = c circle — unreachable asymptote.
    ctx.strokeStyle = "#FFD66B";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(leftCx, leftCy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftCx - radius - 8, leftCy);
    ctx.lineTo(leftCx + radius + 8, leftCy);
    ctx.moveTo(leftCx, leftCy - radius - 8);
    ctx.lineTo(leftCx, leftCy + radius + 8);
    ctx.stroke();

    // Velocity arrow (cyan)
    const ax = leftCx + radius * beta * Math.cos(angleRad);
    const ay = leftCy - radius * beta * Math.sin(angleRad);
    ctx.strokeStyle = "#67E8F9";
    ctx.fillStyle = "#67E8F9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftCx, leftCy);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    // Arrowhead
    const headLen = 8;
    const dxh = ax - leftCx;
    const dyh = ay - leftCy;
    const arrAng = Math.atan2(dyh, dxh);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - headLen * Math.cos(arrAng - Math.PI / 6),
      ay - headLen * Math.sin(arrAng - Math.PI / 6),
    );
    ctx.lineTo(
      ax - headLen * Math.cos(arrAng + Math.PI / 6),
      ay - headLen * Math.sin(arrAng + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();

    // Left-panel labels
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("3-velocity v", leftCx, PANEL_PAD);
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,214,107,0.85)";
    ctx.fillText("|v| = c (unreachable)", leftCx, leftCy + radius + 22);

    ctx.fillStyle = "#67E8F9";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`|v|/c = ${beta.toFixed(2)}`, leftCx + radius + 16, leftCy - 8);

    // ── Divider ────────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W * 0.5, PANEL_PAD);
    ctx.lineTo(CANVAS_W * 0.5, CANVAS_H - PANEL_PAD);
    ctx.stroke();

    // ── Right panel: four-velocity components, in units of c ─────────────
    const rightX0 = CANVAS_W * 0.5 + 28;
    const rightX1 = CANVAS_W - PANEL_PAD;
    const barAreaTop = PANEL_PAD + 32;
    const barAreaBot = CANVAS_H - PANEL_PAD - 36;
    const barAreaH = barAreaBot - barAreaTop;

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "four-velocity u^μ = γ(c, v_x, v_y, v_z)",
      (rightX0 + rightX1) / 2,
      PANEL_PAD,
    );

    const labels = ["u⁰/c", "u¹/c", "u²/c", "u³/c"];
    const components = [u[0] / SPEED_OF_LIGHT, u[1] / SPEED_OF_LIGHT, u[2] / SPEED_OF_LIGHT, u[3] / SPEED_OF_LIGHT];
    const colors = ["#67E8F9", "#FF6ADE", "#FFB36B", "#A0A0FF"];
    const maxVal = Math.max(2, g + 0.5);
    const colWidth = (rightX1 - rightX0) / 4;

    // Baseline
    const baselineY = barAreaBot - (barAreaH * 0) / maxVal;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(rightX0 - 4, baselineY);
    ctx.lineTo(rightX1 + 4, baselineY);
    ctx.stroke();

    // Reference line at value = 1 (where |u^0|/c sits at β = 0)
    const oneY = barAreaBot - barAreaH / maxVal;
    ctx.strokeStyle = "rgba(255,214,107,0.45)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(rightX0 - 4, oneY);
    ctx.lineTo(rightX1 + 4, oneY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,214,107,0.7)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("y = 1", rightX1 - 36, oneY - 4);

    for (let i = 0; i < 4; i++) {
      const cx = rightX0 + colWidth * (i + 0.5);
      const barW = colWidth * 0.4;
      const val = components[i];
      const barH = (Math.abs(val) / maxVal) * barAreaH;
      const barTop = val >= 0 ? baselineY - barH : baselineY;
      ctx.fillStyle = colors[i];
      ctx.fillRect(cx - barW / 2, barTop, barW, barH);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], cx, barAreaBot + 16);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(val.toFixed(3), cx, barAreaBot + 30);
    }

    // ── Top-right HUD: the invariant ────────────────────────────────────
    const norm = (u[0] * u[0] - u[1] * u[1] - u[2] * u[2] - u[3] * u[3]) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT);
    ctx.fillStyle = "#FFD66B";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `u^μ u_μ / c² = ${norm.toFixed(6)}  (invariant, every observer agrees)`,
      rightX0,
      CANVAS_H - PANEL_PAD - 8,
    );

    // β = 0 reminder
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(`γ = ${g.toFixed(4)}`, rightX0, PANEL_PAD + 16);
  }, [beta, angleDeg]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-24">β = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-24">θ = {angleDeg.toFixed(0)}°</span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={angleDeg}
            onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      </div>
    </div>
  );
}
