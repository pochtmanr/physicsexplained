"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.7;
const MAX_HEIGHT = 420;
const RAMP_ANGLE_DEG = 22;
const RAMP_LENGTH = 4.0; // metres

interface Racer {
  label: string;
  short: string;
  color: string;
  /** Rolling coefficient k = I / (m·R²) */
  k: number;
  formula: string;
}

const RACERS: readonly Racer[] = [
  { label: "sliding block", short: "block", color: "#FF6B6B", k: 0, formula: "I = 0  (doesn't rotate)" },
  { label: "solid sphere",  short: "sphere", color: "#6FB8C6", k: 0.4, formula: "I = ⅖·m·R²" },
  { label: "solid cylinder", short: "cyl",  color: "#E4C27A", k: 0.5, formula: "I = ½·m·R²" },
  { label: "hollow sphere", short: "shell", color: "#A78BFA", k: 2 / 3, formula: "I = ⅔·m·R²" },
  { label: "thin hoop",     short: "hoop",  color: "#F472B6", k: 1.0, formula: "I = m·R²" },
];

type RaceState = "idle" | "running" | "finished";

/**
 * Rolling-race visualisation.  Rather than cramming bodies onto a single
 * ramp, we use one dedicated track per body, all of identical length and
 * angle, shown in a row.  A START button triggers a single run, rather
 * than looping.  During the race each body rolls / slides down its own
 * track at the physically correct acceleration
 *    a = g·sinθ / (1 + k)
 * and the elapsed time, current speed, and finish order are shown.
 */
export function RampRaceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [state, setState] = useState<RaceState>("idle");
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);

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

      // Compute elapsed time
      if (state === "running") {
        if (startTimeRef.current === null) startTimeRef.current = t;
        elapsedRef.current = t - startTimeRef.current;
      }
      const elapsed = elapsedRef.current;

      const g = 9.80665;
      const rampAngle = (RAMP_ANGLE_DEG * Math.PI) / 180;
      const slowestK = Math.max(...RACERS.map((r) => r.k));
      const slowestA = (g * Math.sin(rampAngle)) / (1 + slowestK);
      const slowestFinish = Math.sqrt((2 * RAMP_LENGTH) / slowestA);

      // Transition to finished once slowest has crossed
      if (state === "running" && elapsed >= slowestFinish) {
        setState("finished");
      }

      ctx.clearRect(0, 0, width, height);

      // Layout: 5 parallel tracks across the full width
      const padX = 20;
      const padTop = 42;
      const padBottom = 80;
      const trackGap = 8;

      const plotW = width - 2 * padX;
      const plotH = height - padTop - padBottom;
      const trackH = (plotH - trackGap * (RACERS.length - 1)) / RACERS.length;

      // Horizontal scaling: map RAMP_LENGTH metres into (plotW - finishMargin)
      const labelMargin = 78; // left-side label area
      const finishMargin = 64; // right-side result area
      const trackW = plotW - labelMargin - finishMargin;
      const metresToPx = trackW / RAMP_LENGTH;

      // Header
      ctx.font = "13px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText(
        `ramp ${RAMP_ANGLE_DEG}°, length ${RAMP_LENGTH.toFixed(1)} m — same mass, same radius, released together`,
        padX,
        22,
      );

      // Work out finish ordering (stable: lower k = fastest)
      const order = [...RACERS]
        .map((r, idx) => ({
          ...r,
          finishTime: Math.sqrt(
            (2 * RAMP_LENGTH) / ((g * Math.sin(rampAngle)) / (1 + r.k)),
          ),
          idx,
        }))
        .sort((a, b) => a.finishTime - b.finishTime);
      const rankByIdx: Record<number, number> = {};
      order.forEach((r, rank) => {
        rankByIdx[r.idx] = rank + 1;
      });

      // Draw each track
      RACERS.forEach((racer, i) => {
        const yTop = padTop + i * (trackH + trackGap);
        const yMid = yTop + trackH / 2;

        // Track background
        ctx.fillStyle = colors.bg1;
        ctx.fillRect(padX + labelMargin, yTop, trackW, trackH);
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.strokeRect(padX + labelMargin, yTop, trackW, trackH);

        // Distance marks every 1 m
        ctx.strokeStyle = colors.fg3;
        for (let m = 1; m < RAMP_LENGTH; m++) {
          const mx = padX + labelMargin + m * metresToPx;
          ctx.beginPath();
          ctx.moveTo(mx, yTop + trackH - 4);
          ctx.lineTo(mx, yTop + trackH);
          ctx.stroke();
        }

        // Finish line
        ctx.strokeStyle = "#6FB8C6";
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padX + labelMargin + trackW, yTop);
        ctx.lineTo(padX + labelMargin + trackW, yTop + trackH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Compute position
        const a = (g * Math.sin(rampAngle)) / (1 + racer.k);
        const s =
          state === "idle"
            ? 0
            : Math.min(0.5 * a * elapsed * elapsed, RAMP_LENGTH);
        const finished = s >= RAMP_LENGTH;

        // Body position
        const bodyX = padX + labelMargin + s * metresToPx;
        const bodyY = yMid;
        const R = Math.min(trackH * 0.35, 18);

        // Body shape: block vs ball
        if (racer.k === 0) {
          // Sliding block — square
          ctx.fillStyle = racer.color;
          ctx.fillRect(bodyX - R, bodyY - R, 2 * R, 2 * R);
          ctx.strokeStyle = colors.fg0;
          ctx.lineWidth = 1;
          ctx.strokeRect(bodyX - R, bodyY - R, 2 * R, 2 * R);
          // Static "no rotation" indicator
          ctx.strokeStyle = colors.bg0;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bodyX, bodyY - R * 0.6);
          ctx.lineTo(bodyX, bodyY + R * 0.6);
          ctx.stroke();
        } else {
          // Rolling ball
          ctx.fillStyle = racer.color;
          ctx.beginPath();
          ctx.arc(bodyX, bodyY, R, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = colors.fg0;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Spin marker — s / R_physical gives angle
          const Rphys = 0.05;
          const theta = s / Rphys;
          ctx.save();
          ctx.translate(bodyX, bodyY);
          ctx.rotate(theta);
          ctx.strokeStyle = colors.bg0;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(R * 0.85, 0);
          ctx.stroke();
          ctx.restore();
        }

        // Left label: body name + formula
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = colors.fg1;
        ctx.fillText(racer.short, padX, yMid - 4);
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.fillText(racer.formula, padX, yMid + 10);

        // Right-side result / progress
        ctx.textAlign = "left";
        ctx.font = "12px monospace";
        if (state === "idle") {
          ctx.fillStyle = colors.fg3;
          ctx.fillText("—", padX + labelMargin + trackW + 8, yMid + 4);
        } else if (finished) {
          const finishT = Math.sqrt((2 * RAMP_LENGTH) / a);
          ctx.fillStyle = rankByIdx[i] === 1 ? "#6FB8C6" : colors.fg1;
          ctx.fillText(
            `#${rankByIdx[i]}  ${finishT.toFixed(2)}s`,
            padX + labelMargin + trackW + 8,
            yMid + 4,
          );
        } else {
          const v = a * elapsed;
          ctx.fillStyle = colors.fg2;
          ctx.fillText(
            `v = ${v.toFixed(1)}`,
            padX + labelMargin + trackW + 8,
            yMid + 4,
          );
        }
      });

      // Footer: state text
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      if (state === "idle") {
        ctx.fillStyle = colors.fg2;
        ctx.fillText(
          "press START to release all five bodies simultaneously",
          width / 2,
          height - 48,
        );
      } else if (state === "running") {
        ctx.fillStyle = colors.fg1;
        ctx.fillText(
          `t = ${elapsed.toFixed(2)} s`,
          width / 2,
          height - 48,
        );
      } else {
        ctx.fillStyle = "#6FB8C6";
        ctx.fillText(
          `winner: ${order[0].label} — a = g·sinθ / (1 + I/(m·R²))`,
          width / 2,
          height - 48,
        );
      }

      // Equation footer
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg3;
      ctx.fillText(
        "larger I/(m·R²) ⇒ more energy stuck in rotation ⇒ slower CM",
        width / 2,
        height - 28,
      );
    },
  });

  const handleStart = () => {
    startTimeRef.current = null;
    elapsedRef.current = 0;
    setState("running");
  };

  const handleReset = () => {
    startTimeRef.current = null;
    elapsedRef.current = 0;
    setState("idle");
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex gap-2 px-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={state === "running"}
          className="px-3 py-1 text-xs font-mono uppercase tracking-wider bg-[var(--color-cyan)] text-[var(--color-bg-0)] disabled:opacity-40"
        >
          {state === "finished" ? "start again" : "start race"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={state === "idle"}
          className="px-3 py-1 text-xs font-mono uppercase tracking-wider text-[var(--color-fg-3)] border border-[var(--color-fg-4)] disabled:opacity-40 hover:text-[var(--color-fg-1)]"
        >
          reset
        </button>
      </div>
    </div>
  );
}
