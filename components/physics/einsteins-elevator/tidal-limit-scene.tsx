"use client";

import { useEffect, useRef, useState } from "react";
import { tidalAccelerationOverSeparation } from "@/lib/physics/relativity/elevator";

/**
 * TidalLimitScene — FIG.26c
 *
 * The equivalence principle is local. Two test masses far apart in a real
 * gravitational field experience slightly different g (the tide), so the
 * elevator-equivalence breaks down over a finite region.
 *
 * Animation: two test masses fall freely in Earth's field, separated by an
 * adjustable distance Δr. As Δr grows, the residual relative acceleration
 * (the tide) grows visibly: |Δa| = 2 g Δr / R.
 *
 * Slider: Δr from 1 m (essentially zero tide — the EP is excellent) to
 * 1000 km (large tide — the EP fails).
 *
 * Canvas 2D, dark bg.
 */

const BG = "#0A0C12";
const TEXT_DIM = "rgba(255,255,255,0.55)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const HUD = "rgba(255,255,255,0.7)";
const AMBER = "#FFB36B";
const CYAN = "#67C4F0";
const RED = "#E66B6B";

export function TidalLimitScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef<number | null>(null);

  // Δr in meters. Slider is logarithmic: 0 → 1 m, 1 → 1e6 m (1000 km).
  const [logDeltaR, setLogDeltaR] = useState(0.5);
  const deltaR = Math.pow(10, logDeltaR * 6); // 1 m to 1e6 m

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { W, H };
    };

    const tick = (now: number) => {
      if (t0Ref.current === null) t0Ref.current = now;
      const t = (now - t0Ref.current) / 1000;
      const { W, H } = setupCanvas();
      draw(ctx, W, H, t, deltaR);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [deltaR]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 360, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="Two test masses falling toward Earth's centre, separated by a variable distance Δr. The slider controls Δr from 1 metre to 1000 kilometres. The relative tidal acceleration grows linearly with Δr."
      />
      <div className="mt-3 flex items-center gap-3 px-2">
        <label className="font-mono text-xs text-[var(--color-fg-3)]">
          Δr
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={logDeltaR}
          onChange={(e) => setLogDeltaR(parseFloat(e.target.value))}
          className="flex-1 accent-[#FFB36B]"
        />
        <span className="w-28 text-right font-mono text-xs text-[var(--color-fg-1)]">
          {formatDistance(deltaR)}
        </span>
      </div>
    </div>
  );
}

function formatDistance(m: number): string {
  if (m < 1000) return `${m.toFixed(0)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function formatTide(a: number): string {
  const abs = Math.abs(a);
  if (abs < 1e-9) return `${(a * 1e9).toFixed(2)} nm/s²`;
  if (abs < 1e-6) return `${(a * 1e6).toFixed(2)} μm/s²`;
  if (abs < 1e-3) return `${(a * 1e3).toFixed(3)} mm/s²`;
  return `${a.toFixed(3)} m/s²`;
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  deltaR: number,
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Earth at the bottom
  const cx = W / 2;
  const earthRpx = Math.min(W * 0.6, 280);
  const earthCY = H + earthRpx - 26;

  // Earth disk
  ctx.save();
  const eg = ctx.createRadialGradient(cx, earthCY - earthRpx * 0.3, 0, cx, earthCY, earthRpx);
  eg.addColorStop(0, "rgba(80, 130, 170, 0.35)");
  eg.addColorStop(1, "rgba(40, 70, 110, 0.15)");
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(cx, earthCY, earthRpx, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 180, 220, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, earthCY, earthRpx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("Earth", cx, H - 8);
  ctx.restore();

  // Two test masses fall under the centre-of-mass acceleration.
  // The relative drift in the elevator-frame is given by Δa = 2 g Δr / R.
  // For the animation we exaggerate the geometric separation so the slider's
  // effect is visible, but the readout shows the actual SI value of Δa.
  const cycle = 5; // animation period
  const tCycle = (t % cycle) / cycle; // 0..1
  // Vertical drop of the centre of mass on the canvas (just so motion is visible).
  const yTop = 50;
  const yBottom = H - earthRpx + 30;
  const yMid = yTop + (yBottom - yTop) * tCycle;

  // Geometric pixel separation: log-scaled relative to canvas width.
  // 1 m → ~12 px; 1 km → ~80 px; 1000 km → 200 px (clamped).
  const sepPx = Math.min(12 + 32 * Math.log10(Math.max(deltaR, 1)), W * 0.42);

  // Convergence drift visualisation: the two masses drift toward each other
  // by an amount proportional to (Δa) × (t)². We show this as a small inward
  // wobble that grows over the cycle.
  const tideSI = tidalAccelerationOverSeparation(deltaR);
  const tideMagnitude = Math.abs(tideSI);
  // log-scale drift visualisation: 0 at deltaR=1 m, growing visibly by 1000 km.
  const driftScale = Math.min(0.20 * Math.log10(Math.max(tideMagnitude / 3e-6, 1) + 1), 0.35);
  const drift = sepPx * driftScale * (tCycle * tCycle);

  const xLeft = cx - sepPx / 2 + drift;
  const xRight = cx + sepPx / 2 - drift;

  // Trails (subtle)
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx - sepPx / 2, yTop);
  ctx.lineTo(xLeft, yMid);
  ctx.moveTo(cx + sepPx / 2, yTop);
  ctx.lineTo(xRight, yMid);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Two test masses
  drawTestMass(ctx, xLeft, yMid, CYAN, "A");
  drawTestMass(ctx, xRight, yMid, RED, "B");

  // Connecting Δr label
  ctx.save();
  ctx.strokeStyle = "rgba(255, 220, 120, 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(xLeft + 8, yMid);
  ctx.lineTo(xRight - 8, yMid);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = AMBER;
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(`Δr = ${formatDistance(deltaR)}`, (xLeft + xRight) / 2, yMid - 8);
  ctx.restore();

  // Title
  ctx.save();
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("The EP is local — over a finite region, real gravity tides give it away", cx, 22);
  ctx.restore();

  // HUD readout
  const hudY = 50;
  ctx.save();
  ctx.fillStyle = HUD;
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText("|Δa|  =  2 g Δr / R", 24, hudY);
  ctx.fillStyle = AMBER;
  ctx.fillText(`     =  ${formatTide(tideSI)}`, 24, hudY + 16);

  // Verdict
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "right";
  let verdict: string;
  if (tideMagnitude < 1e-6) verdict = "EP excellent (tide < μm/s²)";
  else if (tideMagnitude < 1e-3) verdict = "EP good — tide is small";
  else verdict = "EP breaks down — tide visible";
  ctx.fillText(verdict, W - 24, hudY);
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText(`R = 6371 km, g = 9.81 m/s²`, W - 24, hudY + 16);
  ctx.restore();
}

function drawTestMass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
) {
  ctx.save();
  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Label
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.font = `bold 10px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(label, x, y - 12);
  ctx.restore();
}
