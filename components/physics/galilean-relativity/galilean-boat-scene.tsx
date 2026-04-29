"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { boatOnRiverShoreSpeed } from "@/lib/physics/relativity/galilean";

/**
 * FIG.01a — Boat on a river.
 *
 *   Boat moves at u′ relative to the water (cyan boat in cyan band).
 *   Current carries the water at v relative to the shore (cyan band drifts).
 *   The shore observer measures the boat at u = u′ + v (magenta marker).
 *
 *   Two sliders: boat speed (engine, in water frame) and current speed.
 *   HUD reads u′, v, and the predicted shore-frame speed u live.
 *
 *   Color convention: cyan = water/boat (the "moving frame"),
 *                     magenta = shore-frame measurement,
 *                     amber = numerical readout.
 */

const RATIO = 0.5;
const MAX_HEIGHT = 320;
const SCENE_LENGTH_M = 40; // shore-x range visible

export function GalileanBoatScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const [boatSpeed, setBoatSpeed] = useState(5); // m/s, in water frame
  const [currentSpeed, setCurrentSpeed] = useState(3); // m/s, water vs shore
  const [size, setSize] = useState({ width: 560, height: 280 });

  const boatSpeedRef = useRef(boatSpeed);
  const currentSpeedRef = useRef(currentSpeed);
  useEffect(() => {
    boatSpeedRef.current = boatSpeed;
  }, [boatSpeed]);
  useEffect(() => {
    currentSpeedRef.current = currentSpeed;
  }, [currentSpeed]);

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

      const u = boatSpeedRef.current;
      const v = currentSpeedRef.current;
      const shoreSpeed = boatOnRiverShoreSpeed(u, v);

      const margin = 24;
      const plotW = width - 2 * margin;
      const pxPerMeter = plotW / SCENE_LENGTH_M;
      // Periodic horizontal track — boat wraps at SCENE_LENGTH_M.
      const wrap = (xMeter: number) => ((xMeter % SCENE_LENGTH_M) + SCENE_LENGTH_M) % SCENE_LENGTH_M;

      // Shore (top) and water (bottom) lanes.
      const laneH = (height - 60) / 2;
      const shoreY = 28;
      const waterY = shoreY + laneH + 8;

      // Shore lane label
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("SHORE FRAME (lab)", margin, shoreY - 6);

      // Shore lane background
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(margin, shoreY, plotW, laneH);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(margin + 0.5, shoreY + 0.5, plotW - 1, laneH - 1);

      // Water lane label
      ctx.fillStyle = colors.fg2;
      ctx.fillText("WATER FRAME (boat's frame is here, drifting at v)", margin, waterY - 6);

      // Water lane background — cyan-tinted, scrolling stripes for the current.
      ctx.fillStyle = "rgba(116,220,255,0.05)";
      ctx.fillRect(margin, waterY, plotW, laneH);
      // current stripes
      ctx.strokeStyle = "rgba(116,220,255,0.35)";
      ctx.lineWidth = 1;
      const stripeSpacing = 4; // metres
      const stripeOffset = wrap(v * t);
      for (let m = -stripeSpacing; m < SCENE_LENGTH_M + stripeSpacing; m += stripeSpacing) {
        const xx = margin + wrap(m + stripeOffset) * pxPerMeter;
        ctx.beginPath();
        ctx.moveTo(xx, waterY + 4);
        ctx.lineTo(xx + 8, waterY + laneH - 4);
        ctx.stroke();
      }
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(margin + 0.5, waterY + 0.5, plotW - 1, laneH - 1);

      // Boat in shore frame: position drifts at u = u' + v
      const boatShoreX = wrap(shoreSpeed * t);
      const boatShorePx = margin + boatShoreX * pxPerMeter;

      // Boat in water frame: position drifts at u' (as seen by water-frame observer)
      const boatWaterX = wrap(u * t);
      const boatWaterPx = margin + boatWaterX * pxPerMeter;

      // Draw the cyan boat in the water lane
      drawBoat(ctx, boatWaterPx, waterY + laneH / 2, "#74DCFF");
      // Draw the magenta marker in the shore lane (shore-frame projection)
      drawBoat(ctx, boatShorePx, shoreY + laneH / 2, "#FF6ADE");

      // Velocity arrow — shore frame
      drawArrow(
        ctx,
        margin + 4,
        shoreY + laneH - 8,
        margin + 4 + Math.min(plotW - 16, shoreSpeed * 8),
        shoreY + laneH - 8,
        "#FF6ADE",
        `u = ${shoreSpeed.toFixed(2)} m/s`,
      );
      // Velocity arrow — water frame (boat's engine)
      drawArrow(
        ctx,
        margin + 4,
        waterY + laneH - 8,
        margin + 4 + Math.min(plotW - 16, u * 8),
        waterY + laneH - 8,
        "#74DCFF",
        `u′ = ${u.toFixed(2)} m/s`,
      );

      // HUD bar at bottom — the addition statement
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `u  =  u′ + v   ⇒   ${u.toFixed(2)} + ${v.toFixed(2)} = ${shoreSpeed.toFixed(2)} m/s`,
        width / 2,
        height - 10,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full bg-[#0A0C12] pb-3">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-3 text-xs">
        <label className="font-mono text-[var(--color-fg-3)]">u′ (boat in water)</label>
        <input
          type="range"
          min={-8}
          max={8}
          step={0.1}
          value={boatSpeed}
          onChange={(e) => setBoatSpeed(parseFloat(e.target.value))}
          className="accent-[#74DCFF]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">{boatSpeed.toFixed(2)} m/s</span>

        <label className="font-mono text-[var(--color-fg-3)]">v (current)</label>
        <input
          type="range"
          min={-6}
          max={6}
          step={0.1}
          value={currentSpeed}
          onChange={(e) => setCurrentSpeed(parseFloat(e.target.value))}
          className="accent-[#74DCFF]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">{currentSpeed.toFixed(2)} m/s</span>
      </div>
      <div className="mt-1 px-3 font-mono text-[10px] text-[var(--color-fg-3)]">
        Cyan boat = water frame (boat at u′). Magenta marker = shore-frame projection at u = u′ + v.
      </div>
    </div>
  );
}

function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  // hull
  ctx.beginPath();
  ctx.moveTo(-12, 4);
  ctx.lineTo(12, 4);
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  // mast
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, -10);
  ctx.stroke();
  // sail
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(8, 4);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label?: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // arrowhead
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 5;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ah * Math.cos(ang - Math.PI / 6), y2 - ah * Math.sin(ang - Math.PI / 6));
  ctx.lineTo(x2 - ah * Math.cos(ang + Math.PI / 6), y2 - ah * Math.sin(ang + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, x2 + 6, y2 + 4);
  }
  ctx.restore();
}
