"use client";

import { useEffect, useRef, useState } from "react";
import {
  stringModeAt,
  pluckedStringCoefficient,
  triangularPluck,
} from "@/lib/physics/modes";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const SAMPLES = 200;

type Mode = "single" | "fourier";

export interface StringModesSceneProps {
  /** Start in Fourier/superposition mode instead of single-mode. */
  startInFourier?: boolean;
}

export function StringModesScene({
  startInFourier = false,
}: StringModesSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [mode, setMode] = useState<Mode>(startInFourier ? "fourier" : "single");
  const [n, setN] = useState(1);
  const [nFourier, setNFourier] = useState(12);
  const [size, setSize] = useState({ width: 480, height: 280 });

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

  const { width, height } = size;

  // Physical parameters — fixed, so we can focus on modal shape.
  const L = 1;
  const c = 1;
  const pluckPos = 0.3;

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const marginL = 40;
      const marginR = 20;
      const topPad = 24;
      const botPad = 30;
      const plotW = width - marginL - marginR;
      const plotH = height - topPad - botPad;
      const midY = topPad + plotH / 2;
      const amp = plotH * 0.42;

      // Equilibrium / baseline
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(marginL, midY);
      ctx.lineTo(marginL + plotW, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fixed endpoints
      const endW = 6;
      const endH = 24;
      ctx.fillStyle = colors.fg2;
      ctx.fillRect(marginL - endW / 2, midY - endH / 2, endW, endH);
      ctx.fillRect(
        marginL + plotW - endW / 2,
        midY - endH / 2,
        endW,
        endH,
      );

      // Build y(x, t)
      const values: number[] = [];
      if (mode === "single") {
        for (let i = 0; i <= SAMPLES; i++) {
          const x = (L * i) / SAMPLES;
          values.push(stringModeAt(x, t, n, L, c, 1));
        }
      } else {
        // Fourier pluck: sum first nFourier modes, each oscillating at its
        // own frequency ω_k = k π c / L. Time evolution makes the shape
        // "breathe" — the pluck peak decomposes and recomposes.
        for (let i = 0; i <= SAMPLES; i++) {
          const x = (L * i) / SAMPLES;
          let y = 0;
          for (let k = 1; k <= nFourier; k++) {
            const bk = pluckedStringCoefficient(k, pluckPos);
            y += stringModeAt(x, t, k, L, c, bk);
          }
          values.push(y);
        }
      }

      // Normalise amplitude so both visualisations fill the frame well.
      const yScale =
        mode === "single"
          ? amp
          : amp / 1.0; // triangular pluck has peak ≈ 1

      // Nodes: for single mode, mark them; for Fourier, skip (not useful)
      if (mode === "single") {
        ctx.fillStyle = colors.fg2;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        for (let i = 0; i <= n; i++) {
          const sNode = i / n;
          const px = marginL + plotW * sNode;
          // small tick + label
          ctx.strokeStyle = colors.fg3;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(px, topPad);
          ctx.lineTo(px, topPad + plotH);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillText("N", px, topPad + plotH + 14);
        }

        // Antinodes (halfway between adjacent nodes)
        ctx.fillStyle = "#FFD93D";
        for (let i = 0; i < n; i++) {
          const sAnti = (i + 0.5) / n;
          const px = marginL + plotW * sAnti;
          ctx.fillText("A", px, topPad - 6);
        }
      }

      // Draw the string
      ctx.strokeStyle = "#6FB8C6";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(111, 184, 198, 0.55)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i <= SAMPLES; i++) {
        const px = marginL + (plotW * i) / SAMPLES;
        const py = midY - values[i]! * yScale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // In Fourier mode, overlay the exact triangular pluck shape (target).
      if (mode === "fourier") {
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        for (let i = 0; i <= SAMPLES; i++) {
          const sX = i / SAMPLES;
          // Static target shape — doesn't move in time
          const target = triangularPluck(sX, pluckPos);
          const px = marginL + (plotW * i) / SAMPLES;
          const py = midY - target * yScale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Label
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      const label =
        mode === "single"
          ? `mode n = ${n}    ω = ${n}·π·c/L`
          : `pluck · first ${nFourier} modes`;
      ctx.fillText(label, marginL, topPad - 8);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />

      <div className="mt-3 flex gap-2 text-xs font-mono">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-3 py-1 border ${
            mode === "single"
              ? "border-[#6FB8C6] text-[#6FB8C6]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)]"
          }`}
        >
          SINGLE MODE
        </button>
        <button
          type="button"
          onClick={() => setMode("fourier")}
          className={`px-3 py-1 border ${
            mode === "fourier"
              ? "border-[#6FB8C6] text-[#6FB8C6]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)]"
          }`}
        >
          PLUCK (FOURIER)
        </button>
      </div>

      {mode === "single" ? (
        <div className="mt-2 flex items-center gap-3 px-2">
          <label className="text-sm text-[var(--color-fg-3)]">
            n
          </label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-8 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {n}
          </span>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3 px-2">
          <label className="text-sm text-[var(--color-fg-3)]">
            modes summed
          </label>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={nFourier}
            onChange={(e) => setNFourier(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-8 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {nFourier}
          </span>
        </div>
      )}
    </div>
  );
}
