"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.28c — Flyback spike. An RL circuit runs in steady state with
 * current I_steady = V0 / R. Then at t = 0 the switch is abruptly
 * opened. The inductor refuses to let dI/dt be infinite, but it can be
 * enormous: whatever tiny air gap forms at the switch must sustain the
 * current until it's ionised, and
 *
 *   V_L = L · dI/dt
 *
 * blows up. A millihenry coil carrying 2 A through a switch that cuts
 * in 10 µs forces V_L ≈ 200 V across the gap. A 10 mH ignition coil at
 * 4 A cut in 20 µs? Two kilovolts. That's the spark plug.
 *
 * This scene stages the moment: a closed switch with current flowing,
 * a user-trigger that opens the switch, a huge voltage arc rendered
 * in lilac (displacement-current colour, previewing §07), and a log-
 * scale V_L readout showing the spike.
 */

const RATIO = 0.58;
const MAX_HEIGHT = 400;
const V_SRC = 12; // volts
const R_OHM = 4; // ohms
const L_H = 0.01; // 10 mH — ignition-coil scale
const SWITCH_CUT_TIME = 20e-6; // 20 µs — a fast mechanical cut
const AMBER = "#FFD66B";
const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";
const LILAC = "rgba(200, 160, 255, 0.95)"; // §06/§07 displacement / spark
const LILAC_DIM = "rgba(200, 160, 255, 0.55)";

type Phase = "steady" | "opening" | "spiked";

export function RlFlybackScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  const [phase, setPhase] = useState<Phase>("steady");
  const openStartRef = useRef<number | null>(null);
  const nowRef = useRef(0);
  const sparkSeed = useRef<number>(Math.random());

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

      const Isteady = V_SRC / R_OHM; // 3 A

      let I = Isteady;
      let VL = 0;
      let sparkIntensity = 0;

      if (phase === "opening" && openStartRef.current !== null) {
        // Seconds since the cut began (real wall clock).
        const dt = Math.max(0, t - openStartRef.current);
        // Model: during SWITCH_CUT_TIME the current ramps linearly to zero.
        // dI/dt ≈ −Isteady / SWITCH_CUT_TIME
        // V_L = L · dI/dt  (negative = pointing the other way — we plot magnitude)
        if (dt < SWITCH_CUT_TIME) {
          const frac = dt / SWITCH_CUT_TIME;
          I = Isteady * (1 - frac);
          const dIdt = -Isteady / SWITCH_CUT_TIME; // A/s
          VL = L_H * dIdt; // volts, negative
          sparkIntensity = 1;
        } else {
          // The arc has collapsed; current is zero.
          I = 0;
          VL = 0;
          sparkIntensity = Math.max(
            0,
            1 - (dt - SWITCH_CUT_TIME) / 0.25, // linger the afterglow 250 ms
          );
          if (dt - SWITCH_CUT_TIME > 0.4) {
            setPhase("spiked");
          }
        }
      } else if (phase === "spiked") {
        I = 0;
        VL = 0;
        sparkIntensity = 0;
      }

      // ── Layout ──
      const padX = 36;
      const padY = 32;
      const circuitW = Math.min(width * 0.58, width - padX * 2 - 160);
      const circuitH = height - padY * 2 - 40;
      const cLx = padX;
      const cR = cLx + circuitW;
      const cT = padY + 20;
      const cB = cT + circuitH;

      // wires
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cLx, cT, circuitW, circuitH);
      ctx.stroke();

      // Source on left
      drawBattery(ctx, cLx, (cT + cB) / 2);

      // Switch on top, just right of the battery
      const switchCX = cLx + circuitW * 0.28;
      drawSwitch(ctx, switchCX, cT, phase !== "steady", sparkIntensity, t);

      // Resistor center-top-right
      drawResistor(ctx, cLx + circuitW * 0.65, cT, colors.fg1);

      // Inductor on right
      drawInductor(ctx, cR, (cT + cB) / 2);

      // Current dots (only when there is current)
      if (I > 0.01) {
        const iFrac = I / Isteady;
        drawCurrentDots(ctx, {
          left: cLx,
          right: cR,
          top: cT,
          bottom: cB,
          t,
          iFrac,
        });
      }

      // Flyback arc — huge lilac lightning glyph near the switch
      if (sparkIntensity > 0.01) {
        drawArc(ctx, switchCX, cT, sparkIntensity, t + sparkSeed.current);
      }

      // Spike label on the inductor terminal
      if (phase === "opening" && Math.abs(VL) > 1) {
        const indBoxX = cR + 22;
        const indY = (cT + cB) / 2;
        ctx.save();
        ctx.font = "bold 13px monospace";
        ctx.fillStyle = LILAC;
        ctx.textAlign = "left";
        ctx.fillText(`V_L = ${fmtKV(VL)}`, indBoxX + 8, indY - 6);
        ctx.font = "10px monospace";
        ctx.fillStyle = LILAC_DIM;
        ctx.fillText("L · dI/dt", indBoxX + 8, indY + 8);
        ctx.restore();
      }

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `I = ${I.toFixed(3)} A · V_L = ${fmtKV(VL)}`,
        12,
        16,
      );
      ctx.fillStyle = colors.fg3;
      ctx.fillText(
        `V = ${V_SRC} V · R = ${R_OHM} Ω · L = ${(L_H * 1000).toFixed(0)} mH · Δt = ${(SWITCH_CUT_TIME * 1e6).toFixed(0)} µs`,
        12,
        height - 8,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = LILAC;
      if (phase === "opening" && Math.abs(VL) > V_SRC * 10) {
        ctx.font = "bold 12px monospace";
        ctx.fillText(
          `spike = ${Math.round(Math.abs(VL) / V_SRC)}× source`,
          width - 12,
          16,
        );
      } else {
        ctx.font = "12px monospace";
        ctx.fillText(
          "V_L = L · dI/dt",
          width - 12,
          16,
        );
      }
    },
  });

  const handleOpen = () => {
    if (phase === "steady") {
      openStartRef.current = nowRef.current;
      setPhase("opening");
    }
  };
  const handleReset = () => {
    openStartRef.current = null;
    sparkSeed.current = Math.random();
    setPhase("steady");
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
          {phase === "steady"
            ? "steady I = 3 A flowing · open the switch to see the spike"
            : phase === "opening"
              ? "switch opening — dI/dt enormous — V_L = L dI/dt"
              : "arc collapsed · current = 0 · reservoir drained through the spark"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleOpen}
            disabled={phase !== "steady"}
            className="border border-[var(--color-fg-4)] px-3 py-1 font-mono text-xs text-[var(--color-fg-1)] transition-colors hover:border-[#C8A0FF] hover:text-[#C8A0FF] disabled:opacity-40"
          >
            open switch
          </button>
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

function fmtKV(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(2)} kV`;
  if (abs >= 1) return `${v.toFixed(2)} V`;
  if (abs === 0) return "0 V";
  return `${(v * 1000).toFixed(1)} mV`;
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
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fg: string,
) {
  const w = 60;
  const h = 8;
  const segments = 6;
  const segW = w / segments;
  ctx.fillStyle = "#07090E";
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
  ctx.fillStyle = "#07090E";
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

function drawSwitch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  opened: boolean,
  sparkIntensity: number,
  t: number,
) {
  // Terminal dots either side
  ctx.fillStyle = "rgba(182, 196, 216, 0.9)";
  ctx.beginPath();
  ctx.arc(cx - 12, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 12, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = opened ? CYAN : "rgba(182, 196, 216, 0.9)";
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  if (opened) {
    // Tilted upward arm — pivot from left dot
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx + 10, cy - 14);
  } else {
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx + 12, cy);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(182, 196, 216, 0.8)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(opened ? "open" : "S", cx, cy - 18);

  // Arc flicker across the gap while opening
  if (opened && sparkIntensity > 0.05) {
    ctx.save();
    const alpha = Math.min(1, sparkIntensity);
    ctx.strokeStyle = `rgba(200, 160, 255, ${(0.4 + 0.5 * alpha).toFixed(3)})`;
    ctx.shadowColor = "rgba(200, 160, 255, 0.95)";
    ctx.shadowBlur = 18 * alpha;
    ctx.lineWidth = 2;
    // Jagged line from left terminal to right terminal
    const n = 6;
    const jitter = () => (Math.sin(t * 80 + Math.random() * 8) * 0.5 + Math.random()) * 4;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    for (let i = 1; i < n; i++) {
      const xi = cx - 12 + (24 * i) / n;
      const yi = cy + jitter() * (i % 2 === 0 ? 1 : -1);
      ctx.lineTo(xi, yi);
    }
    ctx.lineTo(cx + 12, cy);
    ctx.stroke();
    ctx.restore();
  }
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  intensity: number,
  t: number,
) {
  // Big lilac burst sitting above the switch — the visual shout of V_L = L dI/dt
  ctx.save();
  const baseAlpha = Math.min(1, intensity);
  ctx.globalAlpha = baseAlpha;
  const N = 9;
  for (let i = 0; i < N; i++) {
    const angle = -Math.PI / 2 + ((i - (N - 1) / 2) * Math.PI) / 14;
    const wobble = Math.sin(t * 50 + i * 2.3) * 3;
    const len = 36 + wobble + Math.random() * 4;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    ctx.strokeStyle = `rgba(220, 185, 255, ${(0.35 + 0.55 * baseAlpha).toFixed(3)})`;
    ctx.shadowColor = "rgba(200, 160, 255, 0.9)";
    ctx.shadowBlur = 14 * baseAlpha;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    // jagged midpoint
    const mx = cx + Math.cos(angle) * len * 0.55 + (Math.random() - 0.5) * 6;
    const my = cy + Math.sin(angle) * len * 0.55 + (Math.random() - 0.5) * 6;
    ctx.lineTo(mx, my);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Central hot spot
  ctx.fillStyle = `rgba(255, 255, 255, ${(0.6 * baseAlpha).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 3 + 2 * baseAlpha, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Label
  ctx.save();
  ctx.globalAlpha = Math.min(1, intensity);
  ctx.fillStyle = LILAC;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("SPARK", cx, cy - 48);
  ctx.restore();
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
