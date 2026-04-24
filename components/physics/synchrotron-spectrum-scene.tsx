"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { syncSpectrumShape } from "@/lib/physics/electromagnetism/synchrotron";

const AMBER = "rgba(255, 180, 80,";
const ORANGE = "rgba(255, 140, 80,";
const CYAN = "rgba(120, 220, 255,";
const LILAC = "rgba(200, 160, 255,";

const WIDTH = 720;
const HEIGHT = 420;
const RATIO = HEIGHT / WIDTH;
const MAX_HEIGHT = 500;

const X_MIN_LOG = -4; // x = 10⁻⁴ ω_c
const X_MAX_LOG = 1.3; // x ≈ 20 ω_c
const SAMPLES = 640;

/**
 * FIG.55b — Synchrotron universal spectrum.
 *
 * A log-log plot of F(x) where x = ω/ω_c. Two regimes are annotated:
 *
 *   - soft end (x ≪ 1):  F ∝ x^(1/3) — the characteristic synchrotron rise
 *   - hard end (x ≫ 1):  F ∝ √x · exp(−x) — the exponential cutoff
 *
 * The critical frequency ω_c is marked as a vertical reference line. Both
 * asymptotes are drawn in as thin dashed guides so the reader can see the
 * numerical spectrum match them at the extremes.
 */
export function SynchrotronSpectrumScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: WIDTH, height: HEIGHT });

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

  useEffect(() => {
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

    const padL = 68;
    const padR = 24;
    const padT = 36;
    const padB = 52;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Build samples in log(x) space
    const samples: { logx: number; F: number }[] = new Array(SAMPLES);
    let fMax = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const logx = X_MIN_LOG + (i / (SAMPLES - 1)) * (X_MAX_LOG - X_MIN_LOG);
      const x = Math.pow(10, logx);
      const F = syncSpectrumShape(x);
      samples[i] = { logx, F };
      if (F > fMax) fMax = F;
    }
    // y axis: plot log₁₀(F). Choose a floor that keeps the rising tail visible.
    const yMinLog = -6;
    const yMaxLog = Math.log10(fMax) + 0.2;

    const xToPx = (logx: number) =>
      padL + ((logx - X_MIN_LOG) / (X_MAX_LOG - X_MIN_LOG)) * plotW;
    const yToPx = (logy: number) =>
      padT + ((yMaxLog - logy) / (yMaxLog - yMinLog)) * plotH;

    // Background
    ctx.fillStyle = `${CYAN} 0.03)`;
    ctx.fillRect(padL, padT, plotW, plotH);

    // Gridlines (decades)
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (let lx = Math.ceil(X_MIN_LOG); lx <= X_MAX_LOG; lx += 1) {
      const px = xToPx(lx);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();
    }
    for (let ly = Math.ceil(yMinLog); ly <= yMaxLog; ly += 1) {
      const py = yToPx(ly);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axis frame
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Axis tick labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let lx = Math.ceil(X_MIN_LOG); lx <= X_MAX_LOG; lx += 1) {
      const px = xToPx(lx);
      ctx.fillText(`10${sup(lx)}`, px, padT + plotH + 14);
    }
    ctx.textAlign = "right";
    for (let ly = Math.ceil(yMinLog); ly <= yMaxLog; ly += 1) {
      const py = yToPx(ly);
      ctx.fillText(`10${sup(ly)}`, padL - 6, py + 3);
    }

    // ω_c reference line (x = 1)
    const wcPx = xToPx(0);
    ctx.strokeStyle = `${LILAC} 0.7)`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(wcPx, padT);
    ctx.lineTo(wcPx, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `${LILAC} 0.95)`;
    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    ctx.fillText("ω = ω_c", wcPx + 4, padT + 12);

    // Asymptote guides — x^(1/3) rise at the soft end, √x exp(-x) at the hard end
    ctx.strokeStyle = `${AMBER} 0.35)`;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    // low-x asymptote
    ctx.beginPath();
    for (let lx = X_MIN_LOG; lx <= 0; lx += 0.05) {
      const x = Math.pow(10, lx);
      const F = 2.15 * Math.cbrt(x);
      const ly = Math.log10(F);
      if (ly < yMinLog) continue;
      const px = xToPx(lx);
      const py = yToPx(ly);
      if (lx === X_MIN_LOG) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // high-x asymptote
    ctx.beginPath();
    for (let lx = 0; lx <= X_MAX_LOG; lx += 0.03) {
      const x = Math.pow(10, lx);
      const F = 1.25 * Math.sqrt(x) * Math.exp(-x);
      if (F <= 0) continue;
      const ly = Math.log10(F);
      if (ly < yMinLog) continue;
      const px = xToPx(lx);
      const py = yToPx(ly);
      if (lx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Main curve: F(x)
    ctx.strokeStyle = `${ORANGE} 0.95)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (const s of samples) {
      if (s.F <= 0) continue;
      const ly = Math.log10(s.F);
      if (ly < yMinLog) continue;
      const px = xToPx(s.logx);
      const py = yToPx(ly);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Annotations
    ctx.font = "10.5px monospace";
    ctx.fillStyle = `${AMBER} 0.9)`;
    ctx.textAlign = "left";
    ctx.fillText("F ~ x^(1/3)", xToPx(-3.3), yToPx(Math.log10(2.15 * Math.cbrt(1e-3))) - 6);
    ctx.textAlign = "right";
    ctx.fillText("F ~ √x · e^(−x)", xToPx(0.85), yToPx(Math.log10(1.25 * Math.sqrt(5) * Math.exp(-5))) - 6);

    // Title + axis labels
    ctx.fillStyle = colors.fg1;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText("SYNCHROTRON · universal spectrum F(ω/ω_c)", padL, padT - 14);

    ctx.fillStyle = colors.fg2;
    ctx.font = "10.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ω / ω_c  (log scale)", padL + plotW / 2, height - 14);

    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("F(ω/ω_c)  (log scale)", 0, 0);
    ctx.restore();

    // Corner caption
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      "broadband: radio at x ≪ 1, hard X-ray near x ~ 1",
      padL + plotW,
      padT - 14,
    );
  }, [size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        One curve describes every synchrotron source. Scale horizontally by
        ω_c = (3/2) γ³ c / R to put the cutoff wherever the machine lives — mm
        for a 1 GeV ring, hard X-ray for a 6 GeV storage ring, soft gamma for
        the Crab Nebula pulsar wind.
      </p>
    </div>
  );
}

function sup(n: number): string {
  const table: Record<string, string> = {
    "-": "\u207B",
    "0": "\u2070",
    "1": "\u00B9",
    "2": "\u00B2",
    "3": "\u00B3",
    "4": "\u2074",
    "5": "\u2075",
    "6": "\u2076",
    "7": "\u2077",
    "8": "\u2078",
    "9": "\u2079",
  };
  return String(n)
    .split("")
    .map((c) => table[c] ?? c)
    .join("");
}
