"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.75;
const MAX_HEIGHT = 420;
const G = 9.80665;

// Simple linear drag: m·a = m·g − b·v → terminal v_t = m·g/b
// Hammer: heavy, tiny drag → falls ~ as in vacuum
// Feather: light, large drag/mass → low terminal velocity → drifts
const FEATHER_TAU = 0.15;

function positionWithDrag(t: number, tau: number, h: number) {
  // With linear drag: y(t) = v_t * (t - tau*(1 - exp(-t/tau)))
  // We scale by a time factor so fall looks right on screen.
  const vt = G * tau;
  const fallen = vt * (t - tau * (1 - Math.exp(-t / tau)));
  return Math.min(fallen, h);
}

function positionVacuum(t: number, h: number) {
  return Math.min(0.5 * G * t * t, h);
}

export function FreeFallScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [airOn, setAirOn] = useState(true);
  const [size, setSize] = useState({ width: 500, height: 400 });
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

  // Reset on toggle
  useEffect(() => {
    startRef.current = null;
  }, [airOn]);

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
      const tLocal = t - startRef.current;

      ctx.clearRect(0, 0, width, height);

      const padX = 30;
      const topY = 40;
      const floorY = height - 28;
      const fallPx = floorY - topY;

      // World units: map 0..fallH meters → 0..fallPx pixels
      const fallH = 2.2; // metres of drop to animate

      // Hammer time-scaled: use real seconds → slow down by factor
      const tSim = tLocal * 0.9;

      const hammerM = positionVacuum(tSim, fallH);
      const featherM = airOn
        ? positionWithDrag(tSim, FEATHER_TAU, fallH)
        : positionVacuum(tSim, fallH);

      // restart when hammer lands (with a short pause)
      if (hammerM >= fallH && featherM >= fallH) {
        if (tSim > (airOn ? 6 : 2)) {
          startRef.current = t;
        }
      }

      const hammerY = topY + (hammerM / fallH) * fallPx;
      const featherY = topY + (featherM / fallH) * fallPx;

      const hammerX = width * 0.33;
      const featherX = width * 0.67;

      // Floor line
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, floorY);
      ctx.lineTo(width - padX, floorY);
      ctx.stroke();

      // Ceiling (release line)
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padX, topY);
      ctx.lineTo(width - padX, topY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Column divider
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2, topY - 10);
      ctx.lineTo(width / 2, floorY);
      ctx.stroke();

      // Labels above
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("hammer", hammerX, topY - 14);
      ctx.fillText("feather", featherX, topY - 14);

      // Hammer (grey rounded rect)
      ctx.fillStyle = "#A0A8B4";
      ctx.beginPath();
      ctx.roundRect(hammerX - 10, hammerY - 12, 20, 24, 3);
      ctx.fill();
      // hammer head
      ctx.fillRect(hammerX - 16, hammerY - 14, 32, 8);

      // Feather (thin teardrop)
      ctx.fillStyle = "#E4C27A";
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - 16);
      ctx.quadraticCurveTo(
        featherX + 10,
        featherY - 4,
        featherX,
        featherY + 10,
      );
      ctx.quadraticCurveTo(
        featherX - 10,
        featherY - 4,
        featherX,
        featherY - 16,
      );
      ctx.fill();
      // spine
      ctx.strokeStyle = "#8A6F40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - 14);
      ctx.lineTo(featherX, featherY + 9);
      ctx.stroke();

      // Status
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        airOn ? "with air resistance" : "in vacuum",
        padX,
        floorY + 20,
      );
      ctx.textAlign = "right";
      ctx.fillText(`g = 9.81 m/s²`, width - padX, floorY + 20);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">Air</label>
        <button
          type="button"
          onClick={() => setAirOn((v) => !v)}
          className={`rounded border px-3 py-1 text-xs font-mono transition ${
            airOn
              ? "border-[#5BE9FF] text-[#5BE9FF]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)]"
          }`}
        >
          {airOn ? "on" : "off"}
        </button>
        <span className="ml-2 text-xs text-[var(--color-fg-3)]">
          {airOn
            ? "drag slows the feather"
            : "vacuum — both fall at the same rate"}
        </span>
      </div>
    </div>
  );
}
