"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { rlCurrent } from "@/lib/physics/electromagnetism/inductance";

/**
 * Three RL transients plotted together — τ = 0.5 s, 1 s, 2 s — sharing the
 * same asymptote V/R. Vertical gridlines at 1τ, 2τ, 3τ of the selected
 * primary trace, horizontal gridlines at 63 %, 86 %, 95 % of V/R.
 *
 * A time cursor sweeps across, showing each curve's instantaneous value.
 * The reader sees exactly how τ sets the "filling-the-bucket" rhythm.
 *
 * Palette:
 *   amber    — τ = 1 s (the reference curve whose gridlines are drawn)
 *   magenta  — τ = 0.5 s
 *   cyan     — τ = 2 s
 *   green    — 63 / 86 / 95 % horizontal guide lines
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const V = 12;
const R = 4;
const TAUS = [0.5, 1.0, 2.0] as const;
const TAU_COLORS = ["#FF6ADE", "#FFD66B", "#6FB8C6"] as const;
const GREEN_DIM = "rgba(120, 255, 170, 0.65)";
const CYCLE_S = 10; // sweep period, then reset

export function RLTimeConstantScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
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

      const tNow = t % CYCLE_S;
      const Iasymp = V / R;

      // ── Layout ──
      const padL = 58;
      const padR = 24;
      const padT = 28;
      const padB = 36;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const xL = padL;
      const xR = padL + plotW;
      const yT = padT;
      const yB = padT + plotH;

      const tMax = 8; // seconds on the x-axis (4τ of the τ = 2 curve)
      const xOf = (tt: number) => xL + (tt / tMax) * plotW;
      const yOf = (frac: number) => yB - frac * plotH;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(xL, yT, plotW, plotH);

      // Dashed asymptote at 100%
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xL, yT + 1);
      ctx.lineTo(xR, yT + 1);
      ctx.stroke();
      ctx.setLineDash([]);

      // Horizontal guide lines at 63%, 86%, 95%
      const guides = [
        { frac: 0.632, label: "63 % (1τ)" },
        { frac: 0.865, label: "86 % (2τ)" },
        { frac: 0.950, label: "95 % (3τ)" },
      ];
      ctx.strokeStyle = GREEN_DIM;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      guides.forEach((g) => {
        ctx.beginPath();
        ctx.moveTo(xL, yOf(g.frac));
        ctx.lineTo(xR, yOf(g.frac));
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = GREEN_DIM;
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      guides.forEach((g) => {
        ctx.fillText(g.label, xR - 4, yOf(g.frac) - 2);
      });

      // Vertical guides at τ, 2τ, 3τ for the reference τ = 1 s curve
      const tauRef = 1.0;
      [1, 2, 3].forEach((k) => {
        const x = xOf(k * tauRef);
        ctx.strokeStyle = "rgba(255, 214, 107, 0.35)";
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, yT);
        ctx.lineTo(x, yB);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255, 214, 107, 0.85)";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${k}τ`, x, yB + 12);
      });

      // Axis ticks
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("V/R", xL - 6, yT + 8);
      ctx.fillText("0", xL - 6, yB + 2);
      ctx.textAlign = "center";
      ctx.fillText("t (s)", (xL + xR) / 2, yB + 26);
      ctx.textAlign = "left";
      ctx.fillText("0", xL, yB + 12);
      ctx.fillText(`${tMax}`, xR - 6, yB + 12);

      // Draw each curve
      TAUS.forEach((tau, idx) => {
        ctx.strokeStyle = TAU_COLORS[idx]!;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        const samples = 160;
        for (let i = 0; i <= samples; i++) {
          const tt = (i / samples) * tMax;
          const I = rlCurrent(V, R, R * tau, tt); // L = Rτ gives τ = L/R
          const frac = I / Iasymp;
          const x = xOf(tt);
          const y = yOf(frac);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Current-position dot
        const Inow = rlCurrent(V, R, R * tau, tNow);
        const fracNow = Inow / Iasymp;
        if (tNow >= 0 && tNow <= tMax) {
          ctx.fillStyle = TAU_COLORS[idx]!;
          ctx.shadowColor = `${TAU_COLORS[idx]!}99`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(xOf(tNow), yOf(fracNow), 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Time cursor
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xOf(Math.min(tNow, tMax)), yT);
      ctx.lineTo(xOf(Math.min(tNow, tMax)), yB);
      ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      const legX = xL + 8;
      const legY = yT + 18;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      TAUS.forEach((tau, idx) => {
        ctx.fillStyle = TAU_COLORS[idx]!;
        ctx.fillRect(legX, legY + idx * 16 - 6, 12, 2);
        ctx.fillText(`τ = ${tau.toFixed(1)} s`, legX + 18, legY + idx * 16);
      });

      // HUD header
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        `I(t) = (V/R)(1 − e^(−t/τ))   V = ${V} V   R = ${R} Ω`,
        xR,
        yT - 10,
      );
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText(`t = ${tNow.toFixed(2)} s`, xL, yT - 10);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        three RL transients · τ = L/R · bigger τ, slower rise
      </div>
    </div>
  );
}
