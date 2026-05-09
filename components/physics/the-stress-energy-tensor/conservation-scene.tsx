"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

/**
 * FIG.36c — LOCAL ENERGY-MOMENTUM CONSERVATION
 *
 * Animates energy-momentum flux through a small control volume.
 * ∇^μ T_{μν} = 0 means: net flux out = change stored inside.
 *
 * Two animated arrows enter/leave the box:
 *   — cyan arrow on the left face: energy flux in (T_{01})
 *   — cyan arrow on the right face: energy flux out (T_{01})
 *   — T_{00} in the interior pulses as energy moves through
 *
 * A scrolling caption shows the temporal and spatial parts of the equation:
 *   ∂_t T_{00} + ∂_i T_{0i} = 0  (energy continuity)
 *   ∂_t T_{0j} + ∂_i T_{ij} = 0  (momentum continuity)
 */

const W = 560;
const H = 300;
const BG = "#0A0C12";

const C_IN = "#67E8F9";
const C_OUT = "#FBBF24";
const C_STORED = "#FF6ADE";
const C_LABEL = "rgba(255,255,255,0.70)";
const C_DIM = "rgba(255,255,255,0.30)";

// ─── Layout constants ──────────────────────────────────────────────────────
const BOX_X = 160;
const BOX_Y = 80;
const BOX_W = 240;
const BOX_H = 140;

function drawFrame(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const cx = BOX_X + BOX_W / 2;
  const cy = BOX_Y + BOX_H / 2;

  // Oscillation: simulate a packet moving left-to-right
  const phase = (t * 0.8) % 1.0; // 0 → 1 cycle
  const packetX = BOX_X - 30 + phase * (BOX_W + 60);

  // ── Control volume box ─────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(BOX_X, BOX_Y, BOX_W, BOX_H);
  ctx.setLineDash([]);

  // Box label
  ctx.fillStyle = C_DIM;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("control volume V", BOX_X + 4, BOX_Y + 4);

  // ── Stored energy indicator (T_{00}) ──────────────────────────────────
  // Pulse as packet passes through
  const inside = packetX > BOX_X && packetX < BOX_X + BOX_W;
  const storeAlpha = inside ? 0.15 + 0.12 * Math.sin(t * 4) : 0.05;
  ctx.fillStyle = `rgba(255,106,222,${storeAlpha})`;
  ctx.fillRect(BOX_X + 1, BOX_Y + 1, BOX_W - 2, BOX_H - 2);

  ctx.fillStyle = C_STORED;
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T₀₀", cx, cy - 18);

  ctx.fillStyle = "rgba(255,106,222,0.65)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillText("energy density", cx, cy - 4);

  // ── Moving energy-momentum packet ─────────────────────────────────────
  const pR = 12;
  // Only draw packet inside ±30 of box region
  if (packetX > BOX_X - 80 && packetX < BOX_X + BOX_W + 80) {
    const pAlpha = Math.min(
      1,
      Math.min(
        (packetX - (BOX_X - 80)) / 40,
        ((BOX_X + BOX_W + 80) - packetX) / 40,
      ),
    );
    ctx.beginPath();
    ctx.arc(packetX, cy + 20, pR, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(103,232,249,${pAlpha * 0.7})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(103,232,249,${pAlpha * 0.90})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Arrow direction
    ctx.strokeStyle = `rgba(103,232,249,${pAlpha * 0.85})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(packetX - pR + 2, cy + 20);
    ctx.lineTo(packetX + pR - 2, cy + 20);
    ctx.stroke();
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(packetX + pR - 2, cy + 20);
    ctx.lineTo(packetX + pR - 9, cy + 15);
    ctx.moveTo(packetX + pR - 2, cy + 20);
    ctx.lineTo(packetX + pR - 9, cy + 25);
    ctx.stroke();
  }

  // ── Flux arrows on faces ───────────────────────────────────────────────
  // Left face: T_{01} in (energy flux entering)
  const inAlpha = 0.5 + 0.4 * Math.sin(t * 2 * Math.PI * 0.8 - Math.PI * 0.5);
  ctx.strokeStyle = `rgba(103,232,249,${Math.max(0, inAlpha)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(BOX_X - 50, cy);
  ctx.lineTo(BOX_X - 4, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(BOX_X - 4, cy);
  ctx.lineTo(BOX_X - 14, cy - 6);
  ctx.moveTo(BOX_X - 4, cy);
  ctx.lineTo(BOX_X - 14, cy + 6);
  ctx.stroke();

  ctx.fillStyle = C_IN;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("T₀₁·in", BOX_X - 27, cy - 10);

  // Right face: T_{01} out
  const outAlpha = 0.5 + 0.4 * Math.sin(t * 2 * Math.PI * 0.8);
  ctx.strokeStyle = `rgba(251,191,36,${Math.max(0, outAlpha)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(BOX_X + BOX_W + 4, cy);
  ctx.lineTo(BOX_X + BOX_W + 50, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(BOX_X + BOX_W + 50, cy);
  ctx.lineTo(BOX_X + BOX_W + 40, cy - 6);
  ctx.moveTo(BOX_X + BOX_W + 50, cy);
  ctx.lineTo(BOX_X + BOX_W + 40, cy + 6);
  ctx.stroke();

  ctx.fillStyle = C_OUT;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("T₀₁·out", BOX_X + BOX_W + 27, cy - 10);

  // ── Conservation equations ────────────────────────────────────────────
  const eqY = H - 76;
  ctx.fillStyle = C_LABEL;
  ctx.font = "bold 10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("∇^μ T_{μν} = 0", 10, eqY);

  ctx.fillStyle = C_DIM;
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillText("ν=0:  ∂_t T₀₀ + ∂_i T₀ᵢ = 0   (energy continuity)", 10, eqY + 16);
  ctx.fillText("ν=j:  ∂_t T₀ⱼ + ∂_i Tᵢⱼ = 0   (momentum continuity)", 10, eqY + 30);

  // ── Covariant divergence label ─────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("net out = 0 ⟺ conserved", W - 10, H - 8);

  // ── Balance indicator ──────────────────────────────────────────────────
  const netX = cx;
  const netY = BOX_Y + BOX_H + 14;
  const fluxIn = 0.5 + 0.4 * Math.sin(t * 2 * Math.PI * 0.8 - Math.PI * 0.5);
  const fluxOut = 0.5 + 0.4 * Math.sin(t * 2 * Math.PI * 0.8);
  const net = fluxOut - fluxIn;
  ctx.fillStyle = Math.abs(net) < 0.1 ? "rgba(103,232,249,0.70)" : "rgba(255,100,100,0.70)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    `Δflux = ${net.toFixed(2)} (oscillates → net ≈ 0)`,
    netX,
    netY,
  );
}

export function ConservationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame(ctx, 0);
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawFrame(ctx, t);
    },
  });

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <p className="font-mono text-[10px] text-white/40 max-w-[560px] text-center">
        A packet of energy-momentum crosses the control volume. The net flux through
        all faces sums to zero: ∇^&#8202;μ T&#8202;_{"{μν}"} = 0. The temporal part is energy
        continuity; the spatial parts are momentum continuity — Newton&#8202;&apos;s second law
        in covariant form.
      </p>
    </div>
  );
}
