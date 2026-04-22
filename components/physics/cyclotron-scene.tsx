"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  cyclotronFrequency,
  lorentzForce,
  type Vec3,
} from "@/lib/physics/electromagnetism/lorentz";

const RATIO = 0.85;
const MAX_HEIGHT = 480;
const PARTICLE_MASS = 1;
const CHARGE = 1;
const PX_PER_M = 80;
const GAP_HALF_WIDTH = 0.2; // half-width of the dee gap in metres
const KICK_PER_CROSSING = 0.6; // m/s gained per gap crossing

interface CyclotronState {
  pos: Vec3;
  vel: Vec3;
  trail: { x: number; y: number }[];
  lastSign: number; // sign of position.x at the previous frame, for gap-crossing detection
}

/**
 * The classic cyclotron, drawn from above. Two D-shaped electrodes ("dees")
 * sit either side of a thin gap. A uniform B field (out of page) bends the
 * particle's path inside each dee into a half-circle. Each time the
 * particle crosses the gap, the alternating voltage gives it a kick — and
 * because the cyclotron frequency ω = |q|B/m is independent of v, the
 * voltage's flip rate can be set once and stay in tune forever.
 *
 * The reader watches the spiral grow. The HUD reports period (constant!)
 * and current radius (growing).
 */
export function CyclotronScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 600, height: 480 });
  const [bMag, setBMag] = useState(2.0);
  const stateRef = useRef<CyclotronState>(initialState());
  const lastResetRef = useRef(0);

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

  // Reset on B change so the spiral does not fly off in mid-cycle.
  useEffect(() => {
    stateRef.current = initialState();
  }, [bMag, size.width, size.height]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
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

      const cx = width / 2;
      const cy = height / 2;
      const maxRadiusPx = Math.min(width, height) * 0.42;
      const maxRadiusM = maxRadiusPx / PX_PER_M;

      // Reset when the spiral exceeds the dees, or every 12 s.
      const s = stateRef.current;
      const r = Math.hypot(s.pos.x, s.pos.y);
      if (r > maxRadiusM || t - lastResetRef.current > 12) {
        stateRef.current = initialState();
        lastResetRef.current = t;
      }

      // Step physics
      const B: Vec3 = { x: 0, y: 0, z: bMag };
      const subSteps = 6;
      const h = Math.min(dt, 1 / 60) / subSteps;
      for (let i = 0; i < subSteps; i++) {
        const F = lorentzForce(CHARGE, s.vel, { x: 0, y: 0, z: 0 }, B);
        s.vel = {
          x: s.vel.x + (F.x / PARTICLE_MASS) * h,
          y: s.vel.y + (F.y / PARTICLE_MASS) * h,
          z: 0,
        };
        const newPos = {
          x: s.pos.x + s.vel.x * h,
          y: s.pos.y + s.vel.y * h,
          z: 0,
        };
        // Gap-crossing detection (sign change of x while inside the gap band)
        const newSign = newPos.x === 0 ? s.lastSign : Math.sign(newPos.x);
        if (
          s.lastSign !== 0 &&
          newSign !== 0 &&
          newSign !== s.lastSign &&
          Math.abs(newPos.y) < GAP_HALF_WIDTH * 4
        ) {
          // Kick along the current direction of motion (energy gain)
          const speed = Math.hypot(s.vel.x, s.vel.y);
          if (speed > 0) {
            const ux = s.vel.x / speed;
            const uy = s.vel.y / speed;
            s.vel.x += ux * KICK_PER_CROSSING;
            s.vel.y += uy * KICK_PER_CROSSING;
          }
        }
        s.pos = newPos;
        s.lastSign = newSign === 0 ? s.lastSign : newSign;
      }

      // Append trail
      const screen = {
        x: cx + s.pos.x * PX_PER_M,
        y: cy - s.pos.y * PX_PER_M,
      };
      s.trail.push(screen);
      if (s.trail.length > 2400) s.trail.shift();

      // ── Render ──
      ctx.clearRect(0, 0, width, height);

      drawDees(ctx, width, height, cx, cy, maxRadiusPx, t, bMag, colors);

      // Spiral trail
      drawSpiral(ctx, s.trail);

      // Particle
      ctx.fillStyle = "#FFD66B";
      ctx.shadowColor = "rgba(255, 214, 107, 0.85)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // HUD
      const speed = Math.hypot(s.vel.x, s.vel.y);
      const rNow = Math.hypot(s.pos.x, s.pos.y);
      const omega = cyclotronFrequency(CHARGE, bMag, PARTICLE_MASS);
      const period = (2 * Math.PI) / omega;

      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("ω = qB/m   →   period independent of v", 12, 18);
      ctx.fillText(`r = mv/(qB)  →  spiral grows as v grows`, 12, 36);

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`|v| = ${speed.toFixed(2)} m/s`, width - 12, 18);
      ctx.fillText(`r   = ${rNow.toFixed(2)} m`, width - 12, 36);
      ctx.fillStyle = "#78DCFF";
      ctx.fillText(`T   = ${period.toFixed(2)} s   (constant!)`, width - 12, 54);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 px-2">
        <Slider
          label="|B|"
          value={bMag}
          min={0.5}
          max={4}
          step={0.05}
          onChange={setBMag}
          unit="T"
          accent="#78DCFF"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        each gap crossing adds energy; B sets the period; the spiral grows but stays in step
      </p>
    </div>
  );
}

function initialState(): CyclotronState {
  return {
    pos: { x: 0, y: 0, z: 0 },
    vel: { x: 0.6, y: 0, z: 0 },
    trail: [],
    lastSign: 0,
  };
}

function drawDees(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  maxRadiusPx: number,
  t: number,
  bMag: number,
  colors: { fg2: string; fg3: string; bg1: string },
) {
  // Two D-shaped electrodes either side of a vertical gap.
  const gapHalfPx = GAP_HALF_WIDTH * PX_PER_M;
  const dEdge = maxRadiusPx + 18;

  // Subtle dee fills
  ctx.fillStyle = "rgba(255, 255, 255, 0.018)";
  // Right dee
  ctx.beginPath();
  ctx.moveTo(cx + gapHalfPx, cy - dEdge);
  ctx.lineTo(cx + gapHalfPx, cy + dEdge);
  ctx.arc(cx + gapHalfPx, cy, dEdge, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
  ctx.fill();
  // Left dee
  ctx.beginPath();
  ctx.moveTo(cx - gapHalfPx, cy - dEdge);
  ctx.lineTo(cx - gapHalfPx, cy + dEdge);
  ctx.arc(cx - gapHalfPx, cy, dEdge, Math.PI / 2, -Math.PI / 2, false);
  ctx.closePath();
  ctx.fill();

  // Dee outlines
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx + gapHalfPx, cy, dEdge, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - gapHalfPx, cy, dEdge, Math.PI / 2, -Math.PI / 2);
  ctx.stroke();

  // Top and bottom flat sides
  ctx.beginPath();
  ctx.moveTo(cx + gapHalfPx, cy - dEdge);
  ctx.lineTo(cx + gapHalfPx, cy + dEdge);
  ctx.moveTo(cx - gapHalfPx, cy - dEdge);
  ctx.lineTo(cx - gapHalfPx, cy + dEdge);
  ctx.stroke();

  // Background "B out of page" markers inside both dees (subtle)
  const bIntensity = Math.min(1, bMag / 3);
  ctx.strokeStyle = `rgba(120, 220, 255, ${0.15 + 0.18 * bIntensity})`;
  ctx.fillStyle = `rgba(120, 220, 255, ${0.4 + 0.3 * bIntensity})`;
  for (let theta = 0; theta < Math.PI * 2; theta += Math.PI / 6) {
    for (let rad = dEdge * 0.3; rad < dEdge * 0.95; rad += dEdge * 0.22) {
      const x = cx + rad * Math.cos(theta);
      const y = cy + rad * Math.sin(theta);
      // Skip the gap region
      if (Math.abs(x - cx) < gapHalfPx + 4) continue;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Alternating-voltage indicator: gap colour pulses with the cyclotron frequency.
  const omega = cyclotronFrequency(CHARGE, bMag, PARTICLE_MASS);
  const phase = Math.sin(omega * t);
  const polarityRight = phase > 0; // true → right dee at +V, gap E points left
  const arrowAlpha = 0.45 + 0.45 * Math.abs(phase);

  ctx.fillStyle = `rgba(255, 106, 222, ${arrowAlpha})`;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(polarityRight ? "+V" : "−V", cx + gapHalfPx + 18, cy - dEdge - 6);
  ctx.fillText(polarityRight ? "−V" : "+V", cx - gapHalfPx - 18, cy - dEdge - 6);

  // Gap E-field arrows
  ctx.strokeStyle = `rgba(255, 106, 222, ${arrowAlpha})`;
  ctx.lineWidth = 1.5;
  for (let yy = cy - dEdge + 30; yy < cy + dEdge - 30; yy += 30) {
    const dir = polarityRight ? -1 : 1; // E from + to −
    const x0 = cx - dir * 8;
    const x1 = cx + dir * 8;
    ctx.beginPath();
    ctx.moveTo(x0, yy);
    ctx.lineTo(x1, yy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, yy);
    ctx.lineTo(x1 - dir * 4, yy - 3);
    ctx.lineTo(x1 - dir * 4, yy + 3);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 106, 222, ${arrowAlpha})`;
    ctx.fill();
  }

  ctx.textAlign = "left";

  // Outer rim label
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.fillText("dees", 12, height - 8);
  ctx.textAlign = "right";
  ctx.fillText("B ⊙ uniform, out of page", width - 12, height - 8);
}

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
) {
  if (pts.length < 2) return;
  const N = pts.length;
  const chunk = 24;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = "rgba(255, 214, 107, 0.45)";
  ctx.shadowBlur = 5;
  for (let i = 0; i < N - 1; i += chunk) {
    const end = Math.min(i + chunk + 1, N);
    const age = i / N;
    ctx.strokeStyle = `rgba(255, 214, 107, ${0.15 + 0.7 * age})`;
    ctx.beginPath();
    ctx.moveTo(pts[i]!.x, pts[i]!.y);
    for (let j = i + 1; j < end; j++) {
      ctx.lineTo(pts[j]!.x, pts[j]!.y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
  accent: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
      <span className="w-6 text-[var(--color-fg-1)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: accent }}
      />
      <span className="w-20 text-right text-[var(--color-fg-1)]">
        {value.toFixed(2)} {unit}
      </span>
    </label>
  );
}
