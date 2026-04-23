"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  fresnelAll,
  reflectance,
  transmittanceS,
  transmittanceP,
  brewsterAngle,
} from "@/lib/physics/electromagnetism/fresnel";

const RATIO = 0.6;
const MAX_HEIGHT = 520;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";
const MAGENTA = "rgba(255, 100, 200,"; // s-polarisation dots
const PALE_BLUE = "rgba(180, 210, 240,"; // p-polarisation ticks

/**
 * BREWSTER SCENE. An unpolarised beam (equal parts s and p) hits an
 * air-glass boundary at the slider-selected angle. The scene decomposes
 * the beam into its two polarisation channels and renders each with its
 * own Fresnel coefficient:
 *
 *   s-polarisation (magenta dots, perpendicular to page) — always has
 *     a nonzero reflected component.
 *   p-polarisation (pale-blue ticks, in the plane of the page) — its
 *     reflected component goes to zero at the Brewster angle.
 *
 * Drag to Brewster: the reflected beam is purely s-polarised — the
 * transmitted beam still carries both. Push past Brewster: p reflection
 * reappears, but now the reflected p component is π out of phase with
 * the incident p component. It is classic Fresnel.
 */
export function BrewsterAngleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 860, height: 500 });
  const n1 = 1.0;
  const n2 = 1.5;
  const thetaBdeg = (brewsterAngle(n1, n2) * 180) / Math.PI;
  const [thetaDeg, setThetaDeg] = useState(thetaBdeg);

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

  useEffect(() => {
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

    const theta = (thetaDeg * Math.PI) / 180;
    const { rs, rp, ts, tp, thetaT } = fresnelAll(theta, n1, n2);
    const Rs = reflectance(rs);
    const Rp = reflectance(rp);
    const Ts = transmittanceS(ts, n1, n2, theta, thetaT);
    const Tp = transmittanceP(tp, n1, n2, theta, thetaT);

    // Scene geometry.
    const cx = width / 2;
    const cy = height * 0.56;
    const rayLen = Math.min(width, height) * 0.36;

    // Lilac-tinted lower half (glass).
    ctx.fillStyle = `${LILAC} 0.09)`;
    ctx.fillRect(0, cy, width, height - cy);

    // Cyan interface.
    ctx.strokeStyle = `${CYAN} 0.85)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, cy);
    ctx.lineTo(width - 12, cy);
    ctx.stroke();

    // Normal (dashed).
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - rayLen * 1.05);
    ctx.lineTo(cx, cy + rayLen * 1.05);
    ctx.stroke();
    ctx.setLineDash([]);

    // Medium labels.
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`n₁ = ${n1}  (air)`, 14, 18);
    ctx.fillText(`n₂ = ${n2}  (glass)`, 14, height - 12);

    // Incoming ray.
    const incStartX = cx - rayLen * Math.sin(theta);
    const incStartY = cy - rayLen * Math.cos(theta);
    drawBeamWithBothPolarizations(
      ctx,
      incStartX,
      incStartY,
      cx,
      cy,
      0.5, // s-density (incident has equal parts)
      0.5, // p-density
      `${AMBER} 0.75)`,
      "in",
    );

    // Reflected ray.
    const reflEndX = cx + rayLen * Math.sin(theta);
    const reflEndY = cy - rayLen * Math.cos(theta);
    drawBeamWithBothPolarizations(
      ctx,
      cx,
      cy,
      reflEndX,
      reflEndY,
      Rs * 0.5, // s density scaled by R_s
      Rp * 0.5, // p density scaled by R_p
      `${AMBER} ${(0.3 + 0.55 * (Rs + Rp) * 0.5).toFixed(2)})`,
      "out",
    );

    // Transmitted ray.
    if (Number.isFinite(thetaT)) {
      const transEndX = cx + rayLen * Math.sin(thetaT);
      const transEndY = cy + rayLen * Math.cos(thetaT);
      drawBeamWithBothPolarizations(
        ctx,
        cx,
        cy,
        transEndX,
        transEndY,
        Ts * 0.5,
        Tp * 0.5,
        `${AMBER} ${(0.3 + 0.55 * (Ts + Tp) * 0.5).toFixed(2)})`,
        "out",
      );
    }

    // Big Brewster indicator — if we are very close to θ_B, highlight.
    const atBrewster = Math.abs(thetaDeg - thetaBdeg) < 0.3;
    ctx.fillStyle = atBrewster ? `${MAGENTA} 0.95)` : colors.fg2;
    ctx.font = atBrewster ? "bold 13px monospace" : "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      atBrewster
        ? "AT BREWSTER — REFLECTED BEAM IS PURELY s-POLARISED"
        : `θᵢ = ${thetaDeg.toFixed(1)}°   ·   θ_B = ${thetaBdeg.toFixed(1)}°`,
      width / 2,
      height - 14,
    );

    // Angle label near hit point.
    ctx.fillStyle = colors.fg1;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `R_s = ${Rs.toFixed(3)}   R_p = ${Rp.toFixed(3)}`,
      cx + 16,
      cy - 8,
    );

    // Legend top-right.
    ctx.textAlign = "right";
    ctx.font = "10px monospace";
    ctx.fillStyle = `${MAGENTA} 0.9)`;
    ctx.fillText("• s-pol (⊥ page)", width - 14, 18);
    ctx.fillStyle = `${PALE_BLUE} 0.9)`;
    ctx.fillText("∣ p-pol (in page)", width - 14, 32);
  }, [size, thetaDeg, colors, thetaBdeg]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Angle θᵢ</label>
        <input
          type="range"
          min={0}
          max={89.9}
          step={0.1}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {thetaDeg.toFixed(1)}°
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,100,200)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(thetaBdeg)}
        >
          θ_B = {thetaBdeg.toFixed(1)}°
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(200,160,255)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(30)}
        >
          near-normal
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,180,80)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(80)}
        >
          grazing
        </button>
      </div>
    </div>
  );
}

// A ray drawn as a line plus two polarisation markers — magenta dots for
// s-polarisation (out-of-page) and pale-blue ticks for p-polarisation
// (in-plane). `sDensity` and `pDensity` modulate how many markers get drawn
// in [0, 1]; zero density means no markers (the polarisation is extinct).
function drawBeamWithBothPolarizations(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sDensity: number,
  pDensity: number,
  strokeColor: string,
  direction: "in" | "out",
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular to the ray direction (unit vector).
  const px = -uy;
  const py = ux;

  // Draw the base ray — thin line scaled by average density.
  const avgDensity = 0.5 * (sDensity + pDensity);
  const baseW = 1.1 + 3.5 * Math.sqrt(Math.max(avgDensity * 2, 0));
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = Math.min(baseW, 6);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead if this is the incoming beam (direction = "in" means it
  // arrives at (x2, y2)).
  if (direction === "in") {
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * 10 - px * 4, y2 - uy * 10 - py * 4);
    ctx.lineTo(x2 - ux * 10 + px * 4, y2 - uy * 10 + py * 4);
    ctx.closePath();
    ctx.fill();
  }

  // Number of markers along the beam.
  const nMarkers = 8;
  for (let i = 1; i < nMarkers; i++) {
    const t = i / nMarkers;
    const mx = x1 + dx * t;
    const my = y1 + dy * t;

    // p-polarisation: a short tick perpendicular to the ray, in the plane
    // of the page.
    if (pDensity > 0.005) {
      const tickL = 3 + 5 * Math.sqrt(Math.min(pDensity * 2, 1));
      ctx.strokeStyle = `${PALE_BLUE} ${(0.4 + 0.55 * Math.sqrt(Math.min(pDensity * 2, 1))).toFixed(2)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mx - px * tickL, my - py * tickL);
      ctx.lineTo(mx + px * tickL, my + py * tickL);
      ctx.stroke();
    }

    // s-polarisation: a dot (field pointing out of the page).
    if (sDensity > 0.005) {
      const dotR = 1.5 + 2.5 * Math.sqrt(Math.min(sDensity * 2, 1));
      ctx.fillStyle = `${MAGENTA} ${(0.4 + 0.55 * Math.sqrt(Math.min(sDensity * 2, 1))).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(mx + px * 7, my + py * 7, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
