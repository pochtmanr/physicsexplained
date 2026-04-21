"use client";

import { useEffect, useRef, useState } from "react";
import { chladniSquareMode, squareMembraneOmega } from "@/lib/physics/modes";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Chladni plate visualisation. Renders the symmetric eigenfunction
 *   φ_{m,n}(x, y) = sin(mπx) sin(nπy) − sin(nπx) sin(mπy)
 * on a unit square. Cells whose |φ| is small are nearly nodal — sand
 * settling there produces the familiar Chladni figures.
 *
 * No PDE solve: pure analytic lookup per pixel, extremely cheap.
 */

const RATIO = 1.0; // square
const MAX_HEIGHT = 380;
const RES = 180; // grid cells per side
const PRESETS: { m: number; n: number; label: string }[] = [
  { m: 1, n: 2, label: "(1, 2)" },
  { m: 1, n: 3, label: "(1, 3)" },
  { m: 2, n: 3, label: "(2, 3)" },
  { m: 2, n: 5, label: "(2, 5)" },
  { m: 3, n: 4, label: "(3, 4)" },
  { m: 3, n: 5, label: "(3, 5)" },
  { m: 1, n: 6, label: "(1, 6)" },
  { m: 4, n: 5, label: "(4, 5)" },
];

export function ChladniScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [idx, setIdx] = useState(2); // default (2,3)
  const [size, setSize] = useState({ width: 380, height: 380 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const s = Math.min(w, MAX_HEIGHT);
          setSize({ width: s, height: s * RATIO });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const preset = PRESETS[idx]!;
  const { width, height } = size;

  // Redraw whenever preset or theme changes.
  useEffect(() => {
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

    const bg = colors.bg0 || "#07090E";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cell = Math.min(width, height) / RES;
    const { m, n } = preset;

    // Render cell by cell. Amplitude |φ| is in [0, 2]. Sand lands where
    // |φ| is small, so we draw bright near zero-crossings and dark at peaks.
    for (let j = 0; j < RES; j++) {
      for (let i = 0; i < RES; i++) {
        const x = (i + 0.5) / RES;
        const y = (j + 0.5) / RES;
        const v = Math.abs(chladniSquareMode(x, y, m, n));
        // Highlight the nodal set: closer to zero → brighter.
        // Intensity peaks sharply at v ≈ 0 then decays.
        const brightness = Math.exp(-v * 5);
        const alpha = Math.min(1, brightness);
        const shade = Math.round(230 * alpha + 25);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(i * cell, j * cell, cell + 1, cell + 1);
      }
    }

    // Border
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    // Label
    const omega = squareMembraneOmega(m, n, 1, 1);
    ctx.fillStyle = "#FFD93D";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`(m, n) = (${m}, ${n})`, 10, 18);
    ctx.textAlign = "right";
    ctx.fillText(`ω ∝ √${m * m + n * n} = ${omega.toFixed(2)}`, width - 10, 18);
  }, [preset, colors, width, height]);

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[380px] pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block mx-auto"
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setIdx(i)}
            className={`px-2 py-1 font-mono text-xs border ${
              i === idx
                ? "border-[#FFD93D] text-[#FFD93D]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-3)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
