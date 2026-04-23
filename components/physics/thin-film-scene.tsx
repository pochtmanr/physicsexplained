"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.48c — Thin-film interference (soap bubble).
 *
 * A wedge-shaped film of soap (n ≈ 1.33) in air has thickness that varies
 * horizontally across the frame. For each pixel column we compute the
 * reflected intensity in each of R, G, B channels (representative
 * wavelengths: 620, 550, 450 nm). Constructive thickness is
 *   2 n d cos θ ≈ (m + ½) λ  (normal incidence, air-soap-air, with the
 *   single π-flip from the top reflection).
 * The combined RGB produces the familiar iridescent bands you see on an
 * actual bubble.
 *
 * Control: maximum film thickness across the frame (stretches or compresses
 * the banding).
 */

const WIDTH = 680;
const HEIGHT = 340;
const N_FILM = 1.33;
const LAMBDAS_NM = { r: 620, g: 550, b: 450 };

export function ThinFilmScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = useThemeColors();
  const [maxThicknessNm, setMaxThicknessNm] = useState(1400);

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

    const image = ctx.createImageData(WIDTH, HEIGHT);
    const data = image.data;

    for (let x = 0; x < WIDTH; x++) {
      // Thickness ramps from ~0 at the left to maxThicknessNm at the right.
      const dNm = (x / (WIDTH - 1)) * maxThicknessNm;
      // Add a little wavy non-uniformity so it looks like a real bubble.
      const wobble = 60 * Math.sin((x / WIDTH) * Math.PI * 3.1);

      for (let y = 0; y < HEIGHT; y++) {
        const yFrac = y / HEIGHT;
        const yWobble = 80 * Math.sin((yFrac + x / WIDTH) * Math.PI * 2.3);
        const d = Math.max(0, dNm + wobble + yWobble);

        // For each channel, intensity of reflection at air/film/air with
        // a single π flip on the top reflection:
        //   Δφ = (2π/λ) · 2 n d + π  →  I = (1 − cos(2π·2nd/λ)) / 2
        // (the +π makes the bright condition sit at 2nd = (m+½)λ.)
        const phase = (nm: number) =>
          (2 * Math.PI * 2 * N_FILM * d) / nm;
        const Ir = (1 - Math.cos(phase(LAMBDAS_NM.r))) / 2;
        const Ig = (1 - Math.cos(phase(LAMBDAS_NM.g))) / 2;
        const Ib = (1 - Math.cos(phase(LAMBDAS_NM.b))) / 2;

        // Add a soft floor so the very-thin left edge doesn't go pitch black
        // (a real bubble looks bright-black there; we nudge with 0.05).
        const floor = 0.05;
        const idx = (y * WIDTH + x) * 4;
        data[idx + 0] = Math.round(255 * Math.min(1, Ir * 0.95 + floor));
        data[idx + 1] = Math.round(255 * Math.min(1, Ig * 0.95 + floor));
        data[idx + 2] = Math.round(255 * Math.min(1, Ib * 0.95 + floor));
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // Labels
    ctx.fillStyle = "rgba(12, 14, 22, 0.8)";
    ctx.fillRect(0, 0, WIDTH, 26);
    ctx.fillStyle = "rgba(230, 236, 244, 0.9)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`n_film = ${N_FILM.toFixed(2)}  (soap in air)`, 10, 17);
    ctx.textAlign = "right";
    ctx.fillText(
      `thickness: 0 → ${maxThicknessNm} nm across frame`,
      WIDTH - 10,
      17,
    );

    // Bottom marker: which stripe is the first-constructive for green.
    const dFirstNm = LAMBDAS_NM.g / (4 * N_FILM);
    const xFirst = (dFirstNm / maxThicknessNm) * WIDTH;
    if (xFirst > 6 && xFirst < WIDTH - 6) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xFirst, 28);
      ctx.lineTo(xFirst, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.textAlign = "left";
      ctx.fillText(
        `d = λ_g/(4n) ≈ ${dFirstNm.toFixed(0)} nm`,
        xFirst + 4,
        HEIGHT - 8,
      );
    }
  }, [maxThicknessNm, colors]);

  return (
    <div className="w-full pb-4" style={{ maxWidth: WIDTH }}>
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT }}
        className="block mx-auto"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)] min-w-[120px]">
          Max thickness
        </label>
        <input
          type="range"
          min={400}
          max={3000}
          step={20}
          value={maxThicknessNm}
          onChange={(e) => setMaxThicknessNm(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {maxThicknessNm} nm
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Iridescent bands from an air–soap–air film whose thickness ramps
        left → right. Each wavelength picks a *different* thickness for
        constructive interference, so the same spot looks green under one
        thickness and magenta under another. The left edge is ~zero
        thickness, where destructive interference across all of visible
        crushes the reflection — a "black film" — just before the bubble
        pops.
      </p>
    </div>
  );
}
