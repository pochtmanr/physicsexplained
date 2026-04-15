"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  terminalVelocityLinear,
  velocityLinearDrag,
} from "@/lib/physics/friction";

const RATIO = 0.55;
const MAX_HEIGHT = 380;

// Fixed sphere mass; we expose the drag coefficient as the slider, which in
// Stokes' law is proportional to viscosity × radius. Calling it "fluid
// thickness" on the control keeps the user-facing story close to the physics
// (a dust mote in air vs a ball-bearing in honey).
const SPHERE_MASS = 0.02; // kg
const G = 9.80665;

export function TerminalVelocityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [dragB, setDragB] = useState(0.08);
  const [size, setSize] = useState({ width: 640, height: 360 });
  const startRef = useRef<number | null>(null);

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

  // Reset the drop each time the slider changes.
  useEffect(() => {
    startRef.current = null;
  }, [dragB]);

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

      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;

      const vt = terminalVelocityLinear(SPHERE_MASS, dragB, G);
      const tau = SPHERE_MASS / dragB;
      const tMaxPlot = Math.max(4 * tau, 1.5);

      // Auto-reset the drop so the trace keeps playing.
      const cycleLength = tMaxPlot + 0.8;
      const tLocal = elapsed % cycleLength;
      const running = tLocal <= tMaxPlot;

      ctx.clearRect(0, 0, width, height);

      // ---- Left: sphere column ------------------------------------------------
      const colW = Math.min(width * 0.32, 200);
      const colPad = 24;
      const columnTop = 36;
      const columnBottom = height - 36;
      const columnH = columnBottom - columnTop;

      // Fluid tube
      ctx.fillStyle = `${colors.fg3}22`;
      ctx.fillRect(colPad, columnTop, colW, columnH);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(colPad, columnTop, colW, columnH);

      // Sphere y-position: we saturate at the floor once terminal velocity ×
      // t exceeds the column length, so the ball doesn't disappear off-screen.
      const v = running ? velocityLinearDrag(tLocal, SPHERE_MASS, dragB, G) : vt;
      const fallFrac = running
        ? Math.min(1, v / vt) * Math.min(1, tLocal / tau / 4)
        : 1;
      const sphereY = columnTop + 20 + fallFrac * (columnH - 40);
      const sphereX = colPad + colW / 2;

      ctx.fillStyle = "#5BE9FF";
      ctx.shadowColor = "rgba(91, 233, 255, 0.5)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Drag arrow (upward) and gravity arrow (downward) scaled by current v
      const dragForce = dragB * v;
      const gravity = SPHERE_MASS * G;
      const maxArrow = 44;
      const dragLen = Math.min(maxArrow, (dragForce / gravity) * maxArrow);
      ctx.strokeStyle = "#E4C27A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sphereX, sphereY);
      ctx.lineTo(sphereX, sphereY - dragLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sphereX - 3, sphereY - dragLen + 4);
      ctx.lineTo(sphereX, sphereY - dragLen);
      ctx.lineTo(sphereX + 3, sphereY - dragLen + 4);
      ctx.stroke();

      ctx.strokeStyle = colors.fg2;
      ctx.beginPath();
      ctx.moveTo(sphereX, sphereY);
      ctx.lineTo(sphereX, sphereY + maxArrow);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sphereX - 3, sphereY + maxArrow - 4);
      ctx.lineTo(sphereX, sphereY + maxArrow);
      ctx.lineTo(sphereX + 3, sphereY + maxArrow - 4);
      ctx.stroke();

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("drag", sphereX + 8, sphereY - dragLen + 4);
      ctx.fillText("mg", sphereX + 8, sphereY + maxArrow - 2);

      // ---- Right: v(t) trace ---------------------------------------------------
      const plotL = colPad + colW + 48;
      const plotR = width - 20;
      const plotT = columnTop;
      const plotB = columnBottom;
      const plotW = plotR - plotL;
      const plotH = plotB - plotT;

      // Axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, plotT);
      ctx.lineTo(plotL, plotB);
      ctx.lineTo(plotR, plotB);
      ctx.stroke();

      // Terminal velocity asymptote
      const vtY = plotT + 16;
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(plotL, vtY);
      ctx.lineTo(plotR, vtY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`v_t = ${vt.toFixed(2)} m/s`, plotL + 6, vtY - 4);

      // Trace v(t)
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const samples = 200;
      const maxV = vt;
      for (let i = 0; i <= samples; i++) {
        const tt = (i / samples) * tMaxPlot;
        if (tt > tLocal) break;
        const vv = velocityLinearDrag(tt, SPHERE_MASS, dragB, G);
        const px = plotL + (tt / tMaxPlot) * plotW;
        const py = plotB - (vv / maxV) * (plotH - 20);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Moving dot on the trace
      if (running) {
        const px = plotL + (tLocal / tMaxPlot) * plotW;
        const py = plotB - (v / maxV) * (plotH - 20);
        ctx.fillStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("t", (plotL + plotR) / 2, plotB + 18);
      ctx.save();
      ctx.translate(plotL - 14, (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("v(t)", 0, 0);
      ctx.restore();

      // Readouts
      ctx.textAlign = "right";
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `v = ${v.toFixed(3)} m/s   τ = ${tau.toFixed(2)} s`,
        plotR,
        plotT - 6,
      );
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
          <label className="w-28 text-sm text-[var(--color-fg-2)]">
            Drag b (N·s/m)
          </label>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.005}
            value={dragB}
            onChange={(e) => setDragB(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {dragB.toFixed(3)}
          </span>
        </div>
        <p className="px-1 text-xs text-[var(--color-fg-2)]">
          Thicker fluid, larger b, lower terminal velocity. The curve approaches
          v_t exponentially with time constant τ = m / b.
        </p>
      </div>
    </div>
  );
}
