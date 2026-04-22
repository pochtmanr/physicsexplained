"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.21a — Faraday's 1831 bench setup.
 *
 * A bar magnet slides toward and away from a multi-turn coil. A
 * galvanometer needle (top-right dial) deflects proportionally to
 * dΦ/dt; the sign of the deflection flips with the direction of
 * motion. Hold the magnet still and the needle snaps back to zero —
 * static flux does not induce anything. It is the *change* that does.
 *
 * HUD reports Φ(t), dΦ/dt numerically, and EMF = −N·dΦ/dt.
 *
 * Colour key:
 *   magenta `#FF6ADE`           — N pole of the magnet / + accent
 *   cyan                        — S pole
 *   amber   `#FFD66B`           — velocity arrow (motion cue)
 *   rgba(120,220,255,0.5–0.9)   — B field lines from the magnet
 *   rgba(120,255,170,0.9)       — induced current direction indicator
 *
 * Right-hand-rule visual cue: an axes badge in the bottom-left shows
 * the induced-current circulation curl arrow relative to the magnet's
 * direction of motion.
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#7ADCFF";
const AMBER = "#FFD66B";
const B_FIELD = "rgba(120, 220, 255, 0.6)";
const INDUCED = "rgba(120, 255, 170, 0.95)";

type MotionMode = "approach" | "still" | "retreat" | "auto";

const MODES: { id: MotionMode; label: string }[] = [
  { id: "approach", label: "PUSH IN" },
  { id: "still", label: "HOLD" },
  { id: "retreat", label: "PULL OUT" },
  { id: "auto", label: "AUTO" },
];

const COIL_TURNS = 6;
const N_LOOPS = 30; // turns modelled for the EMF multiplier

export function MagnetThroughCoilScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 380 });
  const [mode, setMode] = useState<MotionMode>("auto");

  const stateRef = useRef({
    x: 0.3, // normalised magnet centre position along the track (0 left, 1 right)
    vx: 0, // normalised velocity along the track
    flux: 0,
    dFlux: 0,
    prevFlux: 0,
  });

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.56, 320), 420) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

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
      ctx.clearRect(0, 0, width, height);

      const coilCx = width * 0.62;
      const coilCy = height * 0.5;
      const coilHalf = Math.min(width, height) * 0.08;

      // --- Update magnet position from mode ---
      const s = stateRef.current;
      let targetV = 0;
      switch (mode) {
        case "approach":
          targetV = 0.35;
          break;
        case "retreat":
          targetV = -0.35;
          break;
        case "still":
          targetV = 0;
          break;
        case "auto":
          // ease: back-and-forth cycle
          targetV = 0.38 * Math.cos(t * 0.9);
          break;
      }
      // critically-damped approach to targetV
      s.vx += (targetV - s.vx) * Math.min(1, dt * 4);
      s.x += s.vx * dt;
      // clamp and bounce away from the coil/walls gently
      if (s.x < 0.05) {
        s.x = 0.05;
        s.vx = Math.max(0, s.vx);
      }
      if (s.x > 0.55) {
        s.x = 0.55;
        s.vx = Math.min(0, s.vx);
      }

      // Magnet geometry
      const magW = Math.min(width, height) * 0.24;
      const magH = Math.min(width, height) * 0.09;
      const magX = width * s.x;
      const magY = coilCy;
      // Distance from magnet's right tip to coil centre
      const magRightX = magX + magW / 2;
      const dx = coilCx - magRightX;

      // Model flux as a bell-shaped function of (coil centre − magnet tip)
      // peaking when the tip is *inside* the coil (dx ≈ 0). Sign of the
      // flux is fixed (N pole facing coil ⇒ positive B through the coil).
      const phiScale = 1e-3; // arbitrary, for HUD readout in milliwebers
      const sigma = Math.min(width, height) * 0.12;
      const phi = phiScale * Math.exp(-(dx * dx) / (2 * sigma * sigma));
      s.dFlux = dt > 0 ? (phi - s.prevFlux) / dt : 0;
      s.prevFlux = phi;
      s.flux = phi;

      // Induced EMF (volts in scene units) — multiplied by N loops
      const emf = -N_LOOPS * s.dFlux;

      // --- Draw field lines emerging from the magnet ---
      ctx.strokeStyle = B_FIELD;
      ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) {
        const yOff = (k - 3) * magH * 0.55;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const u = i / 60;
          const lx = magRightX + u * (coilCx + coilHalf - magRightX) + 8;
          // field splays out more the further from the magnet
          const splay = yOff * (1 + 0.6 * u);
          const ly = magY + splay;
          if (i === 0) ctx.moveTo(lx, ly);
          else ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
      // Arrowheads on the field lines
      for (let k = 0; k < 3; k++) {
        const u = 0.45 + k * 0.2;
        const yOff = (k - 1) * magH * 0.8;
        const lx = magRightX + u * (coilCx - magRightX);
        const ly = magY + yOff * (1 + 0.6 * u);
        drawArrow(ctx, lx, ly, 1, 0, 10, B_FIELD);
      }

      // --- Draw coil: stacked loops in side-view (ellipses) ---
      for (let i = 0; i < COIL_TURNS; i++) {
        const cxL = coilCx + (i - (COIL_TURNS - 1) / 2) * 10;
        ctx.strokeStyle = colors.fg1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cxL, coilCy, 6, coilHalf, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Coil leads up to the galvanometer
      const galvX = width - 70;
      const galvY = 60;
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(coilCx + 20, coilCy - coilHalf);
      ctx.lineTo(coilCx + 20, coilCy - coilHalf - 30);
      ctx.lineTo(galvX, coilCy - coilHalf - 30);
      ctx.lineTo(galvX, galvY + 20);
      ctx.moveTo(coilCx - 20, coilCy + coilHalf);
      ctx.lineTo(coilCx - 20, coilCy + coilHalf + 30);
      ctx.lineTo(galvX - 30, coilCy + coilHalf + 30);
      ctx.lineTo(galvX - 30, galvY + 20);
      ctx.stroke();

      // --- Induced-current arrow ring around the nearest coil loop ---
      // Size scales with |dΦ/dt|; direction flips with its sign.
      const indicatorR = coilHalf + 16;
      const indicatorSign = Math.sign(s.dFlux) || 0;
      const indicatorMag = Math.min(1, Math.abs(s.dFlux) * 2000);
      if (indicatorMag > 0.02) {
        ctx.strokeStyle = INDUCED;
        ctx.globalAlpha = 0.2 + 0.6 * indicatorMag;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(coilCx, coilCy, 10, indicatorR, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // arrow on top of ring — direction depends on sign of dΦ/dt
        const topY = coilCy - indicatorR;
        const bottomY = coilCy + indicatorR;
        drawArrow(
          ctx,
          coilCx,
          topY,
          indicatorSign > 0 ? -1 : 1,
          0,
          14,
          INDUCED,
        );
        drawArrow(
          ctx,
          coilCx,
          bottomY,
          indicatorSign > 0 ? 1 : -1,
          0,
          14,
          INDUCED,
        );
      }

      // --- Magnet body (two halves: S cyan, N magenta) ---
      ctx.fillStyle = CYAN;
      ctx.fillRect(magX - magW / 2, magY - magH / 2, magW / 2, magH);
      ctx.fillStyle = MAGENTA;
      ctx.fillRect(magX, magY - magH / 2, magW / 2, magH);
      // Labels
      ctx.fillStyle = "#0E0F18";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S", magX - magW / 4, magY);
      ctx.fillText("N", magX + magW / 4, magY);

      // Velocity arrow above the magnet
      if (Math.abs(s.vx) > 0.02) {
        const vDir = Math.sign(s.vx);
        const arrowY = magY - magH / 2 - 18;
        drawArrow(ctx, magX, arrowY, vDir, 0, 28, AMBER);
        ctx.fillStyle = AMBER;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("v", magX + vDir * 22, arrowY - 6);
      }

      // --- Galvanometer dial ---
      ctx.fillStyle = "rgba(14, 15, 24, 0.9)";
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(galvX - 15, galvY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(galvX - 15, galvY, 28, Math.PI, 2 * Math.PI);
      ctx.stroke();
      // needle deflection proportional to EMF (clipped)
      const needleAng =
        -Math.PI / 2 +
        Math.max(-1, Math.min(1, emf * 12)) * (Math.PI / 2.5);
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(galvX - 15, galvY);
      ctx.lineTo(
        galvX - 15 + Math.cos(needleAng) * 25,
        galvY + Math.sin(needleAng) * 25,
      );
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("G", galvX - 15, galvY + 20);

      // --- HUD ---
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const pad = 12;
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("Φ(t)", pad, pad + 14);
      ctx.fillStyle = B_FIELD;
      ctx.fillText(`= ${(s.flux * 1e3).toExponential(3)} mWb`, pad, pad + 30);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("dΦ/dt", pad, pad + 54);
      ctx.fillStyle = AMBER;
      ctx.fillText(`= ${(s.dFlux * 1e3).toExponential(3)} mWb/s`, pad, pad + 70);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`EMF = −N·dΦ/dt  (N=${N_LOOPS})`, pad, pad + 94);
      ctx.fillStyle = INDUCED;
      ctx.fillText(`= ${(emf * 1e3).toFixed(3)} mV`, pad, pad + 110);

      // Right-hand-rule axes badge (bottom-left)
      drawRHRBadge(ctx, 24, height - 30, colors.fg2);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded border px-2 py-1 font-mono text-xs ${
                mode === m.id
                  ? "border-[rgba(120,255,170,0.9)] bg-[rgba(120,255,170,0.12)] text-[var(--color-fg-0)]"
                  : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:border-[var(--color-fg-3)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="ml-auto font-mono text-[10px] text-[var(--color-fg-3)]">
          induced-current ring in green-cyan; field lines in blue
        </div>
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  len: number,
  color: string,
) {
  const tipX = x + tx * len * 0.5;
  const tipY = y + ty * len * 0.5;
  const tailX = x - tx * len * 0.5;
  const tailY = y - ty * len * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  const ang = Math.atan2(ty, tx);
  const head = 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - head * Math.cos(ang - Math.PI / 6),
    tipY - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.lineTo(
    tipX - head * Math.cos(ang + Math.PI / 6),
    tipY - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

/** Small axes badge + curl arrow reminding the reader of the RHR. */
function drawRHRBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  subdued: string,
) {
  ctx.save();
  ctx.strokeStyle = subdued;
  ctx.lineWidth = 1;
  // +x
  drawArrow(ctx, cx + 8, cy, 1, 0, 16, subdued);
  // +y (up)
  drawArrow(ctx, cx, cy - 8, 0, -1, 16, subdued);
  // curl arrow CCW
  ctx.beginPath();
  ctx.arc(cx + 3, cy - 3, 9, 0.2, Math.PI * 1.6);
  ctx.stroke();
  ctx.font = "9px monospace";
  ctx.fillStyle = subdued;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("RHR", cx + 20, cy - 14);
  ctx.restore();
}
