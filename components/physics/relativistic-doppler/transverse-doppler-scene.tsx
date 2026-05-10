"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { gamma } from "@/lib/physics/relativity/types";
import {
  longitudinalDoppler,
  transverseDoppler,
} from "@/lib/physics/relativity/doppler-relativistic";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.10b — Transverse Doppler.
 *
 *   Palette: cyan = observer; magenta = orbiting source; amber = velocity.
 */

export function TransverseDopplerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.65,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const [beta, setBeta] = useState(0.5);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      const b = betaRef.current;
      const g = gamma(b);

      const cx = width * 0.42;
      const cy = height * 0.5;
      const R = Math.min(width, height) * 0.32;

      const omega = 0.9;
      const theta = (t * omega) % (Math.PI * 2);
      const sx = cx + R * Math.cos(theta);
      const sy = cy + R * Math.sin(theta);

      const vx = -Math.sin(theta);
      const vy = Math.cos(theta);

      const losx = (cx - sx);
      const losy = (cy - sy);
      const losLen = Math.hypot(losx, losy);
      const lhx = losx / losLen;
      const lhy = losy / losLen;

      const vDotLos = vx * lhx + vy * lhy;
      const betaLos = b * vDotLos;
      const fLong = longitudinalDoppler(1, -betaLos);
      const fTrans = transverseDoppler(1, b);

      // Orbit ring
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Line of sight
      ctx.strokeStyle = hexToRgba(tokens.textBright, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Velocity arrow
      const arrowLen = 38;
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + vx * arrowLen, sy + vy * arrowLen);
      ctx.stroke();
      const ax = sx + vx * arrowLen;
      const ay = sy + vy * arrowLen;
      const perpX = -vy;
      const perpY = vx;
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - vx * 8 + perpX * 4, ay - vy * 8 + perpY * 4);
      ctx.lineTo(ax - vx * 8 - perpX * 4, ay - vy * 8 - perpY * 4);
      ctx.closePath();
      ctx.fill();

      // Source
      ctx.shadowColor = hexToRgba(tokens.magenta, 0.7);
      ctx.shadowBlur = 16;
      ctx.fillStyle = tokens.magenta;
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Observer
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      const perpendicular = Math.abs(vDotLos) < 0.04;
      if (perpendicular) {
        ctx.strokeStyle = tokens.amber;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = tokens.amber;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("perpendicular", sx, sy - 22);
      }

      // HUD
      const hudX = width * 0.74;
      const hudY = 22;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = tokens.textDim;
      ctx.fillText("orbiting source", hudX, hudY);
      ctx.fillStyle = tokens.textMute;
      ctx.fillText(`β = ${b.toFixed(2)}`, hudX, hudY + 18);
      ctx.fillText(`γ = ${g.toFixed(3)}`, hudX, hudY + 34);

      ctx.fillStyle = tokens.textDim;
      ctx.fillText("line-of-sight", hudX, hudY + 60);
      ctx.fillStyle = tokens.textMute;
      ctx.fillText(`v · r̂ = ${vDotLos.toFixed(2)}`, hudX, hudY + 78);
      ctx.fillStyle = tokens.cyan;
      ctx.fillText(`f_long = ${fLong.toFixed(3)}`, hudX, hudY + 96);

      ctx.fillStyle = tokens.textDim;
      ctx.fillText("transverse", hudX, hudY + 122);
      ctx.fillStyle = tokens.magenta;
      ctx.fillText(`f_trans = 1/γ = ${fTrans.toFixed(3)}`, hudX, hudY + 140);

      ctx.fillStyle = tokens.textMute;
      ctx.font = "10px monospace";
      ctx.fillText("(constant; pure time dilation)", hudX, hudY + 156);

      if (perpendicular) {
        ctx.fillStyle = tokens.amber;
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
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
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
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
