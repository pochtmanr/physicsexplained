"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  lorentzForce,
  type Vec3,
} from "@/lib/physics/electromagnetism/lorentz";

const RATIO = 0.65;
const MAX_HEIGHT = 460;
const PX_PER_M = 60; // 60 px per metre of "particle space"
const MAX_TRAIL = 800; // points held per trail before recycling
const PARTICLE_MASS = 1; // arbitrary "unit" mass — sliders are tuned to this
const PARTICLE_CHARGE = 1; // positive unit charge
const RESET_PERIOD = 6.5; // seconds between auto-resets

type TraceColor = "cyan" | "magenta" | "amber";
const TRACE_RGB: Record<TraceColor, string> = {
  cyan: "120, 220, 255",
  magenta: "255, 106, 222",
  amber: "255, 214, 107",
};

interface ParticleState {
  pos: Vec3;
  vel: Vec3;
  trail: { x: number; y: number }[];
  color: TraceColor;
  label: string;
  E: Vec3;
  /** B is shared across all three (uniform field in this scene). */
}

/**
 * The §03 money-shot. Three particles released at the same instant, in the
 * same uniform B field, with three different (v, E) configurations. Their
 * trails sweep out three signature curves of the Lorentz force:
 *
 *   cyan    — pure circle   : v ⊥ B, no E
 *   magenta — helix         : v has a component along B, no E
 *   amber   — cycloid       : v ⊥ B, perpendicular E
 *
 * One equation, three behaviours. Sliders for v, B, E magnitudes; the scene
 * reseeds whenever a slider moves. The 3D motion is projected by drawing
 * x as horizontal, y as vertical, and adding a small z-as-vertical offset
 * so the helix and circle don't overlap.
 */
export function LorentzTrajectoryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 460 });
  const [vMag, setVMag] = useState(2.0); // m/s in scene units
  const [bMag, setBMag] = useState(1.5); // T in scene units
  const [eMag, setEMag] = useState(1.4); // V/m in scene units
  const particlesRef = useRef<ParticleState[]>([]);
  const lastResetRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Container resize observer
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

  // Reseed whenever sliders or canvas size change.
  useEffect(() => {
    particlesRef.current = seedParticles(vMag, eMag, size.width, size.height);
    lastResetRef.current = lastTimeRef.current;
  }, [vMag, eMag, size.width, size.height]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
      lastTimeRef.current = t;
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

      // Auto-reset so the trails don't fill the canvas indefinitely.
      if (t - lastResetRef.current > RESET_PERIOD) {
        particlesRef.current = seedParticles(vMag, eMag, width, height);
        lastResetRef.current = t;
      }

      // Step physics for each particle.
      const B: Vec3 = { x: 0, y: 0, z: bMag };
      const subSteps = 4;
      const h = Math.min(dt, 1 / 60) / subSteps;
      for (const p of particlesRef.current) {
        for (let i = 0; i < subSteps; i++) {
          const F = lorentzForce(PARTICLE_CHARGE, p.vel, p.E, B);
          // Semi-implicit Euler (symplectic-ish for circular orbits).
          p.vel = {
            x: p.vel.x + (F.x / PARTICLE_MASS) * h,
            y: p.vel.y + (F.y / PARTICLE_MASS) * h,
            z: p.vel.z + (F.z / PARTICLE_MASS) * h,
          };
          p.pos = {
            x: p.pos.x + p.vel.x * h,
            y: p.pos.y + p.vel.y * h,
            z: p.pos.z + p.vel.z * h,
          };
        }
        // Project to canvas pixels and append to trail.
        const screen = projectToScreen(p.pos, width, height);
        p.trail.push(screen);
        if (p.trail.length > MAX_TRAIL) p.trail.shift();
      }

      // ── Render ──
      ctx.clearRect(0, 0, width, height);

      // Background B-field arrows (out-of-page dots, since B = +ẑ).
      drawBFieldGrid(ctx, width, height, bMag);

      // Three "panels" overlay on the same canvas — the trails are color-keyed.
      for (const p of particlesRef.current) {
        drawTrail(ctx, p.trail, p.color);
      }
      for (const p of particlesRef.current) {
        drawParticle(ctx, p);
      }

      // Right-hand-rule hint cue.
      drawRHRBadge(ctx, width, height, colors);

      // HUD
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("F = q (E + v × B)", 12, 18);
      ctx.fillStyle = `rgb(${TRACE_RGB.cyan})`;
      ctx.fillText("● circle   v⊥B, E=0", 12, 36);
      ctx.fillStyle = `rgb(${TRACE_RGB.magenta})`;
      ctx.fillText("● helix    v has B-parallel component", 12, 54);
      ctx.fillStyle = `rgb(${TRACE_RGB.amber})`;
      ctx.fillText("● cycloid  E ⊥ B", 12, 72);

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`|v| = ${vMag.toFixed(2)} m/s`, width - 12, 18);
      ctx.fillText(`|B| = ${bMag.toFixed(2)} T  (out of page)`, width - 12, 36);
      ctx.fillText(`|E| = ${eMag.toFixed(2)} V/m  (cycloid only)`, width - 12, 54);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-3">
        <Slider
          label="|v|"
          value={vMag}
          min={0.4}
          max={3.5}
          step={0.05}
          onChange={setVMag}
          unit="m/s"
          accent="#FFD66B"
        />
        <Slider
          label="|B|"
          value={bMag}
          min={0.3}
          max={3.0}
          step={0.05}
          onChange={(v) => {
            setBMag(v);
            // Changing B alone does not require a reseed — orbits adapt live.
          }}
          unit="T"
          accent="#78DCFF"
        />
        <Slider
          label="|E|"
          value={eMag}
          min={0}
          max={3.0}
          step={0.05}
          onChange={setEMag}
          unit="V/m"
          accent="#FF6ADE"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        right-hand rule: point fingers along v, curl toward B; thumb points along v×B (the magnetic force on a +q)
      </p>
    </div>
  );
}

function seedParticles(
  vMag: number,
  eMag: number,
  _width: number,
  _height: number,
): ParticleState[] {
  // All three start near the centre and head right. The spatial offsets are
  // applied at projection time so the three orbits don't overlap visually.
  const v0 = vMag;
  return [
    {
      pos: { x: 0, y: 0.7, z: 0 },
      vel: { x: v0, y: 0, z: 0 },
      trail: [],
      color: "cyan",
      label: "circle",
      E: { x: 0, y: 0, z: 0 },
    },
    {
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: v0 * 0.85, y: 0, z: v0 * 0.5 }, // has B-parallel z component
      trail: [],
      color: "magenta",
      label: "helix",
      E: { x: 0, y: 0, z: 0 },
    },
    {
      pos: { x: 0, y: -0.7, z: 0 },
      vel: { x: v0, y: 0, z: 0 },
      trail: [],
      color: "amber",
      label: "cycloid",
      // E along +y, B along +z → drift along (E×B)/B² = +x̂ (E_y B_z / B²)
      E: { x: 0, y: -eMag, z: 0 },
    },
  ];
}

function projectToScreen(
  p: Vec3,
  width: number,
  height: number,
): { x: number; y: number } {
  // x → screen x (right positive)
  // y → screen y (down positive)
  // z → small visible offset (helix unwinds horizontally)
  const cx = width / 2;
  const cy = height / 2;
  const x = cx + p.x * PX_PER_M + p.z * PX_PER_M * 0.55;
  const y = cy - p.y * PX_PER_M;
  return { x, y };
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  color: TraceColor,
) {
  if (pts.length < 2) return;
  const rgb = TRACE_RGB[color];
  ctx.lineWidth = 1.6;
  ctx.shadowColor = `rgba(${rgb}, 0.5)`;
  ctx.shadowBlur = 6;
  // Fade older points by drawing in segments with decreasing alpha.
  const N = pts.length;
  const chunkSize = 32;
  for (let i = 0; i < N - 1; i += chunkSize) {
    const end = Math.min(i + chunkSize + 1, N);
    const age = i / N; // 0 = oldest, 1 = newest
    const alpha = 0.12 + 0.78 * age;
    ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(pts[i]!.x, pts[i]!.y);
    for (let j = i + 1; j < end; j++) {
      ctx.lineTo(pts[j]!.x, pts[j]!.y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: ParticleState) {
  const last = p.trail[p.trail.length - 1];
  if (!last) return;
  const rgb = TRACE_RGB[p.color];
  ctx.fillStyle = `rgb(${rgb})`;
  ctx.shadowColor = `rgba(${rgb}, 0.9)`;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Label
  ctx.fillStyle = `rgba(${rgb}, 0.9)`;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(p.label, last.x + 8, last.y - 8);
}

function drawBFieldGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bMag: number,
) {
  // B = +ẑ → out of the page → render as small ring-with-dot symbols.
  const stepX = 60;
  const stepY = 56;
  const intensity = Math.min(1, bMag / 2);
  ctx.strokeStyle = `rgba(120, 220, 255, ${0.15 + 0.18 * intensity})`;
  ctx.fillStyle = `rgba(120, 220, 255, ${0.35 + 0.4 * intensity})`;
  ctx.lineWidth = 1;
  for (let x = stepX / 2; x < width; x += stepX) {
    for (let y = stepY / 2; y < height; y += stepY) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRHRBadge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: { fg2: string; fg3: string },
) {
  // Tiny axes diagram bottom-left: x̂ right, ŷ up, ẑ out (dot in circle).
  const ox = 28;
  const oy = height - 28;
  const len = 18;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1.2;
  // x̂ right
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + len, oy);
  ctx.lineTo(ox + len - 4, oy - 3);
  ctx.lineTo(ox + len - 4, oy + 3);
  ctx.closePath();
  ctx.fill();
  // ŷ up
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy - len);
  ctx.lineTo(ox - 3, oy - len + 4);
  ctx.lineTo(ox + 3, oy - len + 4);
  ctx.closePath();
  ctx.fill();
  // ẑ out (circle + dot)
  ctx.strokeStyle = "rgba(120, 220, 255, 0.8)";
  ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
  ctx.beginPath();
  ctx.arc(ox + 10, oy - 12, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ox + 10, oy - 12, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("x̂", ox + len + 3, oy + 4);
  ctx.fillText("ŷ", ox - 3, oy - len - 3);
  ctx.fillText("B", ox + 17, oy - 9);
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
