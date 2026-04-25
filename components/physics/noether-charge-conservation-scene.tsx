"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.62c — Gauge symmetry → charge conservation, by Noether (1918).
 *
 * Two-part panel.
 *
 *   Top: A wiggling on top of a fixed F. We render a sinusoidal A(x,t)
 *        oscillation (cyan curve) that gets shifted around as the user
 *        scrubs Λ-amplitude — and the corresponding F (magenta curve)
 *        below it stays exactly fixed. Visual proof that
 *        F = ∂A − ∂A is invariant under A → A + ∂Λ.
 *
 *   Bottom: A closed surface in 2D (an amber rectangle) with magenta
 *        current-density arrows flowing in on the left edge and out on
 *        the right edge. The Inflow and Outflow are perfectly equal —
 *        ∇·J = 0, charge in = charge out, ∂_μ J^μ = 0.
 *
 * The HUD prints the bridge between the two: "Gauge symmetry  ⟹  charge
 * conservation (Noether 1918)".
 *
 * Palette:
 *   cyan    — A oscillation (the gauge-shiftable potential)
 *   magenta — F field (gauge-invariant) and J current arrows
 *   amber   — closed surface for the conservation theorem
 *   lilac   — Λ-amplitude indicator
 */

const RATIO = 0.62;
const MAX_HEIGHT = 420;

export function NoetherChargeConservationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  // Λ-amplitude — the "gauge knob". Positive shifts A up by ∂_xΛ; F is
  // unchanged.
  const [lambdaAmp, setLambdaAmp] = useState(0.4);
  const lambdaRef = useRef(lambdaAmp);
  useEffect(() => {
    lambdaRef.current = lambdaAmp;
  }, [lambdaAmp]);

  const [size, setSize] = useState({ width: 720, height: 420 });
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

      const lam = lambdaRef.current;

      // ── Layout: top half (A and F), bottom half (J flow box).
      const padX = 28;
      const innerW = width - 2 * padX;
      const topY0 = 12;
      const topH = height * 0.50;
      const topY1 = topY0 + topH;
      const botY0 = topY1 + 18;
      const botH = height - botY0 - 30;
      const botY1 = botY0 + botH;

      // ── TOP PANEL: A vs F under gauge shift ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, topY0, innerW, topH);

      ctx.fillStyle = colors.fg1;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("A_μ → A_μ + ∂_μΛ   (gauge symmetry)", padX + 6, topY0 + 16);

      // A curve (cyan): a base sinusoid, plus the gauge-shift sinusoid
      // (∂_xΛ proportional to lam · cos(2x)). Animate Λ time-dependence
      // with a slow drift, just to make the gauge wiggle visible.
      const Ay = topY0 + topH * 0.30;
      const Famp = topH * 0.10;
      const Aamp = topH * 0.10;
      const phase = t * 0.8;

      ctx.strokeStyle = "rgba(96, 220, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const N = 220;
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const x = xn * Math.PI * 4;
        // A_base + ∂_xΛ where Λ = lam · sin(2x − phase)
        const Abase = Math.sin(x);
        const dLambda = lam * 2 * Math.cos(2 * x - phase);
        const px = padX + xn * innerW;
        const py = Ay + Aamp * (Abase + dLambda);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(96, 220, 255, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("A (wiggles with Λ)", padX + innerW - 8, Ay - 14);

      // F curve (magenta): F = ∂A. Since the ∂Λ piece is a pure
      // gradient, its contribution to F vanishes — F stays fixed.
      const Fy = topY0 + topH * 0.78;
      ctx.strokeStyle = "rgba(255, 106, 222, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const x = xn * Math.PI * 4;
        const Fval = Math.cos(x); // derivative of base sin(x)
        const px = padX + xn * innerW;
        const py = Fy + Famp * Fval;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("F = ∂A − ∂A   (invariant)", padX + innerW - 8, Fy - 14);

      // baselines
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padX + 6, Ay);
      ctx.lineTo(padX + innerW - 6, Ay);
      ctx.moveTo(padX + 6, Fy);
      ctx.lineTo(padX + innerW - 6, Fy);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── BOTTOM PANEL: closed surface, J_in = J_out ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, botY0, innerW, botH);

      ctx.fillStyle = colors.fg1;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "∂_μ J^μ = 0   (charge conservation, the Noether current)",
        padX + 6,
        botY0 + 16,
      );

      // amber closed-surface rectangle in the middle
      const surfX0 = padX + innerW * 0.30;
      const surfY0 = botY0 + botH * 0.30;
      const surfW = innerW * 0.40;
      const surfH = botH * 0.55;
      ctx.strokeStyle = "rgba(255, 180, 80, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(surfX0, surfY0, surfW, surfH);
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("∮ J · dA = 0", surfX0 + surfW / 2, surfY0 - 6);

      // J inflow arrows on the left edge, outflow on the right.
      // Animate so it's clearly a flow.
      const flowAnim = (Math.sin(t * 1.6) + 1) * 0.5; // 0..1
      const flowAlpha = 0.55 + 0.4 * flowAnim;
      const nArrows = 4;
      for (let i = 0; i < nArrows; i++) {
        const yA = surfY0 + (i + 0.5) * (surfH / nArrows);
        // inflow
        drawArrow(
          ctx,
          surfX0 - 60,
          yA,
          surfX0 - 6,
          yA,
          `rgba(255, 106, 222, ${flowAlpha.toFixed(3)})`,
          1.8,
        );
        // outflow
        drawArrow(
          ctx,
          surfX0 + surfW + 6,
          yA,
          surfX0 + surfW + 60,
          yA,
          `rgba(255, 106, 222, ${flowAlpha.toFixed(3)})`,
          1.8,
        );
      }

      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("J^μ in", surfX0 - 60, surfY0 - 4);
      ctx.textAlign = "right";
      ctx.fillText("J^μ out", surfX0 + surfW + 60, surfY0 - 4);

      // ── HUD line ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Gauge symmetry  ⟹  ∂_μ J^μ = 0     (Noether, 1918)",
        width / 2,
        height - 10,
      );

      // ── Λ readout (lilac, top-left of bottom panel)
      ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`Λ-amp = ${lam.toFixed(2)}`, padX + innerW - 8, botY0 + 16);
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
        <label className="text-sm text-[var(--color-fg-3)]">Λ-amp</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={lambdaAmp}
          onChange={(e) => setLambdaAmp(parseFloat(e.target.value))}
          className="flex-1 accent-[#C8A0FF]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {lambdaAmp.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Drag Λ — A wiggles, F stays put, J flows in equals J flows out. Every
        symmetry generates a conserved current. This is Noether's theorem.
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
  lineWidth: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(7, len * 0.3);
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
