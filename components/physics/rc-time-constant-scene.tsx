"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { rcCharge } from "@/lib/physics/electromagnetism/rc-circuits";

/**
 * Three RC charging curves at R = 100 Ω, 1 kΩ, 10 kΩ with the same C,
 * same V₀. Makes τ's linear dependence on R physical: double R, double
 * τ, half the pace. Reference dashed line at 63 % of V₀ — each curve
 * crosses it at exactly its own τ.
 *
 * Palette:
 *   magenta #FF6ADE — R = 100 Ω   (τ small,   fastest)
 *   amber   #FFD66B — R = 1 kΩ    (τ medium)
 *   cyan    #6FB8C6 — R = 10 kΩ   (τ large,   slowest)
 *   lilac-green guides at 63 % and each τ
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const V0 = 5; // volts
const C = 470e-6; // farads
const R_VALUES = [100, 1000, 10000] as const;
const R_COLORS = ["#FF6ADE", "#FFD66B", "#6FB8C6"] as const;
const LILAC_DIM = "rgba(200, 160, 255, 0.65)";
const GUIDE_DIM = "rgba(120, 255, 170, 0.55)";
const CYCLE_S = 12; // sweep period

export function RcTimeConstantScene() {
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
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
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

      // Layout — full plot, no circuit art. This scene is about the curves.
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

      // Time axis scaled to the *largest* τ so the big guy fits.
      const tauMax = R_VALUES[R_VALUES.length - 1] * C;
      const tMax = 5 * tauMax; // 5τ of the slowest curve

      const xOf = (tt: number) => xL + (tt / tMax) * plotW;
      const yOf = (frac: number) => yB - frac * plotH;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(xL, yT, plotW, plotH);

      // Asymptote
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xL, yT + 1);
      ctx.lineTo(xR, yT + 1);
      ctx.stroke();
      ctx.setLineDash([]);

      // 63 % guide
      ctx.strokeStyle = GUIDE_DIM;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(xL, yOf(0.632));
      ctx.lineTo(xR, yOf(0.632));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = GUIDE_DIM;
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText("63 % (each curve at its own τ)", xR - 4, yOf(0.632) - 2);

      // Vertical guides at each τ
      R_VALUES.forEach((R, idx) => {
        const tau = R * C;
        const x = xOf(tau);
        ctx.strokeStyle = `${R_COLORS[idx]!}55`;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, yT);
        ctx.lineTo(x, yB);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = R_COLORS[idx]!;
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`τ=${formatMs(tau)}`, x, yB + 12);
      });

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("V₀", xL - 6, yT + 8);
      ctx.fillText("0", xL - 6, yB + 2);
      ctx.textAlign = "center";
      ctx.fillText("t (s)", (xL + xR) / 2, yB + 26);
      ctx.textAlign = "left";
      ctx.fillText("0", xL, yB + 12);
      ctx.textAlign = "right";
      ctx.fillText(`${tMax.toFixed(2)} s`, xR - 6, yB + 12);

      // Three curves
      R_VALUES.forEach((R, idx) => {
        ctx.strokeStyle = R_COLORS[idx]!;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        const samples = 180;
        for (let k = 0; k <= samples; k++) {
          const tt = (k / samples) * tMax;
          const v = rcCharge(V0, R, C, tt);
          const frac = v / V0;
          const x = xOf(tt);
          const y = yOf(frac);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // moving dot
        const Vnow = rcCharge(V0, R, C, tNow);
        const frac = Vnow / V0;
        if (tNow >= 0 && tNow <= tMax) {
          ctx.fillStyle = R_COLORS[idx]!;
          ctx.shadowColor = `${R_COLORS[idx]!}99`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(xOf(tNow), yOf(frac), 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Time cursor
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(xOf(Math.min(tNow, tMax)), yT);
      ctx.lineTo(xOf(Math.min(tNow, tMax)), yB);
      ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      const legX = xL + 10;
      const legY = yT + 18;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      R_VALUES.forEach((R, idx) => {
        ctx.fillStyle = R_COLORS[idx]!;
        ctx.fillRect(legX, legY + idx * 16 - 6, 12, 2);
        const tau = R * C;
        ctx.fillText(
          `R = ${fmtOhms(R)}   τ = ${formatMs(tau)}`,
          legX + 18,
          legY + idx * 16,
        );
      });

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        `V_c(t) = V₀(1 − e^(−t/τ))   τ = R·C   V₀ = ${V0} V   C = ${(C * 1e6).toFixed(0)} µF`,
        xR,
        yT - 10,
      );
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText(`t = ${tNow.toFixed(2)} s`, xL, yT - 10);
      void LILAC_DIM;
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
        three resistors · same capacitor · τ scales linearly with R
      </div>
    </div>
  );
}

function fmtOhms(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(0)} kΩ`;
  return `${v} Ω`;
}
function formatMs(tau: number): string {
  if (tau >= 1) return `${tau.toFixed(2)} s`;
  if (tau >= 1e-3) return `${(tau * 1e3).toFixed(0)} ms`;
  return `${(tau * 1e6).toFixed(0)} µs`;
}
