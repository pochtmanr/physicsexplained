"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { gamma } from "@/lib/physics/electromagnetism/relativity";

/**
 * FIG.59c — A charged sphere at rest in the lab frame produces only an
 * electric field. Boost along +x and the same sphere now produces both
 * an electric field (slightly distorted by length contraction along x)
 * and a magnetic field curling azimuthally around the boost axis.
 *
 * This is the visual anchor for §11.4 (two parallel currents) — the same
 * mechanism applied to a continuous charge distribution.
 *
 * Layout: single panel, the charged sphere drawn centred. Magenta radial
 * arrows show E (lab) or E' (boost), cyan curling arrows around the
 * horizontal axis show B' (boost only).
 *
 * Palette:
 *   magenta — radial E / E' field
 *   cyan    — induced B' field (curling around boost axis)
 *   amber   — boost-direction indicator (only visible when β > 0)
 */

const RATIO = 0.6;
const MAX_HEIGHT = 380;

export function PureEBecomesEBScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.7);
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

      const b = betaRef.current;
      const g = gamma(b);
      const cx = width * 0.5;
      const cy = height * 0.55;

      // ── Sphere is "length-contracted" along x by 1/γ ──
      // Visual proxy only — the actual E-field of a moving point charge is
      // not simply a contracted Coulomb field; this is a schematic anchor.
      const baseR = Math.min(width, height) * 0.07;
      const rX = baseR / g; // contracted along boost axis
      const rY = baseR;

      // ── Boost-direction indicator (top) ──
      if (b > 0.01) {
        const aColor = "rgba(255, 180, 80, 0.95)";
        drawArrow(ctx, cx - 80, 28, cx + 80, 28, aColor, 2);
        ctx.fillStyle = aColor;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`v = ${b.toFixed(2)}c`, cx, 18);
      }

      // ── B' field: curling cyan arcs around horizontal (boost) axis ──
      // Only present when β > 0. Strength tracks γβ (closed-form B'∝ γβ E/c²).
      if (b > 0.001) {
        drawCurlingBField(ctx, cx, cy, baseR * 4.2, baseR * 2.3, b, t);
      }

      // ── E field: radial magenta arrows from the sphere ──
      drawRadialEField(ctx, cx, cy, rX, rY, b, t);

      // ── Sphere itself (charged, magenta-rimmed) ──
      ctx.beginPath();
      ctx.ellipse(cx, cy, rX, rY, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 106, 222, 0.18)";
      ctx.fill();
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2;
      ctx.stroke();

      // "+" sign in the middle
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx, cy + 5);
      ctx.stroke();

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        b < 0.01
          ? "Lab frame: pure E."
          : `Boosted at β = ${b.toFixed(2)}: E and B both.`,
        14,
        height - 18,
      );

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(`γ = ${g.toFixed(3)}`, width - 14, height - 18);

      // labels
      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("E", cx + rX + 60, cy - rY - 6);
      if (b > 0.01) {
        ctx.fillStyle = "rgba(111, 184, 198, 0.95)";
        ctx.fillText("B'", cx + baseR * 4.3, cy - baseR * 2.4);
      }
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
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          β = {beta.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Same charged sphere. Slide β; the radial E flattens by 1/γ along x while a
        cyan B' curls around the axis of motion.
      </div>
    </div>
  );
}

function drawRadialEField(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rX: number,
  rY: number,
  beta: number,
  t: number,
) {
  const N = 16;
  const lenBase = Math.max(rX, rY) * 2.6;
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
  const alpha = 0.55 + 0.25 * pulse;
  for (let i = 0; i < N; i++) {
    const phi = (i / N) * Math.PI * 2;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    // Start on the sphere boundary in the direction (cosP, sinP).
    const startX = cx + rX * cosP;
    const startY = cy + rY * sinP;
    // The arrow length is anisotropic at high β (visual flourish — true
    // moving-charge field has cosθ' angular dependence; we use the simple
    // 1 + (γ−1)cos²θ kludge to tilt toward broadside).
    const broadside = sinP * sinP; // 1 at top/bottom, 0 at sides
    const lenScale = 1 + (gammaSafe(beta) - 1) * 0.4 * broadside;
    const endX = cx + (rX + lenBase * 0.45 * lenScale) * cosP;
    const endY = cy + (rY + lenBase * 0.45 * lenScale) * sinP;
    drawArrow(
      ctx,
      startX,
      startY,
      endX,
      endY,
      `rgba(255, 106, 222, ${alpha.toFixed(3)})`,
      1.4,
    );
  }
}

function drawCurlingBField(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  W: number,
  H: number,
  beta: number,
  t: number,
) {
  // Two ovoid loops above and below the boost axis suggesting B curling
  // into and out of the page around the moving sphere.
  const g = gammaSafe(beta);
  const intensity = Math.min(1, beta * g * 0.7);
  const alpha = 0.4 + 0.4 * intensity;
  ctx.strokeStyle = `rgba(111, 184, 198, ${alpha.toFixed(3)})`;
  ctx.lineWidth = 1.5;

  const drawArc = (offY: number, dir: 1 | -1) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy + offY, W * 0.5, H * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    // little arrowheads on the arc to show direction
    const phase = (t * 0.6) % 1;
    const N = 6;
    for (let i = 0; i < N; i++) {
      const phi = ((i + phase) / N) * Math.PI * 2;
      const ax = cx + W * 0.5 * Math.cos(phi);
      const ay = cy + offY + H * 0.32 * Math.sin(phi);
      // tangent direction
      const tx = -W * 0.5 * Math.sin(phi);
      const ty = H * 0.32 * Math.cos(phi);
      const tlen = Math.hypot(tx, ty);
      if (tlen < 1e-6) continue;
      const ux = (tx / tlen) * dir;
      const uy = (ty / tlen) * dir;
      drawTinyArrowhead(
        ctx,
        ax,
        ay,
        ux,
        uy,
        `rgba(111, 184, 198, ${alpha.toFixed(3)})`,
      );
    }
  };

  // Upper arc curls one way, lower arc curls the opposite way (both
  // azimuthal around the +x boost direction).
  drawArc(-H * 0.5, +1);
  drawArc(+H * 0.5, -1);
}

function drawTinyArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ux: number,
  uy: number,
  color: string,
) {
  const head = 5;
  const nx = -uy;
  const ny = ux;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + ux * head * 0.5, y + uy * head * 0.5);
  ctx.lineTo(
    x - ux * head * 0.5 + nx * head * 0.4,
    y - uy * head * 0.5 + ny * head * 0.4,
  );
  ctx.lineTo(
    x - ux * head * 0.5 - nx * head * 0.4,
    y - uy * head * 0.5 - ny * head * 0.4,
  );
  ctx.closePath();
  ctx.fill();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
) {
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

function gammaSafe(beta: number): number {
  const b2 = beta * beta;
  if (b2 >= 0.999999) return 1000;
  return 1 / Math.sqrt(1 - b2);
}
