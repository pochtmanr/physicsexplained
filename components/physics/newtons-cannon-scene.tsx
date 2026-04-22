"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { orbitalVelocity } from "@/lib/physics/circular-motion";

const CANVAS_W = 480;
const CANVAS_H = 360;

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

// Toy units: pick GM and Earth radius so that v_orb ≈ 1.0 in scene units.
// That keeps the slider intuitive and the integration well-conditioned.
const EARTH_R = 1.0;        // scene units
const GM = 1.0;             // scene units (so v_orb = √(GM/R) = 1.0)
const PIXELS_PER_UNIT = 80; // EARTH_R = 80 px on screen
const CANNON_HEIGHT = 0.04; // small ledge above the surface to launch from
const DT = 0.005;           // integration step (scene-time)
const N_STEPS = 4000;       // max integration steps per trajectory
const REAL_V_ORBITAL_KMS = 7.9; // for the displayed real-world readout

// RK4 step for r̈ = -GM r / |r|³
function rk4Step(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
): { x: number; y: number; vx: number; vy: number } {
  const accel = (px: number, py: number) => {
    const r = Math.hypot(px, py);
    const r3 = r * r * r;
    return { ax: (-GM * px) / r3, ay: (-GM * py) / r3 };
  };
  const a1 = accel(x, y);
  const k1x = vx,
    k1y = vy,
    k1vx = a1.ax,
    k1vy = a1.ay;
  const a2 = accel(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
  const k2x = vx + 0.5 * dt * k1vx,
    k2y = vy + 0.5 * dt * k1vy,
    k2vx = a2.ax,
    k2vy = a2.ay;
  const a3 = accel(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
  const k3x = vx + 0.5 * dt * k2vx,
    k3y = vy + 0.5 * dt * k2vy,
    k3vx = a3.ax,
    k3vy = a3.ay;
  const a4 = accel(x + dt * k3x, y + dt * k3y);
  const k4x = vx + dt * k3vx,
    k4y = vy + dt * k3vy,
    k4vx = a4.ax,
    k4vy = a4.ay;

  return {
    x: x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    y: y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y),
    vx: vx + (dt / 6) * (k1vx + 2 * k2vx + 2 * k3vx + k4vx),
    vy: vy + (dt / 6) * (k1vy + 2 * k2vy + 2 * k3vy + k4vy),
  };
}

interface IntegrationResult {
  pts: Array<{ x: number; y: number }>;
  hitGround: boolean;
}

function integrateTrajectory(v0: number): IntegrationResult {
  // Cannon mounted on top of the disk (north pole), launches horizontally to +x
  const x0 = 0;
  const y0 = EARTH_R + CANNON_HEIGHT;
  let x = x0,
    y = y0,
    vx = v0,
    vy = 0;
  const pts: Array<{ x: number; y: number }> = [{ x, y }];
  let hitGround = false;
  for (let i = 0; i < N_STEPS; i++) {
    const next = rk4Step(x, y, vx, vy, DT);
    x = next.x;
    y = next.y;
    vx = next.vx;
    vy = next.vy;
    pts.push({ x, y });
    if (Math.hypot(x, y) <= EARTH_R) {
      hitGround = true;
      break;
    }
    // Stop once we've come back near the launch point — closes the orbit cleanly
    if (i > 200 && Math.hypot(x - x0, y - y0) < 0.03) break;
    // Bail out if it escapes far away
    if (Math.hypot(x, y) > 6 * EARTH_R) break;
  }
  return { pts, hitGround };
}

function regimeLabel(
  v0: number,
  vOrb: number,
): { text: string; color: string } {
  const ratio = v0 / vOrb;
  if (ratio < 0.985) return { text: "sub-orbital — falls to ground", color: MAGENTA };
  if (ratio < 1.015) return { text: "circular orbit", color: CYAN };
  return { text: "elliptical orbit", color: CYAN };
}

export function NewtonsCannonScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const vOrbScene = useMemo(() => orbitalVelocity(EARTH_R, GM), []);
  // Slider in units of v_orb — range [0.6, 1.25] covers all three regimes.
  const [vRatio, setVRatio] = useState(0.85);
  const v0 = vRatio * vOrbScene;

  const trajectory = useMemo(() => integrateTrajectory(v0), [v0]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2 + 20; // shift Earth slightly down so cannon fits

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Earth disk (cyan outline + faint fill)
      ctx.fillStyle = `${CYAN}1A`;
      ctx.beginPath();
      ctx.arc(cx, cy, EARTH_R * PIXELS_PER_UNIT, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Earth label in the centre
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Earth", cx, cy + 4);

      // Cannon at top of Earth — small triangle pointing right
      const cannonX = cx;
      const cannonY = cy - (EARTH_R + CANNON_HEIGHT) * PIXELS_PER_UNIT;
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.moveTo(cannonX - 8, cannonY + 2);
      ctx.lineTo(cannonX + 12, cannonY - 4);
      ctx.lineTo(cannonX + 12, cannonY + 4);
      ctx.lineTo(cannonX - 8, cannonY + 8);
      ctx.closePath();
      ctx.fill();

      // Trajectory polyline (cyan if orbital, magenta if it impacts)
      const traj = trajectory.pts;
      const stroke = trajectory.hitGround ? MAGENTA : CYAN;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < traj.length; i++) {
        const px = cx + traj[i]!.x * PIXELS_PER_UNIT;
        const py = cy - traj[i]!.y * PIXELS_PER_UNIT;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Animated cannonball that walks the polyline once per ~6 seconds
      const cycle = 6;
      const frac = (t % cycle) / cycle;
      const idx = Math.min(traj.length - 1, Math.floor(frac * traj.length));
      const ballPt = traj[idx]!;
      const bx = cx + ballPt.x * PIXELS_PER_UNIT;
      const by = cy - ballPt.y * PIXELS_PER_UNIT;
      ctx.fillStyle = stroke;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  });

  const regime = regimeLabel(v0, vOrbScene);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>v₀ / v_orb = {vRatio.toFixed(3)}</div>
          <div>v_orb = √(GM/R) = {vOrbScene.toFixed(3)}</div>
          <div className="text-[var(--color-fg-3)]">
            real Earth: v_orb ≈ {REAL_V_ORBITAL_KMS} km/s
          </div>
          <div style={{ color: regime.color }}>{regime.text}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="w-28 text-sm text-[var(--color-fg-3)]">
          Muzzle v₀
        </label>
        <input
          type="range"
          min={0.6}
          max={1.25}
          step={0.005}
          value={vRatio}
          onChange={(e) => setVRatio(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {vRatio.toFixed(3)} v_orb
        </span>
      </div>
    </div>
  );
}
