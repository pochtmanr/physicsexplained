"use client";

import { useEffect, useRef, useState } from "react";
import { inelasticMergerMass } from "@/lib/physics/relativity/relativistic-collision";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * FIG.18b — Inelastic merger: kinetic energy becomes rest mass.
 *
 * Two particles of mass m collide head-on at ±β and merge into a single
 * particle at rest in the CoM frame. The final rest mass is:
 *
 *   m_final = 2γ(β)·m
 *
 * which is strictly greater than the Newtonian 2m. The difference
 * (2γ − 2)m is kinetic energy that has been converted to rest mass.
 *
 * At β = 0.5: γ = 1/√(1−0.25) ≈ 1.1547, m_final ≈ 2.309m — a 15.5% surplus.
 *
 * Sliders: mass m (0.5–5), velocity β (0.01–0.95).
 *
 * Color palette:
 *   cyan    = particle 1 (incoming)
 *   magenta = particle 2 (incoming)
 *   amber   = merged particle (final state)
 */

const WIDTH = 720;
const HEIGHT = 320;

export function InelasticMergerScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.5);
  const [mass, setMass] = useState(1.0);

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

    const g = gamma(beta);
    // c = 1 natural units for display. inelasticMergerMass uses SPEED_OF_LIGHT
    // internally but we call it with dimensionless β and then express m_final
    // as a multiple of m. We pass c = 1 override to work in natural units.
    const mFinal = inelasticMergerMass(mass, beta, mass, -beta, 1);
    const mNewton = 2 * mass;
    const massExcess = (mFinal - mNewton) / mNewton; // fractional excess

    // Layout
    const midX = WIDTH / 2;
    const lineY = HEIGHT / 2 - 20;
    const arrowLen = 130;
    const ballR1 = 14; // incoming ball radius
    const ballRFinal = ballR1 * Math.sqrt(mFinal / (mass * 1.5)); // scale visual size

    // Background subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let xv = 0; xv <= WIDTH; xv += 60) {
      ctx.beginPath();
      ctx.moveTo(xv, 20);
      ctx.lineTo(xv, HEIGHT - 90);
      ctx.stroke();
    }

    // --- INCOMING PARTICLE 1 (cyan, from left) ---
    const p1x = midX - arrowLen - ballR1 - 30;

    // Arrow from particle to center
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p1x + ballR1, lineY);
    ctx.lineTo(midX - 15, lineY);
    ctx.stroke();
    // arrowhead
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.moveTo(midX - 8, lineY);
    ctx.lineTo(midX - 20, lineY - 6);
    ctx.lineTo(midX - 20, lineY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.arc(p1x, lineY, ballR1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p1x, lineY + 4);

    // β label
    ctx.fillStyle = "#67E8F9";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`β = +${beta.toFixed(3)}`, p1x, lineY - ballR1 - 8);

    // --- INCOMING PARTICLE 2 (magenta, from right) ---
    const p2x = midX + arrowLen + ballR1 + 30;

    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p2x - ballR1, lineY);
    ctx.lineTo(midX + 15, lineY);
    ctx.stroke();
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.moveTo(midX + 8, lineY);
    ctx.lineTo(midX + 20, lineY - 6);
    ctx.lineTo(midX + 20, lineY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(p2x, lineY, ballR1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p2x, lineY + 4);

    ctx.fillStyle = "#FF6ADE";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`β = −${beta.toFixed(3)}`, p2x, lineY - ballR1 - 8);

    // --- COLLISION SPARK ---
    ctx.strokeStyle = "rgba(255,200,100,0.8)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(midX + 5 * Math.cos(angle), lineY + 5 * Math.sin(angle));
      ctx.lineTo(midX + 18 * Math.cos(angle), lineY + 18 * Math.sin(angle));
      ctx.stroke();
    }

    // --- MERGED PARTICLE (amber, at rest) ---
    const mergedY = lineY + 80;
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(midX, mergedY, Math.max(ballRFinal, 18), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = `bold ${Math.round(Math.min(11, 10 + mFinal / mass))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("M", midX, mergedY + 4);

    // Arrow from collision point to merged particle
    ctx.strokeStyle = "#FBBF24";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, lineY + 22);
    ctx.lineTo(midX, mergedY - Math.max(ballRFinal, 18) - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // β = 0 label for merged particle
    ctx.fillStyle = "#FBBF24";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("β = 0 (at rest in CoM)", midX + Math.max(ballRFinal, 18) + 8, mergedY + 4);

    // --- HUD ---
    const hudY = HEIGHT - 88;
    ctx.fillStyle = "rgba(10, 12, 18, 0.88)";
    ctx.fillRect(0, hudY, WIDTH, 88);

    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(`m = ${mass.toFixed(2)}   β = ${beta.toFixed(3)}   γ = ${g.toFixed(6)}`, 12, hudY + 16);

    ctx.fillStyle = "#67E8F9";
    ctx.fillText(`Newtonian  M_final = 2m = ${mNewton.toFixed(6)}`, 12, hudY + 32);

    ctx.fillStyle = "#FBBF24";
    ctx.fillText(
      `Relativistic M_final = 2γm = ${mFinal.toFixed(6)}   (${(massExcess * 100).toFixed(2)}% heavier)`,
      12,
      hudY + 48,
    );

    ctx.fillStyle = "#4ADE80";
    ctx.fillText(
      `Mass excess = (2γ − 2)m = ${(mFinal - mNewton).toFixed(6)}   [was kinetic energy]`,
      12,
      hudY + 64,
    );

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "right";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("c = 1 natural units — Σp^μ conserved, rest mass is NOT", WIDTH - 12, hudY + 80);
  }, [beta, mass]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <div className="flex w-full max-w-[720px] flex-col gap-2">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-24">β = {beta.toFixed(3)}</span>
          <input
            type="range"
            min={0.01}
            max={0.95}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-24">m = {mass.toFixed(1)}</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      </div>
    </div>
  );
}
