"use client";

import { useEffect, useRef, useState } from "react";
import type { Worldline } from "@/lib/physics/relativity/types";

export interface SpacetimeDiagramProps {
  worldlines: readonly Worldline[];
  lightCone?: boolean;
  simultaneitySlice?: { tPrime: number; beta: number } | null;
  boostBeta?: number;
  boostMin?: number;
  boostMax?: number;
  boostStep?: number;
  onBoostChange?: (beta: number) => void;
  xRange?: [number, number];
  tRange?: [number, number];
  width?: number;
  height?: number;
  palette?: Partial<SpacetimePalette>;
}

interface SpacetimePalette {
  stationary: string;
  boosted: string;
  lightCone: string;
  accelerated: string;
  grid: string;
  axes: string;
}

const DEFAULT_PALETTE: SpacetimePalette = {
  stationary: "#67E8F9",
  boosted: "#FF6ADE",
  lightCone: "#FFD66B",
  accelerated: "#FFB36B",
  grid: "rgba(255,255,255,0.08)",
  axes: "rgba(255,255,255,0.6)",
};

export function SpacetimeDiagramCanvas({
  worldlines,
  lightCone = true,
  simultaneitySlice = null,
  boostBeta,
  boostMin = -0.95,
  boostMax = 0.95,
  boostStep = 0.01,
  onBoostChange,
  xRange = [-2, 2],
  tRange = [0, 4],
  width = 480,
  height = 360,
  palette,
}: SpacetimeDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = { ...DEFAULT_PALETTE, ...palette };
  const [internalBeta, setInternalBeta] = useState(boostBeta ?? 0);
  const beta = onBoostChange !== undefined ? (boostBeta ?? 0) : internalBeta;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Map (x, ct) world coords to canvas pixel coords. Origin at lower-left + margin.
    const margin = 36;
    const plotW = width - 2 * margin;
    const plotH = height - 2 * margin;
    const [xMin, xMax] = xRange;
    const [tMin, tMax] = tRange;
    const xToPx = (x: number) => margin + ((x - xMin) / (xMax - xMin)) * plotW;
    const tToPx = (t: number) => height - margin - ((t - tMin) / (tMax - tMin)) * plotH;

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(x), tToPx(tMin));
      ctx.lineTo(xToPx(x), tToPx(tMax));
      ctx.stroke();
    }
    for (let t = Math.ceil(tMin); t <= Math.floor(tMax); t++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(t));
      ctx.lineTo(xToPx(xMax), tToPx(t));
      ctx.stroke();
    }

    // Lab axes
    ctx.strokeStyle = colors.axes;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(tMin));
    ctx.lineTo(xToPx(0), tToPx(tMax));
    ctx.moveTo(xToPx(xMin), tToPx(0));
    ctx.lineTo(xToPx(xMax), tToPx(0));
    ctx.stroke();

    // Light cone (ct = ±x from origin)
    if (lightCone) {
      ctx.strokeStyle = colors.lightCone;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(-xMin));
      ctx.lineTo(xToPx(xMax), tToPx(xMax));
      ctx.moveTo(xToPx(xMin), tToPx(xMin));
      ctx.lineTo(xToPx(xMax), tToPx(-xMax));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Boosted axes overlay (ct' axis at slope 1/β; x' axis at slope β)
    if (Math.abs(beta) > 1e-6) {
      ctx.strokeStyle = colors.boosted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // ct' axis: x = β·ct, so points (β·t, t) for t ∈ tRange
      ctx.moveTo(xToPx(beta * tMin), tToPx(tMin));
      ctx.lineTo(xToPx(beta * tMax), tToPx(tMax));
      // x' axis: ct = β·x
      ctx.moveTo(xToPx(xMin), tToPx(beta * xMin));
      ctx.lineTo(xToPx(xMax), tToPx(beta * xMax));
      ctx.stroke();
    }

    // Simultaneity slice (line of constant t' = γ(t − βx) = const)
    if (simultaneitySlice) {
      const { tPrime, beta: sliceBeta } = simultaneitySlice;
      const g = 1 / Math.sqrt(1 - sliceBeta * sliceBeta);
      // t = tPrime / γ + β · x
      const t1 = tPrime / g + sliceBeta * xMin;
      const t2 = tPrime / g + sliceBeta * xMax;
      ctx.strokeStyle = colors.boosted;
      ctx.setLineDash([2, 6]);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(t1));
      ctx.lineTo(xToPx(xMax), tToPx(t2));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Worldlines
    for (const wl of worldlines) {
      ctx.strokeStyle = wl.accelerated ? colors.accelerated : wl.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (const ev of wl.events) {
        // Use ev.t directly as the ct coordinate (caller is expected to pass ct units).
        const px = xToPx(ev.x);
        const py = tToPx(ev.t);
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Label at last event
      if (wl.label && wl.events.length > 0) {
        const last = wl.events[wl.events.length - 1];
        ctx.fillStyle = wl.accelerated ? colors.accelerated : wl.color;
        ctx.font = "12px ui-monospace, monospace";
        ctx.fillText(wl.label, xToPx(last.x) + 6, tToPx(last.t));
      }
    }
  }, [worldlines, lightCone, simultaneitySlice, beta, xRange, tRange, width, height, colors]);

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      {onBoostChange !== undefined ? (
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span>β = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={boostMin}
            max={boostMax}
            step={boostStep}
            value={beta}
            onChange={(e) => onBoostChange(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      ) : null}
    </div>
  );
}
