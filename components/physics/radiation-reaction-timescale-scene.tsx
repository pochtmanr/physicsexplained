"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.54;
const MAX_HEIGHT = 360;

/**
 * FIG.57c — Radiation-reaction timescale landscape.
 *
 * Horizontal log axis spans the timescales that matter for "does classical
 * radiation reaction matter here?":
 *
 *     10⁻⁴⁴ s   Planck time
 *     10⁻²⁴ s   τ₀, Abraham-Lorentz electron timescale
 *     10⁻¹⁸ s   attosecond — inner-shell atomic transitions
 *     10⁻¹⁵ s   femtosecond — typical optical atomic transition
 *     10⁻¹²    picosecond — nuclear decay tails
 *     10⁻⁹     nanosecond — fluorescence, digital-clock period
 *     10⁻³     millisecond — human reaction time floor
 *     10⁰      second — everyday time
 *
 * The annotation "at t ~ τ₀ classical electrodynamics breaks; QED is
 * required" sits right on the τ₀ marker. The pale-blue band from the
 * Planck time up through τ₀ is labelled "below this boundary the
 * classical picture does not work" — the honesty the topic is built
 * around.
 */
const MARKERS: { logT: number; label: string; detail: string; color: string }[] = [
  {
    logT: -44,
    label: "Planck time",
    detail: "5.4 × 10⁻⁴⁴ s  —  quantum gravity",
    color: "rgba(200, 160, 255, 0.95)",
  },
  {
    logT: -23.2,
    // 6.27e-24 s → log10 ≈ -23.2
    label: "τ₀  (classical electron)",
    detail: "6.27 × 10⁻²⁴ s  —  Abraham-Lorentz",
    color: "rgba(255, 106, 222, 1)",
  },
  {
    logT: -18,
    label: "attosecond",
    detail: "inner-shell transitions, X-ray pulses",
    color: "rgba(255, 180, 80, 0.9)",
  },
  {
    logT: -15,
    label: "femtosecond",
    detail: "optical atomic transitions",
    color: "rgba(255, 180, 80, 0.9)",
  },
  {
    logT: -12,
    label: "picosecond",
    detail: "fast molecular vibrations",
    color: "rgba(140, 240, 200, 0.9)",
  },
  {
    logT: -9,
    label: "nanosecond",
    detail: "fluorescence, clock periods",
    color: "rgba(140, 240, 200, 0.9)",
  },
  {
    logT: -3,
    label: "millisecond",
    detail: "biological response floor",
    color: "rgba(140, 200, 255, 0.9)",
  },
  {
    logT: 0,
    label: "second",
    detail: "everyday time",
    color: "rgba(140, 200, 255, 0.9)",
  },
];

export function RadiationReactionTimescaleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 760, height: 360 });

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

  useEffect(() => {
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

    ctx.fillStyle = "#1A1D24";
    ctx.fillRect(0, 0, width, height);

    // Layout
    const padL = 40;
    const padR = 40;
    const padT = 44;
    const padB = 60;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const axisY = padT + plotH * 0.6;
    const logMin = -46;
    const logMax = 2;

    const toPx = (logT: number) =>
      padL + ((logT - logMin) / (logMax - logMin)) * plotW;

    // Title
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("timescale landscape  (log₁₀ seconds)", padL, padT - 18);

    // Pale-blue band — "below this boundary classical EM fails"
    const bandStart = toPx(-46);
    const bandEnd = toPx(-23.2);
    ctx.fillStyle = "rgba(140, 200, 255, 0.09)";
    ctx.fillRect(bandStart, padT, bandEnd - bandStart, plotH);
    ctx.strokeStyle = "rgba(140, 200, 255, 0.5)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bandEnd, padT);
    ctx.lineTo(bandEnd, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Band label
    ctx.fillStyle = "rgba(140, 200, 255, 0.85)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "below here: classical EM fails  →  QED is required",
      (bandStart + bandEnd) / 2,
      padT + 14,
    );

    // Main axis line
    ctx.strokeStyle = "rgba(160, 176, 200, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, axisY);
    ctx.lineTo(padL + plotW, axisY);
    ctx.stroke();

    // Minor decade ticks
    ctx.strokeStyle = "rgba(160, 176, 200, 0.35)";
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.fg2;
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    for (let l = logMin; l <= logMax; l += 2) {
      const px = toPx(l);
      ctx.beginPath();
      ctx.moveTo(px, axisY - 4);
      ctx.lineTo(px, axisY + 4);
      ctx.stroke();
      if (l % 4 === 0 || l === -23 || l === -44) {
        ctx.fillText(`10^${l}`, px, axisY + 18);
      }
    }
    // Axis label
    ctx.fillStyle = colors.fg1;
    ctx.font = "10px monospace";
    ctx.fillText("time  (seconds)", padL + plotW / 2, axisY + 36);

    // Alternate labels above/below so text doesn't collide
    MARKERS.forEach((m, i) => {
      const px = toPx(m.logT);
      const above = i % 2 === 0;
      const y1 = axisY - 8;
      const y2 = above ? axisY - 42 : axisY + 40;

      // Tick
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, y1);
      ctx.lineTo(px, above ? y2 + 14 : y2 - 14);
      ctx.stroke();

      // Dot on axis
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(px, axisY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = m.color;
      ctx.fillText(m.label, px, above ? y2 : y2 + 4);
      ctx.font = "9px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(m.detail, px, above ? y2 + 12 : y2 + 16);
    });

    // Big callout on τ₀
    const tauX = toPx(-23.2);
    ctx.strokeStyle = "rgba(255, 106, 222, 0.6)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tauX, padT);
    ctx.lineTo(tauX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(255, 106, 222, 1)";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "at t ~ τ₀ the classical picture breaks",
      tauX,
      padT + plotH + 28,
    );
    ctx.font = "9px monospace";
    ctx.fillStyle = colors.fg2;
    ctx.fillText(
      "QED with renormalisation takes over below this scale",
      tauX,
      padT + plotH + 42,
    );
  }, [size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block rounded-md"
      />
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        τ₀ is the clock speed of Abraham-Lorentz pathologies. Its tiny
        size (6×10⁻²⁴ s) is why the runaway and pre-acceleration look
        absurd in everyday terms — but they are absurd all the way down
        to quantum scales, where QED must take over.
      </p>
    </div>
  );
}
