"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

/**
 * FIG.57 — Abraham-Lorentz phase-plane portrait.
 *
 *   Free equation (no external force):  τ₀ · ȧ = a
 *   Two-dimensional phase space with (a, ȧ) as coordinates.
 *
 * Every trajectory lies on a line through the origin of slope 1/τ₀:
 *   ȧ = a / τ₀
 *
 * All trajectories flow *away* from the origin along that line — the
 * origin (a = 0, ȧ = 0) is an unstable fixed point. The only solution
 * that stays bounded is the one that sits *exactly* on the origin. Any
 * perturbation launches the runaway.
 *
 * The scene draws the phase plane, the unstable radial direction, the
 * stable zero-acceleration axis, and an animated particle tracing out
 * the trajectory from a user-chosen initial (a₀, ȧ₀). Slider: ȧ₀.
 * When ȧ₀ = 0 (and we start on the a-axis), the particle would also
 * need a ≡ 0 to stay — so even on the axis it immediately spirals
 * outward along the unstable direction.
 */
export function AbrahamLorentzPhaseScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 560, height: 340 });
  // jerkInit normalised: −1..+1 of the unstable-mode amplitude.
  const [jerkInit, setJerkInit] = useState(0.35);
  const trajRef = useRef<{ a: number; adot: number; t: number }>({
    a: 0.4,
    adot: 0.4 / 1,
    t: 0,
  });

  // Reset trajectory whenever jerkInit changes.
  useEffect(() => {
    // tau0 normalised = 1 in scene units.
    // Launch from (a0, adot0) where adot0 = jerkInit (signed).
    // Pair it with a0 so that (a0, adot0) sits on the unstable line
    // when jerkInit ≠ 0; else start on the a-axis at a0 = 0.4.
    trajRef.current = {
      a: jerkInit === 0 ? 0.4 : jerkInit,
      adot: jerkInit,
      t: 0,
    };
  }, [jerkInit]);

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
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Advance trajectory. τ₀ = 1 scene-units. ȧ = a / τ₀, a' = ȧ.
      // Integrate analytically: a(t) = a0 e^{t/τ0}, ȧ(t) = adot0 e^{t/τ0}
      // for trajectories on the unstable line.
      const traj = trajRef.current;
      // Simple Euler for generality (numerical runaway is THE POINT):
      const scenedt = Math.min(dt, 0.033);
      const speed = 0.45; // how fast to walk along the trajectory
      const newA = traj.a + traj.adot * scenedt * speed;
      const newAdot = traj.adot + (traj.a / 1) * scenedt * speed;
      traj.a = newA;
      traj.adot = newAdot;
      traj.t += scenedt;

      // When the trajectory leaves the viewport, reset from initial.
      if (Math.abs(traj.a) > 3.5 || Math.abs(traj.adot) > 3.5) {
        traj.a = jerkInit === 0 ? 0.4 : jerkInit;
        traj.adot = jerkInit;
        traj.t = 0;
      }

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "#1A1D24";
      ctx.fillRect(0, 0, width, height);

      // Plot geometry
      const padL = 50;
      const padR = 16;
      const padT = 24;
      const padB = 34;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const cx = padL + plotW / 2;
      const cy = padT + plotH / 2;
      const unit = Math.min(plotW, plotH) / 7; // covers −3.5 … +3.5

      const toPx = (a: number, adot: number) => ({
        px: cx + a * unit,
        py: cy - adot * unit,
      });

      // Grid
      ctx.strokeStyle = colors.fg3;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const { px } = toPx(i, 0);
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        const { py } = toPx(0, i);
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Axes
      ctx.strokeStyle = "rgba(160, 176, 200, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, cy);
      ctx.lineTo(padL + plotW, cy);
      ctx.moveTo(cx, padT);
      ctx.lineTo(cx, padT + plotH);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("a  (acceleration)", cx, padT + plotH + 22);
      ctx.save();
      ctx.translate(16, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("ȧ  (jerk)", 0, 0);
      ctx.restore();

      // Unstable direction: ȧ = a/τ₀, slope 1 in normalised units.
      // Draw as dashed magenta.
      ctx.strokeStyle = "rgba(255, 106, 222, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      const a1 = -3.4;
      const a2 = 3.4;
      const p1 = toPx(a1, a1);
      const p2 = toPx(a2, a2);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label for unstable line
      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      const lbl = toPx(2.2, 2.2);
      ctx.fillText("ȧ = a / τ₀  (runaway)", lbl.px + 6, lbl.py - 4);

      // Vector field — tiny arrows showing flow direction
      ctx.strokeStyle = "rgba(140, 200, 255, 0.35)";
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          if (i === 0 && j === 0) continue;
          const a = i * 0.9;
          const adot = j * 0.9;
          // field: (ȧ, a/τ₀) = (adot, a)
          const fx = adot;
          const fy = a;
          const mag = Math.hypot(fx, fy) || 1;
          const L = 0.25 * unit;
          const p = toPx(a, adot);
          const dx = (fx / mag) * L;
          const dy = -(fy / mag) * L;
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.px + dx, p.py + dy);
          ctx.stroke();
        }
      }

      // Origin marker — the unstable fixed point
      ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 180, 80, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.stroke();

      // The animated trajectory — a moving amber dot with a fading tail
      const p = toPx(traj.a, traj.adot);
      // Tail: analytic exponential from (a0, adot0).
      const a0 = jerkInit === 0 ? 0.4 : jerkInit;
      const adot0 = jerkInit;
      const tauSec = 1;
      const steps = 80;
      ctx.strokeStyle = "rgba(255, 214, 107, 0.8)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255, 214, 107, 0.55)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const s = (k / steps) * traj.t * speed;
        // Analytic: on a general trajectory
        //    a(s) = (a0+adot0)/2 · e^{s/τ} + (a0-adot0)/2 · e^{-s/τ}
        //    ȧ(s) = (a0+adot0)/2 · e^{s/τ} - (a0-adot0)/2 · e^{-s/τ}
        const gp = (a0 + adot0) / 2;
        const gm = (a0 - adot0) / 2;
        const es = Math.exp(s / tauSec);
        const en = Math.exp(-s / tauSec);
        const aNow = gp * es + gm * en;
        const adotNow = gp * es - gm * en;
        const pp = toPx(aNow, adotNow);
        if (k === 0) ctx.moveTo(pp.px, pp.py);
        else ctx.lineTo(pp.px, pp.py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255, 214, 107, 1)";
      ctx.beginPath();
      ctx.arc(p.px, p.py, 4, 0, Math.PI * 2);
      ctx.fill();

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("phase plane  (a, ȧ)", padL + 4, padT + 12);
      ctx.textAlign = "right";
      ctx.fillText(
        `ȧ(0) = ${jerkInit >= 0 ? "+" : ""}${jerkInit.toFixed(2)} · a₀/τ₀`,
        width - 6,
        padT + 12,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        "orange dot = unstable fixed point",
        width - 6,
        padT + 26,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block rounded-md"
      />
      <div className="mt-3 flex items-center gap-3 px-2">
        <label className="w-24 text-xs font-mono text-[var(--color-fg-3)]">
          ȧ(0)
        </label>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={jerkInit}
          onChange={(e) => setJerkInit(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#FF6ADE" }}
        />
        <span className="w-16 text-right text-xs font-mono text-[var(--color-fg-1)]">
          {jerkInit.toFixed(2)}
        </span>
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        every trajectory flies off along the magenta runaway line. set
        ȧ(0) = 0 and nudge — the trajectory still escapes, because the
        origin is unstable.
      </p>
    </div>
  );
}
