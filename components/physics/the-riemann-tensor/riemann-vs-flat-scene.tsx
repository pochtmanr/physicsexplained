"use client";

import { useState, useCallback } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import { christoffelSymbols, parallelTransportStep, sphericalMetric } from "@/lib/physics/relativity/christoffel";
import type { ManifoldEmbedding, TangentArrow, ParallelTransportPath, ManifoldChartPoint } from "@/components/physics/_shared";

/**
 * RIEMANN VS FLAT SCENE — §08 THE RIEMANN TENSOR
 *
 * Two side-by-side ManifoldCanvas panels:
 *   Left  — flat plane (R = 0 everywhere). A small loop of parallel transport
 *            returns the same vector unchanged.
 *   Right — unit sphere (R = 2). A small loop returns a rotated vector;
 *            the rotation angle = enclosed area (holonomy).
 *
 * Controls:
 *   - "Show parallel transport" toggle: reveals the transported vectors.
 *   - "Loop size" slider: scales the demonstration loop.
 */

// ─── Flat plane embedding ──────────────────────────────────────────────────────

/** Flat plane embedding: (u, v) → (u, v, 0) (z = 0 always). */
const FLAT_EMBED: ManifoldEmbedding = (u, v) => [u, v, 0] as const;

/** Flat metric: g = diag(1,1). */
function flatMetric(_x: readonly number[]): readonly (readonly number[])[] {
  return [[1, 0], [0, 1]];
}

// ─── Sphere setup ─────────────────────────────────────────────────────────────

const SPHERE_EMBED: ManifoldEmbedding = sphereEmbedding(1);
const SPHERE_METRIC = sphericalMetric(1);

// ─── Flat tangent arrows ───────────────────────────────────────────────────────

const FLAT_ARROWS: readonly TangentArrow[] = [
  { base: { u: 0.3, v: 0.3 }, vector: [1, 0], color: "#67E8F9", label: "V" },
  { base: { u: 0.3, v: -0.3 }, vector: [1, 0], color: "#67E8F9" },
  { base: { u: -0.3, v: 0.3 }, vector: [1, 0], color: "#67E8F9" },
  { base: { u: -0.3, v: -0.3 }, vector: [1, 0], color: "#67E8F9" },
];

// ─── Sphere tangent arrows ─────────────────────────────────────────────────────

const SPHERE_ARROWS: readonly TangentArrow[] = [
  { base: { u: Math.PI / 4, v: 0 }, vector: [1, 0], color: "#67E8F9", label: "V" },
  { base: { u: Math.PI / 2, v: Math.PI / 2 }, vector: [1, 0], color: "#67E8F9" },
  { base: { u: Math.PI * 0.7, v: Math.PI }, vector: [1, 0], color: "#67E8F9" },
];

// ─── Build a square loop + parallel transport ──────────────────────────────────

interface LoopTransport {
  curve: ManifoldChartPoint[];
  transported: (readonly [number, number])[];
}

function buildFlatLoop(size: number): LoopTransport {
  // A square in chart coords — parallel transport on flat is trivial (no change).
  const steps = 40;
  const u0 = 0;
  const v0 = 0;
  const s = size * 0.5;
  const sides: Array<[number, number, number, number]> = [
    [u0, v0, u0 + s, v0],         // → right
    [u0 + s, v0, u0 + s, v0 + s], // → up
    [u0 + s, v0 + s, u0, v0 + s], // → left
    [u0, v0 + s, u0, v0],         // → down
  ];
  const curve: ManifoldChartPoint[] = [];
  let V: readonly number[] = [1, 0];
  const transported: (readonly [number, number])[] = [];

  for (const [u1, v1, u2, v2] of sides) {
    const du = (u2 - u1) / steps;
    const dv = (v2 - v1) / steps;
    const dxdl: readonly number[] = [du / (1 / steps), dv / (1 / steps)];
    for (let i = 0; i < steps; i++) {
      const u = u1 + i * du;
      const v = v1 + i * dv;
      curve.push({ u, v });
      transported.push([V[0], V[1]] as const);
      const Gamma = christoffelSymbols(flatMetric, [u, v]);
      V = parallelTransportStep(V, Gamma, dxdl, 1 / steps);
    }
  }
  // Close
  curve.push({ u: u0, v: v0 });
  transported.push([V[0], V[1]] as const);

  return { curve, transported };
}

function buildSphereLoop(size: number): LoopTransport {
  // A small square in (θ,φ) chart near the equator.
  const steps = 60;
  const th0 = Math.PI / 2;
  const ph0 = 0.1;
  const dth = 0.4 * size;
  const dph = 0.5 * size;

  const sides: Array<[number, number, number, number]> = [
    [th0, ph0, th0 + dth, ph0],
    [th0 + dth, ph0, th0 + dth, ph0 + dph],
    [th0 + dth, ph0 + dph, th0, ph0 + dph],
    [th0, ph0 + dph, th0, ph0],
  ];
  const curve: ManifoldChartPoint[] = [];
  let V: readonly number[] = [1, 0];
  const transported: (readonly [number, number])[] = [];

  for (const [u1, v1, u2, v2] of sides) {
    const du = (u2 - u1) / steps;
    const dv = (v2 - v1) / steps;
    const dxdl: readonly number[] = [du * steps, dv * steps];
    for (let i = 0; i < steps; i++) {
      const u = u1 + i * du;
      const v = v1 + i * dv;
      curve.push({ u, v });
      transported.push([V[0], V[1]] as const);
      const Gamma = christoffelSymbols(SPHERE_METRIC, [u, v]);
      V = parallelTransportStep(V, Gamma, dxdl, 1 / steps);
    }
  }
  curve.push({ u: th0, v: ph0 });
  transported.push([V[0], V[1]] as const);

  return { curve, transported };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiemannVsFlatScene() {
  const [showTransport, setShowTransport] = useState(false);
  const [loopSize, setLoopSize] = useState(0.6);
  const [flatRot, setFlatRot] = useState(0.4);
  const [sphereRot, setSphereRot] = useState(0.7);

  const flatLoop = buildFlatLoop(loopSize);
  const sphereLoop = buildSphereLoop(loopSize);

  const flatTransport: ParallelTransportPath | null = showTransport
    ? {
        curve: flatLoop.curve,
        initialVector: [1, 0],
        transportedVectors: flatLoop.transported,
        color: "#a3e635",
        label: "V",
      }
    : null;

  const sphereTransport: ParallelTransportPath | null = showTransport
    ? {
        curve: sphereLoop.curve,
        initialVector: [1, 0],
        transportedVectors: sphereLoop.transported,
        color: "#a3e635",
        label: "V",
      }
    : null;

  // Estimate holonomy angle for sphere loop
  const area = Math.sin(Math.PI / 2) * 0.4 * loopSize * 0.5 * loopSize;
  const holoAngleDeg = ((area / (1 * 1)) * 180) / Math.PI;

  const handleFlatRot = useCallback((v: number) => setFlatRot(v), []);
  const handleSphereRot = useCallback((v: number) => setSphereRot(v), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Flat plane */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs text-emerald-400">
              R = 0 everywhere
            </span>
            <span className="font-mono text-xs text-white/40">Flat plane</span>
          </div>
          <ManifoldCanvas
            embedding={FLAT_EMBED}
            uRange={[-1, 1]}
            vRange={[-1, 1]}
            uSteps={8}
            vSteps={8}
            tangentArrows={FLAT_ARROWS}
            parallelTransport={flatTransport}
            rotationY={flatRot}
            onRotationChange={handleFlatRot}
            rotationMin={-Math.PI}
            rotationMax={Math.PI}
            width={260}
            height={220}
            palette={{ surface: "rgba(52,211,153,0.2)", highlight: "#67E8F9" }}
          />
          <p className="text-center font-mono text-xs text-white/40">
            Loop returns V unchanged (δ = 0)
          </p>
        </div>

        {/* Sphere */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs text-amber-400">
              R = 2/r² = 2
            </span>
            <span className="font-mono text-xs text-white/40">Unit sphere</span>
          </div>
          <ManifoldCanvas
            embedding={SPHERE_EMBED}
            uRange={[0, Math.PI]}
            vRange={[0, 2 * Math.PI]}
            uSteps={12}
            vSteps={18}
            tangentArrows={SPHERE_ARROWS}
            parallelTransport={sphereTransport}
            rotationY={sphereRot}
            onRotationChange={handleSphereRot}
            rotationMin={-Math.PI}
            rotationMax={Math.PI}
            width={260}
            height={220}
            palette={{ surface: "rgba(251,191,36,0.2)", highlight: "#67E8F9" }}
          />
          <p className="text-center font-mono text-xs text-white/40">
            Loop rotates V by ≈ {holoAngleDeg.toFixed(1)}° (area/R²)
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-white/10 bg-[#0f172a] p-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={showTransport}
              onChange={(e) => setShowTransport(e.target.checked)}
              className="accent-amber-400"
            />
            <span className="text-white/70">Show parallel transport</span>
          </label>
          <div className="flex flex-1 items-center gap-2">
            <span className="w-20 shrink-0 text-white/40">Loop size</span>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={loopSize}
              onChange={(e) => setLoopSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right text-white/60">{loopSize.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 text-[11px] text-white/50">
          <div>
            <span className="text-emerald-400">Flat plane:</span> R = 0 at every point.
            A cylinder (zero R) is flat in this sense — you can unroll it.
          </div>
          <div>
            <span className="text-amber-400">Unit sphere:</span> Ricci scalar = 2/R² = 2.
            The sphere cannot be unrolled — curvature is intrinsic. The transported vector arrives rotated.
          </div>
        </div>
        <p className="mt-2 text-[11px] text-white/30">
          Drag either manifold to rotate. Check "Show parallel transport" to see the loop.
        </p>
      </div>
    </div>
  );
}
