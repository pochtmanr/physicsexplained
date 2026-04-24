"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.52c — Non-relativistic Larmor vs Liénard γ⁴ (perpendicular) vs γ⁶
 * (parallel) radiated power, plotted as a function of β = v/c.
 *
 * All three curves share the same non-relativistic prefactor
 *     P₀(a) = q² a² / (6π ε₀ c³).
 * Plotted are:
 *   · P / P₀  =  1            — non-relativistic Larmor (flat)
 *   · P / P₀  =  γ⁴           — perpendicular boost (synchrotron)
 *   · P / P₀  =  γ⁶           — parallel boost (linac, beyond nature)
 *
 * The y-axis is log₁₀(P/P₀) so the huge γ⁶ → ∞ divergence at β → 1
 * remains legible. Vertical guides mark β = 0.9, 0.99, 0.999 to give a
 * sense of how quickly synchrotron radiation takes over as electrons
 * approach c.
 *
 * No animation — static plot with a β-slider cursor. The cursor readout
 * shows γ, γ⁴, γ⁶ at the current slider value so a reader can pluck
 * specific comparisons out without reading off the axes.
 */

const RATIO = 0.58;
const MAX_HEIGHT = 400;

export function LarmorRelativisticComparisonScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });

  // β cursor. 0 to 0.9999. Default at 0.95 for a legible γ ≈ 3.2.
  const [beta, setBeta] = useState(0.95);

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

    const marginL = 58;
    const marginR = 24;
    const marginT = 28;
    const marginB = 56;
    const plotW = width - marginL - marginR;
    const plotH = height - marginT - marginB;

    const betaLo = 0;
    const betaHi = 0.999;
    const yLo = -0.3; // log10(1) = 0; pad down so the Larmor line is visible
    const yHi = 10; // γ⁶ at β = 0.999 → γ ≈ 22.4, γ⁶ ≈ 1.27 × 10⁸

    const xOf = (b: number) =>
      marginL + plotW * ((b - betaLo) / (betaHi - betaLo));
    const yOf = (logY: number) =>
      marginT + plotH * (1 - (logY - yLo) / (yHi - yLo));

    // ── grid ──
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (const b of [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.99, 0.999]) {
      const x = xOf(b);
      ctx.beginPath();
      ctx.moveTo(x, marginT);
      ctx.lineTo(x, marginT + plotH);
      ctx.stroke();
    }
    for (let k = 0; k <= 10; k += 2) {
      const y = yOf(k);
      ctx.beginPath();
      ctx.moveTo(marginL, y);
      ctx.lineTo(marginL + plotW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── axes ──
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(marginL, marginT);
    ctx.lineTo(marginL, marginT + plotH);
    ctx.lineTo(marginL + plotW, marginT + plotH);
    ctx.stroke();

    // x-axis ticks
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (const b of [0, 0.5, 0.9, 0.99, 0.999]) {
      const x = xOf(b);
      ctx.fillText(b.toString(), x, marginT + plotH + 14);
    }
    ctx.textAlign = "right";
    for (let k = 0; k <= 10; k += 2) {
      const y = yOf(k);
      ctx.fillText(`10^${k}`, marginL - 6, y + 3);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.fillText("β = v / c", marginL + plotW / 2, marginT + plotH + 32);
    ctx.save();
    ctx.translate(14, marginT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("P / P₀ (Larmor)", 0, 0);
    ctx.restore();

    // ── three curves ──
    const samples = 300;
    const drawCurve = (
      fn: (b: number) => number,
      color: string,
      lineWidth: number,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const b = betaLo + ((betaHi - betaLo) * i) / samples;
        const y = fn(b);
        const logY = Math.log10(Math.max(y, 1e-12));
        const x = xOf(b);
        const py = Math.min(
          Math.max(yOf(logY), marginT),
          marginT + plotH,
        );
        if (i === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    };

    const gammaOf = (b: number) => 1 / Math.sqrt(1 - b * b);
    // Non-rel Larmor (flat at y = 1)
    drawCurve(() => 1, "rgba(111, 184, 198, 0.85)", 2); // cyan
    // γ⁴ perpendicular
    drawCurve(
      (b) => gammaOf(b) ** 4,
      "rgba(255, 180, 80, 0.9)",
      2,
    ); // amber
    // γ⁶ parallel
    drawCurve(
      (b) => gammaOf(b) ** 6,
      "rgba(255, 106, 222, 0.9)",
      2,
    ); // magenta

    // ── β cursor ──
    const bx = xOf(beta);
    ctx.strokeStyle = "rgba(200, 160, 255, 0.65)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(bx, marginT);
    ctx.lineTo(bx, marginT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // readouts
    const gammaAtCursor = gammaOf(beta);
    const g4 = gammaAtCursor ** 4;
    const g6 = gammaAtCursor ** 6;

    // dot on each curve at the cursor
    const placeDot = (y: number, fill: string) => {
      const logY = Math.log10(Math.max(y, 1e-12));
      const py = Math.min(
        Math.max(yOf(logY), marginT),
        marginT + plotH,
      );
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(bx, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    };
    placeDot(1, "#6FB8C6");
    placeDot(g4, "#FFB450");
    placeDot(g6, "#FF6ADE");

    // legend (top-left)
    const legend: Array<[string, string]> = [
      ["P₀  (non-rel Larmor)", "#6FB8C6"],
      ["γ⁴ · P₀  (a ⊥ v — synchrotron)", "#FFB450"],
      ["γ⁶ · P₀  (a ∥ v — linac)", "#FF6ADE"],
    ];
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    for (let i = 0; i < legend.length; i++) {
      const [label, col] = legend[i]!;
      const ly = marginT + 6 + i * 14;
      ctx.fillStyle = col;
      ctx.fillRect(marginL + 6, ly, 10, 2);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(label, marginL + 22, ly + 4);
    }

    // cursor readout (top-right)
    ctx.textAlign = "right";
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    const rrX = width - marginR - 4;
    ctx.fillText(`β = ${beta.toFixed(3)}`, rrX, marginT + 12);
    ctx.fillText(`γ = ${gammaAtCursor.toFixed(2)}`, rrX, marginT + 26);
    ctx.fillStyle = "#FFB450";
    ctx.fillText(
      `γ⁴ = ${formatSci(g4)}`,
      rrX,
      marginT + 40,
    );
    ctx.fillStyle = "#FF6ADE";
    ctx.fillText(
      `γ⁶ = ${formatSci(g6)}`,
      rrX,
      marginT + 54,
    );
  }, [size, colors, beta]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">β = v/c</label>
        <input
          type="range"
          min={0}
          max={0.999}
          step={0.001}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta.toFixed(3)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Non-relativistic Larmor stays flat; perpendicular acceleration picks up
        γ⁴, parallel acceleration γ⁶. By β = 0.999 the parallel case is already
        10⁸ times non-relativistic.
      </div>
    </div>
  );
}

function formatSci(x: number): string {
  if (x < 1000 && x >= 0.01) return x.toFixed(2);
  const exp = Math.floor(Math.log10(x));
  const mant = x / 10 ** exp;
  return `${mant.toFixed(1)}e${exp}`;
}
