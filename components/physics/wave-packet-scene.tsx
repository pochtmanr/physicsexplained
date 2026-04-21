"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * A wave packet in a dispersive medium.
 *
 * We plot u(x, t) = Re[ sum_k A(k) exp(i(k x − omega(k) t)) ] where A(k) is
 * a Gaussian centered on k0 and omega(k) = v_p0 * k + alpha * (k − k0)
 * — a linear-in-k part that gives the envelope a distinct group velocity,
 * plus a higher-order term is not included so the envelope keeps its shape
 * and we can cleanly compare v_p and v_g.
 *
 * v_p (the carrier crest speed) and v_g (the envelope speed) are set
 * independently by the slider. Drag v_g/v_p apart and you can literally
 * watch crests appear at one end of the envelope, race through it, and
 * disappear at the other end — the classic teaching shot.
 */
const RATIO = 0.5;
const MAX_HEIGHT = 320;

export interface WavePacketSceneProps {
  width?: number;
  height?: number;
}

export function WavePacketScene(_props: WavePacketSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  // Slider value is the RATIO v_g / v_p, from 0 to 2.
  const [ratio, setRatio] = useState(0.5);
  const ratioRef = useRef(ratio);
  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

  const [size, setSize] = useState({ width: 480, height: 240 });

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

  const { width, height } = size;

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      const margin = 20;
      const plotW = width - 2 * margin;
      const plotH = height - 2 * margin;
      const midY = margin + plotH / 2;

      // Axis
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, midY);
      ctx.lineTo(margin + plotW, midY);
      ctx.stroke();

      // Physical space: x runs from 0 to L = 20. We loop with period L so
      // the packet re-enters from the left and the animation runs forever.
      const L = 20;
      const vp = 1.5; // phase velocity, arbitrary units
      const vg = ratioRef.current * vp; // group velocity

      const k0 = 8; // carrier wavenumber
      const sigma = 1.2; // envelope spatial sigma

      // Draw envelope (|u|) as a filled soft band behind the carrier.
      const steps = Math.max(240, plotW);
      ctx.fillStyle = "rgba(111, 184, 198, 0.15)";
      ctx.beginPath();
      ctx.moveTo(margin, midY);
      for (let i = 0; i <= steps; i++) {
        const x = (L * i) / steps;
        // Wrap envelope centre into [0, L)
        const center = ((vg * t) % L + L) % L;
        let dx = x - center;
        if (dx > L / 2) dx -= L;
        if (dx < -L / 2) dx += L;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const px = margin + (plotW * i) / steps;
        const py = midY - env * (plotH * 0.42);
        ctx.lineTo(px, py);
      }
      // Close the top loop
      for (let i = steps; i >= 0; i--) {
        const x = (L * i) / steps;
        const center = ((vg * t) % L + L) % L;
        let dx = x - center;
        if (dx > L / 2) dx -= L;
        if (dx < -L / 2) dx += L;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const px = margin + (plotW * i) / steps;
        const py = midY + env * (plotH * 0.42);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Envelope outline (dashed)
      ctx.strokeStyle = "rgba(111, 184, 198, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (const sign of [1, -1]) {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const x = (L * i) / steps;
          const center = ((vg * t) % L + L) % L;
          let dx = x - center;
          if (dx > L / 2) dx -= L;
          if (dx < -L / 2) dx += L;
          const env = sign * Math.exp(-(dx * dx) / (2 * sigma * sigma));
          const px = margin + (plotW * i) / steps;
          const py = midY - env * (plotH * 0.42);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Carrier: Re[exp(i(k0 x - omega0 t))] * envelope.
      // We pick omega0 so that the phase speed is vp: omega0 = k0 * vp.
      const omega0 = k0 * vp;
      ctx.strokeStyle = "#6FB8C6";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = (L * i) / steps;
        const center = ((vg * t) % L + L) % L;
        let dx = x - center;
        if (dx > L / 2) dx -= L;
        if (dx < -L / 2) dx += L;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const val = env * Math.cos(k0 * x - omega0 * t);
        const px = margin + (plotW * i) / steps;
        const py = midY - val * (plotH * 0.42);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Velocity readouts
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `v_p = ${vp.toFixed(2)}   (carrier)`,
        margin + 4,
        margin + 12,
      );
      ctx.fillText(
        `v_g = ${vg.toFixed(2)}   (envelope)`,
        margin + 4,
        margin + 26,
      );

      // Arrow marking envelope centre position
      const envCenter = ((vg * t) % L + L) % L;
      const envPx = margin + (plotW * envCenter) / L;
      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(envPx, margin + plotH);
      ctx.lineTo(envPx, margin + plotH - 8);
      ctx.stroke();
      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.moveTo(envPx, margin + plotH - 10);
      ctx.lineTo(envPx - 4, margin + plotH - 4);
      ctx.lineTo(envPx + 4, margin + plotH - 4);
      ctx.closePath();
      ctx.fill();
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">v_g / v_p</label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={ratio}
          onChange={(e) => setRatio(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-10 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {ratio.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        At ratio 0.5: water waves. At 1: vacuum. At 2: Schrodinger particle.
      </div>
    </div>
  );
}
