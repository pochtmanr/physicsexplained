"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { rlCurrent, rlTimeConstant } from "@/lib/physics/electromagnetism/inductance";

/**
 * A simple RL circuit: battery V, resistor R, inductor L. At t = 0 the
 * switch closes. The current ramps up as I(t) = (V/R)·(1 − e^(−t/τ)).
 * A green-cyan arrow across the inductor's terminals shows the back-EMF
 * pointing *against* the current rise. A live I(t) trace runs on the right.
 *
 * Sliders drive L (the H-value of the inductor). Reset restarts the rise.
 *
 * Palette:
 *   magenta  #FF6ADE — battery +, conventional current colour
 *   cyan     #6FB8C6 — battery −
 *   amber    #FFD66B — applied EMF indicator
 *   green    rgba(120, 255, 170, ...) — induced (back) EMF indicator
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const V_SRC = 12; // volts
const R_OHM = 4; // ohms
const GREEN = "rgba(120, 255, 170, 0.95)";
const GREEN_DIM = "rgba(120, 255, 170, 0.55)";
const AMBER = "#FFD66B";
const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";

export function InductorCurrentBuildupScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [L, setL] = useState(2.0); // henrys
  const startRef = useRef(0);
  const nowRef = useRef(0);
  const prevIRef = useRef(0);

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

      const elapsed = Math.max(0, t - startRef.current);
      const tau = rlTimeConstant(L, R_OHM);
      const I = rlCurrent(V_SRC, R_OHM, L, elapsed);
      const Iasymp = V_SRC / R_OHM;
      const iFrac = I / Iasymp;
      const dIdt = (I - prevIRef.current) / Math.max(1e-3, 1 / 60);
      prevIRef.current = I;
      const backEmf = -L * ((V_SRC / R_OHM) * (1 / tau) * Math.exp(-elapsed / tau));

      // ── Layout ──
      const padX = 36;
      const padY = 32;
      const circuitW = Math.min(width * 0.58, width - padX * 2 - 120);
      const circuitH = height - padY * 2;
      const cL = padX;
      const cR = cL + circuitW;
      const cT = padY;
      const cB = cT + circuitH;

      // wires
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cL, cT, circuitW, circuitH);
      ctx.stroke();

      // battery on left side (vertical)
      const battY = (cT + cB) / 2;
      drawBattery(ctx, cL, battY);

      // resistor on top wire
      const resCX = (cL + cR) / 2;
      drawResistor(ctx, resCX, cT, colors.fg1);

      // inductor on right side (vertical)
      const indY = (cT + cB) / 2;
      drawInductor(ctx, cR, indY);

      // current dots
      drawCurrentDots(ctx, {
        left: cL,
        right: cR,
        top: cT,
        bottom: cB,
        t,
        iFrac,
      });

      // Back-EMF arrow across the inductor — green-cyan, opposing current
      const backStrength = Math.max(0, -backEmf) / V_SRC; // 1 at t=0, 0 at steady
      const arrowAlpha = 0.25 + 0.7 * Math.min(1, backStrength);
      ctx.save();
      const indBoxX = cR + 22;
      ctx.strokeStyle = `rgba(120, 255, 170, ${arrowAlpha.toFixed(3)})`;
      ctx.fillStyle = `rgba(120, 255, 170, ${arrowAlpha.toFixed(3)})`;
      ctx.lineWidth = 2;
      const arrowLen = 50 * Math.min(1, backStrength);
      if (arrowLen > 6) {
        // arrow pointing DOWN (against the clockwise current going UP through L)
        const ax = indBoxX;
        const ay0 = indY - arrowLen / 2;
        const ay1 = indY + arrowLen / 2;
        ctx.beginPath();
        ctx.moveTo(ax, ay0);
        ctx.lineTo(ax, ay1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax, ay1);
        ctx.lineTo(ax - 4, ay1 - 6);
        ctx.lineTo(ax + 4, ay1 - 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(120, 255, 170, ${Math.max(0.4, arrowAlpha).toFixed(3)})`;
      ctx.fillText("back-EMF", indBoxX + 8, indY - 4);
      ctx.fillStyle = GREEN_DIM;
      ctx.fillText("−L dI/dt", indBoxX + 8, indY + 10);
      ctx.restore();

      // ── Plot on the right ──
      const plotL = Math.min(width - 180, cR + 90);
      const plotR = width - 16;
      const plotT = padY + 6;
      const plotB = height - padY - 6;
      if (plotR - plotL > 60) {
        drawCurrentCurve(ctx, plotL, plotT, plotR, plotB, elapsed, tau, Iasymp, I, colors);
      }

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `I(t) = ${I.toFixed(3)} A / ${Iasymp.toFixed(2)} A`,
        12,
        16,
      );
      ctx.fillText(
        `τ = L/R = ${tau.toFixed(2)} s    t = ${elapsed.toFixed(2)} s`,
        12,
        height - 24,
      );
      ctx.fillStyle = GREEN_DIM;
      ctx.fillText(
        `back-EMF = ${backEmf.toFixed(2)} V`,
        12,
        height - 8,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg3;
      ctx.fillText("I(t) = (V/R)(1 − e^(−t/τ))", width - 12, 16);

      // Right-hand-rule axes badge, bottom-left
      drawAxesBadge(ctx, 16, height - 48, colors);

      // dI/dt sign readout
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `dI/dt ≈ ${dIdt.toFixed(2)} A/s`,
        width - 12,
        height - 8,
      );
    },
  });

  const handleReset = () => {
    startRef.current = nowRef.current;
    prevIRef.current = 0;
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <label className="w-20 font-mono text-xs text-[var(--color-fg-3)]">
            L (H)
          </label>
          <input
            type="range"
            min={0.2}
            max={6}
            step={0.1}
            value={L}
            onChange={(e) => setL(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-12 text-right font-mono text-xs text-[var(--color-fg-1)]">
            {L.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-xs text-[var(--color-fg-3)]">
            V = {V_SRC} V · R = {R_OHM} Ω
          </span>
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

function drawBattery(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
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
  ctx.fillText("V", cx + 14, cy + 4);
}

function drawResistor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fg: string,
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

function drawInductor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  // Vertical inductor: four half-loops stacked on the right wire
  const totalH = 64;
  const loops = 4;
  const loopH = totalH / loops;
  const yTop = cy - totalH / 2;
  ctx.fillStyle = "#1A1D24";
  ctx.fillRect(cx - 14, yTop - 4, 18, totalH + 8);
  ctx.strokeStyle = "rgba(255, 214, 107, 0.95)";
  ctx.lineWidth = 1.8;
  for (let i = 0; i < loops; i++) {
    const y0 = yTop + i * loopH;
    ctx.beginPath();
    ctx.arc(cx, y0 + loopH / 2, loopH / 2, -Math.PI / 2, Math.PI / 2, false);
    ctx.stroke();
  }
  // wire stubs
  ctx.strokeStyle = "rgba(182, 196, 216, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, yTop);
  ctx.lineTo(cx, yTop - 16);
  ctx.moveTo(cx, yTop + totalH);
  ctx.lineTo(cx, yTop + totalH + 16);
  ctx.stroke();
  ctx.fillStyle = AMBER;
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText("L", cx - 18, cy + 4);
}

function drawCurrentDots(
  ctx: CanvasRenderingContext2D,
  opts: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    t: number;
    iFrac: number;
  },
) {
  const { left, right, top, bottom, t, iFrac } = opts;
  if (iFrac < 0.02) return;
  const perim = 2 * (right - left) + 2 * (bottom - top);
  const speed = 40 + 240 * iFrac;
  const offset = (t * speed) % perim;
  const nDots = 14;
  const alpha = (0.25 + 0.6 * iFrac).toFixed(3);
  ctx.fillStyle = `rgba(230, 237, 247, ${alpha})`;
  for (let i = 0; i < nDots; i++) {
    const s = (offset + (i * perim) / nDots) % perim;
    const p = pointOnRectClockwise(s, { left, right, top, bottom });
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pointOnRectClockwise(
  s: number,
  r: { left: number; right: number; top: number; bottom: number },
): { x: number; y: number } {
  const w = r.right - r.left;
  const h = r.bottom - r.top;
  if (s < w) return { x: r.left + s, y: r.top };
  if (s < w + h) return { x: r.right, y: r.top + (s - w) };
  if (s < 2 * w + h) return { x: r.right - (s - w - h), y: r.bottom };
  return { x: r.left, y: r.bottom - (s - 2 * w - h) };
}

function drawCurrentCurve(
  ctx: CanvasRenderingContext2D,
  xL: number,
  yT: number,
  xR: number,
  yB: number,
  elapsed: number,
  tau: number,
  Iasymp: number,
  Inow: number,
  colors: { fg2: string; fg3: string },
) {
  // Axes
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xL, yT);
  ctx.lineTo(xL, yB);
  ctx.lineTo(xR, yB);
  ctx.stroke();

  // Dashed asymptote
  ctx.strokeStyle = colors.fg3;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xL, yT + 6);
  ctx.lineTo(xR, yT + 6);
  ctx.stroke();
  ctx.setLineDash([]);

  const tMax = 5 * tau;
  const w = xR - xL;
  const h = yB - yT - 6;

  // I(t) curve
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const tt = (i / 120) * tMax;
    const f = 1 - Math.exp(-tt / tau);
    const x = xL + (tt / tMax) * w;
    const y = yB - f * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Marker at current t
  const tClamp = Math.min(elapsed, tMax);
  const fNow = 1 - Math.exp(-tClamp / tau);
  const xNow = xL + (tClamp / tMax) * w;
  const yNow = yB - fNow * h;
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.arc(xNow, yNow, 3, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`I∞ = ${Iasymp.toFixed(1)} A`, xL + 4, yT + 4);
  ctx.fillText(`I(t)`, xL + 4, yT - 4);
  ctx.textAlign = "right";
  ctx.fillText("5τ", xR, yB + 12);
  ctx.textAlign = "left";
  ctx.fillText("0", xL, yB + 12);
  ctx.fillText(
    `I = ${Inow.toFixed(2)} A`,
    xL + 4,
    yB - 6,
  );
}

function drawAxesBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colors: { fg2: string; fg3: string },
) {
  // Right-hand-rule axes badge: thumb = I (up), fingers curl in direction of B
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y - 6, 92, 46);
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("right-hand rule", x + 6, y + 6);
  ctx.fillStyle = MAGENTA;
  ctx.fillText("thumb = I", x + 6, y + 18);
  ctx.fillStyle = "rgba(120, 220, 255, 0.85)";
  ctx.fillText("fingers = B", x + 6, y + 30);
}
