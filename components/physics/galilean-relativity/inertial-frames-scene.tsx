"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.01c — Three inertial frames; identical pendulum experiments.
 *
 * Three rail cars stacked vertically, each moving horizontally at a
 * different constant velocity (top: still; middle: slow; bottom: fast).
 * Inside each rail car, a pendulum swings with the same period — one of
 * the few experiments a Galilean observer can actually run inside a
 * sealed box. The shapes of the swings are identical; only the trains
 * themselves are at different x-positions.
 *
 * The point: an observer locked inside any one of these cars cannot
 * tell which one she's in. Newtonian mechanics is Galilean-invariant.
 *
 * Color convention: cyan stationary frame, magenta boosted, orange
 * for the fastest (visually distinct, NOT "accelerated" in the SR sense
 * — these are still inertial frames, just clearly labelled).
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;

interface FrameSpec {
  vMps: number;
  color: string;
  label: string;
}

const FRAMES: readonly FrameSpec[] = [
  { vMps: 0, color: "#74DCFF", label: "FRAME A — at rest (v = 0)" },
  { vMps: 6, color: "#FF6ADE", label: "FRAME B — drifts at v = +6 m/s" },
  { vMps: 14, color: "#FFB36B", label: "FRAME C — drifts at v = +14 m/s" },
];

export function InertialFramesScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 560, height: 320 });
  const [paused, setPaused] = useState(false);
  const freezeTRef = useRef(0);

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
    onFrame: (tLive) => {
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

      const t = paused ? freezeTRef.current : tLive;
      if (!paused) freezeTRef.current = tLive;

      const margin = 20;
      const plotW = width - 2 * margin;
      const sceneLengthM = 60;
      const pxPerMeter = plotW / sceneLengthM;
      const wrap = (xMeter: number) =>
        ((xMeter % sceneLengthM) + sceneLengthM) % sceneLengthM;

      const rowH = (height - 24) / FRAMES.length;
      // Pendulum parameters — chosen so the period is visible.
      const pendulumPeriod = 1.6; // seconds (independent of frame)
      const pendulumAmplitude = 0.45; // radians

      FRAMES.forEach((frame, idx) => {
        const yTop = 12 + idx * rowH;
        const yBase = yTop + rowH - 14; // ground line for the train

        // ground line
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(margin, yBase);
        ctx.lineTo(margin + plotW, yBase);
        ctx.stroke();
        ctx.setLineDash([]);

        // frame label
        ctx.fillStyle = frame.color;
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillText(frame.label, margin + 4, yTop + 10);

        // train car position — wrapped
        const carX = wrap(frame.vMps * t);
        const carPx = margin + carX * pxPerMeter;
        const carW = 110;
        const carH = rowH - 28;
        const carY = yBase - carH;

        // Draw two copies if wrapping near edge
        const carPositions = [carPx, carPx - sceneLengthM * pxPerMeter];
        for (const cx of carPositions) {
          if (cx > -carW && cx < margin + plotW) {
            // body
            ctx.strokeStyle = frame.color;
            ctx.fillStyle = "rgba(0,0,0,0.45)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.rect(cx, carY, carW, carH);
            ctx.fill();
            ctx.stroke();
            // wheels
            ctx.fillStyle = frame.color;
            ctx.beginPath();
            ctx.arc(cx + 16, yBase, 4, 0, Math.PI * 2);
            ctx.arc(cx + carW - 16, yBase, 4, 0, Math.PI * 2);
            ctx.fill();

            // pendulum INSIDE the car — phase tied to time, NOT to frame.
            // Same equation in every frame: that's Galilean invariance.
            const pivotX = cx + carW / 2;
            const pivotY = carY + 8;
            const L = carH - 18; // pendulum length
            const theta = pendulumAmplitude * Math.sin((2 * Math.PI * t) / pendulumPeriod);
            const bobX = pivotX + L * Math.sin(theta);
            const bobY = pivotY + L * Math.cos(theta);
            // pivot dot
            ctx.fillStyle = colors.fg1;
            ctx.beginPath();
            ctx.arc(pivotX, pivotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // string
            ctx.strokeStyle = colors.fg2;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.lineTo(bobX, bobY);
            ctx.stroke();
            // bob
            ctx.fillStyle = frame.color;
            ctx.beginPath();
            ctx.arc(bobX, bobY, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Bottom HUD — emphasise the principle
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Identical pendulums, three frames. Pause to verify the swings line up exactly.",
        width / 2,
        height - 4,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full bg-[#0A0C12] pb-3">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
      <div className="mt-3 flex items-center gap-3 px-3 text-xs">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded border border-[var(--color-fg-3)] px-3 py-1 font-mono uppercase tracking-wider text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
        >
          {paused ? "▶ resume" : "❚❚ freeze"}
        </button>
        <span className="font-mono text-[10px] text-[var(--color-fg-3)]">
          Frame A = stationary (cyan). Frame B = +6 m/s (magenta). Frame C = +14 m/s (orange). Pendulum periods: identical.
        </span>
      </div>
    </div>
  );
}
