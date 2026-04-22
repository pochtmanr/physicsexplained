"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  lorentzForce,
  type Vec3,
} from "@/lib/physics/electromagnetism/lorentz";

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const PX_PER_M = 50;
const SLOT_HALF_HEIGHT = 0.6; // particles outside this band hit the wall
const PARTICLE_MASS = 1;
const CHARGE = 1;
const SPAWN_PERIOD = 0.18; // seconds between particles

interface Particle {
  pos: Vec3;
  vel: Vec3;
  speed: number; // initial |v|
  trail: { x: number; y: number }[];
  alive: boolean;
}

/**
 * Crossed E and B: a velocity selector. E points down (−ŷ), B points out
 * of the page (+ẑ). Only particles entering with horizontal speed v = E/B
 * sail straight through (qE down balances qv×B up). Slower or faster
 * particles curve and slam into the channel walls.
 *
 * The reader sees a stream of particles with random speeds in a band,
 * coloured by whether their initial speed is below, at, or above E/B.
 * The amber resonance band marks the "selected" velocity.
 */
export function VelocitySelectorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 380 });
  const [eMag, setEMag] = useState(2.0);
  const [bMag, setBMag] = useState(1.0);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnRef = useRef(0);

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

  const targetSpeed = eMag / bMag; // v = E/B

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

      // Spawn new particles periodically with random speeds in [0.4·v, 1.6·v]
      if (t - lastSpawnRef.current > SPAWN_PERIOD) {
        lastSpawnRef.current = t;
        const speed = targetSpeed * (0.4 + Math.random() * 1.2);
        particlesRef.current.push({
          pos: { x: -((width / 2) / PX_PER_M), y: 0, z: 0 },
          vel: { x: speed, y: 0, z: 0 },
          speed,
          trail: [],
          alive: true,
        });
      }

      // Step physics. E points down (−ŷ), B points into the page (−ẑ).
      // For +q moving right (+x̂): qE = down, q(v×B) = q v_x x̂ × (−ẑ) = up.
      // They cancel exactly when v = E/B → only that speed sails straight.
      const E: Vec3 = { x: 0, y: -eMag, z: 0 };
      const B: Vec3 = { x: 0, y: 0, z: -bMag };
      const subSteps = 3;
      const h = Math.min(dt, 1 / 60) / subSteps;
      for (const p of particlesRef.current) {
        if (!p.alive) continue;
        for (let i = 0; i < subSteps; i++) {
          const F = lorentzForce(CHARGE, p.vel, E, B);
          p.vel = {
            x: p.vel.x + (F.x / PARTICLE_MASS) * h,
            y: p.vel.y + (F.y / PARTICLE_MASS) * h,
            z: 0,
          };
          p.pos = {
            x: p.pos.x + p.vel.x * h,
            y: p.pos.y + p.vel.y * h,
            z: 0,
          };
        }
        // Wall collision: top/bottom of the channel
        if (Math.abs(p.pos.y) > SLOT_HALF_HEIGHT) {
          p.alive = false;
        }
        // Exited right side → still alive but stop tracking
        if (p.pos.x * PX_PER_M > width / 2) {
          p.alive = false;
        }
        const screen = projectToScreen(p.pos, width, height);
        p.trail.push(screen);
        if (p.trail.length > 80) p.trail.shift();
      }
      // Cull dead particles whose trails have left the canvas
      particlesRef.current = particlesRef.current.filter((p) => {
        if (p.alive) return true;
        const last = p.trail[p.trail.length - 1];
        return !!last && last.x < width + 30 && last.y > -30 && last.y < height + 30;
      });

      // ── Render ──
      ctx.clearRect(0, 0, width, height);
      drawChannelBackground(ctx, width, height, colors, eMag, bMag);

      // Draw particles
      for (const p of particlesRef.current) {
        const dev = (p.speed - targetSpeed) / targetSpeed; // -1..+1ish
        drawParticle(ctx, p, dev);
      }

      // HUD
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("crossed E + B → velocity selector", 12, 18);
      ctx.fillText("balance: qE = qvB  ⇒  v = E/B", 12, 36);
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFD66B";
      ctx.fillText(`v* = E/B = ${targetSpeed.toFixed(2)} m/s`, width - 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `E = ${eMag.toFixed(2)} V/m  ↓     B = ${bMag.toFixed(2)} T  ⊗`,
        width - 12,
        36,
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
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <Slider
          label="|E|"
          value={eMag}
          min={0.4}
          max={4}
          step={0.05}
          onChange={setEMag}
          unit="V/m"
          accent="#FF6ADE"
        />
        <Slider
          label="|B|"
          value={bMag}
          min={0.4}
          max={3}
          step={0.05}
          onChange={setBMag}
          unit="T"
          accent="#78DCFF"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        amber band marks the selected speed v = E/B; faster particles bend up, slower ones bend down
      </p>
    </div>
  );
}

function projectToScreen(
  p: Vec3,
  width: number,
  height: number,
): { x: number; y: number } {
  const cx = width / 2;
  const cy = height / 2;
  return { x: cx + p.x * PX_PER_M, y: cy - p.y * PX_PER_M };
}

function drawChannelBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: { fg2: string; fg3: string },
  eMag: number,
  bMag: number,
) {
  // Channel walls (top and bottom of the slot)
  const cy = height / 2;
  const slotPx = SLOT_HALF_HEIGHT * PX_PER_M;
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, cy - slotPx);
  ctx.lineTo(width, cy - slotPx);
  ctx.moveTo(0, cy + slotPx);
  ctx.lineTo(width, cy + slotPx);
  ctx.stroke();

  // Selected-velocity reference band (very narrow strip along the centreline)
  ctx.fillStyle = "rgba(255, 214, 107, 0.08)";
  ctx.fillRect(0, cy - 6, width, 12);
  ctx.strokeStyle = "rgba(255, 214, 107, 0.45)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // E-field arrows (down)
  const intensity = Math.min(1, eMag / 3);
  ctx.strokeStyle = `rgba(255, 106, 222, ${0.3 + 0.4 * intensity})`;
  ctx.fillStyle = `rgba(255, 106, 222, ${0.5 + 0.4 * intensity})`;
  ctx.lineWidth = 1;
  for (let x = 40; x < width; x += 70) {
    // upper arrow
    ctx.beginPath();
    ctx.moveTo(x, cy - slotPx - 24);
    ctx.lineTo(x, cy - slotPx - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, cy - slotPx - 6);
    ctx.lineTo(x - 3, cy - slotPx - 11);
    ctx.lineTo(x + 3, cy - slotPx - 11);
    ctx.closePath();
    ctx.fill();
    // lower mirror arrow (continuation, indicates uniform field)
    ctx.beginPath();
    ctx.moveTo(x, cy + slotPx + 6);
    ctx.lineTo(x, cy + slotPx + 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, cy + slotPx + 24);
    ctx.lineTo(x - 3, cy + slotPx + 19);
    ctx.lineTo(x + 3, cy + slotPx + 19);
    ctx.closePath();
    ctx.fill();
  }

  // B-field "into the page" symbols (× in circle) sprinkled across the channel
  const bIntensity = Math.min(1, bMag / 2);
  ctx.strokeStyle = `rgba(120, 220, 255, ${0.35 + 0.3 * bIntensity})`;
  ctx.lineWidth = 1;
  for (let x = 25; x < width; x += 65) {
    for (let y = cy - slotPx + 14; y < cy + slotPx; y += 22) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
      // × inside the circle
      ctx.beginPath();
      ctx.moveTo(x - 2.4, y - 2.4);
      ctx.lineTo(x + 2.4, y + 2.4);
      ctx.moveTo(x + 2.4, y - 2.4);
      ctx.lineTo(x - 2.4, y + 2.4);
      ctx.stroke();
    }
  }

  // Labels
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("E ↓", 6, 18);
  ctx.fillText("B ⊗ (into page)", 6, height - 8);
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  dev: number,
) {
  // dev: -1 (very slow) → 0 (matched) → +1 (very fast)
  // Map to color: slow = magenta (curves down via E), matched = amber, fast = cyan (curves up via B)
  let color = "rgb(255,214,107)"; // amber
  if (dev > 0.08) color = "rgb(120,220,255)";
  else if (dev < -0.08) color = "rgb(255,106,222)";

  if (p.trail.length >= 2) {
    ctx.strokeStyle = color.replace(")", ",0.55)").replace("rgb", "rgba");
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(p.trail[0]!.x, p.trail[0]!.y);
    for (let i = 1; i < p.trail.length; i++) {
      ctx.lineTo(p.trail[i]!.x, p.trail[i]!.y);
    }
    ctx.stroke();
  }
  const last = p.trail[p.trail.length - 1];
  if (!last) return;
  ctx.fillStyle = color;
  ctx.shadowColor = color.replace(")", ",0.7)").replace("rgb", "rgba");
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
  ctx.fill();
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
