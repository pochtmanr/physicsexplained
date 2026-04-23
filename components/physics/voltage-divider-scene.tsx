"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { voltageDivider } from "@/lib/physics/electromagnetism/dc-circuits";

const RATIO = 0.58;
const MAX_HEIGHT = 380;
const V_IN = 10; // volts
const R_TOTAL = 10_000; // total resistance, split across R1/R2 by the ratio slider

/**
 * FIG.26c — a voltage divider drawn on the right, its V_out rendered as a
 * horizontal bar on the left so the reader can feel the divider ratio before
 * they read the numbers. The slider is log-scaled because the "interesting"
 * range is R1/R2 ∈ [0.1, 10] and a linear slider would bury the midpoint.
 *
 * V_out = V_in · R2 / (R1 + R2)
 *
 * The total R1 + R2 is held constant at 10 kΩ so only the ratio moves.
 */
export function VoltageDividerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 400 });
  // "ratioExp" sweeps log-linearly. ratio = R1/R2. exp ∈ [-1, 1] → ratio ∈ [0.1, 10].
  const [ratioExp, setRatioExp] = useState(0);

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

  const { R1, R2, vOut } = useMemo(() => {
    const ratio = Math.pow(10, ratioExp); // R1/R2
    const r2 = R_TOTAL / (1 + ratio);
    const r1 = R_TOTAL - r2;
    return { R1: r1, R2: r2, vOut: voltageDivider(V_IN, r1, r2) };
  }, [ratioExp]);

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

      ctx.fillStyle = colors.bg0 || "#0A0A0A";
      ctx.fillRect(0, 0, width, height);

      // ─── Left half: a horizontal bar showing V_out as a fraction of V_in ───
      const padX = 24;
      const padY = 36;
      const barLeft = padX;
      const barRight = Math.min(width * 0.55, width - 220);
      const barWidth = barRight - barLeft;
      const barH = 36;
      const barY = padY + 20;

      // Bar background: full V_in scale.
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(barLeft, barY, barWidth, barH);

      // Fill: V_out fraction.
      const frac = vOut / V_IN;
      const grad = ctx.createLinearGradient(barLeft, 0, barRight, 0);
      grad.addColorStop(0, "rgba(233,70,166,0.85)"); // magenta (+ rail)
      grad.addColorStop(1, "rgba(77,208,225,0.85)"); // cyan (GND rail)
      ctx.fillStyle = grad;
      ctx.fillRect(barLeft, barY, barWidth * frac, barH);

      // Tick marks at 25, 50, 75%.
      ctx.strokeStyle = colors.fg3;
      for (const f of [0.25, 0.5, 0.75]) {
        const x = barLeft + barWidth * f;
        ctx.beginPath();
        ctx.moveTo(x, barY + barH);
        ctx.lineTo(x, barY + barH + 4);
        ctx.stroke();
      }

      // Labels.
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "left";
      ctx.fillText("V_out / V_in", barLeft, barY - 8);
      ctx.textAlign = "right";
      ctx.fillText(`${(frac * 100).toFixed(1)} %`, barRight, barY - 8);

      ctx.textAlign = "left";
      ctx.fillStyle = "#E946A6";
      ctx.fillText(`V_out = ${vOut.toFixed(2)} V`, barLeft, barY + barH + 20);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`V_in = ${V_IN.toFixed(0)} V`, barRight, barY + barH + 20);

      // ─── Right half: the schematic ───
      const schL = barRight + 40;
      const schR = width - padX;
      const schT = padY + 8;
      const schB = height - padY - 12;
      const cx = (schL + schR) / 2;

      // Rails: V_in bus at top, GND at bottom.
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(schL + 16, schT);
      ctx.lineTo(schR - 16, schT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(schL + 16, schB);
      ctx.lineTo(schR - 16, schB);
      ctx.stroke();

      // Battery symbol on the left edge between rails.
      const battCY = (schT + schB) / 2;
      const battX = schL + 16;
      ctx.strokeStyle = "#E946A6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(battX - 10, battCY - 8);
      ctx.lineTo(battX + 10, battCY - 8);
      ctx.stroke();
      ctx.strokeStyle = "#4DD0E1";
      ctx.beginPath();
      ctx.moveTo(battX - 6, battCY + 8);
      ctx.lineTo(battX + 6, battCY + 8);
      ctx.stroke();
      ctx.fillStyle = "#E946A6";
      ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "right";
      ctx.fillText("+", battX - 14, battCY - 4);
      ctx.fillStyle = "#4DD0E1";
      ctx.fillText("−", battX - 14, battCY + 12);
      // Wire from battery to top rail and bottom rail.
      ctx.strokeStyle = colors.fg2;
      ctx.beginPath();
      ctx.moveTo(battX, schT);
      ctx.lineTo(battX, battCY - 8);
      ctx.moveTo(battX, battCY + 8);
      ctx.lineTo(battX, schB);
      ctx.stroke();

      // Divider column at cx.
      // R1 from top rail to midpoint; R2 from midpoint to bottom rail.
      // Midpoint Y is proportional to R2 / (R1 + R2) from the BOTTOM rail,
      // i.e. V_out fraction above GND.
      const usableH = schB - schT;
      const midY = schB - usableH * frac;
      drawResistorV(ctx, cx, schT, cx, midY, `R₁=${fmtR(R1)}`, colors.fg1);
      drawResistorV(ctx, cx, midY, cx, schB, `R₂=${fmtR(R2)}`, colors.fg1);

      // Tap wire to a labelled midpoint node.
      ctx.strokeStyle = "#E946A6";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(cx, midY);
      ctx.lineTo(cx + 40, midY);
      ctx.stroke();
      ctx.fillStyle = "#E946A6";
      ctx.beginPath();
      ctx.arc(cx + 40, midY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "#E946A6";
      ctx.fillText("V_out", cx + 48, midY + 3);

      // Ground glyph under the bottom rail.
      drawGround(ctx, cx, schB, colors.fg2);

      // Animated current dots from V_in → R1 → mid → R2 → GND.
      drawFlow(ctx, cx, schT, cx, schB, t, "#F5B041");

      // HUD (top-left of canvas).
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("V_out = V_in · R₂ / (R₁ + R₂)", padX, 18);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `R₁ / R₂ = ${(R1 / R2).toFixed(2)}  ·  R₁ + R₂ = 10 kΩ`,
        padX,
        height - 10,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block rounded-md bg-[#0A0A0A]"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <span className="w-16 text-[var(--color-fg-1)]">R₁/R₂</span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.02}
            value={ratioExp}
            onChange={(e) => setRatioExp(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "#E946A6" }}
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {Math.pow(10, ratioExp).toFixed(2)}
          </span>
        </label>
        <p className="text-xs font-mono text-[var(--color-fg-3)]">
          R₁ = top resistor (V_in side) · R₂ = bottom (GND side)
        </p>
      </div>
    </div>
  );
}

// ---------- Helpers ----------

function fmtR(r: number): string {
  if (r >= 1000) return `${(r / 1000).toFixed(2)}kΩ`;
  return `${r.toFixed(0)}Ω`;
}

function drawResistorV(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  label: string,
  fg: string,
) {
  const len = by - ay;
  if (len < 24) {
    ctx.strokeStyle = fg;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    return;
  }
  const glyphLen = Math.min(60, len * 0.55);
  const start = (len - glyphLen) / 2;
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.25;
  // Lead-in.
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax, ay + start);
  ctx.stroke();
  // Zigzag.
  ctx.beginPath();
  const bumps = 6;
  const seg = glyphLen / bumps;
  const amp = 6;
  let cy = ay + start;
  let cx = ax;
  ctx.moveTo(cx, cy);
  for (let i = 0; i < bumps; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    cy += seg;
    cx = ax + amp * side;
    ctx.lineTo(cx, cy);
  }
  ctx.lineTo(ax, ay + start + glyphLen);
  ctx.stroke();
  // Lead-out.
  ctx.beginPath();
  ctx.moveTo(ax, ay + start + glyphLen);
  ctx.lineTo(bx, by);
  ctx.stroke();
  // Label.
  ctx.fillStyle = fg;
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "right";
  ctx.fillText(label, ax - 12, (ay + by) / 2 + 4);
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fg: string,
) {
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.25;
  const widths = [14, 10, 6];
  const spacing = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 8);
  ctx.stroke();
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const yy = y + 8 + i * spacing;
    ctx.beginPath();
    ctx.moveTo(x - w, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
}

function drawFlow(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  t: number,
  color: string,
) {
  const len = Math.abs(by - ay);
  const speed = 90;
  const offset = (t * speed) % len;
  const nDots = 6;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < nDots; i++) {
    const s = (offset + (i * len) / nDots) % len;
    const y = ay + s;
    ctx.beginPath();
    ctx.arc(ax, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    void bx;
  }
  ctx.globalAlpha = 1;
}
