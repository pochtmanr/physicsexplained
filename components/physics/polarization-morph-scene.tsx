"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { polarizationState } from "@/lib/physics/electromagnetism/plane-waves";

const RATIO = 0.56;
const MAX_HEIGHT = 460;

const MAGENTA = "rgba(255, 100, 200,"; // E-field
const CYAN = "rgba(120, 220, 255,"; // B-field
const AMBER = "rgba(255, 180, 80,"; // k-vector

/**
 * FIG.39 — THE MONEY SHOT.
 *
 * A plane electromagnetic wave travelling along +x̂, rendered in axonometric
 * 3D on a Canvas 2D. Two orthogonal sinusoids ride the same wavevector:
 * magenta E in the (y) direction, cyan B in the (z) direction (rotated by
 * a phase-delay slider). Amber k-vector arrow runs the length of the scene.
 *
 * Two sliders:
 *   1. ellipticity χ  ∈ [0, 1]  — modulates the ratio of the "fast" and
 *      "slow" axis amplitudes in the transverse plane.
 *   2. phaseDelta δ  ∈ [0, π]   — the phase by which Ey lags Ex.
 *
 *  (χ, δ) = (0, 0)      → linear horizontal
 *  (χ, δ) = (1, π/2)    → right-circular
 *  (χ, δ) = (1, π)      → linear, rotated into the other diagonal
 *
 * The classifier (lib/physics/electromagnetism/plane-waves.ts) is called
 * every frame with the live slider values and its label — linear /
 * elliptical / circular — is printed in the HUD. The morph is continuous:
 * the slider is the wave.
 */
export function PolarizationMorphScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 820, height: 460 });
  const [ellipticity, setEllipticity] = useState(0);
  const [phaseDelta, setPhaseDelta] = useState(0);

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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // ─── Axonometric projection ────────────────────────────────────────
      // World axes:  x̂ (propagation) → to the right with a slight z-tilt.
      //              ŷ (magenta axis) → up on screen.
      //              ẑ (cyan axis)    → up-right, foreshortened.
      // 3D → 2D:  screen = origin + x·ex + y·ey + z·ez
      const originX = width * 0.12;
      const originY = height * 0.55;
      const ex = { x: 1, y: -0.18 }; // x-axis direction on screen
      const ey = { x: 0, y: -1 }; // y-axis (up)
      const ez = { x: 0.55, y: -0.45 }; // z-axis (up-right)

      const Lx = width - originX - 40; // visible length along propagation
      const amp = Math.min(height * 0.26, 110); // visible amplitude scale

      const project = (x: number, y: number, z: number) => ({
        x: originX + x * ex.x + y * ey.x + z * ez.x,
        y: originY + x * ex.y + y * ey.y + z * ez.y,
      });

      // ─── Parameters ────────────────────────────────────────────────────
      // The wave amplitudes in the transverse plane. For ellipticity 0 all
      // of the wave lives on the y-axis; for ellipticity 1 the two
      // components are equal.
      const chi = ellipticity;
      const alpha = Math.atan(chi); // ellipticity angle
      const Ey0 = amp * Math.cos(alpha);
      const Ez0 = amp * Math.sin(alpha);
      const delta = phaseDelta;

      // Temporal oscillation: the wave pattern slides along +x with time.
      // ω·t shifts the phase, giving the illusion of propagation.
      const omegaT = t * 2.2;

      // ─── Reference frame: thin grid plane y = 0 from x = 0 .. Lx ──────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const p0 = project(0, 0, 0);
      const p1 = project(Lx, 0, 0);
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      // Ghost axes at the origin: y-axis in magenta faint, z-axis in cyan
      // faint, so the reader can see which sinusoid is which.
      const yTip = project(0, amp * 1.1, 0);
      const zTip = project(0, 0, amp * 1.1);
      ctx.strokeStyle = `${MAGENTA} 0.35)`;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(yTip.x, yTip.y);
      ctx.stroke();
      ctx.strokeStyle = `${CYAN} 0.35)`;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(zTip.x, zTip.y);
      ctx.stroke();

      ctx.fillStyle = `${MAGENTA} 0.85)`;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ŷ", yTip.x - 10, yTip.y - 2);
      ctx.fillStyle = `${CYAN} 0.85)`;
      ctx.fillText("ẑ", zTip.x + 10, zTip.y - 2);

      // ─── k-vector arrow (amber) along +x ──────────────────────────────
      const kTip = project(Lx * 0.98, 0, 0);
      ctx.strokeStyle = `${AMBER} 0.9)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(kTip.x, kTip.y);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.beginPath();
      ctx.moveTo(kTip.x, kTip.y);
      ctx.lineTo(kTip.x - 10, kTip.y - 5);
      ctx.lineTo(kTip.x - 10, kTip.y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("k̂  (propagation)", kTip.x + 6, kTip.y + 4);

      // ─── The wave: E and B sampled along x ────────────────────────────
      // Spatial wavelength chosen so ~2 full cycles fit along Lx.
      const cycles = 2.0;
      const kSpatial = (cycles * 2 * Math.PI) / Lx;

      const nSamples = 140;
      // Path 1: E-field curve — magenta.
      ctx.strokeStyle = `${MAGENTA} 0.95)`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i <= nSamples; i++) {
        const x = (i / nSamples) * Lx;
        const phase = kSpatial * x - omegaT;
        const Ey = Ey0 * Math.cos(phase);
        const Ez = Ez0 * Math.cos(phase + delta);
        // E is the vector sum projected onto the y-axis alone for this
        // curve — but we want the tip trajectory in 3D, so we render the
        // full 3D curve below. For the "main" curve we draw the y-component
        // line; the z-component is drawn as a second curve.
        // Actually: render the 3D tip curve as a single path so the reader
        // sees the ellipse/circle/line the tip traces.
        const p = project(x, Ey, Ez);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Path 2: B-field curve — cyan, 90° rotated in the transverse plane.
      // In vacuum, B = k̂ × E / c, so if E is in (ŷ, ẑ) basis then B is in
      // (−ẑ, ŷ) basis. We render it at half the y-scale to hint at |B| =
      // |E|/c without distorting the scene.
      ctx.strokeStyle = `${CYAN} 0.85)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= nSamples; i++) {
        const x = (i / nSamples) * Lx;
        const phase = kSpatial * x - omegaT;
        const Ey = Ey0 * Math.cos(phase);
        const Ez = Ez0 * Math.cos(phase + delta);
        const bScale = 0.55;
        // B in the transverse plane = k̂ × E / c.
        // For k̂ = x̂: k̂ × (ŷ, ẑ) = (ẑ, -ŷ), so By = -Ez, Bz = +Ey.
        const By = -Ez * bScale;
        const Bz = Ey * bScale;
        const p = project(x, By, Bz);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // ─── Tip trajectory: the polarization ellipse, projected back onto
      // the transverse plane at x = xMarker ──────────────────────────────
      const xMarker = Lx * 0.22;
      // Draw a little transverse disc (yz-plane) centered on the axis
      const discEllipse = (() => {
        // We draw the full tip-path over one period.
        ctx.strokeStyle = `${MAGENTA} 0.45)`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        const steps = 60;
        for (let j = 0; j <= steps; j++) {
          const ph = (j / steps) * 2 * Math.PI;
          const Ey = Ey0 * Math.cos(ph);
          const Ez = Ez0 * Math.cos(ph + delta);
          const p = project(xMarker, Ey, Ez);
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      })();
      void discEllipse;

      // Live E-vector arrow at x = xMarker.
      const phaseMark = kSpatial * xMarker - omegaT;
      const EyLive = Ey0 * Math.cos(phaseMark);
      const EzLive = Ez0 * Math.cos(phaseMark + delta);
      const tailMark = project(xMarker, 0, 0);
      const tipMark = project(xMarker, EyLive, EzLive);
      ctx.strokeStyle = `${MAGENTA} 0.95)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(tailMark.x, tailMark.y);
      ctx.lineTo(tipMark.x, tipMark.y);
      ctx.stroke();
      // Arrowhead on E
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      const dx = tipMark.x - tailMark.x;
      const dy = tipMark.y - tailMark.y;
      const dlen = Math.hypot(dx, dy) || 1;
      const ux = dx / dlen;
      const uy = dy / dlen;
      ctx.beginPath();
      ctx.moveTo(tipMark.x, tipMark.y);
      ctx.lineTo(tipMark.x - ux * 7 - uy * 4, tipMark.y - uy * 7 + ux * 4);
      ctx.lineTo(tipMark.x - ux * 7 + uy * 4, tipMark.y - uy * 7 - ux * 4);
      ctx.closePath();
      ctx.fill();

      // ─── HUD ──────────────────────────────────────────────────────────
      const stateLabel = polarizationState({
        Ex_amplitude: Ey0,
        Ey_amplitude: Ez0,
        phaseDelta: delta,
        tol: 1e-3,
      });

      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("FIG.39 · plane EM wave in vacuum", 12, 18);
      ctx.fillText(
        "E ⊥ B ⊥ k̂   ·   |B| = |E|/c   ·   in phase",
        12,
        34,
      );

      // Right-side HUD
      ctx.textAlign = "right";
      const hudX = width - 12;
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.fillText(`E  magenta`, hudX, 18);
      ctx.fillStyle = `${CYAN} 0.95)`;
      ctx.fillText(`B  cyan`, hudX, 32);
      ctx.fillStyle = `${AMBER} 0.95)`;
      ctx.fillText(`k̂  amber`, hudX, 46);

      // State label — large, centered bottom.
      ctx.textAlign = "center";
      ctx.font = "bold 13px monospace";
      const stateColor =
        stateLabel === "linear"
          ? `${MAGENTA} 0.95)`
          : stateLabel === "circular"
            ? "rgba(120, 255, 170, 0.95)"
            : `${AMBER} 0.95)`;
      ctx.fillStyle = stateColor;
      ctx.fillText(
        `state: ${stateLabel.toUpperCase()}  ·  χ = ${chi.toFixed(2)}  ·  δ = ${(delta / Math.PI).toFixed(2)}π`,
        width / 2,
        height - 12,
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
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Ellipticity χ</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={ellipticity}
          onChange={(e) => setEllipticity(parseFloat(e.target.value))}
          className="accent-[rgb(255,100,200)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {ellipticity.toFixed(2)}
        </span>

        <label className="text-[var(--color-fg-3)]">Phase δ</label>
        <input
          type="range"
          min={0}
          max={Math.PI}
          step={Math.PI / 100}
          value={phaseDelta}
          onChange={(e) => setPhaseDelta(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,255)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {(phaseDelta / Math.PI).toFixed(2)}π
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,100,200)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setEllipticity(0);
            setPhaseDelta(0);
          }}
        >
          linear (0, 0)
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,255,170)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setEllipticity(1);
            setPhaseDelta(Math.PI / 2);
          }}
        >
          circular (1, π/2)
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,180,80)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setEllipticity(1);
            setPhaseDelta(Math.PI);
          }}
        >
          linear diag (1, π)
        </button>
      </div>
    </div>
  );
}
