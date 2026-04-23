"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  radiationPressureReflector,
  SOLAR_CONSTANT,
} from "@/lib/physics/electromagnetism/maxwell-stress";

const RATIO = 0.55;
const MAX_HEIGHT = 360;

/**
 * FIG.37b — laser onto a perfect mirror. The user picks an intensity in
 * "× solar constant" (1361 W/m²), and the scene animates a wavefront
 * approaching, bouncing, and reflecting. The HUD reports the radiation
 * pressure P = 2I/c and the force on a 1 m² mirror.
 *
 * Scale tips for intuition:
 *   • 1 sun at 1 AU (1361 W/m²)       → P ≈ 9.1 µPa
 *   • industrial CW laser (1 MW/m²)   → P ≈ 6.7 mPa
 *   • Lebedev 1900 tabletop (~100 W/m², with blackened vane) → nN-scale
 */
export function FieldPressureScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  // Intensity in units of solar constant (log slider, 10^-2 .. 10^+4)
  const [logI, setLogI] = useState(0); // 10^0 = 1 sun

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const intensity = Math.pow(10, logI) * SOLAR_CONSTANT;
      const P = radiationPressureReflector(intensity); // Pa
      const forcePerM2 = P; // N/m²

      // ─── Layout: mirror on the right half, beam from left ───
      const mirrorX = width * 0.64;
      const mirrorYTop = height * 0.2;
      const mirrorYBot = height * 0.8;
      const beamYmid = height / 2;

      // ─── Draw incoming and reflected wavefronts (sinusoidal E-field) ───
      // Frequency of wave (arbitrary, for visual animation only)
      const omega = 2.4; // rad/s
      const k = 0.04;

      // Alpha based on intensity (brighter beam for higher I)
      const beamAlpha = Math.min(0.9, 0.3 + 0.25 * Math.max(0, logI + 1));

      // Incoming beam (left → mirror)
      ctx.strokeStyle = `rgba(255, 214, 107, ${beamAlpha.toFixed(2)})`; // amber
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 20; x <= mirrorX - 2; x += 2) {
        const phase = k * x - omega * t;
        const y = beamYmid + Math.sin(phase) * 22;
        if (x === 20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reflected beam (mirror → left)
      ctx.strokeStyle = `rgba(120, 220, 255, ${beamAlpha.toFixed(2)})`; // cyan
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 20; x <= mirrorX - 2; x += 2) {
        const dx = mirrorX - x;
        const phase = k * dx - omega * t;
        const y = beamYmid + 40 + Math.sin(phase) * 22;
        if (x === 20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Arrowheads
      drawArrow(ctx, mirrorX - 26, beamYmid, mirrorX - 6, beamYmid, "rgba(255, 214, 107, 0.95)");
      drawArrow(ctx, 40, beamYmid + 40, 20, beamYmid + 40, "rgba(120, 220, 255, 0.95)");

      // Labels
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255, 214, 107, 0.95)";
      ctx.textAlign = "right";
      ctx.fillText("incident", mirrorX - 32, beamYmid - 6);
      ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
      ctx.fillText("reflected", mirrorX - 32, beamYmid + 56);

      // ─── Draw mirror ───
      const mirrorThickness = 10;
      // Body
      const grad = ctx.createLinearGradient(mirrorX, 0, mirrorX + mirrorThickness, 0);
      grad.addColorStop(0, "#E0E0F0");
      grad.addColorStop(1, "#606070");
      ctx.fillStyle = grad;
      ctx.fillRect(mirrorX, mirrorYTop, mirrorThickness, mirrorYBot - mirrorYTop);
      // Front face highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mirrorX, mirrorYTop);
      ctx.lineTo(mirrorX, mirrorYBot);
      ctx.stroke();

      // Mirror "nudge" animation — displace proportional to log(force)
      // (purely visual, never physical — the mirror is bolted down)
      const nudgePx = Math.min(8, Math.max(0, Math.log10(1 + P * 1e6)) * 1.2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(mirrorX + nudgePx, mirrorYTop, mirrorThickness, mirrorYBot - mirrorYTop);

      // ─── Force arrow on mirror ───
      const forceArrowLen = Math.min(80, 10 + Math.max(0, Math.log10(1 + P * 1e6)) * 14);
      const forceX0 = mirrorX + mirrorThickness + 6;
      const forceY = (mirrorYTop + mirrorYBot) / 2;
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(forceX0, forceY);
      ctx.lineTo(forceX0 + forceArrowLen, forceY);
      ctx.stroke();
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.moveTo(forceX0 + forceArrowLen, forceY);
      ctx.lineTo(forceX0 + forceArrowLen - 8, forceY - 4);
      ctx.lineTo(forceX0 + forceArrowLen - 8, forceY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.font = "11px monospace";
      ctx.fillStyle = "#FF6ADE";
      ctx.textAlign = "left";
      ctx.fillText("F = 2I/c · A", forceX0 + forceArrowLen + 6, forceY + 4);

      // ─── HUD ───
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText("Radiation pressure on a perfect mirror", 12, 20);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(`I = ${formatI(intensity)}`, 12, 36);
      ctx.fillText(`P = 2I/c = ${formatPressure(P)}`, 12, 50);
      ctx.fillText(`F on 1 m² = ${formatForce(forcePerM2)}`, 12, 64);

      ctx.textAlign = "right";
      ctx.fillText(regime(intensity), width - 12, 20);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2 font-mono text-xs">
        <label className="w-14 text-[var(--color-fg-3)]">I (log)</label>
        <input
          type="range"
          min={-2}
          max={4}
          step={0.01}
          value={logI}
          onChange={(e) => setLogI(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#FFD66B" }}
        />
        <span className="w-28 text-right text-[var(--color-fg-1)]">
          {Math.pow(10, logI).toFixed(2)} × sun
        </span>
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const head = 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.5, y1 - uy * head + ux * head * 0.5);
  ctx.lineTo(x1 - ux * head + uy * head * 0.5, y1 - uy * head - ux * head * 0.5);
  ctx.closePath();
  ctx.fill();
}

function formatI(I: number): string {
  if (I >= 1e6) return `${(I / 1e6).toFixed(2)} MW/m²`;
  if (I >= 1e3) return `${(I / 1e3).toFixed(1)} kW/m²`;
  return `${I.toFixed(1)} W/m²`;
}

function formatPressure(P: number): string {
  if (P >= 1e3) return `${(P / 1e3).toFixed(2)} kPa`;
  if (P >= 1) return `${P.toFixed(2)} Pa`;
  if (P >= 1e-3) return `${(P * 1e3).toFixed(2)} mPa`;
  if (P >= 1e-6) return `${(P * 1e6).toFixed(2)} µPa`;
  return `${(P * 1e9).toFixed(2)} nPa`;
}

function formatForce(F: number): string {
  if (F >= 1) return `${F.toFixed(2)} N`;
  if (F >= 1e-3) return `${(F * 1e3).toFixed(2)} mN`;
  if (F >= 1e-6) return `${(F * 1e6).toFixed(2)} µN`;
  return `${(F * 1e9).toFixed(2)} nN`;
}

function regime(I: number): string {
  if (I < 100) return "Lebedev 1900 tabletop regime";
  if (I < 5000) return "sunlight at 1 AU";
  if (I < 1e5) return "concentrated sunlight";
  if (I < 1e7) return "industrial CW laser";
  return "pulsed-laser / fusion regime";
}
