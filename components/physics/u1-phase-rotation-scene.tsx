"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { u1PhaseRotation } from "@/lib/physics/electromagnetism/gauge-theory";

/**
 * FIG.63a — U(1) phase rotation of a complex wave function ψ.
 *
 * Two side-by-side panels.
 *
 *   GLOBAL (left): a single rotation θ applied uniformly to ψ at every
 *   point. The wave function is drawn as a row of cyan disks, each with
 *   an arrow showing its phase. Under a global rotation every arrow
 *   sweeps through the same angle in lockstep — the kinetic term
 *   (∂_μψ)*(∂^μψ) is unchanged because every ψ picks up the same e^{iθ}.
 *
 *   LOCAL (right): the same row of ψ disks, but now θ = θ(x) varies
 *   smoothly along the row. Each arrow rotates by a different amount.
 *   The bare ∂_μψ is no longer covariant — the position-dependent θ
 *   spawns an extra ∂_μθ piece that ruins invariance unless absorbed
 *   into a gauge field A_μ → A_μ − ∂_μθ/q.
 *
 * Animation: a slow drift makes the rotation visible. A slider sets the
 * "amplitude" of the local phase variation θ_max along x.
 *
 * Palette:
 *   cyan    — wave function ψ disks and global phase arrows
 *   amber   — local θ(x) wedges (the position-dependent phase shift)
 *   lilac   — phase axis / U(1) marker
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const N_SAMPLES = 9;

export function U1PhaseRotationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [thetaMax, setThetaMax] = useState(1.4);
  const thetaMaxRef = useRef(thetaMax);
  useEffect(() => {
    thetaMaxRef.current = thetaMax;
  }, [thetaMax]);

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

      // Drift animation — global phase advances at constant rate; local
      // phase modulates with the same baseline plus a position-dependent
      // shift that wiggles slowly so the user sees it as motion.
      const baseTheta = 0.6 * t;
      const localAmp = thetaMaxRef.current;
      const localPhase = 0.4 * t;

      const panelW = width / 2;
      drawPanel(
        ctx,
        colors,
        0,
        0,
        panelW,
        height,
        "GLOBAL  ψ → e^{iθ}ψ",
        (i) => baseTheta,
        false,
      );
      drawPanel(
        ctx,
        colors,
        panelW,
        0,
        panelW,
        height,
        "LOCAL  ψ(x) → e^{iθ(x)}ψ(x)",
        (i) => {
          const xn = i / (N_SAMPLES - 1);
          return baseTheta + localAmp * Math.sin(2.4 * xn * Math.PI - localPhase);
        },
        true,
      );

      // Separator
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(panelW, 8);
      ctx.lineTo(panelW, height - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "global: every arrow rotates by the same θ — invariance is automatic",
        12,
        height - 22,
      );
      ctx.fillText(
        "local:  θ depends on x — bare ∂_μψ no longer covariant; needs A_μ",
        12,
        height - 8,
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
        <label className="text-sm text-[var(--color-fg-3)]">θ_max</label>
        <input
          type="range"
          min={0}
          max={Math.PI}
          step={0.01}
          value={thetaMax}
          onChange={(e) => setThetaMax(parseFloat(e.target.value))}
          className="flex-1 accent-[#FFB450]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {thetaMax.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Demanding local U(1) invariance under ψ → e^{`{iθ(x)}`}ψ forces the
        introduction of a gauge field A_μ that absorbs ∂_μθ. That field is
        electromagnetism.
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
  thetaAt: (i: number) => number,
  isLocal: boolean,
): void {
  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 4, y0 + 4, w - 8, h - 56);

  // Title
  ctx.fillStyle = isLocal ? "rgba(255, 180, 80, 0.95)" : colors.fg1;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x0 + 12, y0 + 22);

  // ── ψ row: N_SAMPLES disks across the panel.
  const padX = w * 0.10;
  const innerW = w - 2 * padX;
  const cy = y0 + h * 0.42;
  const r = Math.min(innerW / (N_SAMPLES * 2.4), h * 0.14);

  // Optional: a faint baseline "phase axis" lilac line
  ctx.strokeStyle = "rgba(200, 160, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(x0 + padX, cy);
  ctx.lineTo(x0 + padX + innerW, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < N_SAMPLES; i++) {
    const cx = x0 + padX + (i + 0.5) * (innerW / N_SAMPLES);
    const theta = thetaAt(i);

    // Reference (un-rotated) ψ taken to be {re=1, im=0} so the rotated
    // arrow's angle is θ itself.
    const psi = u1PhaseRotation({ re: 1, im: 0 }, theta);

    // Disk fill — translucent cyan; opacity tracks |θ| for visual punch
    // in the local panel.
    const alpha = 0.18 + 0.08 * Math.abs(Math.sin(theta));
    ctx.fillStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120, 220, 255, 0.7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Phase arrow
    const ax = cx + psi.re * r * 0.85;
    const ay = cy - psi.im * r * 0.85;
    drawArrow(ctx, cx, cy, ax, ay, "rgba(120, 220, 255, 0.95)", 1.6);

    // For LOCAL panel, draw an amber wedge from the global baseline (i=0
    // direction) to the actual θ — that wedge is the position-dependent
    // piece ∂_μθ.
    if (isLocal) {
      const baseDir = thetaAt(0);
      ctx.strokeStyle = "rgba(255, 180, 80, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        r * 0.55,
        -baseDir,
        -theta,
        theta < baseDir,
      );
      ctx.stroke();
    }
  }

  // x-axis label
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("x →", x0 + w / 2, y0 + h - 38);
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
  const head = Math.min(6, len * 0.4);
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
