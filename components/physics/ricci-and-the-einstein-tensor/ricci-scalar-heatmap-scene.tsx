"use client";

import { useEffect, useRef, useState } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared/ManifoldCanvas";

/**
 * FIG.35b — Ricci Scalar Heatmap Scene.
 *
 * Compares two surfaces side by side:
 *   Left:  2-sphere of radius 1 — uniform Ricci scalar R = 2 everywhere.
 *          The sphere is colored uniformly (constant positive curvature).
 *   Right: flat plane — R = 0 everywhere, no tint.
 *
 * A "curvature dial" slider lets the user vary the sphere radius, showing
 * how R = 2/r² decreases for larger spheres.
 *
 * The ManifoldCanvas is used for the sphere. The flat plane is drawn as a
 * simple grid on a 2D Canvas below.
 */

const PLANE_W = 300;
const PLANE_H = 220;

function drawFlatPlane(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = PLANE_W * dpr;
  canvas.height = PLANE_H * dpr;
  canvas.style.width = `${PLANE_W}px`;
  canvas.style.height = `${PLANE_H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = "#0A0C12";
  ctx.fillRect(0, 0, PLANE_W, PLANE_H);

  const nx = 10;
  const ny = 8;
  const marginX = 24;
  const marginY = 20;
  const dx = (PLANE_W - 2 * marginX) / nx;
  const dy = (PLANE_H - 2 * marginY) / ny;

  // Flat grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= nx; i++) {
    const x = marginX + i * dx;
    ctx.beginPath();
    ctx.moveTo(x, marginY);
    ctx.lineTo(x, PLANE_H - marginY);
    ctx.stroke();
  }
  for (let j = 0; j <= ny; j++) {
    const y = marginY + j * dy;
    ctx.beginPath();
    ctx.moveTo(marginX, y);
    ctx.lineTo(PLANE_W - marginX, y);
    ctx.stroke();
  }

  // R = 0 label at center
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R = 0  everywhere", PLANE_W / 2, PLANE_H / 2);

  // Sub-label
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("flat plane", PLANE_W / 2, PLANE_H / 2 + 20);
}

function sphereEmbedding(
  u: number,
  v: number,
): readonly [number, number, number] {
  // Standard 2-sphere: (R sin u cos v, R sin u sin v, R cos u)
  // We use unit sphere (R=1) here; the ManifoldCanvas auto-scales.
  return [Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)];
}

export function RicciScalarHeatmapScene() {
  const planeRef = useRef<HTMLCanvasElement | null>(null);
  const [sphereRadius, setSphereRadius] = useState(1);
  const [rotTheta, setRotTheta] = useState(0.7);

  // Ricci scalar for sphere of radius r: R = 2/r²
  const ricciScalarValue = 2 / (sphereRadius * sphereRadius);

  // Color: map R to a warm tint. For r=1: R=2 (fully tinted).
  // We interpolate from neutral white/grey (R=0) to warm amber/cyan (R=2).
  const tintStrength = Math.min(1, ricciScalarValue / 2); // normalised 0..1

  // Sphere tint: amber for positive curvature
  const r = Math.round(lerp(255, 251, tintStrength));
  const g = Math.round(lerp(255, 191, tintStrength));
  const b = Math.round(lerp(255, 36, tintStrength));
  const sphereColor = `rgba(${r},${g},${b},0.22)`;

  useEffect(() => {
    if (planeRef.current) drawFlatPlane(planeRef.current);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Side-by-side panels */}
      <div className="flex flex-wrap gap-6 items-start justify-center">
        {/* Left: sphere */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs text-white/50">2-sphere (R = {sphereRadius.toFixed(1)})</span>
          <ManifoldCanvas
            embedding={sphereEmbedding}
            uRange={[0.05, Math.PI - 0.05]}
            vRange={[0, 2 * Math.PI]}
            uSteps={14}
            vSteps={20}
            width={300}
            height={220}
            rotationY={rotTheta}
            onRotationChange={setRotTheta}
            palette={{
              surface: sphereColor,
              background: "#0A0C12",
            }}
          />
          <span className="font-mono text-xs text-amber-400/80">
            Ricci scalar R = 2/r² = {ricciScalarValue.toFixed(3)}
          </span>
        </div>

        {/* Right: flat plane */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs text-white/50">flat plane</span>
          <canvas
            ref={planeRef}
            className="rounded-md border border-white/10 bg-black/40"
          />
          <span className="font-mono text-xs text-white/40">
            Ricci scalar R = 0
          </span>
        </div>
      </div>

      {/* Radius slider */}
      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
        <span>sphere radius</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={sphereRadius}
          onChange={(e) => setSphereRadius(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-10 text-right">r = {sphereRadius.toFixed(1)}</span>
      </label>

      <p className="px-1 font-mono text-xs text-white/40">
        The 2-sphere has constant Ricci scalar R = 2/r&#178; — the same at every point (uniform amber tint).
        The flat plane has R = 0 everywhere. The scalar curvature is a single number per point that
        summarises all the curvature information after two contractions. Increase the radius: as r grows,
        R decreases — a larger sphere is less curved.
      </p>
    </div>
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
