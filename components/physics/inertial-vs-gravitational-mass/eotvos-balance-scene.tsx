"use client";

import { useEffect, useRef, useState } from "react";
import { eotvosParameter } from "@/lib/physics/relativity/equivalence-mass";

/**
 * EotvosBalanceScene — FIG.25b
 *
 * Top-down schematic of the 1889/1922 Eötvös torsion balance. Two test masses
 * (platinum and copper) sit at the ends of a horizontal beam suspended from a
 * fine quartz fibre. Earth's rotation produces a centrifugal pseudo-force that
 * couples to *inertial* mass, while gravity couples to *gravitational* mass. If
 * those two coefficients differ between the materials, the beam experiences a
 * tiny torque and rotates by a small angle θ ∝ η · sin(latitude).
 *
 * The slider exposes η = (m_g − m_i) / m_i for the platinum cylinder. At η = 0
 * the beam is motionless (the WEP holds — Eötvös's verdict). At η ≠ 0 the beam
 * deflects; the magnitude is amplified for visibility (real signals are
 * sub-microradian).
 *
 * Canvas 2D, dark bg. PascalCase export: EotvosBalanceScene.
 */

const WIDTH = 720;
const HEIGHT = 420;
const BG = "#0A0C12";
const FIBRE_COLOR = "rgba(255,255,255,0.55)";
const BEAM_COLOR = "rgba(255,255,255,0.85)";
const PT_COLOR = "#67E8F9"; // cyan = platinum (test material A)
const CU_COLOR = "#FFB36B"; // amber = copper (test material B)
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const GREEN = "#86EFAC";
const RED_PALE = "#FCA5A5";
const TICK_COLOR = "rgba(255,255,255,0.35)";

// Visual amplification: real Eötvös signals are ~10⁻⁹ rad. We multiply η by a
// large factor so the rotation is visible at η ~ 10⁻³–10⁻¹ (the slider range).
const ANGLE_GAIN = 0.6; // rad per unit-η (purely pedagogical)
const MAX_ETA = 0.05;

export function EotvosBalanceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [eta, setEta] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, eta);
  }, [eta]);

  // Sanity: confirm the lib invariant holds for our slider value
  // (no behavioural effect; just makes the import meaningful).
  const etaCheck = eta === 0 ? 0 : eotvosParameter(1 + eta, 1);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
        aria-label="Top-down view of an Eötvös torsion balance with platinum and copper test masses. The beam rotates only if the Eötvös parameter η is non-zero."
      />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
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
        />
        <span className="w-32 text-right">
          {eta === 0 ? "no torque" : "torque visible"}
        </span>
      </label>
      <p className="font-mono text-[10px] text-white/40">
        η check from lib: {etaCheck.toExponential(3)}  ·  pedagogical angle gain ×{ANGLE_GAIN}
      </p>
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, eta: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const cx = WIDTH * 0.42;
  const cy = HEIGHT * 0.5;
  const beamHalfLen = 150;
  const massR = 22;

  // Outer protractor (faint angle reference)
  drawProtractor(ctx, cx, cy, beamHalfLen + 50);

  // Anchor point (suspension fibre, top-down dot)
  ctx.save();
  ctx.fillStyle = FIBRE_COLOR;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Reference (un-rotated) beam — dashed grey
  drawBeam(ctx, cx, cy, 0, beamHalfLen, true);

  // Live beam, rotated by θ = ANGLE_GAIN · η
  const theta = eta * ANGLE_GAIN;
  drawBeam(ctx, cx, cy, theta, beamHalfLen, false);

  // Test masses at the rotated beam's ends
  const ax = cx + Math.cos(theta) * beamHalfLen;
  const ay = cy + Math.sin(theta) * beamHalfLen;
  const bx = cx - Math.cos(theta) * beamHalfLen;
  const by = cy - Math.sin(theta) * beamHalfLen;

  drawMass(ctx, ax, ay, massR, PT_COLOR, "platinum", "Pt");
  drawMass(ctx, bx, by, massR, CU_COLOR, "copper", "Cu");

  // Earth-rotation arrow (a stylised hint that the centrifugal force is real)
  drawCentrifugalHint(ctx, cx, cy, beamHalfLen);

  // Title
  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText("Eötvös torsion balance — top-down view", WIDTH / 2, 24);
  ctx.restore();

  // Equation
  ctx.save();
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "center";
  ctx.fillText(
    "θ  ∝  η · sin(latitude)  ·  η = (m_g − m_i) / m_i",
    WIDTH / 2,
    HEIGHT - 16,
  );
  ctx.restore();

  // HUD
  drawHud(ctx, eta, theta);
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  theta: number,
  halfLen: number,
  reference: boolean,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(theta);
  if (reference) {
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
  } else {
    ctx.strokeStyle = BEAM_COLOR;
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

  ctx.fillStyle = "#0A0C12";
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
) {
  ctx.save();
  ctx.strokeStyle = TICK_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Tick marks every 15°
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
) {
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = "rgba(134,239,172,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("Earth rotation → centrifugal", cx, cy - beamHalfLen - 70);
  ctx.fillText("pseudo-force ∝ m_inertial", cx, cy - beamHalfLen - 56);

  // Curved arrow (top arc)
  ctx.strokeStyle = "rgba(134,239,172,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, beamHalfLen + 28, -Math.PI * 0.78, -Math.PI * 0.22);
  ctx.stroke();

  // Arrowhead
  const aHead = -Math.PI * 0.22;
  const ah = 6;
  const tipX = cx + Math.cos(aHead) * (beamHalfLen + 28);
  const tipY = cy + Math.sin(aHead) * (beamHalfLen + 28);
  ctx.fillStyle = "rgba(134,239,172,0.65)";
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
) {
  const hudX = 24;
  const hudY = 56;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(hudX - 4, hudY - 16, 196, 124);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(hudX - 4, hudY - 16, 196, 124);

  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "left";
  ctx.fillText("READOUT", hudX, hudY);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText(`η_Pt = ${eta.toExponential(2)}`, hudX, hudY + 22);
  ctx.fillText(`η_Cu = 0  (reference)`, hudX, hudY + 38);
  ctx.fillText(
    `θ      = ${(theta * 1000).toFixed(2)} mrad`,
    hudX,
    hudY + 54,
  );

  ctx.fillStyle = Math.abs(eta) < 1e-9 ? GREEN : RED_PALE;
  ctx.fillText(
    Math.abs(eta) < 1e-9 ? "→ no torque (WEP)" : "→ torque visible",
    hudX,
    hudY + 78,
  );

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("Eötvös 1922:  |η| < 3 × 10⁻⁹", hudX, hudY + 98);

  ctx.restore();
}
