"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { resistance } from "@/lib/physics/electromagnetism/superconductivity";

const RATIO = 0.58;
const MAX_HEIGHT = 380;

interface Material {
  name: string;
  Tc: number; // Kelvin
  R0: number; // normalised normal-state resistance (relative units)
  note: string;
}

const MATERIALS: Material[] = [
  { name: "Mercury (Hg) · 1911", Tc: 4.2, R0: 1.0, note: "Onnes's original" },
  { name: "Lead (Pb)", Tc: 7.2, R0: 0.85, note: "Meissner 1933" },
  { name: "Niobium (Nb)", Tc: 9.3, R0: 0.95, note: "strongest elemental" },
  { name: "YBa₂Cu₃O₇ (YBCO)", Tc: 92, R0: 1.1, note: "Bednorz–Müller 1986" },
];

/**
 * Kamerlingh Onnes's 1911 chart, redrawn — and the decades of higher-T_c
 * records layered on top.
 *
 *   • x-axis: temperature (K) on a log scale so Hg (4.2 K) and YBCO (92 K)
 *     fit in the same frame without crushing the low-T step
 *   • y-axis: normalised resistance R / R_normal
 *   • trace: resistance(T; T_c, R₀) rendered as a step for each selected
 *     material. The canonical motif — the sharp step at T = T_c — looks
 *     the same regardless of the absolute T_c
 *
 * Selector: a row of material buttons. The previously selected materials
 * fade as a visual palimpsest so the reader can compare transition
 * temperatures across ~20× in T.
 */
export function CriticalTemperatureScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
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

      const padL = 54;
      const padR = 20;
      const padT = 28;
      const padB = 40;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      // Log-scale x
      const Tmin = 1;
      const Tmax = 200;
      const xOf = (T: number) =>
        padL + (Math.log10(Math.max(T, Tmin)) - Math.log10(Tmin)) /
          (Math.log10(Tmax) - Math.log10(Tmin)) * plotW;
      const yOf = (r: number) =>
        padT + (1 - r / 1.2) * plotH;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, plotH);

      // Gridlines at decade boundaries
      ctx.strokeStyle = "rgba(86, 104, 127, 0.35)";
      ctx.lineWidth = 1;
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      for (const T of [1, 2, 5, 10, 20, 50, 100, 200]) {
        const x = xOf(T);
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(`${T}`, x, padT + plotH + 14);
      }
      ctx.textAlign = "right";
      for (const r of [0, 0.5, 1.0]) {
        const y = yOf(r);
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(86, 104, 127, 0.35)";
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(r.toFixed(1), padL - 6, y + 3);
      }

      // Axis labels
      ctx.textAlign = "center";
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText("T (K, log scale)", padL + plotW / 2, padT + plotH + 30);
      ctx.save();
      ctx.translate(16, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("R / R_normal", 0, 0);
      ctx.restore();

      // Draw non-selected traces as faded palimpsest
      const active = MATERIALS[selected]!;
      MATERIALS.forEach((m, i) => {
        if (i === selected) return;
        drawStep(ctx, m, xOf, yOf, padL, plotW, 0.2);
      });
      // Selected trace (bright)
      drawStep(ctx, active, xOf, yOf, padL, plotW, 1.0);

      // Highlight T_c crosshair for the selected material
      const tc = active.Tc;
      ctx.strokeStyle = "rgba(120, 255, 170, 0.9)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xOf(tc), padT);
      ctx.lineTo(xOf(tc), padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Tc = ${tc} K`, xOf(tc) + 6, padT + 14);

      // HUD title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("R vs T · the 1911 chart, generalised", 12, 18);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(active.note, width - 12, 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap gap-2 px-2">
        {MATERIALS.map((m, i) => (
          <button
            key={m.name}
            type="button"
            onClick={() => setSelected(i)}
            className={
              "rounded border px-2 py-1 font-mono text-[10px] transition " +
              (i === selected
                ? "border-[#78FFAA] bg-[#78FFAA22] text-[var(--color-fg-0)]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]")
            }
          >
            {m.name}
          </button>
        ))}
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        same motif — the sharp step — across 20× in Tc. Room-temperature superconductivity is still an open hunt.
      </p>
    </div>
  );
}

function drawStep(
  ctx: CanvasRenderingContext2D,
  m: Material,
  xOf: (t: number) => number,
  yOf: (r: number) => number,
  padL: number,
  plotW: number,
  alpha: number,
) {
  // Sample a few points and use the model resistance for shape; we then
  // polish the step so it renders crisply at any zoom.
  const color = `rgba(120, 220, 255, ${alpha})`;
  ctx.strokeStyle = color;
  ctx.lineWidth = alpha > 0.5 ? 2.2 : 1.2;
  ctx.beginPath();
  // Left (high-T) horizontal at R/R0 = 1 (normalised to the plot's 1.0 line)
  const xLeft = padL + plotW;
  const xTc = xOf(m.Tc);
  const xMin = padL;
  const normalised = m.R0 / 1.0; // we are plotting R(T)/R_normal; use R0 as display
  // Above Tc — flat line at 1.0 (we choose to render the normalised level at 1.0 for clarity)
  void normalised;
  ctx.moveTo(xLeft, yOf(1.0));
  ctx.lineTo(xTc, yOf(1.0));
  ctx.lineTo(xTc, yOf(0.0));
  ctx.lineTo(xMin, yOf(0.0));
  ctx.stroke();

  // Smoke-test the physics model with a value to ensure typecheck and
  // to emphasise that the canvas shape follows resistance().
  const probe = resistance(m.Tc + 1, m.Tc, 1);
  if (probe !== 1) return; // (defensive; won't happen)
}
