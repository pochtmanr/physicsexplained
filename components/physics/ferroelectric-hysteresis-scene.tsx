"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  ferroelectricHysteresis,
  remanentPolarisation,
  type HysteresisParams,
} from "@/lib/physics/electromagnetism/piezo";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

const PARAMS: HysteresisParams = {
  Esat: 1.0e6, // V/m
  Psat: 0.26, // C/m² (BaTiO₃-ish)
  Ecoercive: 1.5e5, // V/m
};

const SWEEP_PERIOD_S = 6; // seconds for one full triangular E sweep

/**
 * Ferroelectric P–E loop with a live trace.
 *
 *   • Drive E with a triangular wave between −Esat and +Esat (period = 6 s).
 *   • Step the model forward each frame, feeding the previous (E, P) back in.
 *   • Plot P vs E. Fade old samples so the loop stays clean across cycles.
 *   • Mark the coercive field ±Ec (P = 0 crossings) and the remanent
 *     polarisation ±P_r (E = 0 crossings).
 */
export function FerroelectricHysteresisScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });

  // Trail: rolling buffer of (E, P) samples with an age in seconds.
  const trailRef = useRef<Array<{ E: number; P: number; t: number }>>([]);
  const stateRef = useRef({ previousE: PARAMS.Esat, previousP: PARAMS.Psat });

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

      ctx.clearRect(0, 0, width, height);

      // ── Compute current applied E from a triangle wave ──
      const phase = (t % SWEEP_PERIOD_S) / SWEEP_PERIOD_S; // 0..1
      // 0 → 1: down from +Esat to −Esat
      // 1 → 2: up from −Esat to +Esat
      let E: number;
      if (phase < 0.5) {
        E = PARAMS.Esat * (1 - 4 * phase); // 1 → −1 over [0, 0.5]
      } else {
        E = PARAMS.Esat * (-1 + 4 * (phase - 0.5)); // −1 → 1 over [0.5, 1]
      }

      // Step the model
      const P = ferroelectricHysteresis(E, stateRef.current, PARAMS);
      stateRef.current = { previousE: E, previousP: P };

      // Push into trail; evict samples older than 2 cycles
      trailRef.current.push({ E, P, t });
      const cutoff = t - 2 * SWEEP_PERIOD_S;
      while (
        trailRef.current.length > 0 &&
        trailRef.current[0]!.t < cutoff
      ) {
        trailRef.current.shift();
      }

      // ── Plot frame ──
      const padL = 56;
      const padR = 24;
      const padT = 20;
      const padB = 36;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      // Map (E, P) → (px, py) with E on x and P on y.
      const Erange = PARAMS.Esat * 1.15;
      const Prange = PARAMS.Psat * 1.15;
      const xOf = (e: number) =>
        padL + ((e + Erange) / (2 * Erange)) * plotW;
      const yOf = (p: number) =>
        padT + (1 - (p + Prange) / (2 * Prange)) * plotH;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, plotH);

      // Axes (E = 0 vertical, P = 0 horizontal)
      ctx.strokeStyle = "rgba(86, 104, 127, 0.55)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xOf(0), padT);
      ctx.lineTo(xOf(0), padT + plotH);
      ctx.moveTo(padL, yOf(0));
      ctx.lineTo(padL + plotW, yOf(0));
      ctx.stroke();
      ctx.setLineDash([]);

      // Coercive-field markers ±Ec at the P = 0 line
      const Pr = remanentPolarisation(PARAMS);
      ctx.fillStyle = "rgba(255, 214, 107, 0.7)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "−Ec",
        xOf(-PARAMS.Ecoercive),
        yOf(0) + 14,
      );
      ctx.fillText(
        "+Ec",
        xOf(+PARAMS.Ecoercive),
        yOf(0) + 14,
      );
      // Tick marks
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(xOf(-PARAMS.Ecoercive), yOf(0) - 4);
      ctx.lineTo(xOf(-PARAMS.Ecoercive), yOf(0) + 4);
      ctx.moveTo(xOf(+PARAMS.Ecoercive), yOf(0) - 4);
      ctx.lineTo(xOf(+PARAMS.Ecoercive), yOf(0) + 4);
      ctx.stroke();

      // Remanent-polarisation markers ±Pr on the E = 0 line
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 106, 222, 0.8)";
      ctx.fillText("+Pr", xOf(0) - 6, yOf(+Pr) + 4);
      ctx.fillStyle = "rgba(111, 184, 198, 0.8)";
      ctx.fillText("−Pr", xOf(0) - 6, yOf(-Pr) + 4);
      ctx.strokeStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.moveTo(xOf(0) - 4, yOf(+Pr));
      ctx.lineTo(xOf(0) + 4, yOf(+Pr));
      ctx.stroke();
      ctx.strokeStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.moveTo(xOf(0) - 4, yOf(-Pr));
      ctx.lineTo(xOf(0) + 4, yOf(-Pr));
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("E (V/m)", padL + plotW / 2, padT + plotH + 28);
      ctx.save();
      ctx.translate(16, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("P (C/m²)", 0, 0);
      ctx.restore();

      // E and P scale annotations at the corners
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg3;
      ctx.font = "9px monospace";
      ctx.fillText(`±${(PARAMS.Esat / 1e6).toFixed(1)} MV/m`, padL, padT - 6);
      ctx.textAlign = "right";
      ctx.fillText(`±${PARAMS.Psat.toFixed(2)} C/m²`, padL + plotW, padT - 6);

      // ── The trail ──
      const trail = trailRef.current;
      ctx.lineWidth = 1.6;
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1]!;
        const b = trail[i]!;
        const age = (t - b.t) / (2 * SWEEP_PERIOD_S);
        const alpha = Math.max(0.05, 1 - age);
        ctx.strokeStyle = `rgba(255, 106, 222, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(xOf(a.E), yOf(a.P));
        ctx.lineTo(xOf(b.E), yOf(b.P));
        ctx.stroke();
      }

      // Current position dot
      ctx.fillStyle = "#FFD66B";
      ctx.shadowColor = "rgba(255, 214, 107, 0.7)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(xOf(E), yOf(P), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `E = ${formatField(E)}    P = ${formatPolarization(P)}`,
        padL,
        14,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg3;
      ctx.fillText("major loop · BaTiO₃-ish", width - padR, 14);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function formatField(E: number): string {
  const a = Math.abs(E);
  if (a >= 1e6) return `${(E / 1e6).toFixed(2)} MV/m`;
  if (a >= 1e3) return `${(E / 1e3).toFixed(2)} kV/m`;
  return `${E.toFixed(0)} V/m`;
}

function formatPolarization(P: number): string {
  const a = Math.abs(P);
  if (a >= 1e-3) return `${(P * 1e3).toFixed(2)} mC/m²`;
  if (a >= 1e-6) return `${(P * 1e6).toFixed(2)} µC/m²`;
  return `${P.toExponential(2)} C/m²`;
}
