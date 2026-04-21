"use client";

import { useEffect, useRef, useState } from "react";
import {
  angularFrequency,
  phaseVelocity,
  sineWave,
  waveNumber,
} from "@/lib/physics/waves";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 320;

export interface TravellingWaveSceneProps {
  amplitude?: number;
  wavelength?: number;
  frequency?: number;
}

/**
 * Animated sinusoidal travelling wave with live controls for wavelength,
 * frequency, and amplitude. Phase velocity v = fλ is reported in the HUD.
 * A vertical crest marker glides at exactly v m/s so you can see the wave
 * move, not just wiggle.
 */
export function TravellingWaveScene({
  amplitude: a0 = 0.6,
  wavelength: l0 = 2.0,
  frequency: f0 = 0.6,
}: TravellingWaveSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [amplitude, setAmplitude] = useState(a0);
  const [wavelength, setWavelength] = useState(l0);
  const [frequency, setFrequency] = useState(f0);
  const [frozen, setFrozen] = useState(false);
  const freezeTRef = useRef(0);
  const [size, setSize] = useState({ width: 560, height: 320 });

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
  const v = phaseVelocity(frequency, wavelength);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (tLive) => {
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

      const t = frozen ? freezeTRef.current : tLive;
      if (!frozen) freezeTRef.current = tLive;

      ctx.clearRect(0, 0, width, height);

      const marginX = 16;
      const plotW = width - 2 * marginX;
      const midY = height / 2;
      const pxPerMetre = plotW / 10; // show 10 m of string
      const ampPx = (height * 0.35);

      // Axis
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(marginX, midY);
      ctx.lineTo(marginX + plotW, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Wavelength bracket at the top
      const k = waveNumber(wavelength);
      const omega = angularFrequency(frequency);
      // Locate the first crest to the right of the origin
      // sin(kx - omega t) = 1  →  kx - omega t = π/2
      const firstCrestX = (Math.PI / 2 + omega * t) / k;
      const crestXpx = marginX + firstCrestX * pxPerMetre;
      const crest2Xpx = crestXpx + wavelength * pxPerMetre;
      if (crest2Xpx < marginX + plotW) {
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        const bracketY = midY - ampPx - 14;
        ctx.beginPath();
        ctx.moveTo(crestXpx, bracketY + 4);
        ctx.lineTo(crestXpx, bracketY);
        ctx.lineTo(crest2Xpx, bracketY);
        ctx.lineTo(crest2Xpx, bracketY + 4);
        ctx.stroke();
        ctx.fillStyle = colors.fg1;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `λ = ${wavelength.toFixed(2)} m`,
          (crestXpx + crest2Xpx) / 2,
          bracketY - 4,
        );
      }

      // Wave curve (sampled densely)
      ctx.strokeStyle = "#6FB8C6";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const steps = plotW;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * 10; // metres
        const y = sineWave(x, t, { amplitude, wavelength, frequency });
        const px = marginX + i;
        const py = midY - (y / 1.0) * (ampPx / 1.0);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Crest marker (a small vertical tick riding on the wave)
      const markerX = ((v * t) % 10 + 10) % 10;
      const markerPx = marginX + markerX * pxPerMetre;
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(markerPx, midY + ampPx + 6);
      ctx.lineTo(markerPx, midY - ampPx - 6);
      ctx.stroke();

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`v = f λ = ${v.toFixed(2)} m/s`, marginX, height - 8);
      ctx.textAlign = "right";
      ctx.fillText(
        `A = ${amplitude.toFixed(2)} m   f = ${frequency.toFixed(2)} Hz`,
        marginX + plotW,
        height - 8,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Wavelength λ</label>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.05}
          value={wavelength}
          onChange={(e) => setWavelength(parseFloat(e.target.value))}
          className="accent-[#6FB8C6]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {wavelength.toFixed(2)} m
        </span>

        <label className="text-[var(--color-fg-3)]">Frequency f</label>
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.02}
          value={frequency}
          onChange={(e) => setFrequency(parseFloat(e.target.value))}
          className="accent-[#6FB8C6]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {frequency.toFixed(2)} Hz
        </span>

        <label className="text-[var(--color-fg-3)]">Amplitude A</label>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.02}
          value={amplitude}
          onChange={(e) => setAmplitude(parseFloat(e.target.value))}
          className="accent-[#6FB8C6]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {amplitude.toFixed(2)} m
        </span>
      </div>
      <div className="mt-2 px-2">
        <button
          type="button"
          onClick={() => setFrozen((f) => !f)}
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
        >
          {frozen ? "▶ resume" : "❚❚ freeze"}
        </button>
      </div>
    </div>
  );
}
