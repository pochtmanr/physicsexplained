"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  rlDecay,
  rlTimeConstant,
} from "@/lib/physics/electromagnetism/rl-circuits";

/**
 * FIG.28b — RL current decay. An inductor holding steady current I0 is
 * cut loose from its source at t = 0. A freewheeling resistor (the one
 * already in series) provides a path for the current to continue. The
 * reservoir drains:
 *
 *   I(t) = I0 · e^(−t·R/L)
 *
 * The inductor refuses to let its current change instantly — dI/dt must
 * stay finite — so the current dies exponentially through the resistor.
 * Every microjoule of ½LI² becomes heat in R.
 */

const RATIO = 0.58;
const MAX_HEIGHT = 360;
const I0_SRC = 3; // amperes — initial steady-state current at t = 0
const R_OHM = 4; // ohms
const AMBER = "#FFD66B";
const CYAN = "#6FB8C6";
const GREEN = "rgba(120, 255, 170, 0.95)";
const GREEN_DIM = "rgba(120, 255, 170, 0.55)";

export function RlDecayScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [L, setL] = useState(2.0);
  const startRef = useRef(0);
  const nowRef = useRef(0);

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
      const I = rlDecay(I0_SRC, R_OHM, L, elapsed);
      const iFrac = I / I0_SRC;

      // ── Layout ──
      const padX = 36;
      const padY = 32;
      const circuitW = Math.min(width * 0.54, width - padX * 2 - 160);
      const circuitH = height - padY * 2;
      const cLx = padX;
      const cR = cLx + circuitW;
      const cT = padY;
      const cB = cT + circuitH;

      // wires — a simple loop between R (top) and L (right/bottom) with
      // a dashed stub on the left where the source used to live.
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cLx, cT);
      ctx.lineTo(cR, cT);
      ctx.moveTo(cR, cT);
      ctx.lineTo(cR, cB);
      ctx.moveTo(cR, cB);
      ctx.lineTo(cLx, cB);
      ctx.stroke();

      // dashed left-side stub indicating the removed source
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cLx, cT);
      ctx.lineTo(cLx, cB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("source removed", cLx - 4, cT - 6);
      ctx.fillText("(freewheel)", cLx - 4, cB + 14);

      // open-switch glyph at the top of the stub
      drawOpenSwitch(ctx, cLx, (cT + cB) / 2);

      // Resistor on top
      drawResistor(ctx, (cLx + cR) / 2, cT, colors.fg1);

      // Inductor on right
      drawInductor(ctx, cR, (cT + cB) / 2);

      // current dots — direction of decay matches direction of initial current
      drawCurrentDots(ctx, {
        left: cLx,
        right: cR,
        top: cT,
        bottom: cB,
        t,
        iFrac,
      });

      // inductor still "pushes" — arrow along current direction (not opposing now)
      const indBoxX = cR + 22;
      const indY = (cT + cB) / 2;
      const strength = Math.max(0, iFrac);
      const arrowAlpha = 0.25 + 0.7 * Math.min(1, strength);
      const arrowLen = 50 * Math.min(1, strength);
      ctx.save();
      ctx.strokeStyle = `rgba(120, 255, 170, ${arrowAlpha.toFixed(3)})`;
      ctx.fillStyle = `rgba(120, 255, 170, ${arrowAlpha.toFixed(3)})`;
      ctx.lineWidth = 2;
      if (arrowLen > 6) {
        const ax = indBoxX;
        const ay0 = indY - arrowLen / 2;
        const ay1 = indY + arrowLen / 2;
        ctx.beginPath();
        ctx.moveTo(ax, ay1);
        ctx.lineTo(ax, ay0);
        ctx.stroke();
        // arrow head pointing up — inductor is now the source, driving
        // current in the same direction it was already flowing
        ctx.beginPath();
        ctx.moveTo(ax, ay0);
        ctx.lineTo(ax - 4, ay0 + 6);
        ctx.lineTo(ax + 4, ay0 + 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(120, 255, 170, ${Math.max(0.4, arrowAlpha).toFixed(3)})`;
      ctx.fillText("L holds I", indBoxX + 8, indY - 4);
      ctx.fillStyle = GREEN_DIM;
      ctx.fillText("V_L = −L dI/dt", indBoxX + 8, indY + 10);
      ctx.restore();

      // ── Decay plot ──
      const plotL = Math.min(width - 180, cR + 110);
      const plotR = width - 16;
      const plotT = padY + 6;
      const plotB = height - padY - 6;
      if (plotR - plotL > 60) {
        drawDecayCurve(
          ctx,
          plotL,
          plotT,
          plotR,
          plotB,
          elapsed,
          tau,
          I0_SRC,
          I,
          colors,
        );
      }

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `I(t) = ${I.toFixed(3)} A / I₀ = ${I0_SRC.toFixed(2)} A`,
        12,
        16,
      );
      ctx.fillText(
        `τ = L/R = ${tau.toFixed(2)} s · t = ${elapsed.toFixed(2)} s`,
        12,
        height - 24,
      );
      ctx.fillStyle = CYAN;
      ctx.fillText(
        `I(t) = I₀ · e^(−t·R/L)`,
        12,
        height - 8,
      );

      if (elapsed >= tau && elapsed < tau + 0.12) {
        ctx.fillStyle = AMBER;
        ctx.textAlign = "center";
        ctx.font = "bold 11px monospace";
        ctx.fillText("36.8 % · t = τ", width / 2, 16);
      }
    },
  });

  const handleReset = () => {
    startRef.current = nowRef.current;
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
            I₀ = {I0_SRC} A · R = {R_OHM} Ω
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

function drawOpenSwitch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  // Terminal dots
  ctx.fillStyle = "rgba(182, 196, 216, 0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Open arm: tilted upward-right
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 10);
  ctx.lineTo(cx + 14, cy - 4);
  ctx.stroke();
  ctx.fillStyle = CYAN;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("open", cx + 16, cy);
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

function drawInductor(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
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
  const speed = 40 + 180 * iFrac;
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

function drawDecayCurve(
  ctx: CanvasRenderingContext2D,
  xL: number,
  yT: number,
  xR: number,
  yB: number,
  elapsed: number,
  tau: number,
  I0: number,
  Inow: number,
  colors: { fg2: string; fg3: string },
) {
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xL, yT);
  ctx.lineTo(xL, yB);
  ctx.lineTo(xR, yB);
  ctx.stroke();

  const tMax = 5 * tau;
  const w = xR - xL;
  const h = yB - yT - 6;

  // Decay curve — amber
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const tt = (i / 120) * tMax;
    const f = Math.exp(-tt / tau);
    const x = xL + (tt / tMax) * w;
    const y = yB - f * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Vertical at τ
  const xTau = xL + (tau / tMax) * w;
  ctx.strokeStyle = colors.fg3;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(xTau, yT);
  ctx.lineTo(xTau, yB);
  ctx.stroke();
  ctx.setLineDash([]);

  // Marker at current t
  const tClamp = Math.min(elapsed, tMax);
  const fNow = Math.exp(-tClamp / tau);
  const xNow = xL + (tClamp / tMax) * w;
  const yNow = yB - fNow * h;
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(xNow, yNow, 3, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`I₀ = ${I0.toFixed(1)} A`, xL + 4, yT + 4);
  ctx.fillStyle = AMBER;
  ctx.fillText("I(t)", xL + 4, yT - 4);
  ctx.fillStyle = colors.fg3;
  ctx.textAlign = "center";
  ctx.fillText("τ", xTau, yB + 12);
  ctx.textAlign = "right";
  ctx.fillText("5τ", xR, yB + 12);
  ctx.textAlign = "left";
  ctx.fillText("0", xL, yB + 12);
  ctx.fillStyle = GREEN;
  ctx.fillText(`I = ${Inow.toFixed(2)} A`, xL + 4, yB - 6);
}
