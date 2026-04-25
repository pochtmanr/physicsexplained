"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  anomalousMagneticMomentLeadingOrder,
  runningCouplingAlpha,
} from "@/lib/physics/electromagnetism/qed-classical-limit";
import { ALPHA_FINE, ELECTRON_MASS, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * FIG.66c — Two faces of QED's small corrections.
 *
 * LEFT panel: g − 2 of the electron, partial sums by loop order, converging
 * onto the experimental value. Schwinger 1948 wrote down the leading term,
 * α/(2π) ≈ 0.00116. Higher-order coefficients (Petermann–Sommerfield 1957,
 * Kinoshita and collaborators since) bring the prediction to 1 part in 10^12
 * agreement with measurement. We plot:
 *
 *   a_e^{(1)} = 0.5·(α/π)
 *   a_e^{(2)} = a_e^{(1)} + (-0.328478965…)·(α/π)²
 *   a_e^{(3)} = a_e^{(2)} + (1.181241456…)·(α/π)³
 *   a_e^{(4)} = a_e^{(3)} + (-1.9106…)·(α/π)⁴
 *   a_e^{(5)} = a_e^{(4)} + (9.16…)·(α/π)⁵
 *
 * with the experimental band drawn as a magenta horizontal line. Each
 * additional loop order corrects the previous prediction by a factor of
 * about α/π ~ 2 × 10^{-3}.
 *
 * RIGHT panel: α(E), the running fine-structure constant, on a log-E axis.
 * Plotted from m_e c² up to the LEP scale (~M_Z ≈ 91 GeV). Climbs from
 * 1/137 to about 1/128 — a small but well-measured change. Beyond M_Z the
 * curve continues to creep up; the Landau pole sits at ridiculously high
 * energy (≈ 10^{286} GeV) outside the validity of QED proper anyway. The
 * pale-grey wash on the right marks "QED breaks; embed into electroweak."
 *
 * Palette:
 *   amber    — partial sums of g − 2 by loop order
 *   magenta  — experimental value (and α/π correction marker)
 *   cyan     — running α(E)
 *   lilac    — energy gridlines
 *   pale-grey — Landau-pole / electroweak embedding wash
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

// Coefficients of (α/π)^n in the QED series for a_e = (g − 2)/2.
// Values from Aoyama–Hayakawa–Kinoshita–Nio reviews; only the magnitudes
// matter for visual convergence in the chart. (We are well inside
// double-precision throughout.)
const A_E_COEFFS = [
  0.5,                   // n = 1, Schwinger 1948
  -0.328478965579193,    // n = 2, Petermann/Sommerfield 1957
  1.181241456587,        // n = 3, Laporta–Remiddi 1996
  -1.9106,               // n = 4, Kinoshita et al
  9.16,                  // n = 5, Aoyama et al 2017
];

// The numerical "experimental" target for a_e in our chart units. Matches
// the n=5 partial sum within a tiny offset; for the visual it's drawn as
// a horizontal line that the partial sums step onto.
const A_E_EXPERIMENT = sumPartial(A_E_COEFFS.length);

function sumPartial(uptoOrder: number): number {
  const r = ALPHA_FINE / Math.PI;
  let s = 0;
  let pow = 1;
  for (let n = 1; n <= uptoOrder; n++) {
    pow *= r;
    s += A_E_COEFFS[n - 1] * pow;
  }
  return s;
}

export function RunningCouplingAndCorrectionsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  // Slider: highlighted loop order on the left panel (1..5)
  const [loopOrder, setLoopOrder] = useState(5);
  const loopOrderRef = useRef(loopOrder);
  useEffect(() => {
    loopOrderRef.current = loopOrder;
  }, [loopOrder]);

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

      const order = loopOrderRef.current;

      const panelW = width / 2;
      drawAnomalousMomentPanel(ctx, colors, 0, 0, panelW, height, order);
      drawRunningCouplingPanel(ctx, colors, panelW, 0, panelW, height);

      // Separator
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(panelW, 8);
      ctx.lineTo(panelW, height - 8);
      ctx.stroke();
      ctx.setLineDash([]);
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
        <label className="text-sm text-[var(--color-fg-3)]">loop order</label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={loopOrder}
          onChange={(e) => setLoopOrder(parseInt(e.target.value, 10))}
          className="flex-1 accent-[#FFB450]"
        />
        <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
          n = {loopOrder}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Left: partial sums of g − 2 by loop order; each new loop adds a
        factor of α/π ~ 0.002 toward experiment. Right: α(E) running from
        1/137 at m_e c² to ~1/128 at the Z scale; the pale-grey region marks
        "QED is an effective theory below electroweak."
      </div>
    </div>
  );
}

function drawAnomalousMomentPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x0: number,
  y0: number,
  w: number,
  h: number,
  highlightOrder: number,
): void {
  const padX = 36;
  const padTop = 22;
  const padBot = 36;
  const innerW = w - 2 * padX;
  const innerH = h - padTop - padBot;
  const ix = x0 + padX;
  const iy = y0 + padTop;
  const iy1 = iy + innerH;

  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(ix, iy, innerW, innerH);

  ctx.fillStyle = colors.fg2;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("a_e = (g − 2) / 2  —  partial sums by loop order", ix + 6, iy + 14);

  // y-scale: encompass 0 and the experimental value with margin.
  const yMax = A_E_EXPERIMENT * 1.05;
  const yMin = 0;
  const yToPx = (v: number) =>
    iy1 - ((v - yMin) / (yMax - yMin)) * (innerH - 18);

  // Horizontal experimental line
  const yExp = yToPx(A_E_EXPERIMENT);
  ctx.strokeStyle = "rgba(255, 106, 222, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(ix + 4, yExp);
  ctx.lineTo(ix + innerW - 4, yExp);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText("experiment (1 part in 10¹²)", ix + innerW - 8, yExp - 4);

  // Bars: one per loop order n = 1..5
  const orderCount = A_E_COEFFS.length;
  const barW = (innerW - 16) / orderCount;
  for (let n = 1; n <= orderCount; n++) {
    const partial = sumPartial(n);
    const bx = ix + 8 + (n - 1) * barW;
    const by = yToPx(partial);
    const isHighlight = n === highlightOrder;
    ctx.fillStyle = isHighlight
      ? "rgba(255, 180, 80, 0.95)"
      : "rgba(255, 180, 80, 0.45)";
    ctx.fillRect(bx + 2, by, Math.max(barW - 6, 2), iy1 - by);

    // Order label below the bar
    ctx.fillStyle = colors.fg2;
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`n=${n}`, bx + barW / 2, iy1 + 12);

    // Partial-sum readout on top of the highlighted bar
    if (isHighlight) {
      ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(partial.toExponential(4), bx + barW / 2, by - 4);
    }
  }

  // Schwinger marker: α/(2π)
  const schw = anomalousMagneticMomentLeadingOrder();
  const ySchw = yToPx(schw);
  ctx.strokeStyle = "rgba(255, 180, 80, 0.5)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(ix + 4, ySchw);
  ctx.lineTo(ix + innerW - 4, ySchw);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 180, 80, 0.85)";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Schwinger α/2π", ix + 8, ySchw - 4);
}

function drawRunningCouplingPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x0: number,
  y0: number,
  w: number,
  h: number,
): void {
  const padX = 36;
  const padTop = 22;
  const padBot = 36;
  const innerW = w - 2 * padX;
  const innerH = h - padTop - padBot;
  const ix = x0 + padX;
  const iy = y0 + padTop;
  const iy1 = iy + innerH;

  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(ix, iy, innerW, innerH);

  ctx.fillStyle = colors.fg2;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("α(E) — fine-structure constant running with energy", ix + 6, iy + 14);

  // Energy axis: log-spaced from m_e c² (=0.511 MeV) up to ~100 TeV in J.
  const meRest = ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
  const eMin = meRest;                           // 0.511 MeV in joules
  const eMax = meRest * 1e8;                     // ~50 TeV
  const logMin = Math.log10(eMin);
  const logMax = Math.log10(eMax);
  const logE = (e: number) => (Math.log10(e) - logMin) / (logMax - logMin);

  // Sample α(E)
  const samples = 200;
  const alphaValues: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const logEi = logMin + f * (logMax - logMin);
    const e = Math.pow(10, logEi);
    alphaValues.push(runningCouplingAlpha(e));
  }
  // y-axis: 1/α from ~120 to ~140
  const invAlphaMax = 140;
  const invAlphaMin = 120;
  const yToPx = (invA: number) =>
    iy1 - ((invA - invAlphaMin) / (invAlphaMax - invAlphaMin)) * (innerH - 18);

  // Horizontal gridlines at 1/137 and 1/128 references
  for (const v of [137, 130, 128]) {
    const y = yToPx(v);
    ctx.strokeStyle = "rgba(200, 160, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(ix + 4, y);
    ctx.lineTo(ix + innerW - 4, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(200, 160, 255, 0.7)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`1/${v}`, ix + 6, y - 2);
  }

  // Pale-grey breakdown wash for E > M_Z (we use ~M_Z = 91 GeV ≈ 1.46e-8 J)
  const mZ = 91.1876e9 * 1.602176634e-19; // GeV → J
  const xMz = ix + logE(mZ) * innerW;
  ctx.fillStyle = "rgba(180, 170, 200, 0.10)";
  ctx.fillRect(xMz, iy + 1, ix + innerW - xMz, innerH - 1);
  ctx.strokeStyle = "rgba(180, 170, 200, 0.55)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xMz, iy + 4);
  ctx.lineTo(xMz, iy1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(180, 170, 200, 0.9)";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("M_Z → embed in EW", xMz + 4, iy + 26);

  // Plot α(E) as 1/α(E) on y-axis
  ctx.strokeStyle = "rgba(96, 220, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const logEi = logMin + f * (logMax - logMin);
    const e = Math.pow(10, logEi);
    const a = alphaValues[i];
    if (!Number.isFinite(a) || a <= 0) continue;
    const px = ix + logE(e) * innerW;
    const py = yToPx(1 / a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Labelled markers
  const markEnergies: { e: number; label: string }[] = [
    { e: meRest, label: "m_e c²" },
    { e: 1e9 * 1.602176634e-19, label: "1 GeV" },
    { e: mZ, label: "M_Z" },
  ];
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  for (const m of markEnergies) {
    const px = ix + logE(m.e) * innerW;
    if (px < ix || px > ix + innerW) continue;
    ctx.fillStyle = "rgba(96, 220, 255, 0.55)";
    ctx.fillRect(px - 0.5, iy1 - 4, 1, 8);
    ctx.fillStyle = colors.fg2;
    ctx.fillText(m.label, px, iy1 + 12);
  }

  // Numeric readouts
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText(
    `α(m_e) = 1/${(1 / runningCouplingAlpha(meRest)).toFixed(2)}`,
    ix + innerW - 8,
    iy + 26,
  );
  ctx.fillText(
    `α(M_Z) ≈ 1/${(1 / runningCouplingAlpha(mZ)).toFixed(1)}`,
    ix + innerW - 8,
    iy + 40,
  );
}
