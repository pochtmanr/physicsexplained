"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { ELEMENTARY_CHARGE, SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { equivalenceCheck } from "@/lib/physics/electromagnetism/relativistic-magnetism";
import {
  BetaSlider,
  formatBeta,
  formatSci,
  SCENE_D,
  SCENE_N0,
  useSharedBeta,
} from "./two-wire-lab-frame-scene";

/**
 * FIG.61c — Force-equivalence readout.
 *
 * Two stacked horizontal bars: F_mag (computed from μ₀ I² / 2π d in the lab
 * frame) and F_elec (computed from ρ_net² / (2π ε₀ d) in the electron rest
 * frame, then transformed back to the lab via F_lab = F_rest / γ). Both
 * bars track exactly together as β slides — that's the point. A small
 * "match" badge confirms that ratio = 1 to numerical tolerance.
 *
 * Bars are drawn on a log scale because both forces span ~25 orders of
 * magnitude across the β slider's range (10⁻¹² up to 0.99).
 */

const RATIO = 0.42;
const MAX_HEIGHT = 280;

export function ForceEquivalenceReadoutScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const beta = useSharedBeta();

  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 640, height: 280 });
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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const b = betaRef.current;
      const v = b * SPEED_OF_LIGHT;
      const I = SCENE_N0 * ELEMENTARY_CHARGE * v;
      const { fMag, fElec, ratio } = equivalenceCheck(I, SCENE_N0, v, SCENE_D);

      // ── log-scale axis ────────────────────────────────────────────────
      // Both forces vary as β² · constant. The constant for our copper-like
      // benchmark (n₀ = 10²⁹, d = 1 cm) caps F at ~10⁵ N/m at β = 1.
      // Map log10(F) ∈ [logMin, logMax] → x ∈ [padX, width − padX].
      const padX = 90;
      const padY = 70;
      const logMin = -22;
      const logMax = 5;
      const axisL = padX;
      const axisR = width - padX - 14;
      const axisLen = axisR - axisL;

      const logF = (F: number) =>
        F <= 0 ? logMin : Math.max(logMin, Math.min(logMax, Math.log10(F)));
      const xOf = (F: number) =>
        axisL + ((logF(F) - logMin) / (logMax - logMin)) * axisLen;

      // ── axis line ─────────────────────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(axisL, height - padY);
      ctx.lineTo(axisR, height - padY);
      ctx.stroke();

      // ── axis ticks at every 5 decades ────────────────────────────────
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let lg = logMin; lg <= logMax; lg += 5) {
        const x = axisL + ((lg - logMin) / (logMax - logMin)) * axisLen;
        ctx.strokeStyle = colors.fg3;
        ctx.beginPath();
        ctx.moveTo(x, height - padY);
        ctx.lineTo(x, height - padY + 5);
        ctx.stroke();
        ctx.fillText(`10${superscript(lg)}`, x, height - padY + 18);
      }
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("F / (N/m)", axisR + 4, height - padY + 4);

      // ── F_mag bar (cyan) ──────────────────────────────────────────────
      const yMag = padY + 10;
      const yElec = padY + 56;
      drawBar(ctx, axisL, yMag, xOf(fMag), 18, "rgba(111, 184, 198, 0.85)");
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "right";
      ctx.font = "12px monospace";
      ctx.fillText("F_mag (lab)", axisL - 8, yMag + 13);

      // ── F_elec bar (magenta) ──────────────────────────────────────────
      drawBar(ctx, axisL, yElec, xOf(fElec), 18, "rgba(255, 106, 222, 0.85)");
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("F_elec (lab)", axisL - 8, yElec + 13);

      // ── live numerical readouts at the bar tips ──────────────────────
      ctx.textAlign = "left";
      ctx.font = "11px monospace";
      ctx.fillStyle = "rgba(111, 184, 198, 1)";
      ctx.fillText(formatSci(fMag), xOf(fMag) + 6, yMag + 13);
      ctx.fillStyle = "rgba(255, 106, 222, 1)";
      ctx.fillText(formatSci(fElec), xOf(fElec) + 6, yElec + 13);

      // ── header HUD ────────────────────────────────────────────────────
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("THE EQUIVALENCE", 14, 22);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `β = ${formatBeta(b)}    F_elec / F_mag = ${ratio.toFixed(6)}`,
        width - 14,
        22,
      );

      // ── badge: same force, different name ─────────────────────────────
      const matched = Math.abs(ratio - 1) < 1e-6;
      ctx.fillStyle = matched
        ? "rgba(111, 184, 198, 0.18)"
        : "rgba(255, 106, 222, 0.18)";
      const badgeY = padY - 28;
      const badgeText = matched
        ? "Same force, different name."
        : "Disagreement — check β";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      const badgeW = ctx.measureText(badgeText).width + 24;
      const badgeX = width / 2 - badgeW / 2;
      ctx.fillRect(badgeX, badgeY, badgeW, 22);
      ctx.fillStyle = matched
        ? "rgba(111, 184, 198, 1)"
        : "rgba(255, 106, 222, 1)";
      ctx.fillText(badgeText, width / 2, badgeY + 15);

      // ── footer ────────────────────────────────────────────────────────
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "computed in two frames, plotted on a single axis — the bars track in lockstep",
        width / 2,
        height - 10,
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
      <BetaSlider />
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        F_mag from the lab frame (μ₀I²/2πd). F_elec from the electron rest
        frame, transformed back to the lab via F_lab = F_rest/γ. The two are
        algebraically identical — Purcell's two-wire equivalence at every β.
      </div>
    </div>
  );
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y: number,
  x1: number,
  h: number,
  color: string,
) {
  if (x1 <= x0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x0, y, x1 - x0, h);
}

const SUPER_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function superscript(n: number): string {
  const sign = n < 0 ? "⁻" : "";
  const abs = Math.abs(n);
  return (
    sign +
    String(abs)
      .split("")
      .map((d) => SUPER_DIGITS[parseInt(d, 10)] ?? d)
      .join("")
  );
}
