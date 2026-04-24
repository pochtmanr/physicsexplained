"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { relativisticDopplerBoost } from "@/lib/physics/electromagnetism/synchrotron";

const AMBER = "rgba(255, 180, 80,";
const ORANGE = "rgba(255, 140, 80,";
const CYAN = "rgba(120, 220, 255,";
const MAGENTA = "rgba(255, 106, 222,";
const LILAC = "rgba(200, 160, 255,";

const WIDTH = 720;
const HEIGHT = 430;
const RATIO = HEIGHT / WIDTH;
const MAX_HEIGHT = 510;

const GAMMA = 5;
const N_LOBE_SAMPLES = 360;

/**
 * FIG.55c — Relativistic beaming.
 *
 * Side-by-side polar patterns.
 *
 * LEFT  — non-relativistic dipole: I(θ) ∝ sin²θ. The classic doughnut,
 * perpendicular to the acceleration, symmetric fore-aft.
 *
 * RIGHT — γ = 5 forward-boosted lobe: the radiation is compressed into a
 * sharp cone of half-width ≈ 1/γ along the velocity direction. We use the
 * beaming-kernel approximation D(γ, θ) = γ² / (1 + (γθ)²)² as a stand-in for
 * the full Lorentz-transformed pattern (§11 does the boost properly).
 *
 * Both patterns rotate with the orbiting electron so the reader sees the
 * doughnut stay symmetric while the γ = 5 lobe sweeps past the viewer like a
 * pulsar lighthouse beam — a short flash each time the cone aligns with the
 * line of sight.
 */
export function RelativisticBeamingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: WIDTH, height: HEIGHT });

  const thetaRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      // One orbit every ~3.5 s — slow enough that the lighthouse flash is
      // deliberate, fast enough that two flashes fit in a scroll-view.
      thetaRef.current = (thetaRef.current + (2 * Math.PI * dt) / 3.5) % (Math.PI * 2);
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const render = () => {
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const stacked = width < 560;
      const leftW = stacked ? width : width * 0.5;
      const leftX = 0;
      const leftY = 0;
      const leftH = stacked ? height * 0.5 : height;
      const rightX = stacked ? 0 : leftW;
      const rightY = stacked ? leftH : 0;
      const rightW = stacked ? width : width - leftW;
      const rightH = stacked ? height * 0.5 : height;

      drawNonRelPanel(ctx, colors, leftX, leftY, leftW, leftH, thetaRef.current);
      drawRelPanel(ctx, colors, rightX, rightY, rightW, rightH, thetaRef.current);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Same electron, two regimes. Left: v ≪ c, the dipole doughnut is
        symmetric and the observer sees a steady glow all the way round.
        Right: γ = 5, the lobe has collapsed forward; each time the cone
        aligns with your line of sight you get a pulse. A pulsar is this scene
        at γ ~ 10⁶.
      </p>
    </div>
  );
}

function drawNonRelPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  orbitTheta: number,
) {
  // Background card
  ctx.fillStyle = `${CYAN} 0.03)`;
  ctx.fillRect(x, y, w, h);

  const cx = x + w * 0.5;
  const cy = y + h * 0.55;
  const scale = Math.min(w, h) * 0.28;

  // Orbit
  const orbitR = Math.min(w, h) * 0.35;
  ctx.strokeStyle = `${CYAN} 0.2)`;
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Electron position
  const ex = cx + orbitR * Math.cos(orbitTheta);
  const ey = cy + orbitR * Math.sin(orbitTheta);
  // Velocity direction (tangent)
  const vx = -Math.sin(orbitTheta);
  const vy = Math.cos(orbitTheta);
  // Acceleration points toward centre (centripetal) — perpendicular to v
  const accelAng = Math.atan2(cy - ey, cx - ex);

  // Doughnut pattern I(θ) ∝ sin²θ about the acceleration axis.
  // θ measured from acceleration vector; perpendicular axis carries v.
  ctx.strokeStyle = `${AMBER} 0.9)`;
  ctx.lineWidth = 1.6;
  ctx.fillStyle = `${AMBER} 0.18)`;
  ctx.beginPath();
  for (let i = 0; i <= N_LOBE_SAMPLES; i += 1) {
    const th = (i / N_LOBE_SAMPLES) * Math.PI * 2;
    const I = Math.sin(th) * Math.sin(th);
    const r = I * scale;
    // Rotate so θ = 0 aligns with acceleration axis
    const worldAng = accelAng + th;
    const px = ex + r * Math.cos(worldAng);
    const py = ey + r * Math.sin(worldAng);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Electron dot
  ctx.fillStyle = `${MAGENTA} 0.95)`;
  ctx.beginPath();
  ctx.arc(ex, ey, 4, 0, Math.PI * 2);
  ctx.fill();

  // Velocity tick
  ctx.strokeStyle = `${CYAN} 0.85)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex + vx * 20, ey + vy * 20);
  ctx.stroke();

  // Captions
  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText("NON-RELATIVISTIC  (v ≪ c)", x + 12, y + 20);
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText("I(θ) ∝ sin²θ — the dipole doughnut", x + 12, y + 36);

  ctx.textAlign = "right";
  ctx.fillStyle = `${AMBER} 0.9)`;
  ctx.fillText("symmetric fore-aft", x + w - 12, y + 20);
}

function drawRelPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  orbitTheta: number,
) {
  // Background card
  ctx.fillStyle = `${ORANGE} 0.035)`;
  ctx.fillRect(x, y, w, h);

  const cx = x + w * 0.5;
  const cy = y + h * 0.55;

  // Orbit
  const orbitR = Math.min(w, h) * 0.35;
  ctx.strokeStyle = `${CYAN} 0.2)`;
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Electron + velocity
  const ex = cx + orbitR * Math.cos(orbitTheta);
  const ey = cy + orbitR * Math.sin(orbitTheta);
  const vx = -Math.sin(orbitTheta);
  const vy = Math.cos(orbitTheta);
  const vAng = Math.atan2(vy, vx);

  // Normalise so the on-axis peak always draws at `scale` pixels; D(0) = γ².
  const scale = Math.min(w, h) * 0.42;
  const peak = GAMMA * GAMMA;

  // Forward-boosted lobe — draw as a filled wedge swept through θ ∈ [−θmax, θmax]
  const thetaMax = 0.9; // rad — wider than the cone, so the tail is visible
  ctx.strokeStyle = `${ORANGE} 0.95)`;
  ctx.fillStyle = `${ORANGE} 0.25)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  for (let i = 0; i <= N_LOBE_SAMPLES; i += 1) {
    const th = -thetaMax + (2 * thetaMax * i) / N_LOBE_SAMPLES;
    const D = relativisticDopplerBoost(GAMMA, th);
    const r = (D / peak) * scale;
    const worldAng = vAng + th;
    const px = ex + r * Math.cos(worldAng);
    const py = ey + r * Math.sin(worldAng);
    if (i === 0) ctx.lineTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Electron dot
  ctx.fillStyle = `${MAGENTA} 0.95)`;
  ctx.beginPath();
  ctx.arc(ex, ey, 4, 0, Math.PI * 2);
  ctx.fill();

  // Observer sits on the right, at screen mid-height outside the orbit.
  // A "flash" is rendered when the forward lobe points toward the observer.
  const obsX = x + w - 18;
  const obsY = cy;
  const toObsAng = Math.atan2(obsY - ey, obsX - ex);
  let dth = toObsAng - vAng;
  // Wrap to [-π, π]
  dth = ((dth + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  const onAxis = Math.abs(dth) < 0.2;
  const flashStrength =
    relativisticDopplerBoost(GAMMA, dth) / peak; // 0…1

  // Observer icon
  ctx.fillStyle = `${LILAC} 0.9)`;
  ctx.beginPath();
  ctx.arc(obsX, obsY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.fg2;
  ctx.font = "9.5px monospace";
  ctx.textAlign = "right";
  ctx.fillText("observer", obsX - 6, obsY - 6);

  // Flash halo around the observer whenever flashStrength is significant
  if (flashStrength > 0.05) {
    const rad = 6 + 22 * flashStrength;
    const grad = ctx.createRadialGradient(obsX, obsY, 0, obsX, obsY, rad);
    grad.addColorStop(0, `${ORANGE} ${(0.6 * flashStrength).toFixed(2)})`);
    grad.addColorStop(1, `${ORANGE} 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(obsX, obsY, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Captions
  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`RELATIVISTIC  (γ = ${GAMMA})`, x + 12, y + 20);
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText("lobe collapses forward, Δθ ≈ 1/γ", x + 12, y + 36);

  ctx.textAlign = "right";
  ctx.fillStyle = onAxis ? `${ORANGE} 0.95)` : `${LILAC} 0.8)`;
  ctx.fillText(
    onAxis ? "FLASH — cone on viewer" : "quiet — cone pointed away",
    x + w - 12,
    y + 36,
  );
  ctx.fillStyle = colors.fg2;
  ctx.fillText("forward boost ≈ γ²", x + w - 12, y + 20);
}
