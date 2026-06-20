"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  deformedRing,
  symmetryAngle,
} from "@/lib/physics/relativity/polarization-modes";
import { Button } from "@/components/ui/button";

/**
 * FIG.51b — Spin-1 versus spin-2 polarization symmetry.
 *
 * Two panels share a single "rotate the detector / rotate the polarization"
 * slider ψ.
 *
 * LEFT (spin-1, photon): a transverse oscillation arrow. Its physical state
 *   returns to itself after a 360° rotation — rotate ψ by 180° and the
 *   field points the other way (a distinct state), only 360° brings it home.
 *
 * RIGHT (spin-2, graviton): the plus-mode strain ellipse on a test-mass
 *   ring. Rotate ψ by 90° and the pattern is identical (stretch ↔ squeeze
 *   axes swap, but a + at 90° is again a +). Quarter turn = same physics.
 *
 * The shared slider makes the contrast literal: spin s ⇒ pattern recurs
 * every 360°/s.
 */

const PAD = 18;

export function SpinSymmetryScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [psiDeg, setPsiDeg] = useState(0);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, (psiDeg * Math.PI) / 180, width, height);
  }, [psiDeg, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Side-by-side comparison of a spin-1 photon polarization arrow and a spin-2 gravitational-wave strain ellipse, both rotated by a shared angle slider, showing 360-degree versus 180-degree symmetry."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">rotate ψ = {psiDeg.toFixed(0)}°</span>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={psiDeg}
          onChange={(e) => setPsiDeg(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1 font-mono text-xs">
        {[0, 90, 180, 270, 360].map((d) => (
          <Button key={d} onClick={() => setPsiDeg(d)}>
            {d}°
          </Button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  psi: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const panelW = (W - PAD * 3) / 2;
  const leftCx = PAD + panelW / 2;
  const rightCx = PAD * 2 + panelW + panelW / 2;
  const cy = H / 2 + 4;
  const R = Math.min(panelW, H) * 0.3;

  // Panel borders
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD + 18, panelW, H - PAD * 2 - 30);
  ctx.strokeRect(PAD * 2 + panelW, PAD + 18, panelW, H - PAD * 2 - 30);

  drawSectionTitle(ctx, PAD + 4, PAD - 2, "SPIN-1  (PHOTON)", tokens.textMute);
  drawSectionTitle(ctx, PAD * 2 + panelW + 4, PAD - 2, "SPIN-2  (GRAVITON)", tokens.textMute);

  // ── LEFT: spin-1 oscillation arrow ──────────────────────────────────────
  // The field rotates with ψ at full rate (spin-1 → 360° recurrence).
  const ax = Math.cos(psi);
  const ay = Math.sin(psi);
  ctx.strokeStyle = hexToRgba(tokens.axes, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(leftCx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // double-headed arrow (E-field oscillates ±)
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftCx - ax * R, cy + ay * R);
  ctx.lineTo(leftCx + ax * R, cy - ay * R);
  ctx.stroke();
  drawArrowHead(ctx, leftCx + ax * R, cy - ay * R, -ay, -ax, tokens.cyan);
  drawArrowHead(ctx, leftCx - ax * R, cy + ay * R, ay, ax, tokens.cyan);

  // ── RIGHT: spin-2 strain ellipse ────────────────────────────────────────
  // Plus mode whose principal axis is rotated by ψ. Pattern recurs every 90°.
  const h = 0.34;
  const hPlus = h * Math.cos(2 * psi);
  const hCross = h * Math.sin(2 * psi);

  // faint rest ring
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.5);
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(rightCx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const ring = deformedRing(120, R, hPlus, hCross);
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ring.forEach((p, i) => {
    const px = rightCx + p.x;
    const py = cy - p.y;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();

  // test masses
  deformedRing(12, R, hPlus, hCross).forEach((p) => {
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(rightCx + p.x, cy - p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── HUD: recurrence readout ─────────────────────────────────────────────
  const recur1 = (symmetryAngle(1) * 180) / Math.PI; // 180 → but field state recurs at 360
  void recur1;
  let hy = PAD + 16;
  hy = drawHudReadout(
    ctx,
    PAD + 6,
    hy,
    "recurs every ",
    "360°",
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    PAD * 2 + panelW + 6,
    PAD + 16,
    "recurs every ",
    "90°",
    tokens.textDim,
    tokens.magenta,
  );

  // mark when patterns coincide with their start
  const back90 = Math.abs(((psi * 180) / Math.PI) % 90) < 1.5;
  if (back90) {
    ctx.fillStyle = tokens.mint;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("identical to start", rightCx, H - PAD - 2);
    ctx.textAlign = "left";
  }
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nx: number,
  ny: number,
  color: string,
) {
  // nx, ny: a perpendicular direction to splay the head
  const s = 7;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + nx * s - ny * s * 0.5, y + ny * s + nx * s * 0.5);
  ctx.lineTo(x + nx * s + ny * s * 0.5, y + ny * s - nx * s * 0.5);
  ctx.closePath();
  ctx.fill();
}
