"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.52;
const MAX_HEIGHT = 420;

const AMBER = "rgba(255, 180, 80,"; // light beam / ray
const MAGENTA = "rgba(255, 100, 200,"; // wheel
const CYAN = "rgba(120, 220, 255,"; // mirror / return
const LILAC = "rgba(200, 160, 255,"; // annotations

// Fizeau 1849 geometry — Paris (Suresnes) to Montmartre, one-way distance
// L ≈ 8633 m. The wheel had 720 teeth and spun at about 12.6 rev/s at the
// moment the returning light passed through a *gap* — this gave his
// estimate c ≈ 3.15 × 10⁸ m/s (about 5% high by modern values).
const L_METRES = 8633;
const N_TEETH = 720;
const REV_PER_SEC = 12.6;

/**
 * FIG.38c — FIZEAU'S TOOTHED WHEEL (1849).
 *
 *   Source → [wheel] → (8.63 km path) → mirror → (8.63 km back) → [wheel]
 *
 * Light leaves the source, passes through a GAP between teeth on the
 * outgoing side, travels 8.63 km to a mirror in Montmartre, returns, and
 * on its return the wheel has rotated. If it has rotated by exactly one
 * tooth, the returning light is blocked. If it has rotated by two teeth
 * (half a tooth-pair period) the returning light makes it through the
 * next gap, and the observer sees the source.
 *
 * For 720 teeth and Δt round-trip = 2L/c, the first "dark" rotation rate is
 *
 *   ω₁ = π / (N · 2L/c)   (radians per second)  ⇒   f₁ = c / (4 · N · L)
 *
 * With Fizeau's numbers, f₁ ≈ 12.6 rev/s, which delivers c ≈ 3.15 × 10⁸ m/s.
 *
 * Scene: an amber ray leaves a source on the left, threads between teeth,
 * reaches a cyan mirror on the right (the Montmartre plate), returns, and
 * is sampled against the rotating wheel. A toggle slows the wheel until
 * the ray makes it through both ways, exhibiting the extinction condition.
 */
export function SpeedMeasurementScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 820, height: 420 });
  const [wheelRate, setWheelRate] = useState(REV_PER_SEC); // rev / s

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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      ctx.fillStyle = "#0b0d10";
      ctx.fillRect(0, 0, width, height);

      // Geometry
      const cy = height / 2 + 10;
      const srcX = 46;
      const wheelX = 150;
      const wheelR = Math.min(height * 0.32, 96);
      const mirrorX = width - 46;

      // Dashed horizontal line representing the 8.63 km light path.
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wheelX + wheelR + 8, cy);
      ctx.lineTo(mirrorX - 10, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance label in the middle of the path.
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `L = 8,633 m  ·  Suresnes → Montmartre`,
        (wheelX + wheelR + mirrorX) / 2,
        cy - 10,
      );

      // Source
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.beginPath();
      ctx.arc(srcX, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("source", srcX, cy + 22);

      // Mirror
      ctx.strokeStyle = `${CYAN} 0.95)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mirrorX, cy - 24);
      ctx.lineTo(mirrorX, cy + 24);
      ctx.stroke();
      ctx.fillStyle = `${CYAN} 0.8)`;
      ctx.fillText("mirror", mirrorX, cy + 38);

      // Wheel — N teeth, spinning at wheelRate rev/s.
      const omega = wheelRate * 2 * Math.PI; // rad/s
      const phase = omega * t;
      drawWheel(ctx, wheelX, cy, wheelR, phase);

      // Compute whether the returning light is transmitted.
      // Round-trip dt = 2L/c (c = 2.998e8 m/s).
      const c = 2.998e8;
      const dtRT = (2 * L_METRES) / c; // seconds
      // Angle advanced during round-trip:
      const dPhi = omega * dtRT;
      // Tooth-pair period: 2π / N (one tooth + one gap).
      const teethPairAngle = (2 * Math.PI) / N_TEETH;
      // Transmitted if the returning light aligns with a GAP again. The
      // wheel has 2N alternating tooth/gap sectors of angular width
      // π/N each. Starting in a gap at emission, after dPhi the wheel is
      // in a gap again iff mod(dPhi, 2π/N) lies in [0, π/N) — first half
      // of the tooth-pair.
      const modAngle = ((dPhi % teethPairAngle) + teethPairAngle) % teethPairAngle;
      const transmitted = modAngle < teethPairAngle / 2;

      // Beam animation — the outgoing ray pulses from source to mirror and
      // back every 1 s of real time (purely visual; the true round-trip is
      // 57 μs).
      const pulseT = (t * 0.9) % 1;
      const pulseX = (() => {
        const half = 0.5;
        if (pulseT < half) {
          // outbound
          return wheelX + wheelR + 8 + (pulseT / half) * (mirrorX - 10 - (wheelX + wheelR + 8));
        } else {
          // inbound
          const f = (pulseT - half) / half;
          return mirrorX - 10 - f * (mirrorX - 10 - (wheelX + wheelR + 8));
        }
      })();
      // Draw the pulse as a short amber dash.
      ctx.strokeStyle = `${AMBER} 0.95)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pulseX - 10, cy);
      ctx.lineTo(pulseX + 10, cy);
      ctx.stroke();

      // Source-to-wheel stub (always shown as a faint ray).
      ctx.strokeStyle = `${AMBER} 0.55)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(srcX + 6, cy);
      ctx.lineTo(wheelX - wheelR, cy);
      ctx.stroke();

      // Compute c estimate from the wheel rate, if we were at the first
      // extinction: c_est = 4 · N · L · f.
      const cEstimate = 4 * N_TEETH * L_METRES * wheelRate;
      const cError = Math.abs(cEstimate - c) / c;

      // HUD
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        "FIZEAU 1849 — toothed wheel, Paris to Montmartre, 8.63 km one-way",
        16,
        22,
      );
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.fillText(
        `wheel: N = 720 teeth · f = ${wheelRate.toFixed(1)} rev/s`,
        16,
        height - 56,
      );
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.fillText(
        `c ≈ 4·N·L·f = ${(cEstimate / 1e8).toFixed(3)} × 10⁸ m/s   (error vs modern c: ${(cError * 100).toFixed(1)}%)`,
        16,
        height - 40,
      );
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.fillText(
        `extinction condition: wheel rotates by exactly one tooth during 2L/c`,
        16,
        height - 24,
      );
      ctx.fillStyle = transmitted ? `${CYAN} 0.95)` : "rgba(255, 130, 130, 0.95)";
      ctx.fillText(
        `return beam: ${transmitted ? "TRANSMITTED — passes through next gap" : "BLOCKED — hits a tooth"}`,
        16,
        height - 8,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 font-mono text-xs">
        <label className="flex items-center gap-2 text-[var(--color-fg-3)]">
          wheel rate
          <input
            type="range"
            min={4}
            max={30}
            step={0.1}
            value={wheelRate}
            onChange={(e) => setWheelRate(Number(e.target.value))}
            className="w-40"
          />
          <span className="text-[var(--color-fg-1)]">
            {wheelRate.toFixed(1)} rev/s
          </span>
        </label>
        <span className="text-[var(--color-fg-3)]">
          nominal Fizeau 1849: 12.6 rev/s → c ≈ 3.15 × 10⁸ m/s
        </span>
      </div>
    </div>
  );
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  phase: number,
) {
  // Rim
  ctx.strokeStyle = `${MAGENTA} 0.7)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Teeth — drawn as short radial segments around the rim.
  // The real Fizeau wheel had 720; we draw 60 for legibility and label it
  // "N = 720 teeth (stylised)".
  const visibleTeeth = 60;
  ctx.strokeStyle = `${MAGENTA} 0.95)`;
  ctx.lineWidth = 2;
  for (let i = 0; i < visibleTeeth; i++) {
    const ang = phase + (i * 2 * Math.PI) / visibleTeeth;
    if (i % 2 === 1) continue; // skip every other position → gap
    const x0 = cx + r * Math.cos(ang);
    const y0 = cy + r * Math.sin(ang);
    const x1 = cx + (r + 10) * Math.cos(ang);
    const y1 = cy + (r + 10) * Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  // Hub
  ctx.fillStyle = `${MAGENTA} 0.85)`;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = `${MAGENTA} 0.9)`;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("toothed wheel (N = 720)", cx, cy + r + 24);
}
