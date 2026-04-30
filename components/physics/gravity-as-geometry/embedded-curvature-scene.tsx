"use client";

import { useEffect, useRef, useState } from "react";
import { schwarzschildRadius } from "@/lib/physics/relativity/gravity-as-geometry";

/**
 * FIG.28b — The rubber-sheet embedding diagram.
 *
 * A "rubber sheet" with a depression caused by a central mass; nearby test
 * particles roll into the depression along geodesics. As the mass slider
 * grows, the well deepens; test-particle paths bend more sharply.
 *
 * Honest caveat in the HUD: "embedding diagrams are pedagogical, not literal —
 * real spacetime curvature is intrinsic, not an embedding into a higher-
 * dimensional space." The visualization helps build intuition, but the §07
 * mathematics replaces it with the metric tensor on a manifold without any
 * external embedding space.
 */

const W = 700;
const H = 360;
const CX = W / 2;
const CY = H / 2 + 30;

// Central-mass slider scales how deep the depression is, in solar masses.
const M_MIN = 0.0;
const M_MAX = 10.0; // solar masses (visualization units)

// Sheet grid lines.
const GRID_LINES = 12;
const GRID_HALF = 220;

// "Depth" of the depression at radius r: a smooth, monotone-decreasing-with-r
// function. Scaled to mass M (solar masses, visualization units).
function depthAt(r: number, mSolar: number): number {
  // Larger M → deeper well. Asymptotically flat at r → ∞.
  const a = 80 + 25 * mSolar;
  return -mSolar * 32 / (1 + (r * r) / (a * a));
}

// Project a (xPlane, yPlane) point on the deformed sheet to canvas (x, y) using
// a simple oblique projection: the depth z displaces y by z and x by z * tilt.
function project(xPlane: number, yPlane: number, z: number) {
  const tilt = 0.45;
  return {
    x: CX + xPlane + z * tilt * 0.0,
    y: CY + yPlane * 0.45 + z, // foreshorten y, drop z visually
  };
}

export function EmbeddedCurvatureScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mSolar, setMSolar] = useState(3.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Header
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("embedding diagram (pedagogical, not literal)", 16, 20);

    // ── Grid lines: parallels in xPlane (constant yPlane) and meridians (constant xPlane) ──
    ctx.strokeStyle = "rgba(167,139,250,0.30)";
    ctx.lineWidth = 1;

    // Lines of constant yPlane (horizontal grid)
    for (let i = 0; i < GRID_LINES; i++) {
      const yPlane = -GRID_HALF + (i / (GRID_LINES - 1)) * (GRID_HALF * 2);
      ctx.beginPath();
      const samples = 80;
      for (let s = 0; s <= samples; s++) {
        const xPlane = -GRID_HALF + (s / samples) * (GRID_HALF * 2);
        const r = Math.sqrt(xPlane * xPlane + yPlane * yPlane);
        const z = depthAt(r, mSolar);
        const p = project(xPlane, yPlane, z);
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Lines of constant xPlane (vertical grid)
    for (let i = 0; i < GRID_LINES; i++) {
      const xPlane = -GRID_HALF + (i / (GRID_LINES - 1)) * (GRID_HALF * 2);
      ctx.beginPath();
      const samples = 80;
      for (let s = 0; s <= samples; s++) {
        const yPlane = -GRID_HALF + (s / samples) * (GRID_HALF * 2);
        const r = Math.sqrt(xPlane * xPlane + yPlane * yPlane);
        const z = depthAt(r, mSolar);
        const p = project(xPlane, yPlane, z);
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // ── Central mass marker ──
    const centerZ = depthAt(0, mSolar);
    const centerProj = project(0, 0, centerZ);
    const massR = 8 + Math.min(20, mSolar * 1.5);
    const grad = ctx.createRadialGradient(centerProj.x, centerProj.y, 0, centerProj.x, centerProj.y, massR);
    grad.addColorStop(0, "#FFD66B");
    grad.addColorStop(1, "#FB923C");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerProj.x, centerProj.y, massR, 0, Math.PI * 2);
    ctx.fill();

    // ── Test particle geodesics: a few orbits/falls into the well ──
    // Geodesic 1: a horizontal "flyby" trajectory (test particle moving in +x at y = +60)
    // We simulate by: at each xPlane along its path, the particle's yPlane shifts toward
    // the central mass with a simple gradient-descent model (purely visual).
    const colors = ["#67E8F9", "#34D399", "#F472B6"];
    const startYs = [-95, 0, 95];

    for (let g = 0; g < 3; g++) {
      const startY = startYs[g];
      ctx.strokeStyle = colors[g];
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let xPlane = -GRID_HALF * 0.95;
      let yPlane = startY;
      let vy = 0;
      const dt = 0.04;
      const samples = 200;
      for (let s = 0; s <= samples; s++) {
        const r = Math.max(8, Math.sqrt(xPlane * xPlane + yPlane * yPlane));
        const z = depthAt(r, mSolar);
        const p = project(xPlane, yPlane, z);
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);

        // Toy "geodesic" integration: pull yPlane toward 0 with strength scaled by mSolar/r²
        const ay = -mSolar * 12 * (yPlane / (r * r * r * 0.001 + 1));
        vy += ay * dt;
        yPlane += vy * dt;
        xPlane += (GRID_HALF * 1.9 / samples);
      }
      ctx.stroke();

      // Final test-mass dot
      const r = Math.max(8, Math.sqrt(xPlane * xPlane + yPlane * yPlane));
      const z = depthAt(r, mSolar);
      const p = project(xPlane, yPlane, z);
      ctx.fillStyle = colors[g];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── HUD: mass, Schwarzschild radius (literal value for context), the caveat ──
    const M_kg = mSolar * 1.989e30;
    const rsKm = mSolar > 0 ? schwarzschildRadius(M_kg) / 1000 : 0;

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `M = ${mSolar.toFixed(2)} M_sun    r_s = ${rsKm.toFixed(2)} km`,
      16,
      H - 36,
    );

    // The honest caveat
    ctx.fillStyle = "#FCA5A5";
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText(
      "embedding diagrams are pedagogical, not literal — real spacetime",
      16,
      H - 22,
    );
    ctx.fillText(
      "curvature is intrinsic, not an embedding into a higher-dimensional space.",
      16,
      H - 10,
    );
  }, [mSolar]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-28">M = {mSolar.toFixed(2)} M_sun</span>
          <input
            type="range"
            min={M_MIN}
            max={M_MAX}
            step={0.05}
            value={mSolar}
            onChange={(e) => setMSolar(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <p className="font-mono text-xs text-white/40">
          Drag M. The sheet is the picture; the math underneath is a metric on a manifold —
          §07 makes that rigorous, without ever invoking a fourth dimension to embed into.
        </p>
      </div>
    </div>
  );
}
