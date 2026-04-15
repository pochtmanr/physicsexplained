"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  criticalAngle,
  isBlockStatic,
  slideAcceleration,
} from "@/lib/physics/friction";

const RATIO = 0.6;
const MAX_HEIGHT = 380;

export function FrictionRampScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [angleDeg, setAngleDeg] = useState(15);
  const [muStatic, setMuStatic] = useState(0.4);
  const [size, setSize] = useState({ width: 640, height: 380 });
  // Ratio μ_k / μ_s — kinetic is always a bit lower than static.
  const KINETIC_RATIO = 0.75;

  // Simulation state — we roll a simple Euler integrator for the slide.
  const sRef = useRef(0); // distance slid along ramp, metres
  const vRef = useRef(0); // velocity along ramp, m/s
  const restartPauseRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Reset when the user drags the sliders — avoids the block "remembering"
  // a slide from the previous configuration.
  useEffect(() => {
    sRef.current = 0;
    vRef.current = 0;
    restartPauseRef.current = 0;
  }, [angleDeg, muStatic]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
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

      const angle = (angleDeg * Math.PI) / 180;
      const muKinetic = muStatic * KINETIC_RATIO;
      const thetaCrit = criticalAngle(muStatic);
      const thetaCritDeg = (thetaCrit * 180) / Math.PI;
      const staticHolds = isBlockStatic(angle, muStatic);

      // Geometry
      const pad = 28;
      const rampLen = Math.min(width - pad * 2 - 20, 640);
      const originX = pad + 10;
      const originY = height - pad - 14;
      const endX = originX + rampLen * Math.cos(angle);
      const endY = originY - rampLen * Math.sin(angle);

      // Physics — only advance the slide if static friction has lost.
      if (staticHolds) {
        sRef.current = 0;
        vRef.current = 0;
        restartPauseRef.current = 0;
      } else {
        const a = slideAcceleration(angle, muKinetic);
        const clampedDt = Math.min(dt, 0.05);
        vRef.current += a * clampedDt;
        sRef.current += vRef.current * clampedDt;

        // Scale real-world metres to screen-ramp metres for the demo. We treat
        // the full ramp length as ~6 m so the slide takes a second or two to
        // traverse.
        const rampMeters = 6;
        if (sRef.current >= rampMeters) {
          restartPauseRef.current += clampedDt;
          if (restartPauseRef.current > 0.8) {
            sRef.current = 0;
            vRef.current = 0;
            restartPauseRef.current = 0;
          }
        }
      }

      // Map slide distance to pixel fraction along the ramp.
      const rampMeters = 6;
      const slideFrac = Math.min(1, sRef.current / rampMeters);
      const blockTopOffset = rampLen * 0.05; // start a bit down from the peak
      const blockDistPx = blockTopOffset + slideFrac * (rampLen - blockTopOffset - 24);

      // Block centre along the ramp, measured from the top.
      const cx = endX - blockDistPx * Math.cos(angle);
      const cy = endY + blockDistPx * Math.sin(angle);

      // Outward normal to the ramp surface (up and to the left of the slope).
      const nx = -Math.sin(angle);
      const ny = -Math.cos(angle);

      ctx.clearRect(0, 0, width, height);

      // Ground
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, originY);
      ctx.lineTo(width - pad, originY);
      ctx.stroke();

      // Shaded ramp triangle
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(endX, originY);
      ctx.closePath();
      ctx.fillStyle = `${colors.fg3}33`;
      ctx.fill();

      // Ramp face
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Critical-angle indicator — a faint dashed line at the threshold, so
      // the user can see how close they are to slipping.
      const critEndX = originX + rampLen * Math.cos(thetaCrit);
      const critEndY = originY - rampLen * Math.sin(thetaCrit);
      ctx.strokeStyle = "#5BE9FF";
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(critEndX, critEndY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Block (rotated square sitting on the ramp)
      const blockSize = 26;
      ctx.save();
      ctx.translate(cx + nx * blockSize * 0.5, cy + ny * blockSize * 0.5);
      ctx.rotate(-angle);
      ctx.fillStyle = staticHolds ? colors.fg2 : "#5BE9FF";
      if (!staticHolds) {
        ctx.shadowColor = "rgba(91, 233, 255, 0.45)";
        ctx.shadowBlur = 10;
      }
      ctx.fillRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`θ = ${angleDeg}°`, originX + 8, originY - 6);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `μ_s = ${muStatic.toFixed(2)}    μ_k = ${muKinetic.toFixed(2)}`,
        originX + 8,
        originY - 24,
      );
      ctx.fillText(
        `critical θ = arctan(μ_s) = ${thetaCritDeg.toFixed(1)}°`,
        originX + 8,
        originY - 40,
      );

      // Status badge top-right
      ctx.textAlign = "right";
      ctx.font = "11px monospace";
      if (staticHolds) {
        ctx.fillStyle = colors.fg2;
        ctx.fillText("STATIC — block holds", width - pad, pad + 4);
      } else {
        ctx.fillStyle = "#5BE9FF";
        ctx.fillText(
          `SLIDING — v = ${vRef.current.toFixed(2)} m/s`,
          width - pad,
          pad + 4,
        );
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm text-[var(--color-fg-2)]">Angle θ</label>
          <input
            type="range"
            min={0}
            max={45}
            step={0.5}
            value={angleDeg}
            onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {angleDeg.toFixed(1)}°
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm text-[var(--color-fg-2)]">μ_s</label>
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.01}
            value={muStatic}
            onChange={(e) => setMuStatic(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {muStatic.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
