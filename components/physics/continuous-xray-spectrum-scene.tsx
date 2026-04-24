"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { kramersSpectrum } from "@/lib/physics/electromagnetism/bremsstrahlung";

const RATIO = 0.58;
const MAX_HEIGHT = 460;

const XRAY = "rgba(255, 140, 80,";
const CYAN = "rgba(120, 220, 255,";
const LILAC = "rgba(200, 160, 255,";

/**
 * FIG.56b — Continuous X-ray spectrum with Duane-Hunt cutoff.
 *
 * The Kramers thick-target shape dN/dE ∝ (E_max − E)/E plotted against
 * photon energy E. The right edge of the plot is the Duane-Hunt cutoff
 * E_max = eU — the sharpest experimental feature in the entire
 * spectrum. To the right of it, no photons; to the left, a 1/E-like
 * rise (clipped in practice by low-E absorption inside the tube).
 *
 * A voltage slider shifts U from 10 to 150 kV; both the cutoff and the
 * total integrated intensity move. A toggle overlays the tungsten Kα/Kβ
 * characteristic lines near 59 keV — the sharp line-structure that the
 * continuous bremsstrahlung backdrop rides on top of in real clinical
 * X-ray tubes.
 */
export function ContinuousXraySpectrumScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 420 });
  const [voltageKv, setVoltageKv] = useState(80);
  const [showLines, setShowLines] = useState(true);

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

  // Plot axis spans 0 → 150 keV regardless of voltage (so the cutoff
  // visibly shifts within the frame). Precompute the Kramers curve at
  // the current voltage.
  const BINS = 600;
  const E_AXIS_MAX = 150;
  const spectrum = useMemo(() => {
    const arr = new Float64Array(BINS);
    let peak = 0;
    // Low-E absorption (soft X-rays are absorbed by the glass envelope
    // and the target itself before they leave the tube). Model it as a
    // simple e^{−(E_abs/E)²} cut; without it the 1/E divergence swamps
    // the plot.
    const E_abs = 5; // keV
    for (let i = 0; i < BINS; i++) {
      const E = ((i + 0.5) / BINS) * E_AXIS_MAX;
      const shape = kramersSpectrum(E, voltageKv);
      const ratio = E_abs / Math.max(E, 0.1);
      const absorb = Math.exp(-(ratio * ratio));
      const v = shape * absorb;
      arr[i] = v;
      if (v > peak) peak = v;
    }
    return { values: arr, peak };
  }, [voltageKv]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t) => {
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

      const pad = { l: 54, r: 24, t: 24, b: 42 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      const x0 = pad.l;
      const y0 = pad.t;

      // ── Axes ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y0 + plotH);
      ctx.lineTo(x0 + plotW, y0 + plotH);
      ctx.stroke();

      // Tick marks on E axis (every 20 keV)
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let E = 0; E <= E_AXIS_MAX; E += 20) {
        const xPx = x0 + (E / E_AXIS_MAX) * plotW;
        ctx.strokeStyle = colors.fg3;
        ctx.beginPath();
        ctx.moveTo(xPx, y0 + plotH);
        ctx.lineTo(xPx, y0 + plotH + 4);
        ctx.stroke();
        ctx.fillStyle = colors.fg2;
        ctx.fillText(E.toString(), xPx, y0 + plotH + 16);
      }
      ctx.fillStyle = colors.fg1;
      ctx.fillText("E (keV)", x0 + plotW / 2, y0 + plotH + 32);

      // Y axis label
      ctx.save();
      ctx.translate(x0 - 36, y0 + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "center";
      ctx.fillText("dN/dE  (arb.)", 0, 0);
      ctx.restore();

      // ── Kramers curve (filled, orange-red) ──
      const maxVal = Math.max(spectrum.peak, 1e-9);
      ctx.beginPath();
      ctx.moveTo(x0, y0 + plotH);
      for (let i = 0; i < BINS; i++) {
        const E = ((i + 0.5) / BINS) * E_AXIS_MAX;
        const xPx = x0 + (E / E_AXIS_MAX) * plotW;
        const v = spectrum.values[i];
        const yPx = y0 + plotH - (v / maxVal) * plotH * 0.92;
        if (i === 0) ctx.lineTo(xPx, yPx);
        else ctx.lineTo(xPx, yPx);
      }
      ctx.lineTo(x0 + plotW, y0 + plotH);
      ctx.closePath();
      ctx.fillStyle = `${XRAY} 0.22)`;
      ctx.fill();

      // Curve outline
      ctx.strokeStyle = `${XRAY} 0.95)`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < BINS; i++) {
        const E = ((i + 0.5) / BINS) * E_AXIS_MAX;
        const xPx = x0 + (E / E_AXIS_MAX) * plotW;
        const v = spectrum.values[i];
        const yPx = y0 + plotH - (v / maxVal) * plotH * 0.92;
        if (i === 0) ctx.moveTo(xPx, yPx);
        else ctx.lineTo(xPx, yPx);
      }
      ctx.stroke();

      // ── Duane-Hunt cutoff marker ──
      const cutoffX = x0 + (voltageKv / E_AXIS_MAX) * plotW;
      ctx.strokeStyle = `${CYAN} 0.9)`;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cutoffX, y0);
      ctx.lineTo(cutoffX, y0 + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `${CYAN} 1)`;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `Duane-Hunt  E_max = eU = ${voltageKv} keV`,
        cutoffX + 6,
        y0 + 14,
      );

      // ── Optional: tungsten K-shell lines near 59 keV ──
      if (showLines && voltageKv > 69.5) {
        // Kα1 ≈ 59.3 keV, Kα2 ≈ 57.98 keV, Kβ ≈ 67.2 keV (schematic)
        const lines = [
          { E: 57.98, h: 0.55, label: "Kα₂" },
          { E: 59.32, h: 0.98, label: "Kα₁" },
          { E: 67.24, h: 0.35, label: "Kβ" },
        ];
        for (const line of lines) {
          if (line.E > voltageKv) continue;
          const xPx = x0 + (line.E / E_AXIS_MAX) * plotW;
          const top = y0 + plotH - line.h * plotH * 0.92;
          ctx.strokeStyle = `${LILAC} 0.95)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(xPx, y0 + plotH);
          ctx.lineTo(xPx, top);
          ctx.stroke();
          ctx.fillStyle = `${LILAC} 1)`;
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(line.label, xPx, top - 4);
        }
      }

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Kramers spectrum  dN/dE ∝ (E_max − E)/E", x0 + 8, y0 + 18);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText("thick tungsten target", x0 + plotW - 8, y0 + 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Tube voltage U</label>
        <input
          type="range"
          min={10}
          max={150}
          step={1}
          value={voltageKv}
          onChange={(e) => setVoltageKv(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,255)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {voltageKv.toFixed(0)} kV
        </span>

        <label className="text-[var(--color-fg-3)]">Tungsten K lines</label>
        <label className="flex items-center gap-2 text-[var(--color-fg-1)]">
          <input
            type="checkbox"
            checked={showLines}
            onChange={(e) => setShowLines(e.target.checked)}
            className="accent-[rgb(200,160,255)]"
          />
          <span className="font-mono text-xs text-[var(--color-fg-3)]">
            Kα ≈ 59 keV, Kβ ≈ 67 keV
          </span>
        </label>
        <span />
      </div>
    </div>
  );
}
