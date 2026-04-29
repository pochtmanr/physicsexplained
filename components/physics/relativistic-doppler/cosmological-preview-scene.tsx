"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.10c — Cosmological-redshift PREVIEW (forward-link to §12.3
 * `hubble-and-cosmological-redshift`).
 *
 *   A galaxy at redshift z = 1 (so λ_obs = 2 · λ_emit) is shown next to a
 *   stationary "lab source" emitting at the same rest wavelength. The
 *   cosmological case looks Doppler-ish — and historically was MIS-described
 *   that way — but it is **NOT** the relativistic Doppler factor of §02.5.
 *   It is metric expansion: the wavelength of an in-flight photon stretches
 *   along with the scale factor a(t) of the universe between emission and
 *   absorption. There is no inertial-frame relative-velocity formula that
 *   gives the right answer, and at z ≳ 1 the recession "speed" exceeds c
 *   without paradox because nothing is moving through space — space itself
 *   is expanding.
 *
 *   The animation: a grid stretches uniformly while a photon-tracker follows
 *   one wavelength as it inflates. Below, the spectrum bar slides like §02.5
 *   — visually identical, physically distinct.
 *
 *   This scene's whole job is to set up the §12 distinction so the reader
 *   doesn't carry away "redshift = relativistic Doppler" as a universal
 *   identification. Then we return to §02's punchline.
 *
 *   Palette: amber for the emitted photon track; magenta for the receding
 *   galaxy; cyan for the stationary lab source; faint grey for the
 *   expanding-grid background.
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;

const Z = 1.0; // hard-coded forward-reference value
const LAMBDA_LAB_NM = 500;
const LAMBDA_OBS_NM = LAMBDA_LAB_NM * (1 + Z); // 1000 nm — out of visible into IR

export function CosmologicalPreviewScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 720, height: 396 });
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
    onFrame: (t) => {
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

      // Animation: scale factor goes 1 → 2 over a 4-second loop.
      const cycle = 4;
      const tCycle = (t % cycle) / cycle;
      const a = 1 + tCycle; // 1 → 2

      // ── Top region: expanding-grid backdrop. ──────────────────────────
      const margin = 20;
      const top = margin;
      const bottom = height * 0.6;
      const midY = (top + bottom) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(margin, top, width - 2 * margin, bottom - top);
      ctx.clip();

      // Grid lines stretch with scale factor a(t).
      const cellRest = 32;
      const cell = cellRest * a;
      ctx.strokeStyle = "rgba(150, 150, 170, 0.18)";
      ctx.lineWidth = 1;
      const cx = (margin + width - margin) / 2;
      for (let x = cx; x < width; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
      for (let x = cx - cell; x > margin; x -= cell) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
      for (let y = midY; y < bottom; y += cell) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }
      for (let y = midY - cell; y > top; y -= cell) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }

      // Galaxy (left, magenta) — moves outward with the grid.
      const galaxyRest = -160;
      const galaxyX = cx + galaxyRest * a;
      ctx.shadowColor = "rgba(255, 105, 180, 0.6)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#FF6BCB";
      ctx.beginPath();
      ctx.arc(galaxyX, midY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Observer / "us" (right, cyan) — stationary at cx + offset.
      const obsX = cx + 180;
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(obsX, midY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Wavelength tracker — a single sinusoid between galaxy and observer
      // whose wavelength inflates with a(t). 3 wavelengths at a=1, 1.5 at a=2.
      const path = obsX - galaxyX;
      const lambdaPx = (path / 3) * (a / 1); // base 3 wavelengths over the path at a=1
      const k = (2 * Math.PI) / lambdaPx;
      ctx.strokeStyle = "#FFD93D";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const N = 80;
      for (let i = 0; i <= N; i++) {
        const f = i / N;
        const px = galaxyX + path * f;
        const py = midY - 16 * Math.sin(k * (px - galaxyX));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.restore();

      // Labels above the grid
      ctx.font = "11px monospace";
      ctx.fillStyle = "#FF6BCB";
      ctx.textAlign = "center";
      ctx.fillText("galaxy at z = 1", galaxyX, top - 6);
      ctx.fillStyle = "#6FB8C6";
      ctx.fillText("us", obsX, top - 6);

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`a(t) = ${a.toFixed(2)}`, margin + 6, top + 14);
      ctx.fillText("(scale factor — space itself stretches)", margin + 6, top + 30);

      // ── Bottom: punchline panel. ──────────────────────────────────────
      const panelTop = bottom + 14;
      const panelBottom = height - margin;
      ctx.fillStyle = "rgba(255, 217, 61, 0.07)";
      ctx.fillRect(margin, panelTop, width - 2 * margin, panelBottom - panelTop);
      ctx.strokeStyle = "rgba(255, 217, 61, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, panelTop, width - 2 * margin, panelBottom - panelTop);

      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFD93D";
      ctx.fillText("⚠ this is NOT relativistic Doppler", margin + 12, panelTop + 18);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        "It is metric expansion. λ_obs / λ_emit = a_now / a_then = 1 + z.",
        margin + 12,
        panelTop + 36,
      );
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(
        `at z = ${Z.toFixed(1)}: λ stretched by 1+z = ${(1 + Z).toFixed(0)}× — see §12.3 hubble-and-cosmological-redshift`,
        margin + 12,
        panelTop + 54,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
      <p className="mt-2 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        forward-link · §12.3 hubble-and-cosmological-redshift covers this in
        detail. Brought up here only to mark the boundary of §02.5&apos;s claim.
      </p>
    </div>
  );
}
