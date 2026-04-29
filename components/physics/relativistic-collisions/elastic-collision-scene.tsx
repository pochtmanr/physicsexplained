"use client";

import { useEffect, useRef, useState } from "react";
import {
  totalFourMomentum,
  fourMomentaEqual,
} from "@/lib/physics/relativity/relativistic-collision";
import { fourMomentum } from "@/lib/physics/relativity/four-momentum";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * FIG.18a — 1D head-on elastic collision.
 *
 * Two equal-mass particles approach along ±x. For a 1D elastic collision
 * between equal masses the relativistic outcome is identical to the Newtonian
 * one: the particles swap velocities. That means Σ p^μ_in = Σ p^μ_out holds
 * componentwise and we can display it live to 6 decimal places.
 *
 * Sliders: mass m (0.1–5 natural units), velocity β (0.01–0.95).
 * Live readout of all four-momentum components for each particle (in and out).
 * Conservation HUD confirms equality to 6 d.p.
 *
 * Color palette (§04 conventions):
 *   cyan    = particle 1 (incoming from left)
 *   magenta = particle 2 (incoming from right)
 *   green   = outgoing particles (post-collision)
 */

const WIDTH = 720;
const HEIGHT = 340;

// c = 1 natural-units for the canvas animation
const C_NAT = 1;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  headSize = 8,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

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

export function ElasticCollisionScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.6);
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
    const c = C_NAT;

    // Incoming: particle 1 from left (+β), particle 2 from right (−β)
    const p1in = fourMomentum(mass, { x: beta * c, y: 0, z: 0 }, c);
    const p2in = fourMomentum(mass, { x: -beta * c, y: 0, z: 0 }, c);
    // Elastic equal-mass 1D: particles swap velocities
    const p1out = fourMomentum(mass, { x: -beta * c, y: 0, z: 0 }, c);
    const p2out = fourMomentum(mass, { x: beta * c, y: 0, z: 0 }, c);

    const totalIn = totalFourMomentum([p1in, p2in]);
    const totalOut = totalFourMomentum([p1out, p2out]);
    const conserved = fourMomentaEqual(totalIn, totalOut, 1e-9);

    // Layout: left half = before, right half = after
    const midX = WIDTH / 2;
    const lineY = HEIGHT / 2 - 10;
    const arrowLen = 120;
    const ballR = 16;

    // Collision point (center)
    const collX = midX;

    // Background grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let xv = 0; xv <= WIDTH; xv += 60) {
      ctx.beginPath();
      ctx.moveTo(xv, 30);
      ctx.lineTo(xv, HEIGHT - 80);
      ctx.stroke();
    }
    for (let yv = 30; yv <= HEIGHT - 80; yv += 60) {
      ctx.beginPath();
      ctx.moveTo(0, yv);
      ctx.lineTo(WIDTH, yv);
      ctx.stroke();
    }

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, HEIGHT - 80);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels BEFORE / AFTER
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.fillText("BEFORE", midX / 2, 24);
    ctx.fillText("AFTER", midX + midX / 2, 24);

    // --- BEFORE ---
    // Particle 1 (cyan) incoming from left
    const p1x = collX - arrowLen - ballR - 20;
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.arc(p1x, lineY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p1x, lineY + 4);
    drawArrow(ctx, p1x + ballR, lineY, collX - 10, lineY, "#67E8F9");

    // Particle 2 (magenta) incoming from right
    const p2x = collX + arrowLen + ballR + 20;
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(p2x, lineY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p2x, lineY + 4);
    drawArrow(ctx, p2x - ballR, lineY, collX + 10, lineY, "#FF6ADE");

    // Collision spark
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(collX + 4 * Math.cos(angle), lineY + 4 * Math.sin(angle));
      ctx.lineTo(collX + 12 * Math.cos(angle), lineY + 12 * Math.sin(angle));
      ctx.stroke();
    }

    // --- AFTER ---
    // Particle 1-out (green, going left)
    const p1outx = collX - arrowLen - ballR - 20;
    drawArrow(ctx, collX + 10, lineY + 40, p1outx - ballR, lineY + 40, "#4ADE80");
    ctx.fillStyle = "#4ADE80";
    ctx.beginPath();
    ctx.arc(p1outx, lineY + 40, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p1outx, lineY + 44);

    // Particle 2-out (green, going right)
    const p2outx = collX + arrowLen + ballR + 20;
    drawArrow(ctx, collX - 10, lineY + 40, p2outx + ballR, lineY + 40, "#4ADE80");
    ctx.fillStyle = "#4ADE80";
    ctx.beginPath();
    ctx.arc(p2outx, lineY + 40, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0A0C12";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("m", p2outx, lineY + 44);

    // β labels
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "#67E8F9";
    ctx.textAlign = "center";
    ctx.fillText(`β = +${beta.toFixed(2)}`, (p1x + collX) / 2, lineY - 28);
    ctx.fillStyle = "#FF6ADE";
    ctx.fillText(`β = −${beta.toFixed(2)}`, (p2x + collX) / 2, lineY - 28);
    ctx.fillStyle = "#4ADE80";
    ctx.fillText(`β = −${beta.toFixed(2)}`, (p1outx + collX) / 2 - 20, lineY + 20);
    ctx.fillText(`β = +${beta.toFixed(2)}`, (p2outx + collX) / 2 + 20, lineY + 20);

    // --- HUD ---
    const hudY = HEIGHT - 72;
    ctx.fillStyle = "rgba(10, 12, 18, 0.85)";
    ctx.fillRect(0, hudY, WIDTH, 72);

    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";

    // p1 in
    ctx.fillStyle = "#67E8F9";
    ctx.fillText(
      `p₁ᵢₙ = (${p1in[0].toFixed(6)}, ${p1in[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 16,
    );
    // p2 in
    ctx.fillStyle = "#FF6ADE";
    ctx.fillText(
      `p₂ᵢₙ = (${p2in[0].toFixed(6)}, ${p2in[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 30,
    );
    // Total in
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(
      `Σpᵢₙ  = (${totalIn[0].toFixed(6)}, ${totalIn[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 44,
    );
    // Total out
    ctx.fillStyle = "#4ADE80";
    ctx.fillText(
      `Σpₒᵤₜ = (${totalOut[0].toFixed(6)}, ${totalOut[1].toFixed(6)}, 0, 0)`,
      12,
      hudY + 58,
    );

    // Conservation badge
    ctx.textAlign = "right";
    ctx.fillStyle = conserved ? "#4ADE80" : "#F87171";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.fillText(
      conserved
        ? `✓ Σp^μ_in = Σp^μ_out   γ = ${g.toFixed(4)}`
        : `✗ NOT CONSERVED   γ = ${g.toFixed(4)}`,
      WIDTH - 12,
      hudY + 20,
    );
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("c = 1, equal-mass elastic 1D (velocity swap)", WIDTH - 12, hudY + 58);
  }, [beta, mass]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <div className="flex w-full max-w-[720px] flex-col gap-2">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-24">β = {beta.toFixed(2)}</span>
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
            min={0.1}
            max={5}
            step={0.1}
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      </div>
    </div>
  );
}
