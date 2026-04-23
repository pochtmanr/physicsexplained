"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  frequencyFromWavelength,
  photonEnergyInEV,
} from "@/lib/physics/electromagnetism/em-spectrum";
import { wavelengthToRGB } from "@/lib/physics/electromagnetism/visible-color";

const RATIO = 0.52;
const MAX_HEIGHT = 340;

const LAMBDA_MIN_NM = 380;
const LAMBDA_MAX_NM = 780;

/**
 * FIG.41c — the visible band, zoomed.
 *
 * A slider drags a vertical needle across the 380–780 nm rainbow. The HUD
 * reports the pure colour at that wavelength (as a swatch), plus f = c/λ
 * in THz and the photon energy in eV. At the 550 nm default, readers see
 * "green-yellow, 545 THz, 2.25 eV" — the same three numbers three-quarters
 * of quantum mechanics are built around.
 */
export function VisibleBandZoomScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 340 });

  const [lambdaNm, setLambdaNm] = useState(550);
  const lambdaRef = useRef(lambdaNm);
  useEffect(() => {
    lambdaRef.current = lambdaNm;
  }, [lambdaNm]);

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

      const marginX = 28;
      const plotW = width - 2 * marginX;
      const bandTop = height * 0.22;
      const bandH = Math.max(70, height * 0.36);
      const bandBottom = bandTop + bandH;

      const lambdaToPx = (nm: number) =>
        marginX + ((nm - LAMBDA_MIN_NM) / (LAMBDA_MAX_NM - LAMBDA_MIN_NM)) * plotW;

      // ─────── Rainbow strip ───────
      const steps = Math.floor(plotW);
      for (let i = 0; i < steps; i++) {
        const nm = LAMBDA_MIN_NM +
          ((i + 0.5) / steps) * (LAMBDA_MAX_NM - LAMBDA_MIN_NM);
        const rgb = wavelengthToRGB(nm);
        ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        ctx.fillRect(marginX + i, bandTop, 1, bandH);
      }

      // ─────── Wavelength tick axis ───────
      ctx.fillStyle = colors.fg2;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let nm = 400; nm <= 750; nm += 50) {
        const x = lambdaToPx(nm);
        ctx.beginPath();
        ctx.moveTo(x, bandBottom);
        ctx.lineTo(x, bandBottom + 4);
        ctx.stroke();
        ctx.fillText(`${nm} nm`, x, bandBottom + 6);
      }

      // ─────── Slider needle ───────
      const sel = lambdaRef.current;
      const selX = lambdaToPx(sel);
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(selX, bandTop - 10);
      ctx.lineTo(selX, bandBottom + 2);
      ctx.stroke();
      // Needle arrowhead
      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.moveTo(selX, bandTop - 14);
      ctx.lineTo(selX - 5, bandTop - 5);
      ctx.lineTo(selX + 5, bandTop - 5);
      ctx.closePath();
      ctx.fill();

      // ─────── HUD: swatch + numbers ───────
      const selRGB = wavelengthToRGB(sel);
      const f = frequencyFromWavelength(sel * 1e-9);
      const eV = photonEnergyInEV(sel * 1e-9);

      const hudY = bandBottom + 40;
      const swatchSize = 36;
      ctx.fillStyle = `rgb(${selRGB.r}, ${selRGB.g}, ${selRGB.b})`;
      ctx.fillRect(marginX, hudY, swatchSize, swatchSize);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(marginX, hudY, swatchSize, swatchSize);

      ctx.fillStyle = colors.fg1;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(
        `λ = ${sel.toFixed(0)} nm   (${nameColour(sel)})`,
        marginX + swatchSize + 12,
        hudY + 14,
      );
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(
        `f = c/λ = ${(f / 1e12).toFixed(1)} THz       E_photon = hc/λ = ${eV.toFixed(2)} eV`,
        marginX + swatchSize + 12,
        hudY + 30,
      );

      // ─────── Header ───────
      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "visible band · 380 → 780 nm · drag the slider",
        marginX,
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
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">λ (nm)</label>
        <input
          type="range"
          min={380}
          max={780}
          step={1}
          value={lambdaNm}
          onChange={(e) => setLambdaNm(parseInt(e.target.value, 10))}
          className="flex-1 accent-[#8EE6B0]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {lambdaNm} nm
        </span>
      </div>
    </div>
  );
}

/**
 * A rough plain-English colour name for a given wavelength. Not authoritative
 * (the eye's response to monochromatic light is nonlinear and personal) —
 * just enough of a label to make the slider feel alive.
 */
function nameColour(nm: number): string {
  if (nm < 400) return "near-UV violet";
  if (nm < 440) return "violet";
  if (nm < 485) return "blue";
  if (nm < 500) return "cyan";
  if (nm < 565) return "green";
  if (nm < 590) return "yellow";
  if (nm < 625) return "orange";
  if (nm < 700) return "red";
  return "deep red";
}
