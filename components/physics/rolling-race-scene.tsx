"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  inclineAcceleration,
  SHAPE_FACTOR,
  type ShapeName,
} from "@/lib/physics/rolling";

const CANVAS_W = 480;
const CANVAS_H = 360;
const RAMP_Y0 = 50;
const RAMP_Y1 = 240;
const RAMP_X0 = 30;
const RAMP_X1 = 380;
const GRAPH_X = 80;
const GRAPH_Y0 = 270;
const GRAPH_Y1 = 340;
const GRAPH_W = CANVAS_W - GRAPH_X - 20;
const RAMP_LEN_PX = Math.hypot(RAMP_X1 - RAMP_X0, RAMP_Y1 - RAMP_Y0);
const RAMP_LEN_M = 4.0;
const PX_PER_M = RAMP_LEN_PX / RAMP_LEN_M;
const RACER_R = 12;

interface Racer {
  shape: ShapeName;
  label: string;
  color: string;
}

const RACERS: readonly Racer[] = [
  { shape: "solidSphere", label: "solid sphere", color: "#6FB8C6" },
  { shape: "solidCylinder", label: "solid cylinder", color: "#E4C27A" },
  { shape: "hollowCylinder", label: "hollow cylinder", color: "#FF6ADE" },
];

const RAMP_ANGLE = Math.atan2(RAMP_Y1 - RAMP_Y0, RAMP_X1 - RAMP_X0);

function rampPosition(s: number): { x: number; y: number } {
  // s in metres along the ramp surface
  const px = s * PX_PER_M;
  return {
    x: RAMP_X0 + px * Math.cos(RAMP_ANGLE),
    y: RAMP_Y0 + px * Math.sin(RAMP_ANGLE) - RACER_R / Math.cos(RAMP_ANGLE),
  };
}

export function RollingRaceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [running, setRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const startRef = useRef<number | null>(null);
  const finishedRef = useRef<Map<ShapeName, number>>(new Map());

  // Reset start time when resetKey changes
  useEffect(() => {
    startRef.current = null;
    finishedRef.current = new Map();
  }, [resetKey]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      if (running && startRef.current === null) startRef.current = t;
      const tElapsed = running && startRef.current !== null ? t - startRef.current : 0;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Ramp
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(RAMP_X0, RAMP_Y0);
      ctx.lineTo(RAMP_X1, RAMP_Y1);
      ctx.lineTo(RAMP_X0, RAMP_Y1);
      ctx.closePath();
      ctx.stroke();

      // Ramp angle label
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `θ = ${((RAMP_ANGLE * 180) / Math.PI).toFixed(0)}°`,
        RAMP_X0 + 10,
        RAMP_Y1 - 6,
      );

      // Racers + position graph
      ctx.lineWidth = 2;
      RACERS.forEach((racer, i) => {
        const a = inclineAcceleration(SHAPE_FACTOR[racer.shape], RAMP_ANGLE);
        const sUnclamped = 0.5 * a * tElapsed * tElapsed;
        const finished = sUnclamped >= RAMP_LEN_M;
        if (finished && !finishedRef.current.has(racer.shape)) {
          finishedRef.current.set(racer.shape, tElapsed);
        }
        const s = Math.min(sUnclamped, RAMP_LEN_M);
        const pos = rampPosition(s);

        // Racer ball (offset perpendicular to ramp surface so it sits on top)
        const offsetX = -RACER_R * Math.sin(RAMP_ANGLE);
        const offsetY = -RACER_R * Math.cos(RAMP_ANGLE);
        ctx.fillStyle = racer.color;
        ctx.beginPath();
        ctx.arc(pos.x + offsetX, pos.y + offsetY + (i - 1) * 6, RACER_R, 0, Math.PI * 2);
        ctx.fill();

        // Position-vs-time curve
        ctx.strokeStyle = racer.color;
        ctx.beginPath();
        const tMaxLocal = Math.min(tElapsed, Math.sqrt((2 * RAMP_LEN_M) / a));
        const tDisplayMax = 4.0;
        for (let k = 0; k <= 60; k++) {
          const tk = (k / 60) * Math.min(tElapsed, tDisplayMax);
          const sk = Math.min(0.5 * a * tk * tk, RAMP_LEN_M);
          const gx = GRAPH_X + (tk / tDisplayMax) * GRAPH_W;
          const gy = GRAPH_Y1 - (sk / RAMP_LEN_M) * (GRAPH_Y1 - GRAPH_Y0);
          if (k === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
        ctx.stroke();
      });

      // Graph axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(GRAPH_X, GRAPH_Y0);
      ctx.lineTo(GRAPH_X, GRAPH_Y1);
      ctx.lineTo(GRAPH_X + GRAPH_W, GRAPH_Y1);
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("s(t)", GRAPH_X - 4, GRAPH_Y0 + 8);
      ctx.textAlign = "left";
      ctx.fillText("t →", GRAPH_X + GRAPH_W + 4, GRAPH_Y1 + 4);

      // Legend
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      RACERS.forEach((racer, i) => {
        const ly = 16 + i * 14;
        ctx.fillStyle = racer.color;
        ctx.fillRect(CANVAS_W - 150, ly - 8, 10, 10);
        ctx.fillStyle = colors.fg1;
        ctx.fillText(racer.label, CANVAS_W - 134, ly);
      });
    },
  });

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="mx-auto block"
      />
      <div className="mt-2 flex items-center justify-center gap-3 font-mono text-[11px]">
        <button
          type="button"
          onClick={() => {
            setResetKey((k) => k + 1);
            setRunning(true);
          }}
          className="rounded-sm border border-[var(--color-fg-4)] px-2 py-1 text-[var(--color-fg-1)] hover:bg-[var(--color-bg-1)]"
        >
          restart
        </button>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded-sm border border-[var(--color-fg-4)] px-2 py-1 text-[var(--color-fg-1)] hover:bg-[var(--color-bg-1)]"
        >
          {running ? "pause" : "resume"}
        </button>
      </div>
    </div>
  );
}
