"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.58;
const MAX_HEIGHT = 440;

const MAGENTA = "rgba(255, 106, 222,";
const CYAN = "rgba(120, 220, 255,";
const AMBER = "rgba(255, 180, 80,";
const XRAY = "rgba(255, 140, 80,";

/**
 * FIG.56a — Coulomb deflection and the braking event.
 *
 * An electron (cyan) comes in from the left with velocity v₀. It hits
 * the nuclear Coulomb potential of a heavy-metal nucleus (magenta) at
 * the origin and deflects through an angle that depends on its impact
 * parameter b. At the point of closest approach — where the transverse
 * acceleration is maximal — the electron emits an X-ray photon (orange-
 * red arrow tangent to the trajectory). That is bremsstrahlung in a
 * single event: non-line-structure radiation continuously produced by
 * acceleration in the nuclear field.
 *
 * The trajectory is a hyperbolic Rutherford scattering curve — the same
 * orbit Rutherford fitted to gold-foil α particles in 1911 — here used
 * for electrons on tungsten as in every X-ray tube. The slider adjusts
 * b from a head-on small value (hard brake, high-energy photon) to a
 * wide-pass large value (gentle deflection, soft photon).
 */
export function CoulombDeflectionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  /** impact parameter, arbitrary units (pixels, scaled at draw-time) */
  const [impactB, setImpactB] = useState(35);

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

  /**
   * Precompute the hyperbolic trajectory. In 2D Rutherford scattering,
   * the closed-form orbit is
   *     r(φ) = p / (e cos(φ − φ₀) − 1)   for a repulsive Coulomb.
   * For our purposes a hyperbolic arc parameterised numerically is
   * easier to plot smoothly; we simulate by direct integration of
   *     d²x/dt² = k x / r³,   d²y/dt² = k y / r³
   * with a small time step. Repulsive between like-sign (both "−" in
   * our cartoon would give attraction; to mimic an electron deflecting
   * off a *nuclear* +Ze we use an attractive interaction and watch the
   * trajectory bend inward). The qualitative picture — incoming line,
   * bend through the potential, outgoing line — is the same either way.
   */
  const trajectory = useMemo(() => {
    const pts: { x: number; y: number; vx: number; vy: number; a: number }[] =
      [];
    // Simulation units: start far to the left at (-200, b), velocity
    // (vx, 0). Nucleus at origin. k sets the interaction strength.
    const k = 900; // positive → attractive
    const dt = 0.05;
    const steps = 1200;
    const b = impactB;
    let x = -220;
    let y = b;
    let vx = 6.0;
    let vy = 0.0;
    for (let i = 0; i < steps; i++) {
      const r2 = x * x + y * y + 0.5; // small softening to avoid blow-up
      const r = Math.sqrt(r2);
      const ax = (-k * x) / (r2 * r);
      const ay = (-k * y) / (r2 * r);
      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;
      const amag = Math.sqrt(ax * ax + ay * ay);
      pts.push({ x, y, vx, vy, a: amag });
    }
    return pts;
  }, [impactB]);

  // Find the deflection point — where |a| is maximal — for the photon arrow.
  const deflectionIdx = useMemo(() => {
    let best = 0;
    let bestA = -Infinity;
    for (let i = 0; i < trajectory.length; i++) {
      if (trajectory[i].a > bestA) {
        bestA = trajectory[i].a;
        best = i;
      }
    }
    return best;
  }, [trajectory]);

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
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.55;
      const scale = Math.min(width, height) / 420;

      // Coordinate transform: simulation (x, y) → screen (cx + x*scale, cy - y*scale)
      const sx = (x: number) => cx + x * scale;
      const sy = (y: number) => cy - y * scale;

      // ── Background grid ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      for (let r = 40; r <= 200; r += 40) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── Nucleus (heavy positive charge) with faint Coulomb field glow ──
      const nucleusR = 10;
      const glow = ctx.createRadialGradient(
        cx,
        cy,
        nucleusR * 0.4,
        cx,
        cy,
        nucleusR * 8,
      );
      glow.addColorStop(0, `${MAGENTA} 0.45)`);
      glow.addColorStop(1, `${MAGENTA} 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, nucleusR * 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("+Ze", cx, cy + 25);

      // ── Impact parameter b reference line ──
      ctx.strokeStyle = `${CYAN} 0.35)`;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx(-220), sy(impactB));
      ctx.lineTo(sx(-40), sy(impactB));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `${CYAN} 0.9)`;
      ctx.textAlign = "left";
      ctx.fillText(
        `b = ${(impactB).toFixed(0)}`,
        sx(-220) + 6,
        sy(impactB) - 6,
      );

      // ── Trajectory (animated reveal) ──
      const progress = ((t * 0.25) % 1.4);
      const revealedEnd = Math.min(
        trajectory.length,
        Math.floor(progress * trajectory.length),
      );
      ctx.strokeStyle = `${CYAN} 0.95)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < revealedEnd; i++) {
        const p = trajectory[i];
        if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
        else ctx.lineTo(sx(p.x), sy(p.y));
      }
      ctx.stroke();

      // Full trajectory ghost (for context)
      ctx.strokeStyle = `${CYAN} 0.22)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < trajectory.length; i += 3) {
        const p = trajectory[i];
        if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
        else ctx.lineTo(sx(p.x), sy(p.y));
      }
      ctx.stroke();

      // Electron dot at the head of the revealed trail
      if (revealedEnd > 0) {
        const head = trajectory[Math.max(0, revealedEnd - 1)];
        ctx.fillStyle = "#78DCFF";
        ctx.beginPath();
        ctx.arc(sx(head.x), sy(head.y), 4, 0, Math.PI * 2);
        ctx.fill();

        // Label near the incoming leg
        if (revealedEnd < trajectory.length * 0.2) {
          ctx.fillStyle = colors.fg1;
          ctx.font = "11px monospace";
          ctx.textAlign = "left";
          ctx.fillText("e⁻  v₀", sx(head.x) + 8, sy(head.y) - 4);
        }
      }

      // ── Emission arrow at the deflection point ──
      // Flash only when the reveal has passed the deflection moment
      const emitted = revealedEnd > deflectionIdx;
      if (emitted) {
        const p = trajectory[deflectionIdx];
        // tangent direction at deflection point
        const vmag = Math.hypot(p.vx, p.vy);
        const ux = p.vx / vmag;
        const uy = p.vy / vmag;
        // perpendicular (the radiation preferentially goes perpendicular
        // to the acceleration direction; for visual purposes point it
        // along the transverse, rotated off the velocity by ~30°)
        const rot = Math.PI * 0.18;
        const dx = Math.cos(rot) * ux - Math.sin(rot) * uy;
        const dy = Math.sin(rot) * ux + Math.cos(rot) * uy;
        const arrowLen = 85;
        const x0 = sx(p.x);
        const y0 = sy(p.y);
        const x1 = x0 + dx * arrowLen;
        const y1 = y0 - dy * arrowLen;
        const alpha = 0.55 + 0.45 * Math.sin(t * 6);
        drawArrow(
          ctx,
          x0,
          y0,
          x1,
          y1,
          `${XRAY} ${alpha.toFixed(3)})`,
          2.2,
        );
        ctx.fillStyle = `${XRAY} ${alpha.toFixed(3)})`;
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillText("γ  (X-ray)", x1 + 6, y1);
      }

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Rutherford deflection → braking radiation", 14, 20);
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(
        `|a|_max at the closest-approach kink`,
        14,
        36,
      );

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `small b → hard brake → harder photon`,
        width - 14,
        height - 10,
      );

      // Avoid unused-variable warning (colors still consumed for fg2 etc.)
      void AMBER;
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Impact parameter b</label>
        <input
          type="range"
          min={8}
          max={85}
          step={1}
          value={impactB}
          onChange={(e) => setImpactB(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,255)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {impactB.toFixed(0)}
        </span>
      </div>
      <div className="mt-2 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        small b: tight hyperbola, maximal transverse a, hardest X-ray; large b: barely a wiggle.
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(10, len * 0.28);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head + nx * head * 0.5, y1 - uy * head + ny * head * 0.5);
  ctx.lineTo(x1 - ux * head - nx * head * 0.5, y1 - uy * head - ny * head * 0.5);
  ctx.closePath();
  ctx.fill();
}
