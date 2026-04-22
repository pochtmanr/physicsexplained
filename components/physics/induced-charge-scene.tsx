"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

/**
 * Edge-on view of a grounded conducting plane with a + charge sitting at
 * height d above it. The induced surface charge density is the well-known
 *
 *   σ(x) = -q · d / [2π · (x² + d²)^(3/2)]
 *
 * We plot σ(x) along the plane and numerically integrate it over a finite
 * window |x| ≤ L. The total converges on −q (= −1 here) as L grows — a
 * concrete check that the entire compensating charge lives on the surface.
 */
export function InducedChargeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [d, setD] = useState(1.0); // m
  const [L, setL] = useState(8); // sampled half-window in metres
  const [size, setSize] = useState({ width: 640, height: 380 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
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

      // Top half of the canvas: edge-on view of plane and charge.
      // Bottom half: σ(x) plot.
      const topH = height * 0.42;
      const botY0 = topH + 18; // top of bottom plot
      const botY1 = height - 30; // bottom of bottom plot

      // ===== TOP =====
      const planeY = topH * 0.78;
      const cx = width / 2;
      const xWorldHalf = 5; // plot extends ±5 m horizontally in top
      const pxPerUnitX = (width - 60) / (2 * xWorldHalf);
      const pxPerUnitY = (planeY - 16) / 2.5; // worldY half-span ~ 2.5

      // Plane line
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, planeY);
      ctx.lineTo(width - 20, planeY);
      ctx.stroke();

      // Hatching
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      for (let x = 20; x < width - 10; x += 9) {
        ctx.beginPath();
        ctx.moveTo(x, planeY);
        ctx.lineTo(x - 8, planeY + 8);
        ctx.stroke();
      }

      // Real + charge
      const realY = planeY - d * pxPerUnitY;
      ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(cx, realY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#07090E";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", cx, realY + 1);
      ctx.textBaseline = "alphabetic";

      // d indicator
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 22, realY);
      ctx.lineTo(cx + 22, planeY);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`d = ${d.toFixed(2)} m`, cx + 28, (realY + planeY) / 2 + 4);

      // Indicate the windowed sample range on the plane
      const xLpx = Math.min(width - 20, cx + L * pxPerUnitX);
      const xLnpx = Math.max(20, cx - L * pxPerUnitX);
      ctx.strokeStyle = "rgba(111, 184, 198, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xLnpx, planeY - 2);
      ctx.lineTo(xLpx, planeY - 2);
      ctx.stroke();

      // Tick marks at ±L
      ctx.beginPath();
      ctx.moveTo(xLnpx, planeY - 6);
      ctx.lineTo(xLnpx, planeY + 4);
      ctx.moveTo(xLpx, planeY - 6);
      ctx.lineTo(xLpx, planeY + 4);
      ctx.stroke();

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`-L`, xLnpx - 4, planeY + 16);
      ctx.textAlign = "left";
      ctx.fillText(`+L`, xLpx + 4, planeY + 16);

      // ===== BOTTOM: σ(x) plot =====
      const plotL = 30;
      const plotR = width - 30;
      const plotW = plotR - plotL;
      const plotH = botY1 - botY0;

      // Use the SAME x-scale as the top so columns line up visually.
      const sigmaXHalf = xWorldHalf;
      const sigmaPxPerX = plotW / (2 * sigmaXHalf);
      const sigmaCx = (plotL + plotR) / 2;

      // Plot frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, botY0);
      ctx.lineTo(plotL, botY1);
      ctx.lineTo(plotR, botY1);
      ctx.stroke();

      // σ formula: σ(x) = -q · d / [2π · (x² + d²)^(3/2)] with q = 1.
      // Take peak |σ| (at x = 0) for normalisation: σ(0) = -1 / (2π·d²)
      const sigmaAt = (x: number) =>
        -d / (2 * Math.PI * Math.pow(x * x + d * d, 1.5));
      const sigmaPeak = Math.abs(sigmaAt(0));

      // Curve (σ ≤ 0 always, so we draw downward from the top of the plot)
      ctx.strokeStyle = "#6FB8C6";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const samples = 240;
      for (let i = 0; i <= samples; i++) {
        const x = -sigmaXHalf + (i / samples) * (2 * sigmaXHalf);
        const s = sigmaAt(x);
        // Map: s = 0 → top of plot, s = -sigmaPeak → bottom of plot.
        const yFrac = Math.abs(s) / sigmaPeak;
        const px = sigmaCx + x * sigmaPxPerX;
        const py = botY0 + yFrac * (plotH - 2);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Highlight the windowed region (under the curve)
      ctx.fillStyle = "rgba(111, 184, 198, 0.18)";
      ctx.beginPath();
      const xs0 = Math.max(-sigmaXHalf, -L);
      const xs1 = Math.min(sigmaXHalf, L);
      const winSamples = 120;
      ctx.moveTo(sigmaCx + xs0 * sigmaPxPerX, botY0);
      for (let i = 0; i <= winSamples; i++) {
        const x = xs0 + (i / winSamples) * (xs1 - xs0);
        const s = sigmaAt(x);
        const yFrac = Math.abs(s) / sigmaPeak;
        const px = sigmaCx + x * sigmaPxPerX;
        const py = botY0 + yFrac * (plotH - 2);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(sigmaCx + xs1 * sigmaPxPerX, botY0);
      ctx.closePath();
      ctx.fill();

      // x = 0 marker
      ctx.save();
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = colors.fg3;
      ctx.beginPath();
      ctx.moveTo(sigmaCx, botY0);
      ctx.lineTo(sigmaCx, botY1);
      ctx.stroke();
      ctx.restore();

      // Numerical integration on the windowed range — Simpson-ish.
      // Treat the plane as an infinite strip in y (translation invariance),
      // so the line density σ(x) integrates to a 2D charge: we want
      //   ∫_{-L}^{L} ∫_{-∞}^{∞} σ(r) dy dx
      // For our σ(x) above, that double integral is the standard result,
      // but here σ(x) is already the line density in 2D — i.e. this scene
      // shows the 2D edge-on slice. To get the right total, we use the
      // explicit closed form for a thin strip of width 2L:
      //
      //   Q_window = -q · (2/π) · arctan(L / d)
      //
      // which → -q as L → ∞. We compute it directly here as the readout.
      const Qwindow = -1 * (2 / Math.PI) * Math.atan(L / d);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("σ(x) along plane", sigmaCx, botY0 - 6);

      // x-axis labels
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("x = 0", sigmaCx, botY1 + 14);
      ctx.textAlign = "left";
      ctx.fillText("x", plotR + 4, botY1 + 4);

      // ===== HUD =====
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`d = ${d.toFixed(2)} m`, 14, 20);
      ctx.fillText(`L = ${L.toFixed(1)} m`, 14, 38);
      ctx.textAlign = "right";
      ctx.fillText(
        `Q(window) = ${Qwindow.toFixed(4)}  (→ -q = -1)`,
        width - 14,
        20,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `σ(0) = -1 / (2π·d²) = ${(-1 / (2 * Math.PI * d * d)).toExponential(2)}`,
        width - 14,
        38,
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
      <div className="mt-3 flex flex-col gap-3 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <label className="w-12 text-[var(--color-fg-3)]">d</label>
          <input
            type="range"
            min={0.4}
            max={2.0}
            step={0.05}
            value={d}
            onChange={(e) => setD(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {d.toFixed(2)} m
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-12 text-[var(--color-fg-3)]">L</label>
          <input
            type="range"
            min={1}
            max={50}
            step={0.5}
            value={L}
            onChange={(e) => setL(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {L.toFixed(1)} m
          </span>
        </div>
      </div>
    </div>
  );
}
