"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.48a — Two-source interference.
 *
 * Two coherent point sources sit on the left of the frame at a vertical
 * separation `d`. Each emits circular wavefronts at the same frequency and
 * phase. Where they overlap, the scalar field is the sum of two sinusoids
 *
 *   ψ(x, y) = cos(k·r₁) + cos(k·r₂)
 *
 * and the *intensity* painted on the canvas is ψ². On the right edge we
 * project the intensity along a vertical screen — the horizontal-stripe
 * intensity pattern of a Young-style experiment. Sliders: source separation
 * `d` and frequency (which sets `k` = 2π/λ in pixel units).
 */

const WIDTH = 680;
const HEIGHT = 380;

export function TwoSourceInterferenceScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = useThemeColors();
  const [dPx, setDPx] = useState(70);
  const [freq, setFreq] = useState(0.14); // cycles per pixel

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== WIDTH * dpr || cv.height !== HEIGHT * dpr) {
      cv.width = WIDTH * dpr;
      cv.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const bg = colors.bg0 || "#07090E";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const k = 2 * Math.PI * freq; // rad per pixel
    const s1x = 60;
    const s1y = HEIGHT / 2 - dPx / 2;
    const s2x = 60;
    const s2y = HEIGHT / 2 + dPx / 2;
    const screenX = WIDTH - 70;

    // Paint the intensity field as a sparse grid so we stay fast.
    const step = 3;
    const image = ctx.createImageData(WIDTH, HEIGHT);
    const data = image.data;
    for (let y = 0; y < HEIGHT; y += step) {
      for (let x = 0; x < WIDTH; x += step) {
        const r1 = Math.hypot(x - s1x, y - s1y);
        const r2 = Math.hypot(x - s2x, y - s2y);
        const psi = Math.cos(k * r1) + Math.cos(k * r2);
        // Intensity ∝ ψ² ∈ [0, 4]. Normalise to [0, 1].
        const I = (psi * psi) / 4;
        // Amber for constructive, dark for destructive.
        const r = Math.round(228 * I);
        const g = Math.round(194 * I);
        const b = Math.round(122 * I);
        for (let dy = 0; dy < step; dy++) {
          for (let dx = 0; dx < step; dx++) {
            const px = (y + dy) * WIDTH + (x + dx);
            const idx = px * 4;
            data[idx + 0] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(image, 0, 0);

    // Sources as small magenta dots.
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(s1x, s1y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s2x, s2y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 106, 222, 0.5)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(s1x, s1y);
    ctx.lineTo(s1x, s2y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Separation label.
    ctx.fillStyle = "#FF6ADE";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`d = ${dPx} px`, s1x + 10, HEIGHT / 2);

    // Screen on the right — one-pixel-wide vertical column sampled from the
    // field and stretched into a strip showing fringe locations.
    ctx.strokeStyle = "rgba(228, 194, 122, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX, 10);
    ctx.lineTo(screenX, HEIGHT - 10);
    ctx.stroke();

    const stripX = screenX + 8;
    const stripW = 40;
    for (let y = 10; y < HEIGHT - 10; y++) {
      const r1 = Math.hypot(screenX - s1x, y - s1y);
      const r2 = Math.hypot(screenX - s2x, y - s2y);
      const psi = Math.cos(k * r1) + Math.cos(k * r2);
      const I = (psi * psi) / 4;
      const a = Math.min(1, I);
      ctx.fillStyle = `rgba(228, 194, 122, ${a})`;
      ctx.fillRect(stripX, y, stripW, 1);
    }
    ctx.strokeStyle = "rgba(228, 194, 122, 0.3)";
    ctx.strokeRect(stripX, 10, stripW, HEIGHT - 20);

    // Top-right readout.
    ctx.fillStyle = "rgba(230, 236, 244, 0.85)";
    ctx.textAlign = "right";
    ctx.font = "11px ui-monospace, monospace";
    const lambdaPx = 1 / freq;
    ctx.fillText(`λ ≈ ${lambdaPx.toFixed(1)} px`, WIDTH - 10, 18);
    ctx.fillText(`d / λ = ${(dPx * freq).toFixed(2)}`, WIDTH - 10, 34);
  }, [dPx, freq, colors]);

  return (
    <div className="w-full pb-4" style={{ maxWidth: WIDTH }}>
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT }}
        className="block mx-auto"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)] min-w-[80px]">
          Separation d
        </label>
        <input
          type="range"
          min={20}
          max={180}
          step={2}
          value={dPx}
          onChange={(e) => setDPx(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {dPx} px
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)] min-w-[80px]">
          Frequency
        </label>
        <input
          type="range"
          min={0.06}
          max={0.26}
          step={0.005}
          value={freq}
          onChange={(e) => setFreq(parseFloat(e.target.value))}
          className="flex-1 accent-[#E4C27A]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {freq.toFixed(3)}
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Two coherent point sources on the left. The amber lattice is |ψ|² of
        the overlapping wavefronts; the strip on the right samples the same
        field along a vertical screen. Bright bands sit where the path
        difference is an integer number of λ.
      </p>
    </div>
  );
}
