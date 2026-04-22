"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.7;
const MAX_HEIGHT = 520;

/**
 * FIG.22c — Elihu Thomson's 1887 jumping-ring demo. A vertical iron core
 * carries a primary coil at its base; an aluminium ring sits loose around
 * the core, resting on the coil's top. When AC is switched on, the
 * primary's rapidly-changing B drives a changing flux through the ring →
 * Lenz-induced current in the ring → the induced current's B opposes the
 * primary's, and the two rings repel. The aluminium ring jumps.
 *
 * Cooling the ring (lower R → bigger I → stronger repulsion) makes it
 * jump higher — a button toggles 300 K vs 77 K. The simulation runs a
 * simplified 1D motion with lift ∝ I² (modelled as proportional to the
 * square of the instantaneous primary AC amplitude and the ring's
 * effective coupling), gravity pulls it back.
 */
export function JumpingRingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 560, height: 460 });
  const [acOn, setAcOn] = useState(true);
  const [cooled, setCooled] = useState(false);

  const yRef = useRef(0); // height above coil, metres (scene units)
  const vRef = useRef(0); // vertical velocity, m/s
  const phaseRef = useRef(0); // AC phase

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

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // AC primary current. Amplitude is constant; we care about d/dt.
      const f = 50; // Hz (mains-ish)
      phaseRef.current += 2 * Math.PI * f * dt;
      const I_prim = Math.sin(phaseRef.current);

      // The ring's induced current is ∝ dI_prim/dt / R_ring, so the lift
      // on the ring (∝ I_prim · I_induced · mutual inductance gradient)
      // averages to a *positive* force over one cycle. Model the
      // time-averaged lift as a DC force proportional to 1/R and scaled
      // by coupling. This keeps the render smooth without needing to
      // resolve 50 Hz.
      const R_ring = cooled ? 0.08 : 0.3;
      const coupling = Math.exp(-yRef.current / 0.35); // drops off with height
      const F_lift_base = 6.0 / R_ring; // arbitrary scene units
      const liftOn = acOn ? 1 : 0;
      const F_lift = liftOn * F_lift_base * coupling;

      // Gravity + drag.
      const g = 9.81;
      const mass = 0.03; // 30 g aluminium ring
      const drag = 0.08 * vRef.current; // velocity-proportional air resistance
      const a = F_lift / mass - g - drag / mass;
      vRef.current += a * dt;
      yRef.current += vRef.current * dt;
      if (yRef.current < 0) {
        yRef.current = 0;
        if (vRef.current < 0) vRef.current *= -0.2; // small bounce
      }
      if (yRef.current > 1.8) {
        yRef.current = 1.8;
        if (vRef.current > 0) vRef.current = 0;
      }

      // ── Render ──
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const groundY = height - 40;
      const PX = Math.min(height, width) * 0.36; // scene-to-pixel

      // Iron core (vertical cylinder).
      drawIronCore(ctx, cx, groundY, PX);
      // Primary coil at base.
      drawPrimaryCoil(ctx, cx, groundY, PX, acOn, phaseRef.current);
      // Aluminium ring at height y.
      const ringY = groundY - yRef.current * PX;
      drawRing(ctx, cx, ringY, PX, cooled, acOn);

      // Induced-current arrow on ring (when AC is on).
      if (acOn) {
        drawInducedCurrentArrow(
          ctx,
          cx,
          ringY,
          PX,
          Math.sign(Math.cos(phaseRef.current)),
        );
      }

      // Primary current indicator.
      drawPrimaryCurrentArrow(ctx, cx, groundY, PX, acOn, I_prim);

      // Ground line.
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, groundY + 20);
      ctx.lineTo(width - 40, groundY + 20);
      ctx.stroke();

      // Right-hand-rule badge.
      drawRHRBadge(ctx, width, height, colors);

      // HUD.
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("Thomson's jumping ring (Lenz in action)", 12, 18);
      ctx.fillStyle = acOn ? "rgba(255, 214, 107, 0.95)" : colors.fg2;
      ctx.fillText(acOn ? "AC: ON (50 Hz)" : "AC: OFF", 12, 36);
      ctx.fillStyle = cooled ? "rgba(120, 220, 255, 0.95)" : colors.fg2;
      ctx.fillText(
        cooled ? "ring: cooled (77 K, R low)" : "ring: room temp (300 K)",
        12,
        54,
      );

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`y = ${yRef.current.toFixed(2)} m`, width - 12, 18);
      ctx.fillText(`v = ${vRef.current.toFixed(2)} m/s`, width - 12, 36);
    },
  });

  function drawIronCore(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    PX: number,
  ) {
    const w = PX * 0.12;
    const h = PX * 2.0;
    ctx.fillStyle = "#3A3F4D";
    ctx.fillRect(cx - w / 2, groundY - h, w, h);
    ctx.strokeStyle = "#555A68";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - w / 2, groundY - h, w, h);
    // Hatching for "iron".
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const y = groundY - h + (i / 14) * h;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, y);
      ctx.lineTo(cx + w / 2, y - 4);
      ctx.stroke();
    }
  }

  function drawPrimaryCoil(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    PX: number,
    on: boolean,
    phase: number,
  ) {
    const w = PX * 0.55;
    const h = PX * 0.35;
    const yTop = groundY - h;
    const base = on ? 0.3 + 0.25 * Math.abs(Math.sin(phase)) : 0.2;
    ctx.fillStyle = `rgba(255, 106, 222, ${base})`;
    // Rounded box
    ctx.beginPath();
    const r = 6;
    ctx.moveTo(cx - w / 2 + r, yTop);
    ctx.lineTo(cx + w / 2 - r, yTop);
    ctx.quadraticCurveTo(cx + w / 2, yTop, cx + w / 2, yTop + r);
    ctx.lineTo(cx + w / 2, groundY - r);
    ctx.quadraticCurveTo(cx + w / 2, groundY, cx + w / 2 - r, groundY);
    ctx.lineTo(cx - w / 2 + r, groundY);
    ctx.quadraticCurveTo(cx - w / 2, groundY, cx - w / 2, groundY - r);
    ctx.lineTo(cx - w / 2, yTop + r);
    ctx.quadraticCurveTo(cx - w / 2, yTop, cx - w / 2 + r, yTop);
    ctx.closePath();
    ctx.fill();
    // Wire turns (horizontal lines).
    ctx.strokeStyle = "rgba(255, 106, 222, 0.7)";
    ctx.lineWidth = 1.4;
    const turns = 8;
    for (let i = 0; i < turns; i++) {
      const y = yTop + ((i + 0.5) / turns) * h;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + 4, y);
      ctx.lineTo(cx + w / 2 - 4, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#FF6ADE";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("primary coil (AC)", cx, groundY + 14);
  }

  function drawRing(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    PX: number,
    cooled: boolean,
    acOn: boolean,
  ) {
    const rx = PX * 0.28;
    const ry = PX * 0.08;
    // Aluminium ring: silver-ish fill, cyan tint when cooled.
    const baseCol = cooled ? "rgba(170, 220, 255, 0.8)" : "rgba(210, 215, 225, 0.8)";
    ctx.fillStyle = baseCol;
    ctx.strokeStyle = cooled ? "#78DCFF" : "#D0D4E0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Inner "hole" ellipse for tube look.
    ctx.fillStyle = "rgba(10,14,22,0.55)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.75, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Glow when carrying induced current.
    if (acOn) {
      ctx.strokeStyle = "rgba(120, 255, 170, 0.5)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(120, 255, 170, 0.5)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 1.04, ry * 1.1, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawInducedCurrentArrow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    PX: number,
    sense: number,
  ) {
    // Show one arrowhead on the visible near-side of the ring indicating
    // induced-current direction, flipping with the primary's half-cycle.
    const rx = PX * 0.28;
    const ry = PX * 0.08;
    ctx.strokeStyle = "rgba(120, 255, 170, 0.95)";
    ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
    ctx.lineWidth = 1.8;
    const x = cx + (sense >= 0 ? rx * 1.05 : -rx * 1.05);
    const y = cy + ry * 1.3;
    const dir = sense >= 0 ? -1 : 1; // near-front of ring goes in opposite rim-direction
    const len = 20 * dir;
    ctx.beginPath();
    ctx.moveTo(x - len * 0.5, y);
    ctx.lineTo(x + len * 0.5, y);
    ctx.stroke();
    const back = dir > 0 ? -5 : 5;
    ctx.beginPath();
    ctx.moveTo(x + len * 0.5, y);
    ctx.lineTo(x + len * 0.5 + back, y - 3);
    ctx.lineTo(x + len * 0.5 + back, y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("I_induced", x, y + 14);
  }

  function drawPrimaryCurrentArrow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    PX: number,
    on: boolean,
    I_prim: number,
  ) {
    if (!on) return;
    const x = cx + PX * 0.42;
    const y = groundY - PX * 0.18;
    ctx.strokeStyle = "rgba(255, 106, 222, 0.95)";
    ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
    ctx.lineWidth = 1.5;
    const dir = I_prim >= 0 ? 1 : -1;
    const len = 18 * dir;
    ctx.beginPath();
    ctx.moveTo(x - len * 0.5, y);
    ctx.lineTo(x + len * 0.5, y);
    ctx.stroke();
    const back = dir > 0 ? -5 : 5;
    ctx.beginPath();
    ctx.moveTo(x + len * 0.5, y);
    ctx.lineTo(x + len * 0.5 + back, y - 3);
    ctx.lineTo(x + len * 0.5 + back, y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("I_primary (AC)", x + 10, y + 4);
  }

  function drawRHRBadge(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: { fg2: string; fg3: string },
  ) {
    const ox = 28;
    const oy = height - 28;
    const len = 18;
    ctx.strokeStyle = colors.fg2;
    ctx.fillStyle = colors.fg2;
    ctx.lineWidth = 1.2;
    // r̂ right
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + len, oy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox + len, oy);
    ctx.lineTo(ox + len - 3, oy - 3);
    ctx.lineTo(ox + len - 3, oy + 3);
    ctx.closePath();
    ctx.fill();
    // ẑ up (along core axis)
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy - len);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, oy - len);
    ctx.lineTo(ox - 3, oy - len + 3);
    ctx.lineTo(ox + 3, oy - len + 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.fg3;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("r̂", ox + len + 3, oy + 4);
    ctx.fillText("ẑ", ox - 3, oy - len - 3);
    ctx.fillText("RHR · B along ẑ", ox + 12, oy - len - 6);
  }

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block mx-auto"
      />
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 px-2">
        <button
          type="button"
          onClick={() => setAcOn((v) => !v)}
          className="rounded border border-[var(--color-fg-4)] px-3 py-1 font-mono text-xs text-[var(--color-fg-1)] hover:border-[var(--color-fg-2)]"
          style={{ background: acOn ? "rgba(255,214,107,0.1)" : "transparent" }}
        >
          {acOn ? "switch AC off" : "switch AC on"}
        </button>
        <button
          type="button"
          onClick={() => setCooled((v) => !v)}
          className="rounded border border-[var(--color-fg-4)] px-3 py-1 font-mono text-xs text-[var(--color-fg-1)] hover:border-[var(--color-fg-2)]"
          style={{
            background: cooled ? "rgba(120,220,255,0.12)" : "transparent",
          }}
        >
          {cooled ? "let ring warm up" : "cool ring (liquid N₂)"}
        </button>
      </div>
      <p className="mt-2 px-2 text-center text-xs font-mono text-[var(--color-fg-3)]">
        cooling lowers ring resistance → bigger induced current → stronger
        Lenz repulsion → higher jump
      </p>
    </div>
  );
}
