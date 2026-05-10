"use client";

import { useEffect, useRef, useState } from "react";
import { fourVelocity } from "@/lib/physics/relativity/four-vectors";
import { gamma } from "@/lib/physics/relativity/types";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.14a — The 3-velocity vector v on the left vs the four-velocity
 * components u^μ = γ(c, v_x, v_y, v_z) on the right. β slider drives both.
 */

const PANEL_PAD = 24;

export function FourVelocityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [beta, setBeta] = useState(0.6);
  const [angleDeg, setAngleDeg] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    const CANVAS_W = width;
    const CANVAS_H = height;

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
    ctx.strokeStyle = tokens.amber;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(leftCx, leftCy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = tokens.axes;
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
    ctx.strokeStyle = tokens.cyan;
    ctx.fillStyle = tokens.cyan;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftCx, leftCy);
    ctx.lineTo(ax, ay);
    ctx.stroke();
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

    ctx.fillStyle = tokens.textBright;
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("3-velocity v", leftCx, PANEL_PAD);
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = tokens.amber;
    ctx.fillText("|v| = c (unreachable)", leftCx, leftCy + radius + 22);

    ctx.fillStyle = tokens.cyan;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`|v|/c = ${beta.toFixed(2)}`, leftCx + radius + 16, leftCy - 8);

    // ── Divider ────────────────────────────────────────────────────────────
    ctx.strokeStyle = tokens.panelBorder;
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

    ctx.fillStyle = tokens.textBright;
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "four-velocity u^μ = γ(c, v_x, v_y, v_z)",
      (rightX0 + rightX1) / 2,
      PANEL_PAD,
    );

    const labels = ["u⁰/c", "u¹/c", "u²/c", "u³/c"];
    const components = [u[0] / SPEED_OF_LIGHT, u[1] / SPEED_OF_LIGHT, u[2] / SPEED_OF_LIGHT, u[3] / SPEED_OF_LIGHT];
    const colors = [tokens.cyan, tokens.magenta, tokens.orange, tokens.purple];
    const maxVal = Math.max(2, g + 0.5);
    const colWidth = (rightX1 - rightX0) / 4;

    // Baseline
    const baselineY = barAreaBot - (barAreaH * 0) / maxVal;
    ctx.strokeStyle = tokens.axes;
    ctx.beginPath();
    ctx.moveTo(rightX0 - 4, baselineY);
    ctx.lineTo(rightX1 + 4, baselineY);
    ctx.stroke();

    // Reference line at value = 1
    const oneY = barAreaBot - barAreaH / maxVal;
    ctx.strokeStyle = tokens.amber;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(rightX0 - 4, oneY);
    ctx.lineTo(rightX1 + 4, oneY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.amber;
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
      ctx.fillStyle = tokens.textBright;
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], cx, barAreaBot + 16);
      ctx.fillStyle = tokens.textDim;
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(val.toFixed(3), cx, barAreaBot + 30);
    }

    // ── HUD: the invariant ────────────────────────────────────
    const norm = (u[0] * u[0] - u[1] * u[1] - u[2] * u[2] - u[3] * u[3]) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT);
    ctx.fillStyle = tokens.amber;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `u^μ u_μ / c² = ${norm.toFixed(6)}  (invariant, every observer agrees)`,
      rightX0,
      CANVAS_H - PANEL_PAD - 8,
    );

    ctx.fillStyle = tokens.textMute;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(`γ = ${g.toFixed(4)}`, rightX0, PANEL_PAD + 16);
  }, [beta, angleDeg, tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-24">β = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-24">θ = {angleDeg.toFixed(0)}°</span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={angleDeg}
            onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </label>
      </div>
    </div>
  );
}
