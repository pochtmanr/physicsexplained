"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { gamma } from "@/lib/physics/relativity/types";
import {
  longitudinalDoppler,
  transverseDoppler,
} from "@/lib/physics/relativity/doppler-relativistic";

/**
 * FIG.10b — Transverse Doppler.
 *
 *   A source orbits the observer at fixed radius R, at speed βc = 0.5c
 *   (slider exposed to fine-tune). The observer sits at the centre.
 *
 *   At the perpendicular moment — when the source's instantaneous
 *   velocity points across the line of sight, not along it — the
 *   line-of-sight component of v is zero. Classical Doppler predicts
 *   no shift at all. Special relativity predicts a shift of 1/γ — pure
 *   time dilation, with no classical analogue.
 *
 *   The HUD compares the instantaneous longitudinal-Doppler factor (which
 *   oscillates around 1 over the orbit) with the transverse-Doppler factor
 *   (a constant 1/γ < 1). At the perpendicular instant the longitudinal
 *   classical factor would be exactly 1; the relativistic transverse
 *   factor is f_obs / f_emit = 1/γ.
 *
 *   Palette: cyan = observer; magenta = orbiting source; amber = velocity
 *   tangent.
 */

const RATIO = 0.65;
const MAX_HEIGHT = 380;

export function TransverseDopplerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.5);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 600, height: 390 });
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const b = betaRef.current;
      const g = gamma(b);

      // Observer at center
      const cx = width * 0.42;
      const cy = height * 0.5;
      const R = Math.min(width, height) * 0.32;

      // Source angle — constant angular speed (visual only). Make one orbit
      // every ~6 seconds so the geometry is comfortable to watch.
      const omega = 0.9;
      const theta = (t * omega) % (Math.PI * 2);
      const sx = cx + R * Math.cos(theta);
      const sy = cy + R * Math.sin(theta);

      // Velocity tangent (perpendicular to radius)
      const vx = -Math.sin(theta);
      const vy = Math.cos(theta);

      // Line-of-sight vector source → observer (unit)
      const losx = (cx - sx);
      const losy = (cy - sy);
      const losLen = Math.hypot(losx, losy);
      const lhx = losx / losLen;
      const lhy = losy / losLen;

      // Component of velocity along observer-direction. β_los = β · (v · r̂_so)
      // where r̂_so points from source toward observer. Receding means
      // β_los < 0; approaching means β_los > 0.
      const vDotLos = vx * lhx + vy * lhy;
      const betaLos = b * vDotLos;
      // f_classical = (1 − β_los) — first-order approximation; the full
      // relativistic longitudinal factor on the line-of-sight component is:
      const fLong = longitudinalDoppler(1, -betaLos);
      // (note: convention here: β > 0 in `longitudinalDoppler` means
      // receding. v·r̂_so > 0 means approaching, so we feed −β_los.)
      const fTrans = transverseDoppler(1, b);

      // Orbit ring
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Line of sight
      ctx.strokeStyle = "rgba(180, 180, 200, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Velocity arrow at source (amber)
      const arrowLen = 38;
      ctx.strokeStyle = "#FFD93D";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + vx * arrowLen, sy + vy * arrowLen);
      ctx.stroke();
      // Arrowhead
      const ax = sx + vx * arrowLen;
      const ay = sy + vy * arrowLen;
      const perpX = -vy;
      const perpY = vx;
      ctx.fillStyle = "#FFD93D";
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - vx * 8 + perpX * 4, ay - vy * 8 + perpY * 4);
      ctx.lineTo(ax - vx * 8 - perpX * 4, ay - vy * 8 - perpY * 4);
      ctx.closePath();
      ctx.fill();

      // Source disc (magenta)
      ctx.shadowColor = "rgba(255, 105, 180, 0.7)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#FF6BCB";
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Observer (cyan)
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Highlight when at perpendicular instant (|β_los| ≈ 0)
      const perpendicular = Math.abs(vDotLos) < 0.04;
      if (perpendicular) {
        ctx.strokeStyle = "#FFD93D";
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#FFD93D";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("perpendicular", sx, sy - 22);
      }

      // ── HUD (right side panel) ────────────────────────────────────────
      const hudX = width * 0.74;
      const hudY = 22;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("orbiting source", hudX, hudY);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`β = ${b.toFixed(2)}`, hudX, hudY + 18);
      ctx.fillText(`γ = ${g.toFixed(3)}`, hudX, hudY + 34);

      ctx.fillStyle = colors.fg1;
      ctx.fillText("line-of-sight", hudX, hudY + 60);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`v · r̂ = ${vDotLos.toFixed(2)}`, hudX, hudY + 78);
      ctx.fillStyle = "#6FB8C6";
      ctx.fillText(`f_long = ${fLong.toFixed(3)}`, hudX, hudY + 96);

      ctx.fillStyle = colors.fg1;
      ctx.fillText("transverse", hudX, hudY + 122);
      ctx.fillStyle = "#FF6BCB";
      ctx.fillText(`f_trans = 1/γ = ${fTrans.toFixed(3)}`, hudX, hudY + 140);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("(constant; pure time dilation)", hudX, hudY + 156);

      // Caption pointer when perpendicular
      if (perpendicular) {
        ctx.fillStyle = "#FFD93D";
        ctx.font = "11px monospace";
        ctx.fillText("classical Doppler = 1", hudX, hudY + 188);
        ctx.fillText("relativistic = 1/γ < 1", hudX, hudY + 204);
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">β = v / c</label>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6BCB]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
