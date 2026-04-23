"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { wavelengthToRGB } from "@/lib/physics/electromagnetism/visible-color";

const RATIO = 0.42;
const MAX_HEIGHT = 280;

/**
 * FIG.41b — the solar spectrum with Fraunhofer lines.
 *
 * A continuous visible rainbow from 380 nm (violet) to 780 nm (deep red),
 * rendered via a CIE 1931-style wavelength → sRGB mapping. Overlaid on the
 * rainbow are thin dark bands at the wavelengths where cool gases in the
 * Sun's outer atmosphere absorb specific photons — hydrogen, sodium,
 * calcium, magnesium, iron, oxygen — each leaving a razor-thin black slit
 * in the otherwise smooth gradient.
 *
 * Fraunhofer (Munich, 1814–1817) catalogued 576 of them and tagged the
 * strongest with letters A..K. Kirchhoff and Bunsen (Heidelberg, 1859)
 * matched the laboratory emission lines of heated salts to those exact
 * wavelengths — proving the Sun is made of the same elements we have on
 * Earth. Astrophysics as a quantitative science is born in that match.
 */

interface FraunhoferLine {
  readonly lambdaNm: number;
  readonly letter: string;
  readonly element: string;
  /** Relative strength 0..1 — controls how dark the line is drawn. */
  readonly strength: number;
}

// Classic Fraunhofer letters, plus common element tags. The wavelengths are
// the modern high-precision air values; Fraunhofer's original 1817 chart
// was drawn to the same lines but without knowing what was absorbing them.
const LINES: readonly FraunhoferLine[] = [
  { lambdaNm: 759.4, letter: "A", element: "O₂", strength: 0.8 },
  { lambdaNm: 687.0, letter: "B", element: "O₂", strength: 0.7 },
  { lambdaNm: 656.3, letter: "C", element: "H α", strength: 0.95 },
  { lambdaNm: 589.6, letter: "D₁", element: "Na", strength: 0.9 },
  { lambdaNm: 589.0, letter: "D₂", element: "Na", strength: 0.9 },
  { lambdaNm: 527.0, letter: "E", element: "Fe", strength: 0.6 },
  { lambdaNm: 518.4, letter: "b₁", element: "Mg", strength: 0.7 },
  { lambdaNm: 486.1, letter: "F", element: "H β", strength: 0.9 },
  { lambdaNm: 434.0, letter: "G", element: "H γ", strength: 0.8 },
  { lambdaNm: 430.8, letter: "G′", element: "Fe/Ca", strength: 0.7 },
  { lambdaNm: 396.8, letter: "H", element: "Ca II", strength: 1.0 },
  { lambdaNm: 393.4, letter: "K", element: "Ca II", strength: 1.0 },
];

const LAMBDA_MIN_NM = 380;
const LAMBDA_MAX_NM = 780;

export function FraunhoferLinesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 300 });

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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const marginX = 24;
      const plotW = width - 2 * marginX;
      const bandTop = height * 0.22;
      const bandH = Math.max(80, height * 0.48);
      const bandBottom = bandTop + bandH;

      const lambdaToPx = (nm: number) =>
        marginX + ((nm - LAMBDA_MIN_NM) / (LAMBDA_MAX_NM - LAMBDA_MIN_NM)) * plotW;

      // ─────── Continuous rainbow strip ───────
      // One vertical slice per pixel; the CIE mapping decides the colour.
      const steps = Math.floor(plotW);
      for (let i = 0; i < steps; i++) {
        const nm = LAMBDA_MIN_NM +
          ((i + 0.5) / steps) * (LAMBDA_MAX_NM - LAMBDA_MIN_NM);
        const rgb = wavelengthToRGB(nm);
        ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        ctx.fillRect(marginX + i, bandTop, 1, bandH);
      }

      // ─────── Dark absorption lines ───────
      for (const line of LINES) {
        const x = lambdaToPx(line.lambdaNm);
        const lineW = 1.2;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.55 + 0.4 * line.strength})`;
        ctx.fillRect(x - lineW / 2, bandTop, lineW, bandH);

        // Tick mark + letter below the band.
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, bandBottom);
        ctx.lineTo(x, bandBottom + 5);
        ctx.stroke();
        ctx.fillStyle = colors.fg1;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(line.letter, x, bandBottom + 6);
        ctx.fillStyle = colors.fg2;
        ctx.font = "8px monospace";
        ctx.fillText(line.element, x, bandBottom + 17);
      }

      // ─────── Axis: wavelength ticks every 50 nm ───────
      ctx.fillStyle = colors.fg2;
      ctx.strokeStyle = colors.fg3;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let nm = 400; nm <= 750; nm += 50) {
        const x = lambdaToPx(nm);
        ctx.beginPath();
        ctx.moveTo(x, bandTop - 3);
        ctx.lineTo(x, bandTop);
        ctx.stroke();
        ctx.fillText(`${nm}`, x, bandTop - 14);
      }
      // Axis units
      ctx.textAlign = "right";
      ctx.fillText("nm", width - marginX, bandTop - 14);

      // ─────── Captions ───────
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("Fraunhofer 1817 · 576 dark lines", marginX, 16);
      ctx.textAlign = "right";
      ctx.fillText(
        "Kirchhoff 1859 · same lines = element fingerprints",
        width - marginX,
        16,
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
    </div>
  );
}
