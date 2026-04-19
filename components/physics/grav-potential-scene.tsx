"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Interactive plot of the gravitational potential Phi(r) = -GM/r.
 * A draggable test particle slides along the curve. Shows KE, PE, total E.
 */
export function GravPotentialScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.65, 420) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  // rFrac: normalised position of particle along r-axis (0.1 .. 1.0)
  const [rFrac, setRFrac] = useState(0.4);
  const draggingRef = useRef(false);

  // Total energy: user adjustable to show bound vs unbound
  const [totalE, setTotalE] = useState(-0.6);

  // Layout constants
  const margin = { left: 60, right: 30, top: 30, bottom: 50 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Physics in normalised units: Phi(r) = -1/r, GM=1
  const rToPixel = useCallback(
    (r: number) => margin.left + (r / 1.2) * plotW,
    [margin.left, plotW],
  );
  const phiToPixel = useCallback(
    (phi: number) => {
      // Map phi range [-4, 1] to plot area
      const phiMin = -4;
      const phiMax = 1;
      const frac = (phi - phiMin) / (phiMax - phiMin);
      return margin.top + plotH * (1 - frac);
    },
    [margin.top, plotH],
  );
  const pixelToR = useCallback(
    (px: number) => ((px - margin.left) / plotW) * 1.2,
    [margin.left, plotW],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dotPx = rToPixel(rFrac);
      const phi = -1 / rFrac;
      const dotPy = phiToPixel(phi);
      if (Math.hypot(mx - dotPx, my - dotPy) < 20) {
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [rFrac, rToPixel, phiToPixel],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const r = pixelToR(mx);
      setRFrac(Math.max(0.08, Math.min(1.15, r)));
    },
    [pixelToR],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const [readout, setReadout] = useState({ KE: 0, PE: 0, E: 0, escape: false });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      // Vertical axis
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, margin.top + plotH);
      ctx.stroke();
      // Horizontal axis
      ctx.beginPath();
      ctx.moveTo(margin.left, phiToPixel(0));
      ctx.lineTo(margin.left + plotW, phiToPixel(0));
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("r", margin.left + plotW + 15, phiToPixel(0) + 4);
      ctx.save();
      ctx.translate(15, margin.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("\u03A6(r)", 0, 0);
      ctx.restore();

      // Phi = 0 label
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("0", margin.left - 6, phiToPixel(0) + 4);

      // Plot Phi(r) = -1/r
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const r = 0.06 + (1.14 * i) / steps;
        const phi = -1 / r;
        if (phi < -4) continue;
        const px = rToPixel(r);
        const py = phiToPixel(phi);
        if (i === 0 || phi < -3.9) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Total energy line (horizontal)
      const ePx = phiToPixel(totalE);
      ctx.strokeStyle = "rgba(255, 107, 107, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, ePx);
      ctx.lineTo(margin.left + plotW, ePx);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label for E
      ctx.fillStyle = "#FF6B6B";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `E = ${totalE.toFixed(2)}`,
        margin.left + plotW - 70,
        ePx - 6,
      );

      // Escape threshold label at Phi=0
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("escape: E \u2265 0", margin.left + 10, phiToPixel(0) - 8);

      // Particle on the curve
      const phi = -1 / rFrac;
      const dotPx = rToPixel(rFrac);
      const dotPy = phiToPixel(phi);

      // KE bar: KE = E_total - PE = totalE - phi
      const KE = Math.max(0, totalE - phi);
      const PE = phi;
      const isEscape = totalE >= 0;

      // Draw KE as a vertical bar from PE to E
      if (KE > 0) {
        const keTopPx = phiToPixel(totalE);
        ctx.fillStyle = "rgba(255, 79, 216, 0.25)";
        ctx.fillRect(dotPx - 6, keTopPx, 12, dotPy - keTopPx);
        ctx.strokeStyle = "#FF4FD8";
        ctx.lineWidth = 1;
        ctx.strokeRect(dotPx - 6, keTopPx, 12, dotPy - keTopPx);
      }

      // Particle dot
      ctx.shadowColor = isEscape
        ? "rgba(255, 107, 107, 0.8)"
        : "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = isEscape ? "#FF6B6B" : "#5BE9FF";
      ctx.beginPath();
      ctx.arc(dotPx, dotPy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Drag hint
      ctx.fillStyle = colors.fg3;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("drag", dotPx, dotPy + 22);

      setReadout({ KE, PE, E: totalE, escape: isEscape });
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height, cursor: "grab" }}
        className="block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          Total energy (E)
        </label>
        <input
          type="range"
          min={-3}
          max={0.5}
          step={0.05}
          value={totalE}
          onChange={(e) => setTotalE(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF4FD8]"
        />
        <span className="w-12 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {totalE.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 px-2 font-mono text-xs text-[var(--color-fg-1)]">
        <div>
          <span className="text-[var(--color-fg-3)]">PE </span>
          {readout.PE.toFixed(2)}
        </div>
        <div>
          <span className="text-[#FF4FD8]">KE </span>
          {readout.KE.toFixed(2)}
        </div>
        <div>
          {readout.escape ? (
            <span className="text-[#FF6B6B]">unbound</span>
          ) : (
            <span className="text-[#5BE9FF]">bound</span>
          )}
        </div>
      </div>
    </div>
  );
}
