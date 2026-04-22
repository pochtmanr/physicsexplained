"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;
const TAU = 1.5; // RC time constant in seconds (visual)
const Q_MAX = 1; // dimensionless full charge

/**
 * A battery, a resistor, and a capacitor in a loop. When the switch closes
 * (auto on mount or via reset), charge accumulates on the plates following
 * q(t) = Q∞ · (1 − e^(−t/RC)). The current i(t) decays as e^(−t/RC).
 *
 * The shaded charge bars on the two plates fill in real time, and a small
 * inset plot shows q(t) versus its asymptote. A reset button restarts the
 * cycle. RC time constant is named in the HUD as a hook for §06 Circuits.
 */
export function CapacitorChargingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 340 });
  const startRef = useRef<number>(0);
  const tNowRef = useRef<number>(0);

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
      tNowRef.current = t;
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
      const fillFrac = 1 - Math.exp(-elapsed / TAU);
      const q = Q_MAX * fillFrac;
      const iFrac = Math.exp(-elapsed / TAU); // current as fraction of i(0)

      // ─────── Layout ───────
      const padX = 40;
      const padY = 40;
      const circuitW = Math.min(width - padX * 2, width * 0.62);
      const circuitH = height - padY * 2;
      const circuitLeft = padX;
      const circuitRight = circuitLeft + circuitW;
      const circuitTop = padY;
      const circuitBottom = circuitTop + circuitH;

      // ─────── Wires (rectangle) ───────
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(circuitLeft, circuitTop);
      ctx.lineTo(circuitRight, circuitTop);
      ctx.moveTo(circuitRight, circuitTop);
      ctx.lineTo(circuitRight, circuitBottom);
      ctx.moveTo(circuitRight, circuitBottom);
      ctx.lineTo(circuitLeft, circuitBottom);
      ctx.moveTo(circuitLeft, circuitBottom);
      ctx.lineTo(circuitLeft, circuitTop);
      ctx.stroke();

      // ─────── Battery (left side, vertical) ───────
      const battCY = (circuitTop + circuitBottom) / 2;
      drawBattery(ctx, circuitLeft, battCY);

      // ─────── Resistor (top wire) ───────
      const resCX = (circuitLeft + circuitRight) / 2;
      drawResistor(ctx, resCX, circuitTop);

      // ─────── Capacitor (right side, vertical) ───────
      const capCY = (circuitTop + circuitBottom) / 2;
      drawCapacitor(ctx, circuitRight, capCY, fillFrac);

      // ─────── Animated current dots ───────
      drawCurrentDots(ctx, {
        left: circuitLeft,
        right: circuitRight,
        top: circuitTop,
        bottom: circuitBottom,
        t,
        iFrac,
      });

      // ─────── q(t) inset plot on the right ───────
      const plotL = circuitRight + 60;
      const plotR = width - 16;
      const plotT = padY + 10;
      const plotB = height - padY - 10;
      if (plotR - plotL > 60) {
        drawChargeCurve(ctx, plotL, plotT, plotR, plotB, elapsed, colors);
      }

      // ─────── HUD ───────
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`q(t) / Q∞ = ${(fillFrac * 100).toFixed(1)} %`, 12, 18);
      ctx.fillText(`i(t) / i₀ = ${(iFrac * 100).toFixed(1)} %`, 12, height - 8);
      ctx.textAlign = "right";
      ctx.fillText(
        `τ = RC  ·  t = ${elapsed.toFixed(2)} s`,
        width - 12,
        18,
      );
      ctx.fillText(
        `q(t) = Q∞(1 − e^(−t/RC))`,
        width - 12,
        height - 8,
      );

      // Mark fully-charged
      if (fillFrac > 0.99) {
        ctx.fillStyle = "rgba(111, 184, 198, 0.85)";
        ctx.textAlign = "center";
        ctx.fillText("charged", width / 2, 18);
      }
    },
  });

  const handleReset = () => {
    startRef.current = tNowRef.current;
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center justify-between px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">
          battery → resistor → capacitor · charge ramps with τ = RC
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-1)] transition-colors hover:border-[#6FB8C6] hover:text-[#6FB8C6]"
        >
          reset
        </button>
      </div>
    </div>
  );
}

function drawBattery(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  // Long line = positive terminal, short line = negative
  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 2;
  // long
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 10);
  ctx.lineTo(cx + 10, cy - 10);
  ctx.stroke();
  ctx.strokeStyle = "#6FB8C6";
  // short
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 10);
  ctx.lineTo(cx + 6, cy + 10);
  ctx.stroke();

  ctx.fillStyle = "#FF6ADE";
  ctx.font = "11px monospace";
  ctx.textAlign = "right";
  ctx.fillText("+", cx - 14, cy - 6);
  ctx.fillStyle = "#6FB8C6";
  ctx.fillText("−", cx - 14, cy + 14);
  ctx.fillStyle = "rgba(182, 196, 216, 0.8)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("battery", cx + 14, cy + 4);
}

function drawResistor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  // Zigzag resistor along the top wire
  const w = 60;
  const h = 8;
  const segments = 6;
  const segW = w / segments;
  ctx.fillStyle = "#07090E";
  ctx.fillRect(cx - w / 2 - 2, cy - h - 4, w + 4, h * 2 + 8);
  ctx.strokeStyle = "rgba(182, 196, 216, 0.95)";
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
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fillFrac: number,
) {
  // Two horizontal plates centered on the right wire (cx is the wire x)
  const plateW = 38;
  const gap = 10;
  const yTop = cy - gap / 2;
  const yBot = cy + gap / 2;

  // Wire stubs to plates
  ctx.strokeStyle = "rgba(182, 196, 216, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 30);
  ctx.lineTo(cx, yTop);
  ctx.moveTo(cx, yBot);
  ctx.lineTo(cx, cy + 30);
  ctx.stroke();

  // Charge intensity tracks fillFrac
  const posAlpha = 0.25 + 0.7 * fillFrac;
  const negAlpha = posAlpha;

  ctx.shadowColor = `rgba(255, 106, 222, ${(0.4 * fillFrac).toFixed(3)})`;
  ctx.shadowBlur = 14 * fillFrac;
  ctx.fillStyle = `rgba(255, 106, 222, ${posAlpha.toFixed(3)})`;
  ctx.fillRect(cx - plateW / 2, yTop - 3, plateW, 4);
  ctx.shadowColor = `rgba(111, 184, 198, ${(0.4 * fillFrac).toFixed(3)})`;
  ctx.fillStyle = `rgba(111, 184, 198, ${negAlpha.toFixed(3)})`;
  ctx.fillRect(cx - plateW / 2, yBot - 1, plateW, 4);
  ctx.shadowBlur = 0;

  // Charge symbols, count tracks fillFrac
  const nMax = 5;
  const n = Math.round(nMax * fillFrac);
  ctx.fillStyle = "#FF6ADE";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  for (let i = 0; i < n; i++) {
    const x = cx - plateW / 2 + (plateW / (nMax + 1)) * (i + 1);
    ctx.fillText("+", x, yTop - 6);
  }
  ctx.fillStyle = "#6FB8C6";
  for (let i = 0; i < n; i++) {
    const x = cx - plateW / 2 + (plateW / (nMax + 1)) * (i + 1);
    ctx.fillText("−", x, yBot + 14);
  }

  ctx.fillStyle = "rgba(182, 196, 216, 0.8)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("C", cx + plateW / 2 + 6, cy + 3);
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
  // Travel clockwise around the rectangle. Conventional current leaves +.
  const perim = 2 * (right - left) + 2 * (bottom - top);
  const speed = 80 + 200 * iFrac; // px/s — slows as charging completes
  const offset = (t * speed) % perim;

  const nDots = 12;
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
  // Clockwise from top-left: top edge → right edge → bottom edge → left edge
  if (s < w) return { x: r.left + s, y: r.top };
  if (s < w + h) return { x: r.right, y: r.top + (s - w) };
  if (s < 2 * w + h) return { x: r.right - (s - w - h), y: r.bottom };
  return { x: r.left, y: r.bottom - (s - 2 * w - h) };
}

function drawChargeCurve(
  ctx: CanvasRenderingContext2D,
  xL: number,
  yT: number,
  xR: number,
  yB: number,
  elapsed: number,
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

  // Asymptote line at q = Q∞
  ctx.strokeStyle = colors.fg3;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xL, yT + 6);
  ctx.lineTo(xR, yT + 6);
  ctx.stroke();
  ctx.setLineDash([]);

  // Curve q(t)/Q∞ = 1 − e^(−t/τ) over a 5τ window
  const tMax = 5 * TAU;
  const w = xR - xL;
  const h = yB - yT - 6;
  ctx.strokeStyle = "#6FB8C6";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const tt = (i / 100) * tMax;
    const f = 1 - Math.exp(-tt / TAU);
    const x = xL + (tt / tMax) * w;
    const y = yB - f * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Marker at current t (clamped to plot window)
  const tClamp = Math.min(elapsed, tMax);
  const fNow = 1 - Math.exp(-tClamp / TAU);
  const xNow = xL + (tClamp / tMax) * w;
  const yNow = yB - fNow * h;
  ctx.fillStyle = "#FF6ADE";
  ctx.beginPath();
  ctx.arc(xNow, yNow, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Q∞", xL + 4, yT + 4);
  ctx.fillText("q(t)", xL + 4, yT - 4);
  ctx.textAlign = "right";
  ctx.fillText("5τ", xR, yB + 12);
  ctx.textAlign = "left";
  ctx.fillText("0", xL, yB + 12);
}
