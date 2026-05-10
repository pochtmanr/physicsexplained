"use client";

import { useEffect, useRef, useState } from "react";
import { eotvosParameter } from "@/lib/physics/relativity/equivalence-mass";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * EotvosBalanceScene — FIG.25b
 *
 * Top-down schematic of the 1889/1922 Eötvös torsion balance.
 */

const ANGLE_GAIN = 0.6;
const MAX_ETA = 0.05;

export function EotvosBalanceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 320,
  });
  const [eta, setEta] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, width, height, eta, tokens);
  }, [eta, tokens, width, height]);

  const etaCheck = eta === 0 ? 0 : eotvosParameter(1 + eta, 1);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Top-down view of an Eötvös torsion balance with platinum and copper test masses. The beam rotates only if the Eötvös parameter η is non-zero."
      />
      <label className="flex w-full items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32">
          η<sub>Pt</sub> = {eta.toExponential(2)}
        </span>
        <input
          type="range"
          min={-MAX_ETA}
          max={MAX_ETA}
          step={MAX_ETA / 100}
          value={eta}
          onChange={(e) => setEta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <span className="w-32 text-right">
          {eta === 0 ? "no torque" : "torque visible"}
        </span>
      </label>
      <p className="font-mono text-[10px] text-[var(--color-fg-4)]">
        η check from lib: {etaCheck.toExponential(3)}  ·  pedagogical angle gain ×{ANGLE_GAIN}
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  eta: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.42;
  const cy = H * 0.5;
  const beamHalfLen = Math.min(150, Math.min(W, H) * 0.32);
  const massR = 22;

  drawProtractor(ctx, cx, cy, beamHalfLen + 50, tokens);

  // Anchor point
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.55);
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.85);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  drawBeam(ctx, cx, cy, 0, beamHalfLen, true, tokens);
  const theta = eta * ANGLE_GAIN;
  drawBeam(ctx, cx, cy, theta, beamHalfLen, false, tokens);

  const ax = cx + Math.cos(theta) * beamHalfLen;
  const ay = cy + Math.sin(theta) * beamHalfLen;
  const bx = cx - Math.cos(theta) * beamHalfLen;
  const by = cy - Math.sin(theta) * beamHalfLen;

  drawMass(ctx, ax, ay, massR, tokens.cyan, "platinum", "Pt", tokens);
  drawMass(ctx, bx, by, massR, tokens.amber, "copper", "Cu", tokens);

  drawCentrifugalHint(ctx, cx, cy, beamHalfLen, tokens);

  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText("Eötvös torsion balance — top-down view", W / 2, 24);
  ctx.restore();

  ctx.save();
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.fillText(
    "θ  ∝  η · sin(latitude)  ·  η = (m_g − m_i) / m_i",
    W / 2,
    H - 16,
  );
  ctx.restore();

  drawHud(ctx, eta, theta, tokens);
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  theta: number,
  halfLen: number,
  reference: boolean,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(theta);
  if (reference) {
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.18);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
  } else {
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.85);
    ctx.lineWidth = 3;
  }
  ctx.beginPath();
  ctx.moveTo(-halfLen, 0);
  ctx.lineTo(halfLen, 0);
  ctx.stroke();
  ctx.restore();
}

function drawMass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  label: string,
  symbol: string,
  tokens: SceneTokens,
) {
  ctx.save();
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = tokens.bg;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, x, y + 1);

  ctx.fillStyle = color;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x, y + r + 14);
  ctx.restore();
}

function drawProtractor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const r1 = R - (i % 6 === 0 ? 12 : 6);
    const x1 = cx + Math.cos(a) * r1;
    const y1 = cy + Math.sin(a) * r1;
    const x2 = cx + Math.cos(a) * R;
    const y2 = cy + Math.sin(a) * R;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCentrifugalHint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  beamHalfLen: number,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = hexToRgba(tokens.mint, 0.7);
  ctx.textAlign = "center";
  ctx.fillText("Earth rotation → centrifugal", cx, cy - beamHalfLen - 70);
  ctx.fillText("pseudo-force ∝ m_inertial", cx, cy - beamHalfLen - 56);

  ctx.strokeStyle = hexToRgba(tokens.mint, 0.55);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, beamHalfLen + 28, -Math.PI * 0.78, -Math.PI * 0.22);
  ctx.stroke();

  const aHead = -Math.PI * 0.22;
  const ah = 6;
  const tipX = cx + Math.cos(aHead) * (beamHalfLen + 28);
  const tipY = cy + Math.sin(aHead) * (beamHalfLen + 28);
  ctx.fillStyle = hexToRgba(tokens.mint, 0.65);
  ctx.beginPath();
  ctx.moveTo(tipX + ah, tipY);
  ctx.lineTo(tipX - ah, tipY - ah);
  ctx.lineTo(tipX - ah, tipY + ah);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  eta: number,
  theta: number,
  tokens: SceneTokens,
) {
  const hudX = 24;
  const hudY = 56;
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.04);
  ctx.fillRect(hudX - 4, hudY - 16, 196, 124);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.strokeRect(hudX - 4, hudY - 16, 196, 124);

  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "left";
  ctx.fillText("READOUT", hudX, hudY);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText(`η_Pt = ${eta.toExponential(2)}`, hudX, hudY + 22);
  ctx.fillText(`η_Cu = 0  (reference)`, hudX, hudY + 38);
  ctx.fillText(
    `θ      = ${(theta * 1000).toFixed(2)} mrad`,
    hudX,
    hudY + 54,
  );

  ctx.fillStyle = Math.abs(eta) < 1e-9 ? tokens.mint : tokens.red;
  ctx.fillText(
    Math.abs(eta) < 1e-9 ? "→ no torque (WEP)" : "→ torque visible",
    hudX,
    hudY + 78,
  );

  ctx.fillStyle = tokens.textFaint;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("Eötvös 1922:  |η| < 3 × 10⁻⁹", hudX, hudY + 98);

  ctx.restore();
}
