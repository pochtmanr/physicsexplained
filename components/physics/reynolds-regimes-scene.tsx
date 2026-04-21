"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { classifyPipeFlow } from "@/lib/physics/viscosity";

const RATIO = 0.46;
const MAX_HEIGHT = 360;

// Flow past a circular cylinder, schematic. We don't solve Navier-Stokes —
// that would take more compute than this page can spare — instead we draw
// three procedurally-generated streamline fields keyed to Reynolds number:
//   Re ≲ 1     — creeping flow. Streamlines part and rejoin smoothly,
//                fore-aft symmetric.
//   1 ≲ Re ≲ 40 — steady separation. Two standing vortices hang off the back.
//   40 ≲ Re ≲ 2000 — periodic vortex shedding (Kármán street). Alternating
//                vortices peel off and drift downstream.
//   Re ≳ 2000 — turbulent wake. Random eddies, structure is lost.
// The slider runs on a log scale from 0.1 to 10^6. Reading the wake at each
// band is the point.

interface Vortex {
  // position in world coords (cylinder centre = origin, positive x downstream)
  x: number;
  y: number;
  // circulation sign: +1 top shed, -1 bottom shed
  sign: number;
  // birth time, used to fade
  bornAt: number;
}

export function ReynoldsRegimesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [logRe, setLogRe] = useState(1.5); // 10^1.5 ≈ 32
  const [size, setSize] = useState({ width: 720, height: 340 });

  const vorticesRef = useRef<Vortex[]>([]);
  const lastShedRef = useRef(0);
  const lastShedSignRef = useRef(1);

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

  // Reset vortex trail when the regime changes dramatically.
  useEffect(() => {
    vorticesRef.current = [];
    lastShedRef.current = 0;
  }, [logRe]);

  const Re = Math.pow(10, logRe);

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

      // --- Layout -----------------------------------------------------------
      const padL = 24;
      const padR = 20;
      const padT = 24;
      const padB = 56;

      const plotL = padL;
      const plotR = width - padR;
      const plotT = padT;
      const plotB = height - padB;
      const plotW = plotR - plotL;
      const plotH = plotB - plotT;

      const cylX = plotL + plotW * 0.25;
      const cylY = plotT + plotH / 2;
      const cylR = Math.min(18, plotH * 0.09);

      // --- Inflow arrows on the left ----------------------------------------
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const y = plotT + 12 + ((plotH - 24) * i) / 6;
        if (Math.abs(y - cylY) < cylR * 1.1) continue;
        ctx.beginPath();
        ctx.moveTo(plotL + 2, y);
        ctx.lineTo(plotL + 24, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(plotL + 24, y);
        ctx.lineTo(plotL + 20, y - 3);
        ctx.lineTo(plotL + 20, y + 3);
        ctx.closePath();
        ctx.fillStyle = colors.fg3;
        ctx.fill();
      }

      // --- Streamlines ------------------------------------------------------
      // We draw streamlines by numerical integration from a set of inlet
      // seeds. The velocity field is a crude analytical proxy: potential flow
      // past a cylinder plus, for Re above the relevant thresholds, a wake
      // recirculation region and (above Re ≈ 50) the unsteady vortex drift
      // that lives in `vorticesRef`.
      const uInf = 1; // conceptual free-stream speed (units are arbitrary)
      const worldToPx = (x: number, y: number) => ({
        px: cylX + x * (cylR * 4), // 1 world unit ≈ 4 cylinder radii in px
        py: cylY - y * (cylR * 4),
      });

      const nStream = 9;
      const streamlineColor = "#6FB8C6";
      ctx.strokeStyle = streamlineColor;
      ctx.lineWidth = 1.2;

      for (let s = 0; s < nStream; s++) {
        const y0 =
          (-plotH / 2 / (cylR * 4)) * 0.95 +
          ((plotH / (cylR * 4)) * 0.95 * s) / (nStream - 1);
        let x = -plotW / 2 / (cylR * 4);
        let y = y0;
        ctx.beginPath();
        const start = worldToPx(x, y);
        ctx.moveTo(start.px, start.py);
        for (let step = 0; step < 260; step++) {
          // Potential flow past a cylinder of unit radius
          const r2 = x * x + y * y;
          if (r2 < 1) {
            // Inside the cylinder — streamline terminates here (we'll restart
            // on the other side visually by just stopping the line).
            break;
          }
          // u = U(1 − (a^2(x^2 − y^2))/r^4)   with a = 1
          // v = −U(2 a^2 x y / r^4)
          let u = uInf * (1 - (x * x - y * y) / (r2 * r2));
          let v = uInf * (-(2 * x * y) / (r2 * r2));

          // Wake modification: below Re ≈ 5 flow is nearly fore-aft
          // symmetric; above that, streamlines behind the cylinder start
          // deflecting around a widening wake.
          if (Re > 5 && x > 0 && Math.abs(y) < 1.6) {
            const wake = Math.min(1, (Math.log10(Re) - 0.7) / 2);
            const push = wake * 0.25 * Math.exp(-x * 0.25);
            v += y > 0 ? push : -push;
            u *= 1 - 0.35 * wake * Math.exp(-x * 0.25) * (1 - Math.min(1, Math.abs(y)));
          }

          // Turbulent wake: jitter x > 0 streamlines. Scale with Re.
          if (Re > 2000 && x > 0.8) {
            const jitter = Math.min(0.35, (Math.log10(Re) - 3.3) * 0.12);
            u += (Math.random() - 0.5) * jitter;
            v += (Math.random() - 0.5) * jitter;
          }

          const dt = 0.05;
          x += u * dt;
          y += v * dt;
          const p = worldToPx(x, y);
          if (p.px > plotR || p.px < plotL || p.py < plotT || p.py > plotB) break;
          ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
      }

      // --- Cylinder ---------------------------------------------------------
      ctx.fillStyle = colors.bg1;
      ctx.beginPath();
      ctx.arc(cylX, cylY, cylR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // --- Vortex shedding (Kármán street) ---------------------------------
      // Shed a new vortex on a fixed cadence once Re enters the vortex-street
      // band. Strouhal ~0.2 => shedding rate for our arbitrary units is just
      // "fast enough to be visible". We don't try to match real wall-clock
      // physics — the visualisation runs at a readable pace.
      if (Re > 45 && Re < 5000) {
        const shedPeriod = Math.max(0.35, 1.0 - (logRe - 1.65) * 0.25);
        if (t - lastShedRef.current > shedPeriod) {
          lastShedSignRef.current *= -1;
          vorticesRef.current.push({
            x: 1.2,
            y: 0.4 * lastShedSignRef.current,
            sign: lastShedSignRef.current,
            bornAt: t,
          });
          lastShedRef.current = t;
        }
      } else {
        // Outside shedding band: drain existing vortices.
      }

      // Advect vortices downstream; remove ones that leave.
      const dtAdv = 0.016; // frame-local, advection speed in world units
      const keep: Vortex[] = [];
      for (const vx of vorticesRef.current) {
        vx.x += 0.9 * dtAdv * 60 * 0.02; // tuned drift speed
        // Slight oscillation so the street looks organic.
        vx.y += (vx.sign * 0.02) * Math.sin((t - vx.bornAt) * 2);
        if (vx.x < 6) keep.push(vx);
      }
      vorticesRef.current = keep;

      // Draw vortices as little swirl glyphs.
      for (const vx of vorticesRef.current) {
        const p = worldToPx(vx.x, vx.y);
        const age = t - vx.bornAt;
        const alpha = Math.max(0, Math.min(0.8, 0.8 - age * 0.15));
        if (alpha <= 0) continue;
        ctx.strokeStyle = `rgba(255, 107, 203, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        const swirlR = 6 + age * 0.6;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2.4; a += 0.25) {
          const rSwirl = swirlR * (1 - a / 8);
          const sx = p.px + rSwirl * Math.cos(a * vx.sign);
          const sy = p.py + rSwirl * Math.sin(a * vx.sign);
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // --- Regime label ----------------------------------------------------
      const regime = pickRegimeLabel(Re);
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Re = ${formatRe(Re)}`, plotL + 4, plotT - 8);
      ctx.textAlign = "right";
      ctx.fillText(regime, plotR - 4, plotT - 8);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-[var(--color-fg-3)]">
            log₁₀ Re
          </label>
          <input
            type="range"
            min={-1}
            max={6}
            step={0.02}
            value={logRe}
            onChange={(e) => setLogRe(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-24 text-right text-sm font-mono text-[var(--color-fg-1)]">
            Re = {formatRe(Re)}
          </span>
        </div>
        <p className="px-1 text-xs text-[var(--color-fg-3)]">
          Below Re ≈ 1 the wake is a mirror of the leading edge — no memory of
          which way the flow went. Past Re ≈ 45 vortices start peeling off
          alternately — a <em>Kármán vortex street</em>, the thing that makes
          tall chimneys hum. Past Re ≈ 2000 the wake shatters into turbulence
          and structure is lost.
        </p>
        <p className="px-1 text-[10px] text-[var(--color-fg-3)] italic">
          ({classifyPipeFlow(Re)} regime label is borrowed from the pipe-flow
          convention; for external flow past a bluff body the numbers shift
          but the ordering is the same.)
        </p>
      </div>
    </div>
  );
}

function pickRegimeLabel(Re: number): string {
  if (Re < 1) return "creeping — reversible-looking, viscous";
  if (Re < 40) return "steady, attached wake";
  if (Re < 2000) return "Kármán vortex street";
  if (Re < 2e5) return "turbulent wake";
  return "fully turbulent";
}

function formatRe(Re: number): string {
  if (Re < 10) return Re.toFixed(2);
  if (Re < 1000) return Re.toFixed(0);
  if (Re < 1e6) return `${(Re / 1e3).toFixed(1)}k`;
  return `${(Re / 1e6).toFixed(1)}M`;
}
