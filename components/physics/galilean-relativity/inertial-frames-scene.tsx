"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";

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

interface FrameSpec {
  vMps: number;
  colorKey: "cyan" | "magenta" | "orange";
  label: string;
}

const FRAMES: readonly FrameSpec[] = [
  { vMps: 0, colorKey: "cyan", label: "FRAME A — at rest (v = 0)" },
  { vMps: 6, colorKey: "magenta", label: "FRAME B — drifts at v = +6 m/s" },
  { vMps: 14, colorKey: "orange", label: "FRAME C — drifts at v = +14 m/s" },
];

export function InertialFramesScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokens = useSceneTokens();

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [paused, setPaused] = useState(false);
  const freezeTRef = useRef(0);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (tLive) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

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
        const frameColor = colorFor(tokens, frame.colorKey);

        // ground line
        ctx.strokeStyle = tokens.panelBorder;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(margin, yBase);
        ctx.lineTo(margin + plotW, yBase);
        ctx.stroke();
        ctx.setLineDash([]);

        // frame label
        ctx.fillStyle = frameColor;
        ctx.font = tokens.fontHudSmall;
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
            ctx.strokeStyle = frameColor;
            ctx.fillStyle = hexToRgba(tokens.bg, 0.45);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.rect(cx, carY, carW, carH);
            ctx.fill();
            ctx.stroke();
            // wheels
            ctx.fillStyle = frameColor;
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
            ctx.fillStyle = tokens.textDim;
            ctx.beginPath();
            ctx.arc(pivotX, pivotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // string
            ctx.strokeStyle = tokens.textMute;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.lineTo(bobX, bobY);
            ctx.stroke();
            // bob
            ctx.fillStyle = frameColor;
            ctx.beginPath();
            ctx.arc(bobX, bobY, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Bottom HUD — emphasise the principle
      ctx.fillStyle = tokens.textDim;
      ctx.font = tokens.fontHud;
      ctx.textAlign = "center";
      ctx.fillText(
        "Identical pendulums, three frames. Pause to verify the swings line up exactly.",
        width / 2,
        height - 4,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 flex items-center gap-3 px-3 text-xs">
        <Button variant="ghost" size="sm" onClick={() => setPaused((p) => !p)}>
          {paused ? "▶ resume" : "❚❚ freeze"}
        </Button>
        <span className="font-mono text-[10px] text-[var(--color-fg-3)]">
          Frame A = stationary (cyan). Frame B = +6 m/s (magenta). Frame C = +14 m/s (orange). Pendulum periods: identical.
        </span>
      </div>
    </div>
  );
}

function colorFor(tokens: SceneTokens, key: "cyan" | "magenta" | "orange"): string {
  switch (key) {
    case "cyan":
      return tokens.cyan;
    case "magenta":
      return tokens.magenta;
    case "orange":
      return tokens.orange;
  }
}
