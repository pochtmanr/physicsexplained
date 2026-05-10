"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.28a — The same falling apple, two interpretations.
 *
 * Newtonian view (left) vs GR view (right) — same trajectory, two readings.
 */

const PAD = 16;
const T_MAX = 1.0;

function applePos(
  t: number,
  panelX0: number,
  panelY0: number,
  panelW: number,
) {
  const xLocal = t * (panelW - 60);
  const yLocal = 40 + 4.5 * (xLocal / (panelW - 60)) * xLocal;
  return { x: panelX0 + 30 + xLocal, y: panelY0 + 30 + yLocal };
}

export function CurvedTrajectoryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });
  const [t, setT] = useState(0.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, t, tokens);
  }, [t, tokens, width, height]);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
          <span className="w-28">progress = {t.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={T_MAX}
            step={0.01}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <p className="font-mono text-xs text-[var(--color-fg-4)]">
          Same trajectory, two interpretations. Newton: a force pulls. Einstein: spacetime is curved
          and the apple takes the straightest available path. The observed motion is identical;
          the explanation is geometric.
        </p>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const PANEL_W = (W - PAD * 3) / 2;

  // ── LEFT PANEL: Newtonian
  const leftX0 = PAD;
  const leftY0 = PAD;

  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.10);
  ctx.lineWidth = 1;
  ctx.strokeRect(leftX0, leftY0, PANEL_W, H - PAD * 2);

  ctx.fillStyle = tokens.cyan;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("NEWTON  ·  a force pulls the apple", leftX0 + 8, leftY0 + 18);

  // Earth schematic — physical brick/soil tone (kept as real material color)
  ctx.fillStyle = "rgba(180,140,90,0.50)";
  ctx.fillRect(leftX0 + 4, H - PAD - 24, PANEL_W - 8, 20);
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.40);
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("Earth", leftX0 + PANEL_W / 2, H - PAD - 8);

  // Trajectory
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.40);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let s = 0; s <= 60; s++) {
    const tt = s / 60;
    const p = applePos(tt, leftX0, leftY0, PANEL_W);
    if (s === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  const appleL = applePos(t, leftX0, leftY0, PANEL_W);
  ctx.fillStyle = tokens.orange;
  ctx.beginPath();
  ctx.arc(appleL.x, appleL.y, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = tokens.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(appleL.x, appleL.y);
  ctx.lineTo(appleL.x, appleL.y + 38);
  ctx.stroke();
  ctx.fillStyle = tokens.red;
  ctx.beginPath();
  ctx.moveTo(appleL.x, appleL.y + 42);
  ctx.lineTo(appleL.x - 5, appleL.y + 34);
  ctx.lineTo(appleL.x + 5, appleL.y + 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tokens.red;
  ctx.font = "bold 10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("F = mg", appleL.x + 8, appleL.y + 28);

  ctx.fillStyle = tokens.textDim;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("trajectory bends BECAUSE a force acts", leftX0 + 8, H - PAD - 36);

  // ── RIGHT PANEL: GR
  const rightX0 = PAD * 2 + PANEL_W;
  const rightY0 = PAD;

  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.10);
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX0, rightY0, PANEL_W, H - PAD * 2);

  ctx.fillStyle = tokens.purple;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("EINSTEIN  ·  a geodesic in curved spacetime", rightX0 + 8, rightY0 + 18);

  ctx.fillStyle = "rgba(180,140,90,0.50)";
  ctx.fillRect(rightX0 + 4, H - PAD - 24, PANEL_W - 8, 20);
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.40);
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("Earth (curving spacetime around it)", rightX0 + PANEL_W / 2, H - PAD - 8);

  ctx.strokeStyle = hexToRgba(tokens.purple, 0.18);
  ctx.lineWidth = 1;
  for (let row = 0; row < 6; row++) {
    const baseY = rightY0 + 50 + row * 38;
    ctx.beginPath();
    const samples = 30;
    for (let i = 0; i <= samples; i++) {
      const xL = rightX0 + 8 + (i / samples) * (PANEL_W - 16);
      const curvatureStrength = 0.25 + row * 0.08;
      const center = rightX0 + PANEL_W / 2;
      const dxFromCenter = xL - center;
      const sag = curvatureStrength * Math.exp(-(dxFromCenter * dxFromCenter) / 4500);
      const yL = baseY + sag * 14;
      if (i === 0) ctx.moveTo(xL, yL);
      else ctx.lineTo(xL, yL);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba(tokens.purple, 0.55);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let s = 0; s <= 60; s++) {
    const tt = s / 60;
    const p = applePos(tt, rightX0, rightY0, PANEL_W);
    if (s === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  const appleR = applePos(t, rightX0, rightY0, PANEL_W);
  ctx.fillStyle = tokens.orange;
  ctx.beginPath();
  ctx.arc(appleR.x, appleR.y, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = tokens.purple;
  ctx.font = "bold 10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("(no force) ", appleR.x + 8, appleR.y - 4);
  ctx.fillStyle = hexToRgba(tokens.purple, 0.85);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("→ straightest path in the local geometry", appleR.x + 8, appleR.y + 12);

  ctx.fillStyle = tokens.textDim;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("trajectory bends BECAUSE spacetime is curved", rightX0 + 8, H - PAD - 36);
}
