"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  rcCharge,
  rcChargeCurrent,
  rcTimeConstant,
} from "@/lib/physics/electromagnetism/rc-circuits";

/**
 * A series RC circuit: battery V₀, resistor R, capacitor C. At t = 0 the
 * switch closes. V_c(t) rises on a (1 − e^(−t/τ)) curve toward V₀ while
 * i(t) decays on e^(−t/τ) from its initial maximum V₀/R. Two synchronized
 * plots on the right: V_c (lilac — field-energy accumulating) and i (amber
 * — conduction current dying off).
 *
 * Sliders drive R and C; reset restarts the charge from zero.
 *
 * Palette (carried from §05):
 *   magenta #FF6ADE — battery +, V-reservoir marker
 *   cyan    #6FB8C6 — battery −
 *   amber   #FFD66B — conduction current
 *   lilac   rgba(200,160,255,...) — capacitor voltage (field-energy reservoir)
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const V_SRC = 5; // volts
const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";
const AMBER = "#FFD66B";
const LILAC = "rgba(200, 160, 255, 0.95)";
const LILAC_DIM = "rgba(200, 160, 255, 0.55)";

export function RcChargingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [R, setR] = useState(1000); // ohms
  const [Cuf, setCuf] = useState(470); // microfarads
  const startRef = useRef(0);
  const nowRef = useRef(0);

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
      nowRef.current = t;
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

      const C = Cuf * 1e-6;
      const tau = rcTimeConstant(R, C);
      const elapsed = Math.max(0, t - startRef.current);
      // Auto-reset after 6τ so the scene loops.
      const loop = elapsed % (6 * tau);
      const Vc = rcCharge(V_SRC, R, C, loop);
      const i = rcChargeCurrent(V_SRC, R, C, loop);
      const imax = V_SRC / R;
      const vFrac = Vc / V_SRC;

      // ── Layout ──
      const padX = 28;
      const padY = 28;
      const circuitW = Math.min(width * 0.52, width - padX * 2 - 140);
      const circuitH = height - padY * 2;
      const cL = padX;
      const cR = cL + circuitW;
      const cT = padY;
      const cB = cT + circuitH;

      // wires frame
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cL, cT, circuitW, circuitH);
      ctx.stroke();

      // battery (left side)
      drawBattery(ctx, cL, (cT + cB) / 2);
      // resistor (top)
      drawResistor(ctx, (cL + cR) / 2, cT, colors.fg1);
      // capacitor (right side)
      drawCapacitor(ctx, cR, (cT + cB) / 2, vFrac);

      // moving current dots around the loop (amber)
      drawCurrentDots(ctx, {
        left: cL, right: cR, top: cT, bottom: cB,
        t, iFrac: i / imax,
      });

      // ── Plots on the right ──
      const plotL = Math.min(width - 160, cR + 70);
      const plotR = width - 14;
      const plotT = padY + 6;
      const plotB = height - padY - 24;
      if (plotR - plotL > 60) {
        drawDualPlot(ctx, {
          xL: plotL, yT: plotT, xR: plotR, yB: plotB,
          tau, loop, V0: V_SRC, imax, R, C,
          colors,
        });
      }

      // ── HUD ──
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `V_c = ${Vc.toFixed(3)} V / ${V_SRC} V   (${(vFrac * 100).toFixed(1)} %)`,
        12, 16,
      );
      ctx.fillStyle = AMBER;
      ctx.fillText(
        `i = ${(i * 1000).toFixed(2)} mA`,
        12, 34,
      );
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText(
        `τ = R·C = ${(tau * 1000).toFixed(1)} ms    t = ${(loop * 1000).toFixed(0)} ms`,
        12, height - 10,
      );
      ctx.fillStyle = colors.fg3;
      ctx.textAlign = "right";
      ctx.fillText(
        `V_c(t) = V₀(1 − e^(−t/τ))`,
        width - 12, 16,
      );
    },
  });

  const handleReset = () => { startRef.current = nowRef.current; };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <label className="w-20 font-mono text-xs text-[var(--color-fg-3)]">R (Ω)</label>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={R}
            onChange={(e) => setR(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-14 text-right font-mono text-xs text-[var(--color-fg-1)]">
            {R >= 1000 ? `${(R / 1000).toFixed(1)}k` : R}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-20 font-mono text-xs text-[var(--color-fg-3)]">C (µF)</label>
          <input
            type="range"
            min={10}
            max={2200}
            step={10}
            value={Cuf}
            onChange={(e) => setCuf(parseFloat(e.target.value))}
            className="flex-1 accent-[rgb(200,160,255)]"
          />
          <span className="w-14 text-right font-mono text-xs text-[var(--color-fg-1)]">
            {Cuf}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-xs text-[var(--color-fg-3)]">V₀ = {V_SRC} V</span>
          <button
            type="button"
            onClick={handleReset}
            className="border border-[var(--color-fg-4)] px-3 py-1 font-mono text-xs text-[var(--color-fg-1)] transition-colors hover:border-[#FFD66B] hover:text-[#FFD66B]"
          >
            reset
          </button>
        </div>
      </div>
    </div>
  );
}

function drawBattery(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 10);
  ctx.lineTo(cx + 10, cy - 10);
  ctx.stroke();
  ctx.strokeStyle = CYAN;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 10);
  ctx.lineTo(cx + 6, cy + 10);
  ctx.stroke();
  ctx.fillStyle = MAGENTA;
  ctx.font = "11px monospace";
  ctx.textAlign = "right";
  ctx.fillText("+", cx - 14, cy - 6);
  ctx.fillStyle = CYAN;
  ctx.fillText("−", cx - 14, cy + 14);
  ctx.fillStyle = "rgba(182, 196, 216, 0.8)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("V₀", cx + 14, cy + 4);
}

function drawResistor(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, fg: string,
) {
  const w = 60;
  const h = 8;
  const segments = 6;
  const segW = w / segments;
  ctx.fillStyle = "#1A1D24";
  ctx.fillRect(cx - w / 2 - 2, cy - h - 4, w + 4, h * 2 + 8);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  for (let i = 0; i < segments; i++) {
    const x = cx - w / 2 + (i + 0.5) * segW;
    const y = cy + (i % 2 === 0 ? -h : h);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + w / 2, cy);
  ctx.stroke();
  ctx.fillStyle = "rgba(182, 196, 216, 0.8)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("R", cx, cy - h - 8);
}

function drawCapacitor(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, vFrac: number,
) {
  // Vertical capacitor: two horizontal plates across the right wire.
  const plateHalf = 14;
  const gap = 8;
  ctx.strokeStyle = "rgba(182, 196, 216, 0.9)";
  ctx.lineWidth = 1.5;
  // wires in and out
  ctx.beginPath();
  ctx.moveTo(cx, cy - 24);
  ctx.lineTo(cx, cy - gap / 2);
  ctx.moveTo(cx, cy + gap / 2);
  ctx.lineTo(cx, cy + 24);
  ctx.stroke();
  // plates — top plate glows magenta as it accumulates +Q
  const topAlpha = 0.4 + 0.6 * Math.min(1, vFrac);
  ctx.strokeStyle = `rgba(255, 106, 222, ${topAlpha.toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - plateHalf, cy - gap / 2);
  ctx.lineTo(cx + plateHalf, cy - gap / 2);
  ctx.stroke();
  // bottom plate cyan
  ctx.strokeStyle = `rgba(111, 184, 198, ${topAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(cx - plateHalf, cy + gap / 2);
  ctx.lineTo(cx + plateHalf, cy + gap / 2);
  ctx.stroke();
  // field between plates — lilac bars
  const nBars = 5;
  for (let k = 0; k < nBars; k++) {
    const fx = cx - plateHalf + 2 + (k * (2 * plateHalf - 4)) / (nBars - 1);
    ctx.strokeStyle = `rgba(200, 160, 255, ${(0.15 + 0.7 * vFrac).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx, cy - gap / 2 + 1);
    ctx.lineTo(fx, cy + gap / 2 - 1);
    ctx.stroke();
  }
  // label
  ctx.fillStyle = LILAC;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("C", cx + plateHalf + 6, cy + 4);
}

function drawCurrentDots(
  ctx: CanvasRenderingContext2D,
  opts: { left: number; right: number; top: number; bottom: number; t: number; iFrac: number },
) {
  const { left, right, top, bottom, t, iFrac } = opts;
  if (iFrac < 0.02) return;
  const perim = 2 * (right - left) + 2 * (bottom - top);
  const speed = 40 + 240 * iFrac;
  const offset = (t * speed) % perim;
  const nDots = 14;
  const alpha = (0.25 + 0.6 * iFrac).toFixed(3);
  ctx.fillStyle = `rgba(255, 214, 107, ${alpha})`;
  for (let i = 0; i < nDots; i++) {
    const s = (offset + (i * perim) / nDots) % perim;
    const p = pointOnRectClockwise(s, { left, right, top, bottom });
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pointOnRectClockwise(
  s: number, r: { left: number; right: number; top: number; bottom: number },
): { x: number; y: number } {
  const w = r.right - r.left;
  const h = r.bottom - r.top;
  if (s < w) return { x: r.left + s, y: r.top };
  if (s < w + h) return { x: r.right, y: r.top + (s - w) };
  if (s < 2 * w + h) return { x: r.right - (s - w - h), y: r.bottom };
  return { x: r.left, y: r.bottom - (s - 2 * w - h) };
}

function drawDualPlot(
  ctx: CanvasRenderingContext2D,
  opts: {
    xL: number; yT: number; xR: number; yB: number;
    tau: number; loop: number; V0: number; imax: number; R: number; C: number;
    colors: { fg1: string; fg2: string; fg3: string };
  },
) {
  const { xL, yT, xR, yB, tau, loop, V0, imax, R, C, colors } = opts;
  const w = xR - xL;
  const h = yB - yT;
  const tMax = 6 * tau;

  // Frame + dashed asymptote
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(xL, yT, w, h);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xL, yT + 1);
  ctx.lineTo(xR, yT + 1);
  ctx.stroke();

  // 63 % guide
  ctx.strokeStyle = "rgba(200, 160, 255, 0.35)";
  ctx.beginPath();
  ctx.moveTo(xL, yT + h * (1 - 0.632));
  ctx.lineTo(xR, yT + h * (1 - 0.632));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = LILAC_DIM;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText("63 %", xR - 4, yT + h * (1 - 0.632) - 2);

  // Vertical dashed line at current time
  const tClamp = Math.min(loop, tMax);
  const xNow = xL + (tClamp / tMax) * w;
  ctx.strokeStyle = colors.fg3;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(xNow, yT);
  ctx.lineTo(xNow, yB);
  ctx.stroke();
  ctx.setLineDash([]);

  // V_c curve (lilac, rising)
  ctx.strokeStyle = LILAC;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  for (let k = 0; k <= 120; k++) {
    const tt = (k / 120) * tMax;
    const frac = 1 - Math.exp(-tt / tau);
    const x = xL + (tt / tMax) * w;
    const y = yT + h * (1 - frac);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // i(t) curve (amber, decaying)
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let k = 0; k <= 120; k++) {
    const tt = (k / 120) * tMax;
    const frac = Math.exp(-tt / tau);
    const x = xL + (tt / tMax) * w;
    const y = yT + h * (1 - frac);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Current-position dots
  const vFrac = 1 - Math.exp(-tClamp / tau);
  const iFrac = Math.exp(-tClamp / tau);
  ctx.fillStyle = LILAC;
  ctx.beginPath();
  ctx.arc(xNow, yT + h * (1 - vFrac), 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(xNow, yT + h * (1 - iFrac), 3, 0, Math.PI * 2);
  ctx.fill();

  // Legend
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = LILAC;
  ctx.fillText("V_c(t)", xL + 6, yT + 14);
  ctx.fillStyle = AMBER;
  ctx.fillText("i(t)", xL + 6, yT + 28);
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`I₀ = ${(imax * 1000).toFixed(1)} mA`, xR - 4, yT + 14);

  // Axis labels
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.fillText("t", (xL + xR) / 2, yB + 12);
  ctx.textAlign = "left";
  ctx.fillText("0", xL, yB + 12);
  ctx.textAlign = "right";
  ctx.fillText("6τ", xR, yB + 12);
  void V0;
  void R;
  void C;
}
