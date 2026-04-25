"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { gamma } from "@/lib/physics/electromagnetism/relativity";

/**
 * FIG.62a — The four-potential A^μ = (φ/c, A⃗) under a Lorentz boost.
 *
 * Two side-by-side panels. Lab (left) shows a static configuration with
 * scalar potential φ (rendered as a translucent magenta height-field)
 * sitting on top of a vector potential A⃗ (cyan arrow grid). The boosted
 * frame (right) takes the Lorentz transform of A^μ along +x by β:
 *
 *   A'^0 = γ(A^0 − β A^1)        (the time component, φ/c)
 *   A'^1 = γ(A^1 − β A^0)        (the x component of A⃗)
 *   A'^2 = A^2,  A'^3 = A^3
 *
 * What the viewer should see: the scalar potential and the x-component
 * of the vector potential mix exactly the way ct and x mix in special
 * relativity. The right panel's φ' shrinks/grows and the A'_x arrows
 * stretch/squash as β slides — the "scalar" and the "vector" turn out
 * to be two faces of one 4-vector.
 *
 * Palette:
 *   magenta — scalar potential surface (φ height map)
 *   cyan    — vector potential A⃗ arrow grid
 *   lilac   — boost direction indicator
 *   amber   — HUD label highlights
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

// Lab-frame configuration: a uniform "puddle" of scalar potential plus
// a uniform vector potential pointing along +x. The numbers are scene
// units, not physical SI — the goal is to make the mixing legible.
const PHI0 = 1.0;     // scalar potential (scene units)
const A0_X = 0.6;     // vector potential x-component
const A0_Y = 0.0;     // vector potential y-component (stays put under boost-x)

export function FourPotentialComponentsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.6);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 720, height: 380 });
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
    onFrame: () => {
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

      const b = betaRef.current;
      const g = gamma(b);

      // Lorentz mix of the (A^0, A^x) pair:
      const A0_lab = PHI0; // we plot φ directly; the c-scaling is implicit
      const Ax_lab = A0_X;
      const A0_boost = g * (A0_lab - b * Ax_lab);
      const Ax_boost = g * (Ax_lab - b * A0_lab);

      const panelW = width / 2;
      drawPanel(ctx, colors, 0, 0, panelW, height, "LAB FRAME", A0_lab, Ax_lab, A0_Y, false);
      drawPanel(ctx, colors, panelW, 0, panelW, height, `BOOST β = ${b.toFixed(2)}`, A0_boost, Ax_boost, A0_Y, true);

      // ── separator line ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(panelW, 8);
      ctx.lineTo(panelW, height - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── HUD: live readout of A^μ ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      const yHud = height - 22;
      ctx.fillText(
        `A^μ_lab    = (${A0_lab.toFixed(2)},  ${Ax_lab.toFixed(2)},  0,  0)`,
        12,
        yHud,
      );
      ctx.fillText(
        `A^μ_boost  = (${A0_boost.toFixed(2)},  ${Ax_boost.toFixed(2)},  0,  0)   γ = ${g.toFixed(3)}`,
        12,
        yHud + 14,
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
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">β</label>
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Boost mixes scalar φ/c and vector A_x exactly like (ct, x). The "scalar
        potential" and the "vector potential" are two faces of one 4-vector.
      </div>
    </div>
  );
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x0: number,
  y0: number,
  w: number,
  h: number,
  label: string,
  phi: number,
  ax: number,
  ay: number,
  isBoost: boolean,
): void {
  // Panel background frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 4, y0 + 4, w - 8, h - 40);

  // Title
  ctx.fillStyle = isBoost ? "rgba(200, 160, 255, 0.95)" : colors.fg1;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x0 + 12, y0 + 22);

  // ── scalar potential as a magenta translucent disk whose intensity
  //    encodes |φ|. Larger |φ| ⇒ richer magenta fill.
  const cx = x0 + w / 2;
  const cy = y0 + h / 2 - 14;
  const baseR = Math.min(w, h) * 0.28;
  const phiAbs = Math.min(Math.abs(phi), 2.5);
  const phiAlpha = 0.10 + 0.30 * (phiAbs / 2.5);
  const phiSign = phi >= 0 ? 1 : -1;
  ctx.fillStyle = `rgba(255, 106, 222, ${phiAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * (0.5 + 0.3 * phiAbs / 2.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 106, 222, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // φ label at the centre of the disk
  ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`φ/c = ${(phi).toFixed(2)}`, cx, cy + 4);
  if (phiSign < 0) {
    ctx.fillText("(sign-flipped)", cx, cy + 16);
  }

  // ── vector potential as a 5×3 grid of cyan arrows pointing in (ax, ay).
  //    Arrow length encodes magnitude.
  const axMag = Math.hypot(ax, ay);
  const arrowLen = baseR * 0.55 * Math.min(axMag, 1.5);
  const cols = 5;
  const rows = 3;
  const padX = w * 0.12;
  const padY = h * 0.18;
  const innerW = w - 2 * padX;
  const innerH = h * 0.55 - 2 * padY;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const px = x0 + padX + (i + 0.5) * (innerW / cols);
      const py = y0 + padY + (j + 0.5) * (innerH / rows);
      // Skip arrows that overlap the central scalar disk
      if (Math.hypot(px - cx, py - cy) < baseR * 0.7) continue;
      drawArrow(
        ctx,
        px,
        py,
        px + (ax / Math.max(axMag, 1e-6)) * arrowLen,
        py - (ay / Math.max(axMag, 1e-6)) * arrowLen, // y-up convention
        "rgba(96, 220, 255, 0.85)",
        1.4,
      );
    }
  }

  // ── boost arrow (only on the boosted panel)
  if (isBoost) {
    drawArrow(
      ctx,
      x0 + 14,
      y0 + h - 50,
      x0 + 60,
      y0 + h - 50,
      "rgba(200, 160, 255, 0.95)",
      2,
    );
    ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("v⃗", x0 + 64, y0 + h - 46);
  }

  // ── A⃗ readout
  ctx.fillStyle = "rgba(96, 220, 255, 0.95)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`|A⃗| = ${axMag.toFixed(2)}`, x0 + 12, y0 + h - 50);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(7, len * 0.35);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * head + nx * head * 0.5,
    y1 - uy * head + ny * head * 0.5,
  );
  ctx.lineTo(
    x1 - ux * head - nx * head * 0.5,
    y1 - uy * head - ny * head * 0.5,
  );
  ctx.closePath();
  ctx.fill();
}
