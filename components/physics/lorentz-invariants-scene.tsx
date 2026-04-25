"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { transformFields } from "@/lib/physics/electromagnetism/relativity";
import {
  lorentzInvariantEDotB,
  lorentzInvariantE2MinusC2B2,
} from "@/lib/physics/electromagnetism/em-lorentz-transform";

/**
 * FIG.59b — The two Lorentz invariants of the EM field, plotted as horizontal
 * bars whose heights track |I₁| = |E·B| and |I₂| = ||E|² − c²|B|²|.
 *
 * Input field: E = (1e3, 1e3, 0) V/m, B = (0, 0, 1e-5) T.
 *
 *   I₁(lab) = (1e3)(0) + (1e3)(0) + (0)(1e-5) = 0
 *   I₂(lab) = 2e6 − c²·1e-10 ≈ 1.0e6 V²/m² (since c²·1e-10 ≈ 8.99e6)
 *     → actually slightly negative; classification is "magnetic-like".
 *
 * As β sweeps from −0.99 to +0.99 along +x, the invariants stay flat
 * (each pair coincides exactly under transformFields). Individual |E|
 * and |B| readouts in the HUD vary wildly.
 *
 * Palette:
 *   lilac   — invariant bars (both I₁ and I₂)
 *   magenta — instantaneous |E| readout
 *   cyan    — instantaneous |B| readout
 */

const RATIO = 0.5;
const MAX_HEIGHT = 380;

const E_LAB = { x: 1e3, y: 1e3, z: 0 };
const B_LAB = { x: 0, y: 0, z: 1e-5 };
const C = SPEED_OF_LIGHT;

export function LorentzInvariantsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.5);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = size;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // ── compute lab and boosted invariants + magnitudes ──
    const i1Lab = lorentzInvariantEDotB(E_LAB, B_LAB);
    const i2Lab = lorentzInvariantE2MinusC2B2(E_LAB, B_LAB);
    const { E: Ep, B: Bp } = transformFields(E_LAB, B_LAB, beta);
    const i1Boost = lorentzInvariantEDotB(Ep, Bp);
    const i2Boost = lorentzInvariantE2MinusC2B2(Ep, Bp);

    const Emag = Math.sqrt(Ep.x ** 2 + Ep.y ** 2 + Ep.z ** 2);
    const Bmag = Math.sqrt(Bp.x ** 2 + Bp.y ** 2 + Bp.z ** 2);
    const EmagLab = Math.sqrt(E_LAB.x ** 2 + E_LAB.y ** 2 + E_LAB.z ** 2);
    const BmagLab = Math.sqrt(B_LAB.x ** 2 + B_LAB.y ** 2 + B_LAB.z ** 2);

    const marginL = 130;
    const marginR = 24;
    const marginT = 30;
    const marginB = 90;
    const plotW = width - marginL - marginR;
    const plotH = height - marginT - marginB;

    // Reference scales chosen so both bars fill ~75% of plot at lab values.
    const i1Ref = Math.max(1e-30, Math.abs(EmagLab * BmagLab));
    const i2Ref = Math.max(1e-30, Math.abs(EmagLab ** 2) + C * C * BmagLab ** 2);

    const bars = [
      {
        label: "|I₁| = |E·B|",
        labLab: i1Lab,
        labBoost: i1Boost,
        ref: i1Ref,
        units: "V·T/m",
      },
      {
        label: "|I₂| = ||E|²−c²|B|²|",
        labLab: i2Lab,
        labBoost: i2Boost,
        ref: i2Ref,
        units: "V²/m²",
      },
    ];

    const barH = plotH / 3.5;
    const barGap = barH * 0.6;
    const lilac = "rgba(200, 160, 255, 0.85)";
    const lilacFill = "rgba(200, 160, 255, 0.25)";

    // baseline x = marginL
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = colors.fg2;

    bars.forEach((bar, idx) => {
      const yTop = marginT + 20 + idx * (barH + barGap);
      const fracLab = Math.min(1, Math.abs(bar.labLab) / bar.ref);
      const fracBoost = Math.min(1, Math.abs(bar.labBoost) / bar.ref);

      // Label on the left
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(bar.label, marginL - 12, yTop + barH * 0.6);

      // Background outline rect (full width)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.strokeRect(marginL, yTop, plotW, barH);
      ctx.setLineDash([]);

      // Lab bar (lighter, overlay)
      ctx.fillStyle = lilacFill;
      ctx.fillRect(marginL, yTop, plotW * fracLab, barH);

      // Boost bar (solid line outline)
      ctx.strokeStyle = lilac;
      ctx.lineWidth = 2;
      ctx.strokeRect(marginL, yTop, plotW * fracBoost, barH);

      // numerical readouts
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(
        `lab: ${formatSci(bar.labLab)}    boost: ${formatSci(bar.labBoost)}    ${bar.units}`,
        marginL + 6,
        yTop + barH + 14,
      );
    });

    // ── HUD: |E|, |B|, β, γ ──
    const hudY = height - marginB + 30;
    const g = 1 / Math.sqrt(1 - beta * beta);

    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
    ctx.fillText(`|E'| = ${formatSci(Emag)} V/m`, marginL, hudY);
    ctx.fillStyle = "rgba(111, 184, 198, 0.95)";
    ctx.fillText(`|B'| = ${formatSci(Bmag)} T`, marginL + 200, hudY);
    ctx.fillStyle = colors.fg1;
    ctx.fillText(
      `β = ${beta.toFixed(2)}    γ = ${g.toFixed(3)}`,
      marginL + 400,
      hudY,
    );

    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.fillText(
      `lab |E| = ${formatSci(EmagLab)} V/m    lab |B| = ${formatSci(BmagLab)} T`,
      marginL,
      hudY + 18,
    );
    ctx.fillText(
      "Two lilac bars stay locked across all β. Individual |E| and |B| do not.",
      marginL,
      hudY + 36,
    );

    // ── Title ──
    ctx.fillStyle = colors.fg1;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Lorentz invariants of E and B", marginL - 110, marginT - 10);
    ctx.textAlign = "right";
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.fillText("E = (1e3, 1e3, 0) V/m   B = (0, 0, 1e-5) T", width - marginR, marginT - 10);
  }, [size, beta, colors]);

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
          min={-0.99}
          max={0.99}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
          β = {beta.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        I₁ = E·B and I₂ = |E|²−c²|B|² are the two Lorentz scalars of the EM field.
        Slide β; the bars do not move.
      </div>
    </div>
  );
}

function formatSci(v: number): string {
  if (Math.abs(v) < 1e-30) return "0";
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  const exp = Math.floor(Math.log10(a));
  const mant = a / Math.pow(10, exp);
  return `${sign}${mant.toFixed(2)}e${exp >= 0 ? "+" : ""}${exp}`;
}
