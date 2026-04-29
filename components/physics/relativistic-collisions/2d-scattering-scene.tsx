"use client";

import { useEffect, useRef, useState } from "react";
import { fourMomentum } from "@/lib/physics/relativity/four-momentum";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * FIG.18c — 2D elastic scattering: relativistic vs. Newtonian outgoing angles.
 *
 * Setup: equal-mass particles m.
 *   • Particle 1 (projectile) arrives along +x with velocity β·c.
 *   • Particle 2 (target) is at rest.
 *
 * After the collision the two particles scatter at angles ±θ relative to the
 * beam axis. In the Newtonian limit the outgoing angle satisfies a 90° sum:
 *   θ₁ + θ₂ = 90° (Newtonian billiards, equal masses).
 * In relativity this is no longer exact; the sum θ₁ + θ₂ < 90° at high β,
 * and the relativistic angles are computed from four-momentum conservation.
 *
 * We solve the 2D elastic equal-mass scattering by working in the CoM frame
 * (where both particles approach symmetrically), picking a scatter angle φ
 * in the CoM, and boosting back to the lab frame.
 *
 * Sliders: incoming β (0.01–0.95), CoM scatter angle φ (0°–90°).
 *
 * Color palette:
 *   cyan    = projectile (incoming)
 *   amber   = target (stationary)
 *   green   = scattered particle 1 (upper)
 *   magenta = scattered particle 2 (lower)
 */

const WIDTH = 720;
const HEIGHT = 360;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  headSize = 8,
  dashed = false,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  if (dashed) ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headSize * Math.cos(angle - Math.PI / 7),
    y2 - headSize * Math.sin(angle - Math.PI / 7),
  );
  ctx.lineTo(
    x2 - headSize * Math.cos(angle + Math.PI / 7),
    y2 - headSize * Math.sin(angle + Math.PI / 7),
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Solve 2D elastic equal-mass scattering in lab frame given:
 *   beta_in  = incoming projectile β
 *   phi      = CoM scatter angle (radians) of particle 1
 *
 * Returns angles θ₁ (particle 1, upper) and θ₂ (particle 2, lower)
 * in the lab frame, plus the Newtonian approximation for comparison.
 */
function solveScatteringAngles(betaIn: number, phi: number) {
  // CoM frame: both particles approach along ±x at β_com.
  // For lab-frame projectile at β_in, target at rest:
  //   β_com = β_in / (1 + γ_in) (CoM velocity in lab = β_in / (γ_in + 1))
  const gIn = gamma(betaIn);
  const betaCom = betaIn / (1 + gIn); // CoM velocity in lab

  // In CoM frame each particle has speed β_com.
  // After scatter by angle phi, particle 1 goes at (phi, 0) from +x.
  // Momentum in CoM: p* = γ_com · m · β_com (natural units, c = 1)
  const gCom = gamma(betaCom);

  // CoM-frame four-momentum of particle 1 after scatter:
  //   p*^μ = (γ_com m, γ_com m β_com cos(phi), γ_com m β_com sin(phi), 0)
  // CoM-frame four-momentum of particle 2 after scatter (opposite direction):
  //   p*'^μ = (γ_com m, -γ_com m β_com cos(phi), -γ_com m β_com sin(phi), 0)

  const E_star = gCom; // natural units, m = 1
  const p_star = gCom * betaCom;

  // Boost from CoM to lab (boost by +β_com along x)
  // Lab four-momentum of particle 1:
  //   p^0_lab = γ_com (E* + β_com · p*_x)
  //   p^x_lab = γ_com (p*_x + β_com · E*)
  //   p^y_lab = p*_y
  const p1x_com = p_star * Math.cos(phi);
  const p1y_com = p_star * Math.sin(phi);
  const p1E_lab = gCom * (E_star + betaCom * p1x_com);
  const p1x_lab = gCom * (p1x_com + betaCom * E_star);
  const p1y_lab = p1y_com;
  const theta1 = Math.atan2(p1y_lab, p1x_lab);

  // Particle 2 in CoM: opposite direction
  const p2x_com = -p_star * Math.cos(phi);
  const p2y_com = -p_star * Math.sin(phi);
  const p2E_lab = gCom * (E_star + betaCom * p2x_com);
  const p2x_lab = gCom * (p2x_com + betaCom * E_star);
  const p2y_lab = p2y_com;
  const theta2 = Math.atan2(-p2y_lab, p2x_lab); // magnitude of lower angle

  // Newtonian: θ₁ = phi/2, θ₂ = (π/2 - phi/2) for equal masses
  const theta1Newton = phi / 2;
  const theta2Newton = Math.PI / 2 - phi / 2;
  const thetaSumNewton = theta1Newton + theta2Newton; // always π/2
  const thetaSumRel = theta1 + theta2;

  // Particle lab-frame momenta magnitudes for arrow scaling
  const p1Mag = Math.sqrt(p1x_lab * p1x_lab + p1y_lab * p1y_lab);
  const p2Mag = Math.sqrt(p2x_lab * p2x_lab + p2y_lab * p2y_lab);

  return {
    theta1,
    theta2,
    theta1Newton,
    theta2Newton,
    thetaSumRel,
    thetaSumNewton,
    p1E_lab,
    p2E_lab,
    p1Mag,
    p2Mag,
  };
}

export function TwoDScatteringScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [betaIn, setBetaIn] = useState(0.6);
  const [phiDeg, setPhiDeg] = useState(45);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const phi = (phiDeg * Math.PI) / 180;
    const result = solveScatteringAngles(betaIn, phi);
    const {
      theta1,
      theta2,
      theta1Newton,
      theta2Newton,
      thetaSumRel,
      thetaSumNewton,
      p1Mag,
      p2Mag,
    } = result;

    // Layout
    const collX = 300;
    const collY = HEIGHT / 2 - 10;
    const incomingLen = 150;
    const arrowScale = 130;

    // Background grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let xv = 0; xv <= WIDTH; xv += 60) {
      ctx.beginPath();
      ctx.moveTo(xv, 20);
      ctx.lineTo(xv, HEIGHT - 90);
      ctx.stroke();
    }
    for (let yv = 20; yv <= HEIGHT - 90; yv += 60) {
      ctx.beginPath();
      ctx.moveTo(0, yv);
      ctx.lineTo(WIDTH, yv);
      ctx.stroke();
    }

    // Beam axis (dashed)
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, collY);
    ctx.lineTo(WIDTH, collY);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- INCOMING PROJECTILE (cyan) ---
    drawArrow(
      ctx,
      collX - incomingLen,
      collY,
      collX - 15,
      collY,
      "#67E8F9",
    );
    // Projectile ball
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.arc(collX - incomingLen - 14, collY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", collX - incomingLen - 14, collY + 4);

    // β label
    ctx.fillStyle = "#67E8F9";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`β = ${betaIn.toFixed(2)}`, collX - incomingLen - 14, collY - 22);

    // --- TARGET (amber, at rest) ---
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(collX, collY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", collX, collY + 4);
    ctx.fillStyle = "#FBBF24";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("β = 0", collX, collY - 22);

    // Collision spark
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(collX + 16 * Math.cos(angle), collY + 16 * Math.sin(angle));
      ctx.lineTo(collX + 26 * Math.cos(angle), collY + 26 * Math.sin(angle));
      ctx.stroke();
    }

    // --- NEWTONIAN outgoing (dashed, dimmer) ---
    const newtonScale = arrowScale * 0.7;
    // Particle 1 Newton
    drawArrow(
      ctx,
      collX,
      collY,
      collX + newtonScale * Math.cos(theta1Newton),
      collY - newtonScale * Math.sin(theta1Newton),
      "rgba(74, 222, 128, 0.3)",
      6,
      true,
    );
    // Particle 2 Newton
    drawArrow(
      ctx,
      collX,
      collY,
      collX + newtonScale * Math.cos(theta2Newton),
      collY + newtonScale * Math.sin(theta2Newton),
      "rgba(255, 106, 222, 0.3)",
      6,
      true,
    );

    // Newton sum angle arc
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(collX, collY, newtonScale * 0.6, -theta1Newton, theta2Newton);
    ctx.stroke();

    // --- RELATIVISTIC outgoing (solid) ---
    const p1ArrowLen = Math.min(arrowScale * p1Mag, arrowScale * 1.5);
    const p2ArrowLen = Math.min(arrowScale * p2Mag, arrowScale * 1.5);

    drawArrow(
      ctx,
      collX,
      collY,
      collX + p1ArrowLen * Math.cos(theta1),
      collY - p1ArrowLen * Math.sin(theta1),
      "#4ADE80",
    );
    drawArrow(
      ctx,
      collX,
      collY,
      collX + p2ArrowLen * Math.cos(theta2),
      collY + p2ArrowLen * Math.sin(theta2),
      "#FF6ADE",
    );

    // Angle labels (relativistic)
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "#4ADE80";
    const lx1 = collX + (p1ArrowLen + 18) * Math.cos(theta1);
    const ly1 = collY - (p1ArrowLen + 18) * Math.sin(theta1);
    ctx.textAlign = "left";
    ctx.fillText(`θ₁ = ${((theta1 * 180) / Math.PI).toFixed(1)}°`, lx1, ly1);

    ctx.fillStyle = "#FF6ADE";
    const lx2 = collX + (p2ArrowLen + 18) * Math.cos(theta2);
    const ly2 = collY + (p2ArrowLen + 18) * Math.sin(theta2);
    ctx.fillText(`θ₂ = ${((theta2 * 180) / Math.PI).toFixed(1)}°`, lx2, ly2);

    // Newtonian angle labels (dim)
    ctx.fillStyle = "rgba(74, 222, 128, 0.45)";
    ctx.font = "10px ui-monospace, monospace";
    const nlx1 = collX + (newtonScale + 15) * Math.cos(theta1Newton);
    const nly1 = collY - (newtonScale + 15) * Math.sin(theta1Newton);
    ctx.textAlign = "left";
    ctx.fillText(`θ₁ᴺ = ${((theta1Newton * 180) / Math.PI).toFixed(1)}°`, nlx1, nly1);
    ctx.fillStyle = "rgba(255, 106, 222, 0.45)";
    const nlx2 = collX + (newtonScale + 15) * Math.cos(theta2Newton);
    const nly2 = collY + (newtonScale + 15) * Math.sin(theta2Newton);
    ctx.fillText(`θ₂ᴺ = ${((theta2Newton * 180) / Math.PI).toFixed(1)}°`, nlx2, nly2);

    // Legend (top right)
    ctx.textAlign = "left";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = "#4ADE80";
    ctx.fillText("— relativistic", WIDTH - 160, 38);
    ctx.fillStyle = "rgba(74, 222, 128, 0.4)";
    ctx.fillText("- - Newtonian", WIDTH - 160, 52);

    // --- HUD ---
    const hudY = HEIGHT - 88;
    ctx.fillStyle = "rgba(10, 12, 18, 0.88)";
    ctx.fillRect(0, hudY, WIDTH, 88);

    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(
      `β_in = ${betaIn.toFixed(3)}   γ = ${gamma(betaIn).toFixed(4)}   φ_CoM = ${phiDeg.toFixed(0)}°`,
      12,
      hudY + 16,
    );

    ctx.fillStyle = "#4ADE80";
    ctx.fillText(
      `Relativistic:  θ₁ = ${((theta1 * 180) / Math.PI).toFixed(3)}°   θ₂ = ${((theta2 * 180) / Math.PI).toFixed(3)}°   sum = ${((thetaSumRel * 180) / Math.PI).toFixed(3)}°`,
      12,
      hudY + 32,
    );

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(
      `Newtonian:     θ₁ = ${((theta1Newton * 180) / Math.PI).toFixed(3)}°   θ₂ = ${((theta2Newton * 180) / Math.PI).toFixed(3)}°   sum = ${((thetaSumNewton * 180) / Math.PI).toFixed(3)}°  (always 90°)`,
      12,
      hudY + 48,
    );

    const deficit = (90 - (thetaSumRel * 180) / Math.PI).toFixed(3);
    ctx.fillStyle = "#FBBF24";
    ctx.fillText(
      `Relativistic deficit: θ₁ + θ₂ = 90° − ${deficit}°   (diverges with β)`,
      12,
      hudY + 64,
    );

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("equal-mass elastic 2D — c = 1 natural units", WIDTH - 12, hudY + 80);
  }, [betaIn, phiDeg]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <div className="flex w-full max-w-[720px] flex-col gap-2">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-36">β_in = {betaIn.toFixed(2)}</span>
          <input
            type="range"
            min={0.01}
            max={0.95}
            step={0.01}
            value={betaIn}
            onChange={(e) => setBetaIn(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-36">φ_CoM = {phiDeg.toFixed(0)}°</span>
          <input
            type="range"
            min={5}
            max={85}
            step={1}
            value={phiDeg}
            onChange={(e) => setPhiDeg(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      </div>
    </div>
  );
}
