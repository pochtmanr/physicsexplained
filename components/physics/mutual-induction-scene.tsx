"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { concentricSolenoidMutual } from "@/lib/physics/electromagnetism/inductance";

/**
 * Two coaxial solenoids viewed from the side. The primary (outer) is driven
 * with a sinusoidal current I₁(t) = I₀ sin(ωt); the secondary (inner, slid
 * along the shared axis) picks up EMF_2 = −M · dI₁/dt.
 *
 * A slider moves the secondary along the axis. When fully inside, the
 * coupling is strong (M close to its geometric maximum); when pulled
 * out, the flux linkage collapses and the induced EMF drops — the
 * coupling factor k ≤ 1 is shown live.
 *
 * Palette:
 *   magenta  — primary coil markers (+ / current out)
 *   cyan     — primary coil markers (− / current in)
 *   amber    — primary current trace
 *   green    — secondary (induced) EMF trace
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const OMEGA = 2 * Math.PI * 0.6; // rad/s (0.6 Hz drive)
const I0 = 3; // amps peak
const N1_PER_M = 2000; // turns per metre (primary density)
const N2_TURNS = 120; // secondary total turns
const A_INNER = Math.PI * 0.015 * 0.015; // inner coil cross-section (m²)
const GREEN = "rgba(120, 255, 170, 0.95)";
const AMBER = "#FFD66B";
const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";

export function MutualInductionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  // separation s ∈ [0, 1] where 0 is fully inside, 1 is pulled fully out
  const [separation, setSeparation] = useState(0);

  // Rolling trace buffers
  const traceRef = useRef<Array<{ t: number; I1: number; emf: number }>>([]);

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

      // ── Physics ──
      // Geometry-max M (fully inside):
      const Mmax = concentricSolenoidMutual(N1_PER_M, N2_TURNS, A_INNER);
      // Coupling coefficient k falls smoothly as the secondary leaves:
      const k = 1 - separation;
      const M = Mmax * k;
      const I1 = I0 * Math.sin(OMEGA * t);
      const dI1dt = I0 * OMEGA * Math.cos(OMEGA * t);
      const emf = -M * dI1dt;

      // Push into rolling trace
      traceRef.current.push({ t, I1, emf });
      const cutoff = t - 4.0;
      while (
        traceRef.current.length > 0 &&
        traceRef.current[0]!.t < cutoff
      ) {
        traceRef.current.shift();
      }

      // ── Layout ──
      const padX = 28;
      const padY = 28;
      const sceneW = Math.min(width * 0.58, width - padX * 2 - 120);
      const sceneH = height - padY * 2;
      const sL = padX;
      const sR = sL + sceneW;
      const axisY = padY + sceneH * 0.5;

      // Axis line (the shared solenoid axis)
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(sL, axisY);
      ctx.lineTo(sR, axisY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Primary (outer) solenoid: a wide horizontal tube
      const primW = sceneW * 0.78;
      const primCX = (sL + sR) / 2;
      const primL = primCX - primW / 2;
      const primR = primCX + primW / 2;
      const primY1 = axisY - sceneH * 0.18;
      const primY2 = axisY + sceneH * 0.18;

      // primary walls: cross-section dots (current direction depends on sign of I1)
      const primMarker = I1 >= 0 ? "out" : "in";
      const nMarkers = 10;
      for (let i = 0; i < nMarkers; i++) {
        const x = primL + ((i + 0.5) / nMarkers) * primW;
        drawCurrentMarker(ctx, x, primY1, primMarker);
        drawCurrentMarker(
          ctx,
          x,
          primY2,
          primMarker === "out" ? "in" : "out",
        );
      }

      // Primary-field shading inside (direction depends on sign of I1)
      const Bmag = Math.abs(I1) / I0; // 0..1
      const fieldColor =
        I1 >= 0
          ? `rgba(120, 220, 255, ${(0.15 + 0.4 * Bmag).toFixed(3)})`
          : `rgba(255, 106, 222, ${(0.1 + 0.3 * Bmag).toFixed(3)})`;
      ctx.fillStyle = fieldColor;
      ctx.fillRect(primL, primY1 + 4, primW, primY2 - primY1 - 8);

      // Secondary (inner) solenoid: smaller, slides along axis
      const secW = sceneW * 0.28;
      const secY1 = axisY - sceneH * 0.10;
      const secY2 = axisY + sceneH * 0.10;
      // secondary centre: fully inside = primCX; fully out = primR + secW/2 + 20
      const secCX =
        primCX + separation * (primR + secW / 2 + 24 - primCX);
      const secL = secCX - secW / 2;
      const secR = secCX + secW / 2;
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(secL, secY1, secW, secY2 - secY1);
      // Secondary turns as short vertical lines
      const secTurns = 10;
      for (let i = 0; i < secTurns; i++) {
        const x = secL + ((i + 0.5) / secTurns) * secW;
        ctx.strokeStyle = "rgba(120, 255, 170, 0.7)";
        ctx.beginPath();
        ctx.moveTo(x, secY1);
        ctx.lineTo(x, secY2);
        ctx.stroke();
      }

      // Induced-EMF arrow on the secondary (direction follows sign of emf)
      const emfMag = Math.abs(emf);
      const emfScale = Math.min(1, emfMag / (Mmax * I0 * OMEGA));
      const arrowLen = 46 * emfScale;
      if (arrowLen > 4) {
        const ay = axisY;
        const ax0 = secCX;
        const dir = Math.sign(emf) || 1; // left-right
        const ax1 = ax0 + dir * arrowLen;
        ctx.strokeStyle = `rgba(120, 255, 170, ${(0.4 + 0.6 * emfScale).toFixed(3)})`;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax0, ay - 30);
        ctx.lineTo(ax1, ay - 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax1, ay - 30);
        ctx.lineTo(ax1 - dir * 7, ay - 34);
        ctx.lineTo(ax1 - dir * 7, ay - 26);
        ctx.closePath();
        ctx.fill();
      }

      // Labels
      ctx.fillStyle = MAGENTA;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("primary (coil 1)", primL, primY1 - 8);
      ctx.fillStyle = GREEN;
      ctx.fillText("secondary (coil 2)", secL, secY2 + 14);
      ctx.fillStyle = "rgba(120, 255, 170, 0.75)";
      ctx.fillText("induced EMF", secCX - 36, axisY - 40);

      // ── Trace panel on the right ──
      const plotL = Math.min(width - 180, sR + 20);
      const plotR = width - 14;
      const plotT = padY + 4;
      const plotB = height - padY - 4;
      if (plotR - plotL > 60) {
        drawTraces(
          ctx,
          plotL,
          plotT,
          plotR,
          plotB,
          traceRef.current,
          t,
          Mmax,
          colors,
        );
      }

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `I₁ = ${I1.toFixed(2)} A    EMF₂ = ${(emf * 1e3).toFixed(1)} mV`,
        12,
        16,
      );
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(
        `M = ${(M * 1e6).toFixed(2)} µH    k = ${k.toFixed(2)}`,
        12,
        height - 20,
      );
      ctx.fillStyle = colors.fg3;
      ctx.fillText("EMF₂ = −M · dI₁/dt", 12, height - 6);

      // right-hand-rule axes cue
      drawAxesBadge(ctx, width - 120, height - 50, colors);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2">
        <div className="flex items-center gap-2">
          <label className="w-28 font-mono text-xs text-[var(--color-fg-3)]">
            separation
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={separation}
            onChange={(e) => setSeparation(parseFloat(e.target.value))}
            className="flex-1 accent-[#A8FFCD]"
          />
          <span className="w-16 text-right font-mono text-xs text-[var(--color-fg-1)]">
            k = {(1 - separation).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function drawCurrentMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: "in" | "out",
) {
  const r = 5;
  const color = dir === "out" ? MAGENTA : CYAN;
  ctx.shadowColor = `${color}AA`;
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#0E0F18";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  if (dir === "out") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y - r * 0.5);
    ctx.lineTo(x + r * 0.5, y + r * 0.5);
    ctx.moveTo(x + r * 0.5, y - r * 0.5);
    ctx.lineTo(x - r * 0.5, y + r * 0.5);
    ctx.stroke();
  }
}

function drawTraces(
  ctx: CanvasRenderingContext2D,
  xL: number,
  yT: number,
  xR: number,
  yB: number,
  trace: Array<{ t: number; I1: number; emf: number }>,
  tNow: number,
  Mmax: number,
  colors: { fg2: string; fg3: string },
) {
  const w = xR - xL;
  const h = yB - yT;
  // Two stacked sub-plots
  const midY = yT + h / 2;
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xL, yT);
  ctx.lineTo(xL, yB);
  ctx.moveTo(xL, midY);
  ctx.lineTo(xR, midY);
  ctx.moveTo(xL, yB);
  ctx.lineTo(xR, yB);
  ctx.stroke();

  const tWindow = 4.0;
  const xOf = (t: number) => xL + ((t - (tNow - tWindow)) / tWindow) * w;

  const i1Max = I0;
  const emfMax = Mmax * I0 * OMEGA;

  // Upper: I1(t)
  const yTop0 = (yT + midY) / 2;
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  trace.forEach((p, i) => {
    const x = xOf(p.t);
    const y = yTop0 - (p.I1 / i1Max) * ((midY - yT) / 2 - 4);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = AMBER;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("I₁(t)", xL + 4, yT + 10);

  // Lower: emf(t)
  const yBot0 = (midY + yB) / 2;
  ctx.strokeStyle = "rgba(120, 255, 170, 0.95)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  trace.forEach((p, i) => {
    const x = xOf(p.t);
    const y =
      emfMax > 0
        ? yBot0 - (p.emf / emfMax) * ((yB - midY) / 2 - 4)
        : yBot0;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
  ctx.fillText("EMF₂(t)", xL + 4, midY + 10);
}

function drawAxesBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colors: { fg2: string; fg3: string },
) {
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y - 6, 108, 46);
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("right-hand rule", x + 6, y + 6);
  ctx.fillStyle = MAGENTA;
  ctx.fillText("thumb = I₁", x + 6, y + 18);
  ctx.fillStyle = "rgba(120, 220, 255, 0.9)";
  ctx.fillText("fingers = B", x + 6, y + 30);
}
